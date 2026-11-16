#!/usr/bin/env bash
# Builds wrist/out/wrist.apk with the plain Android SDK tools: no Gradle, no downloads.
# Usage: wrist/build.sh <version-code> <version-name>
set -euo pipefail
cd "$(dirname "$0")"
CODE="${1:-1}"; NAME="${2:-local}"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[ -n "$SDK" ] && [ -d "$SDK" ] || { echo "BUILD ERROR: no Android SDK (ANDROID_HOME unset)"; exit 1; }
BT="$(ls -d "$SDK"/build-tools/*/ | sort -V | tail -1)"
PLAT=""
for d in $(ls -d "$SDK"/platforms/android-*/ | sort -V); do [ -f "$d/android.jar" ] && PLAT="$d/android.jar"; done
[ -n "$PLAT" ] || { echo "BUILD ERROR: no platform android.jar under $SDK/platforms"; exit 1; }
echo "build-tools: $BT"; echo "platform: $PLAT"; java -version 2>&1 | head -1

rm -rf build; mkdir -p build/classes build/test build/dex out

echo "== lab checks =="
javac -encoding UTF-8 -Xlint:-options -source 8 -target 8 -d build/test app/src/com/acmeproducts/wrist/Detector.java test/DetectorTest.java
java -cp build/test DetectorTest

echo "== compile =="
javac -encoding UTF-8 -Xlint:-options -source 8 -target 8 -bootclasspath "$PLAT" -d build/classes $(find app/src -name '*.java')
"$BT/d8" --release --min-api 30 --lib "$PLAT" --output build/dex $(find build/classes -name '*.class')

echo "== package =="
"$BT/aapt2" link -o build/base.apk --manifest app/AndroidManifest.xml -I "$PLAT" \
  --min-sdk-version 30 --target-sdk-version 34 --version-code "$CODE" --version-name "$NAME"
(cd build/dex && zip -q ../base.apk classes.dex)
"$BT/zipalign" -f 4 build/base.apk build/aligned.apk
"$BT/apksigner" sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --ks-key-alias wrist \
  --out build/wrist.apk build/aligned.apk
"$BT/apksigner" verify --verbose build/wrist.apk | head -6
"$BT/aapt2" dump badging build/wrist.apk | head -4
cp build/wrist.apk out/wrist.apk
echo "BUILD OK $NAME ($(stat -c %s out/wrist.apk) bytes)"
