# Wrist build log

Run 2, commit 6b4357eaed53c61652988594194aab1d51fc173b, 2026-11-16T13:29:31Z, exit 0

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
PASS swings fired no tap
PASS slow turn while vertical: no swipe
PASS same swing with the hand flat: no swipe
PASS one 20 ms knock: exactly one TAP
PASS two knocks 0.6 s apart: two TAPs
PASS 0.4 s shove: no TAP
PASS jolt while the arm is turning fast: no TAP
17/17 lab checks passed
== compile ==
Note: app/src/com/acmeproducts/wrist/MainActivity.java uses or overrides a deprecated API.
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
package: name='com.acmeproducts.wrist' versionCode='2' versionName='turn02-b2' platformBuildVersionName='17' platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
minSdkVersion:'30'
targetSdkVersion:'34'
uses-permission: name='android.permission.VIBRATE'
BUILD OK turn02-b2 (16805 bytes)
```
