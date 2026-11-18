package com.acmeproducts.wrist;

import android.app.ActivityManager;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.PowerManager;

/**
 * One snapshot of everything on the watch that decides whether Wrist can keep working:
 * which link carries its messages, what the watch's power saving is doing to it, and the reader's own health.
 * The same snapshot is drawn on the Wrist screen and sent to the log, so the owner never has to photograph the watch.
 * Samsung's own toggles (automatic Wi-Fi, Universal gestures) are not readable by apps and are not here.
 */
final class Diag {
    /* link */
    String link = "none";            // bt | wifi | cell | other | none
    boolean validated, wifiOn;
    /* power */
    int bat = -1; boolean charging, saver, idle, lightIdle, restricted, exempt, screen;
    int bucket = -1;
    int unused = -1;
    /* sensors */
    boolean gravity, gyro, linear, wakeAccel;
    /* watch */
    String firmware = "?"; int sdk;

    static Diag read(Context c) {
        Diag d = new Diag();
        try {
            ConnectivityManager cm = (ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            NetworkCapabilities k = n == null ? null : cm.getNetworkCapabilities(n);
            if (k != null) {
                d.link = k.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ? "wifi"
                        : k.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) ? "bt"
                        : k.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ? "cell" : "other";
                d.validated = k.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
            }
        } catch (Exception e) { d.link = "?"; }
        try { d.wifiOn = ((WifiManager) c.getApplicationContext().getSystemService(Context.WIFI_SERVICE)).isWifiEnabled(); } catch (Exception e) { d.wifiOn = false; }
        try {
            BatteryManager b = (BatteryManager) c.getSystemService(Context.BATTERY_SERVICE);
            d.bat = b.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            d.charging = b.isCharging();
        } catch (Exception e) { d.bat = -1; }
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            d.saver = pm.isPowerSaveMode();
            d.idle = pm.isDeviceIdleMode();
            if (Build.VERSION.SDK_INT >= 33) d.lightIdle = pm.isDeviceLightIdleMode();
            d.exempt = pm.isIgnoringBatteryOptimizations(c.getPackageName());
            d.screen = pm.isInteractive();
        } catch (Exception e) { /* leave defaults */ }
        try { d.restricted = ((ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE)).isBackgroundRestricted(); } catch (Exception e) { d.restricted = false; }
        // "Pause app activity if unused": 1 = Wrist is exempt (will not be paused), 0 = it may be paused, -1 = the watch would not say
        try { d.unused = c.getPackageManager().isAutoRevokeWhitelisted() ? 1 : 0; } catch (Throwable e) { d.unused = -1; }
        try { d.bucket = ((UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE)).getAppStandbyBucket(); } catch (Exception e) { d.bucket = -1; }
        try {
            SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
            d.gravity = sm.getDefaultSensor(Sensor.TYPE_GRAVITY) != null;
            d.gyro = sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE) != null;
            d.linear = sm.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION) != null;
            d.wakeAccel = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER, true) != null;
        } catch (Exception e) { /* leave defaults */ }
        d.firmware = String.valueOf(Build.DISPLAY);
        d.sdk = Build.VERSION.SDK_INT;
        return d;
    }

    String linkName() {
        return "bt".equals(link) ? "Bluetooth (via phone)" : "wifi".equals(link) ? "Wi-Fi" : "cell".equals(link) ? "Mobile" : "none".equals(link) ? "NO CONNECTION" : link;
    }

    String bucketName() {
        return bucket <= 0 ? "?" : bucket <= 5 ? "exempt" : bucket <= 10 ? "active" : bucket <= 20 ? "working set" : bucket <= 30 ? "frequent" : bucket <= 40 ? "rare" : "RESTRICTED";
    }

    /** The part that, when it changes, is worth a fresh log line. */
    String key() {
        return link + validated + wifiOn + charging + saver + idle + lightIdle + restricted + exempt + screen + bucket + unused;
    }

    private static String s(String v) { return "\"" + v.replace("\\", "/").replace("\"", "'") + "\""; }
    private static int i(boolean v) { return v ? 1 : 0; }

    String json() {
        return "\"ln\":" + s(link) + ",\"valid\":" + i(validated) + ",\"wifiOn\":" + i(wifiOn)
                + ",\"bat\":" + bat + ",\"chg\":" + i(charging) + ",\"saver\":" + i(saver) + ",\"idle\":" + i(idle) + ",\"lightIdle\":" + i(lightIdle)
                + ",\"restricted\":" + i(restricted) + ",\"exempt\":" + i(exempt) + ",\"bucket\":" + bucket + ",\"screen\":" + i(screen)
                + ",\"sens\":" + s((gravity ? "g" : "-") + (gyro ? "y" : "-") + (linear ? "a" : "-") + (wakeAccel ? "w" : "-"))
                + ",\"unused\":" + unused + ",\"fw\":" + s(firmware) + ",\"sdk\":" + sdk;
    }
}
