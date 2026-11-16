package com.acmeproducts.wrist;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.BatteryManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.SecureRandom;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

/**
 * Wrist turn03: reads the left-wrist motions with the watch screen off and sends each one to X.
 *
 * Two modes, to spare the battery:
 *   active  - the arm is in a use pose (hand flat or hand vertical): all three sensors at 100 Hz, processor kept awake.
 *   resting - the arm is down or has not moved for a while: one slow wake-up sensor, processor allowed to sleep.
 */
public class WristService extends Service implements SensorEventListener {
    static final String RELAY = "https://wrist-relay.myacctfortracking.workers.dev";
    static final String ACTION_STOP = "com.acmeproducts.wrist.STOP";
    static final long OTHER_POSE_NS = 4000000000L;      // arm out of a use pose this long: rest
    static final long STILL_NS = 45000000000L;          // no movement this long: rest
    static final float STILL_GYRO = 0.15f;              // rad/s
    static final float WAKE_MOVE = 1.0f;                // m/s^2 change between slow samples that counts as movement
    static final long SETTLE_NS = 600000000L;           // ignore motions right after waking: that was the arm coming up

    static volatile WristService inst;

    /* ---- status the watch face reads ---- */
    volatile String net = "not sent yet", last = "nothing yet", mode = "starting", idleKind = "", missing = "", code = "------", build = "?";
    volatile int sentOk, sentErr, pages = -1, tiltStep;
    final Detector det = new Detector();

    private SensorManager sm;
    private Vibrator vib;
    private PowerManager pm;
    private PowerManager.WakeLock lock;
    private final Object lockGuard = new Object();
    private final LinkedBlockingDeque<String> queue = new LinkedBlockingDeque<String>();
    private volatile boolean running, active;
    private Thread sender;
    private int seq;
    private long otherSinceNs, stillSinceNs, activeSinceNs;
    private float px, py, pz, lx, ly, lz;
    private boolean havePrev;
    private int usePoseRun;
    private long lastMoveNs;

    static String codeFor(Context c) {
        SharedPreferences sp = c.getSharedPreferences("wrist", MODE_PRIVATE);
        String code = sp.getString("code", "");
        if (code.length() != 6) {
            code = String.valueOf(100000 + new SecureRandom().nextInt(900000));
            sp.edit().putString("code", code).apply();
        }
        return code;
    }

    @Override public IBinder onBind(Intent i) { return null; }

    @Override public void onCreate() {
        super.onCreate();
        try { PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0); build = pi.versionName; } catch (Exception e) { build = "?"; }
        code = codeFor(this);
        sm = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "wrist:sense");
        lock.setReferenceCounted(false);
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel("wrist", "Wrist", NotificationManager.IMPORTANCE_LOW));
            Notification n = new Notification.Builder(this, "wrist").setContentTitle("Wrist").setContentText("Reading wrist motions")
                    .setSmallIcon(android.R.drawable.stat_notify_sync).setOngoing(true).build();
            startForeground(1, n);
        } catch (Exception e) {
            net = "cannot run in background: " + e.getClass().getSimpleName();
        }
        inst = this;
        running = true;
        sender = new Thread(new Runnable() { @Override public void run() { sendLoop(); } }, "wrist-send");
        sender.start();
        goActive("start");
    }

    @Override public int onStartCommand(Intent i, int flags, int id) {
        if (i != null && ACTION_STOP.equals(i.getAction())) { stopSelf(); return START_NOT_STICKY; }
        return START_STICKY;
    }

    @Override public void onDestroy() {
        running = false;
        if (sm != null) sm.unregisterListener(this);
        if (sender != null) sender.interrupt();
        synchronized (lockGuard) { if (lock != null && lock.isHeld()) lock.release(); }
        if (inst == this) inst = null;
        super.onDestroy();
    }

    /* ---------------- modes ---------------- */

    private void goActive(String why) {
        synchronized (lockGuard) { if (!lock.isHeld()) lock.acquire(); active = true; }
        mode = "active";
        sm.unregisterListener(this);
        missing = "";
        listen(Sensor.TYPE_GRAVITY, "gravity");
        listen(Sensor.TYPE_GYROSCOPE, "gyro");
        listen(Sensor.TYPE_LINEAR_ACCELERATION, "accel");
        otherSinceNs = 0; stillSinceNs = 0; activeSinceNs = 0;
        queue.offer(event("mode", ",\"m\":\"active\",\"why\":\"" + why + "\""));
    }

    private void goIdle(String why) {
        active = false;
        mode = "resting";
        tiltStep = 0;
        sm.unregisterListener(this);
        havePrev = false; usePoseRun = 0; lastMoveNs = 0;
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER, true);
        if (s != null && sm.registerListener(this, s, 200000, 1000000)) idleKind = "wakeup";
        else {
            s = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            idleKind = s != null && sm.registerListener(this, s, 200000) ? "lock" : "none";
        }
        queue.offer(event("mode", ",\"m\":\"resting\",\"why\":\"" + why + "\",\"idle\":\"" + idleKind + "\""));
    }

    private void listen(int type, String name) {
        Sensor s = sm.getDefaultSensor(type);
        if (s == null || !sm.registerListener(this, s, 10000)) missing += (missing.length() > 0 ? ", " : "") + name;
    }

    /* ---------------- sensors ---------------- */

    @Override public void onAccuracyChanged(Sensor s, int a) { }

    @Override public void onSensorChanged(SensorEvent e) {
        float[] v = e.values;
        long t = e.timestamp;
        int type = e.sensor.getType();
        if (!active) { if (type == Sensor.TYPE_ACCELEROMETER) resting(v[0], v[1], v[2], t); return; }
        if (activeSinceNs == 0) activeSinceNs = t;
        int ev = Detector.NONE;
        if (type == Sensor.TYPE_GRAVITY) {
            det.onGravity(v[0], v[1], v[2], t);
            tiltStep = t - activeSinceNs < SETTLE_NS ? 0 : Math.round(det.scrollRate * 4f);
            if (det.pose == Detector.POSE_OTHER) { if (otherSinceNs == 0) otherSinceNs = t; else if (t - otherSinceNs > OTHER_POSE_NS) { goIdle("arm down"); return; } }
            else otherSinceNs = 0;
        } else if (type == Sensor.TYPE_GYROSCOPE) {
            ev = det.onGyro(v[0], v[1], v[2], t);
            float mag = (float) Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            if (mag < STILL_GYRO && tiltStep == 0) { if (stillSinceNs == 0) stillSinceNs = t; else if (t - stillSinceNs > STILL_NS) { goIdle("still"); return; } }
            else stillSinceNs = 0;
        } else if (type == Sensor.TYPE_LINEAR_ACCELERATION) {
            ev = det.onLinear(v[0], v[1], v[2], t);
        }
        if (ev != Detector.NONE && t - activeSinceNs >= SETTLE_NS) act(ev, "wrist");
    }

    /** Resting: wake only when the arm comes into a use pose and is actually moving. */
    private void resting(float x, float y, float z, long t) {
        if (havePrev) {
            float dx = x - px, dy = y - py, dz = z - pz;
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) > WAKE_MOVE) lastMoveNs = t;
            lx += (x - lx) * 0.4f; ly += (y - ly) * 0.4f; lz += (z - lz) * 0.4f;
        } else { lx = x; ly = y; lz = z; havePrev = true; }
        px = x; py = y; pz = z;
        usePoseRun = Detector.poseOf(lx, ly, lz) != Detector.POSE_OTHER ? usePoseRun + 1 : 0;
        if (usePoseRun >= 2 && lastMoveNs != 0 && t - lastMoveNs < 1500000000L) goActive("arm up");
    }

    void act(int ev, String how) {
        if (ev == Detector.SWIPE_LEFT) { last = "swing left"; queue.offer(event("swipe", ",\"d\":\"left\"")); buzz(new long[]{0, 35}); }
        else if (ev == Detector.SWIPE_RIGHT) { last = "swing right"; queue.offer(event("swipe", ",\"d\":\"right\"")); buzz(new long[]{0, 35}); }
        else if (ev == Detector.TAP) {
            last = "knock (" + how + ")"; queue.offer(event("tap", ",\"how\":\"" + how + "\"")); buzz(new long[]{0, 25, 70, 25});
            synchronized (lockGuard) { if (!lock.isHeld()) lock.acquire(3000); }   // a touch while resting still has to get out
        }
    }

    /* ---------------- sending ---------------- */

    /** One event as JSON, with the readings behind it so thresholds and battery use can be tuned from the relay log. */
    private String event(String type, String extra) {
        int bat = -1;
        try { bat = ((BatteryManager) getSystemService(Context.BATTERY_SERVICE)).getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY); } catch (Exception e) { bat = -1; }
        boolean exempt = false;
        try { exempt = pm.isIgnoringBatteryOptimizations(getPackageName()); } catch (Exception e) { exempt = false; }
        boolean screen = false;
        try { screen = pm.isInteractive(); } catch (Exception e) { screen = false; }
        return "{\"t\":\"" + type + "\"" + extra + ",\"seq\":" + (++seq) + ",\"b\":\"" + build + "\""
                + ",\"pose\":" + det.pose + ",\"tilt\":" + Math.round(det.pitchDeg - det.neutralPitch) + ",\"roll\":" + Math.round(det.rollDeg)
                + ",\"pk\":" + one(det.tapPeak) + ",\"th\":" + one(det.tapThreshold) + ",\"noise\":" + one(det.noise)
                + ",\"bat\":" + bat + ",\"screen\":" + (screen ? 1 : 0) + ",\"exempt\":" + (exempt ? 1 : 0) + "}";
    }

    static String one(float v) { return String.valueOf(Math.round(v * 10f) / 10f); }

    private void sendLoop() {
        int sentStep = 0;
        long lastTilt = 0, lastBeat = System.currentTimeMillis();
        while (running) {
            String m;
            try { m = queue.poll(50, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { break; }
            if (m != null) post(m);
            long now = System.currentTimeMillis();
            int step = tiltStep;
            if (step != sentStep) { post(event("scroll", ",\"r\":" + step)); sentStep = step; lastTilt = now; }
            else if (step != 0 && now - lastTilt > 400) { post("{\"t\":\"scroll\",\"r\":" + step + ",\"rep\":1}"); lastTilt = now; }
            if (active && now - lastBeat > 10000) { post(event("hb", missing.length() > 0 ? ",\"missing\":\"" + missing + "\"" : "")); lastBeat = now; }
            synchronized (lockGuard) {
                // resting with a wake-up sensor: once everything is sent, let the processor sleep
                if (!active && queue.isEmpty() && "wakeup".equals(idleKind) && lock.isHeld()) lock.release();
            }
        }
    }

    private void post(String body) {
        HttpURLConnection c = null;
        try {
            byte[] bytes = body.getBytes("UTF-8");
            c = (HttpURLConnection) new URL(RELAY + "/e/" + code).openConnection();
            c.setConnectTimeout(4000); c.setReadTimeout(4000);
            c.setRequestMethod("POST"); c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setFixedLengthStreamingMode(bytes.length);
            OutputStream o = c.getOutputStream(); o.write(bytes); o.close();
            int status = c.getResponseCode();
            InputStream in = status < 400 ? c.getInputStream() : c.getErrorStream();
            String reply = "";
            if (in != null) { byte[] buf = new byte[256]; int n = in.read(buf); if (n > 0) reply = new String(buf, 0, n, "UTF-8"); while (in.read(buf) > 0) { /* drain so the connection is reused */ } in.close(); }
            if (status == 200) {
                sentOk++; net = "ok";
                int i = reply.indexOf("\"pages\":");
                if (i >= 0) { try { pages = Integer.parseInt(reply.substring(i + 8).replaceAll("[^0-9].*", "")); } catch (Exception e) { pages = -1; } }
            } else { sentErr++; net = "relay said " + status; }
        } catch (Exception e) {
            sentErr++; net = e.getClass().getSimpleName();
            if (c != null) c.disconnect();
        }
    }

    private void buzz(long[] pattern) {
        try { if (vib != null) vib.vibrate(VibrationEffect.createWaveform(pattern, -1)); } catch (Exception e) { /* no vibrator */ }
    }
}
