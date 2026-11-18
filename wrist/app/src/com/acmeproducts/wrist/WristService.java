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
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
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
 * Wrist turn06: reads the left wrist with the watch screen off and sends what it sees to X.
 * Two kinds of output: motions it recognises itself (tilt, swing), and, when a Lab page asks
 * for it, the raw sensor stream so new motions can be tried and tuned on the page without a new watch app.
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
    volatile String netDetail = "";
    volatile String net = "connecting", last = "nothing yet", mode = "starting", idleKind = "", missing = "", code = "------", build = "?";
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

    /* ---- raw stream for the Lab: 50 samples a second, only while a page asks for it ---- */
    static final int RAW_FIELDS = 10, RAW_MAX = 200;
    volatile boolean rawWanted;
    private final Object rawGuard = new Object();
    private final int[] rawBuf = new int[RAW_FIELDS * RAW_MAX];
    private int rawN, gravTick;
    private long rawBaseNs, rawBaseMs;
    private float wx, wy, wz, ax, ay, az;
    private final long startedMs = System.currentTimeMillis();

    /* ---- the watch's own connection: asked for and held while active, so it is up before the first message ---- */
    private ConnectivityManager cm;
    private ConnectivityManager.NetworkCallback netCb;
    volatile boolean netUp;

    private void holdNetwork() {
        if (cm == null || netCb != null) return;
        try {
            netCb = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network n) { netUp = true; }
                @Override public void onLost(Network n) { netUp = false; }
            };
            cm.requestNetwork(new NetworkRequest.Builder().addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build(), netCb);
        } catch (Exception e) { netCb = null; netDetail = "no network hold: " + e.getClass().getSimpleName(); }
    }

    private void releaseNetwork() {
        if (cm == null || netCb == null) return;
        try { cm.unregisterNetworkCallback(netCb); } catch (Exception e) { /* already gone */ }
        netCb = null; netUp = false;
    }

    /* ---- diagnostics: one snapshot every 2 s, drawn on the Wrist screen and logged when it changes ---- */
    volatile Diag diag = new Diag();
    volatile int restarts, rttMs = -1;
    volatile long lastOkMs, longestSilenceMs;
    private String diagKey = "";
    private long lastDiagRead, lastDiagSent;

    long upSeconds() { return (System.currentTimeMillis() - startedMs) / 1000L; }

    private String diagEvent(String why) {
        return event("diag", ",\"why\":\"" + why + "\"," + diag.json() + ",\"restarts\":" + restarts
                + ",\"ok\":" + sentOk + ",\"silence\":" + (longestSilenceMs / 1000L) + ",\"idleKind\":\"" + idleKind + "\",\"detail\":\"" + netDetail + "\"");
    }

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
        try {
            SharedPreferences sp = getSharedPreferences("wrist", MODE_PRIVATE);
            restarts = sp.getInt("starts", 0) + 1;
            sp.edit().putInt("starts", restarts).apply();
        } catch (Exception e) { restarts = -1; }
        diag = Diag.read(this);
        sm = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
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
        releaseNetwork();
        synchronized (lockGuard) { if (lock != null && lock.isHeld()) lock.release(); }
        if (inst == this) inst = null;
        super.onDestroy();
    }

    /* ---------------- modes ---------------- */

    private void goActive(String why) {
        synchronized (lockGuard) { if (!lock.isHeld()) lock.acquire(); active = true; }
        mode = "active";
        holdNetwork();
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
        boolean lab = rawWanted;                         // while a Lab page is watching, never drop to resting
        if (type == Sensor.TYPE_GRAVITY) {
            det.onGravity(v[0], v[1], v[2], t);
            tiltStep = t - activeSinceNs < SETTLE_NS ? 0 : Math.round(det.scrollRate * 4f);
            if (lab && (++gravTick & 1) == 0) rawSample(v[0], v[1], v[2], t);
            if (det.pose == Detector.POSE_OTHER && !lab) { if (otherSinceNs == 0) otherSinceNs = t; else if (t - otherSinceNs > OTHER_POSE_NS) { goIdle("arm down"); return; } }
            else otherSinceNs = 0;
        } else if (type == Sensor.TYPE_GYROSCOPE) {
            wx = v[0]; wy = v[1]; wz = v[2];
            ev = det.onGyro(v[0], v[1], v[2], t);
            float mag = (float) Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            if (mag < STILL_GYRO && tiltStep == 0 && !lab) { if (stillSinceNs == 0) stillSinceNs = t; else if (t - stillSinceNs > STILL_NS) { goIdle("still"); return; } }
            else stillSinceNs = 0;
        } else if (type == Sensor.TYPE_LINEAR_ACCELERATION) {
            ax = v[0]; ay = v[1]; az = v[2];
        }
        if (ev != Detector.NONE && t - activeSinceNs >= SETTLE_NS) act(ev, "wrist");
    }

    /** One raw row: ms since the batch began, then gravity, turn rate and linear acceleration, each x100. */
    private void rawSample(float gx, float gy, float gz, long t) {
        synchronized (rawGuard) {
            if (rawN >= RAW_MAX) return;                 // the sender is behind: drop, never block the sensor thread
            if (rawN == 0) { rawBaseNs = t; rawBaseMs = System.currentTimeMillis(); }
            int o = rawN * RAW_FIELDS;
            rawBuf[o] = (int) ((t - rawBaseNs) / 1000000L);
            rawBuf[o + 1] = Math.round(gx * 100f); rawBuf[o + 2] = Math.round(gy * 100f); rawBuf[o + 3] = Math.round(gz * 100f);
            rawBuf[o + 4] = Math.round(wx * 100f); rawBuf[o + 5] = Math.round(wy * 100f); rawBuf[o + 6] = Math.round(wz * 100f);
            rawBuf[o + 7] = Math.round(ax * 100f); rawBuf[o + 8] = Math.round(ay * 100f); rawBuf[o + 9] = Math.round(az * 100f);
            rawN++;
        }
    }

    private String rawBatch() {
        synchronized (rawGuard) {
            if (rawN == 0) return null;
            StringBuilder b = new StringBuilder(64 + rawN * 48);
            b.append("{\"t\":\"raw\",\"ln\":\"").append(diag.link).append("\",\"rt\":").append(rttMs).append(",\"w\":").append(rawBaseMs).append(",\"s\":[");
            for (int i = 0; i < rawN; i++) {
                b.append(i == 0 ? "[" : ",[");
                for (int k = 0; k < RAW_FIELDS; k++) { if (k > 0) b.append(','); b.append(rawBuf[i * RAW_FIELDS + k]); }
                b.append(']');
            }
            rawN = 0;
            return b.append("]}").toString();
        }
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
    }

    /* ---------------- sending ---------------- */

    /** One event as JSON, with the readings behind it so thresholds and battery use can be tuned from the relay log. */
    private String event(String type, String extra) {
        int bat = -1;
        try { bat = ((BatteryManager) getSystemService(Context.BATTERY_SERVICE)).getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY); } catch (Exception e) { bat = -1; }
        boolean exempt = diag.exempt;
        boolean screen = false;
        try { screen = pm.isInteractive(); } catch (Exception e) { screen = false; }
        return "{\"t\":\"" + type + "\"" + extra + ",\"seq\":" + (++seq) + ",\"b\":\"" + build + "\""
                + ",\"pose\":" + det.pose + ",\"tilt\":" + Math.round(det.pitchDeg - det.neutralPitch) + ",\"roll\":" + Math.round(det.rollDeg)
                + ",\"up\":" + ((System.currentTimeMillis() - startedMs) / 1000L) + ",\"mode\":\"" + mode + "\",\"raw\":" + (rawWanted ? 1 : 0)
                + ",\"err\":" + sentErr + ",\"net\":" + (netUp ? 1 : 0) + ",\"ln\":\"" + diag.link + "\",\"rtt\":" + rttMs
                + ",\"bat\":" + bat + ",\"screen\":" + (screen ? 1 : 0) + ",\"exempt\":" + (exempt ? 1 : 0) + "}";
    }

    static String one(float v) { return String.valueOf(Math.round(v * 10f) / 10f); }

    private void sendLoop() {
        int sentStep = 0;
        long lastTilt = 0, lastBeat = System.currentTimeMillis();
        while (running) {
            String m;
            try { m = queue.poll(50, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { break; }
            if (m != null && !post(m) && m.indexOf("\"t\":\"hb\"") != 1) {
                // not delivered: keep it (a motion or a mode change must not be lost while the connection wakes) and try again shortly
                if (queue.size() < 40) queue.offerFirst(m);
                try { Thread.sleep(1000); } catch (InterruptedException e) { break; }
                continue;
            }
            long now = System.currentTimeMillis();
            if (now - lastDiagRead > 2000) {
                lastDiagRead = now;
                Diag d = Diag.read(this);
                diag = d;
                String k = d.key();
                boolean changed = !k.equals(diagKey);
                if (changed || now - lastDiagSent > 60000) {
                    queue.offer(diagEvent(diagKey.length() == 0 ? "start" : changed ? "change" : "minute"));
                    diagKey = k; lastDiagSent = now;
                }
            }
            int step = tiltStep;
            if (step != sentStep) { post(event("scroll", ",\"r\":" + step)); sentStep = step; lastTilt = now; }
            else if (step != 0 && now - lastTilt > 400) { post("{\"t\":\"scroll\",\"r\":" + step + ",\"rep\":1}"); lastTilt = now; }
            if (rawWanted) { String raw = rawBatch(); if (raw != null) post(raw); }
            // heartbeat: every 3 s while a page is listening (so a Lab request reaches the watch quickly), else every 10 s.
            // Also while resting if the processor is awake anyway, so a Lab page can wake the watch.
            boolean beat = active || "lock".equals(idleKind);
            if (beat && now - lastBeat > (pages > 0 ? 3000 : 10000)) { post(event("hb", missing.length() > 0 ? ",\"missing\":\"" + missing + "\"" : "")); lastBeat = now; }
            if (rawWanted && !active) goActive("lab");
            synchronized (lockGuard) {
                // resting with a wake-up sensor: once everything is sent, let the processor sleep
                if (!active && queue.isEmpty() && "wakeup".equals(idleKind) && lock.isHeld()) lock.release();
            }
        }
    }

    private boolean post(String body) {
        HttpURLConnection c = null;
        try {
            byte[] bytes = body.getBytes("UTF-8");
            long t0 = System.currentTimeMillis();
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
                long t1 = System.currentTimeMillis();
                rttMs = (int) (t1 - t0);
                if (lastOkMs != 0 && t1 - lastOkMs > longestSilenceMs) longestSilenceMs = t1 - lastOkMs;
                lastOkMs = t1;
                sentOk++; net = "ok"; netDetail = "";
                int i = reply.indexOf("\"pages\":");
                if (i >= 0) { try { pages = Integer.parseInt(reply.substring(i + 8).replaceAll("[^0-9].*", "")); } catch (Exception e) { pages = -1; } }
                boolean want = reply.indexOf("\"raw\":1") >= 0;
                if (want != rawWanted) { rawWanted = want; if (!want) synchronized (rawGuard) { rawN = 0; } }
                return true;
            }
            sentErr++; net = "relay said " + status; netDetail = "";
        } catch (Exception e) {
            // UnknownHost / SocketTimeout here mean the watch's own connection is not up yet, not that the relay is down
            sentErr++; net = sentOk == 0 ? "connecting" : "reconnecting"; netDetail = e.getClass().getSimpleName().replace("Exception", "");
            if (c != null) c.disconnect();
        }
        return false;
    }

    private void buzz(long[] pattern) {
        try { if (vib != null) vib.vibrate(VibrationEffect.createWaveform(pattern, -1)); } catch (Exception e) { /* no vibrator */ }
    }
}
