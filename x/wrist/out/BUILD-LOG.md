# Wrist build log

Run 6, commit b0b4e9f70a31c286fc40610eae8406a295bbf920, 2026-11-18T00:10:52Z, exit 0

```
build-tools: /usr/local/lib/android/sdk/build-tools/37.0.0/
platform: /usr/local/lib/android/sdk/platforms/android-37.2//android.jar
openjdk version "25.0.5" 2026-10-20 LTS
== lab checks ==
PASS flat and still: no events
PASS flat and still: pose is flat, no scroll
PASS hand raised 30 deg and held 2 s: still scrolling, positive
PASS back to level: scrolling stops
PASS hand lowered 30 deg: scrolling negative
PASS tilting never fired a swipe or tap
PASS slow 8 deg drift over 8 s: no scroll
PASS hand vertical: pose is vertical
PASS swing left and back: exactly one SWIPE_LEFT
PASS swing right and back: exactly one SWIPE_RIGHT
PASS the detector never produces a knock
PASS slow turn while vertical: no swipe
PASS same swing with the hand flat: no swipe
PASS arm hanging at the side is not a use pose
PASS watch face down is not a use pose
PASS hand flat and hand vertical are use poses
16/16 lab checks passed
== compile ==
Note: app/src/com/acmeproducts/wrist/WristService.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
== package ==
WARNING: A restricted method in java.lang.System has been called
WARNING: java.lang.System::loadLibrary has been called by org.conscrypt.NativeLibraryUtil in an unnamed module (file:/usr/local/lib/android/sdk/build-tools/37.0.0/lib/apksigner.jar)
WARNING: Use --enable-native-access=ALL-UNNAMED to avoid a warning for callers in this module
WARNING: Restricted methods will be blocked in a future release unless native access is enabled

WARNING: A restricted method in java.lang.System has been called
WARNING: java.lang.System::loadLibrary has been called by org.conscrypt.NativeLibraryUtil in an unnamed module (file:/usr/local/lib/android/sdk/build-tools/37.0.0/lib/apksigner.jar)
WARNING: Use --enable-native-access=ALL-UNNAMED to avoid a warning for callers in this module
WARNING: Restricted methods will be blocked in a future release unless native access is enabled

Verifies
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): false
Verified using v3 scheme (APK Signature Scheme v3): true
Verified using v3.1 scheme (APK Signature Scheme v3.1): false
Verified using v3.2 scheme (APK Signature Scheme v3.2): false
package: name='com.acmeproducts.wrist' versionCode='6' versionName='turn06-b6' platformBuildVersionName='17' platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
minSdkVersion:'30'
targetSdkVersion:'30'
uses-permission: name='android.permission.VIBRATE'
BUILD OK turn06-b6 (24997 bytes)
```
