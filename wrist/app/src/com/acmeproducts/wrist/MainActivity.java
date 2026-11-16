package com.acmeproducts.wrist;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.SecureRandom;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

/**
 * Wrist turn02: the watch is a sensor, not a screen. It reads the left-wrist motions and
 * sends each one to X (a page on the phone or desktop) through the wrist relay. The watch
 * face only shows the pairing code and whether sending works.
 */
public class MainActivity extends Activity implements SensorEventListener {
    static final String RELAY = "https://wrist-relay.myacctfortracking.workers.dev";

    private final Detector det = new Detector();
    private SensorManager sm;
    private Vibrator vib;
    private Screen screen;
    private String build = "?", missing = "", code = "------";
    private String last = "nothing yet";
    private int seq;

    /* ---- sending: one background thread, newest tilt wins ---- */
    private final LinkedBlockingDeque<String> queue = new LinkedBlockingDeque<String>();
    private volatile int tiltStep;           // -4..4, + = hand raised
    private volatile boolean running;
    private volatile String net = "not sent yet";
    private volatile int sentOk, sentErr, pages = -1;
    private Thread sender;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        try { PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0); build = pi.versionName; } catch (Exception e) { build = "?"; }
        SharedPreferences sp = getSharedPreferences("wrist", MODE_PRIVATE);
        code = sp.getString("code", "");
        if (code.length() != 6) {
            code = String.valueOf(100000 + new SecureRandom().nextInt(900000));
            sp.edit().putString("code", code).apply();
        }
        sm = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        screen = new Screen(this);
        setContentView(screen);
    }

    @Override protected void onResume() {
        super.onResume();
        missing = "";
        listen(Sensor.TYPE_GRAVITY, "gravity");
        listen(Sensor.TYPE_GYROSCOPE, "gyro");
        listen(Sensor.TYPE_LINEAR_ACCELERATION, "accel");
        running = true;
        sender = new Thread(new Runnable() { @Override public void run() { sendLoop(); } }, "wrist-send");
        sender.start();
        queue.offer(event("hello", ""));
        screen.invalidate();
    }

    @Override protected void onPause() {
        super.onPause();
        if (sm != null) sm.unregisterListener(this);
        tiltStep = 0;
        running = false;
        if (sender != null) sender.interrupt();
    }

    private void listen(int type, String name) {
        Sensor s = sm == null ? null : sm.getDefaultSensor(type);
        if (s == null || !sm.registerListener(this, s, 10000)) missing += (missing.length() > 0 ? ", " : "") + name;
    }

    @Override public void onAccuracyChanged(Sensor s, int a) { }

    @Override public void onSensorChanged(SensorEvent e) {
        float[] v = e.values;
        int ev = Detector.NONE;
        switch (e.sensor.getType()) {
            case Sensor.TYPE_GRAVITY:
                det.onGravity(v[0], v[1], v[2], e.timestamp);
                tiltStep = Math.round(det.scrollRate * 4f);
                break;
            case Sensor.TYPE_GYROSCOPE: ev = det.onGyro(v[0], v[1], v[2], e.timestamp); break;
            case Sensor.TYPE_LINEAR_ACCELERATION: ev = det.onLinear(v[0], v[1], v[2], e.timestamp); break;
            default: break;
        }
        if (ev != Detector.NONE) act(ev, "wrist");
    }

    private void act(int ev, String how) {
        if (ev == Detector.SWIPE_LEFT) { last = "swing left"; queue.offer(event("swipe", ",\"d\":\"left\"")); buzz(new long[]{0, 35}); }
        else if (ev == Detector.SWIPE_RIGHT) { last = "swing right"; queue.offer(event("swipe", ",\"d\":\"right\"")); buzz(new long[]{0, 35}); }
        else if (ev == Detector.TAP) { last = "knock (" + how + ")"; queue.offer(event("tap", ",\"how\":\"" + how + "\"")); buzz(new long[]{0, 25, 70, 25}); }
        screen.postInvalidate();
    }

    /** One event as JSON, with the readings behind it so thresholds can be tuned from the relay log. */
    private String event(String type, String extra) {
        return "{\"t\":\"" + type + "\"" + extra + ",\"seq\":" + (++seq) + ",\"b\":\"" + build + "\""
                + ",\"pose\":" + det.pose + ",\"tilt\":" + Math.round(det.pitchDeg - det.neutralPitch) + ",\"roll\":" + Math.round(det.rollDeg)
                + ",\"pk\":" + one(det.tapPeak) + ",\"th\":" + one(det.tapThreshold) + ",\"noise\":" + one(det.noise) + "}";
    }

    private static String one(float v) { return String.valueOf(Math.round(v * 10f) / 10f); }

    private void sendLoop() {
        int sentStep = 0;
        long lastTilt = 0, lastBeat = System.currentTimeMillis();
        while (running && sender == Thread.currentThread()) {
            String m;
            try { m = queue.poll(50, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { break; }
            if (m != null) post(m);
            long now = System.currentTimeMillis();
            int step = tiltStep;
            if (step != sentStep) { post(event("scroll", ",\"r\":" + step)); sentStep = step; lastTilt = now; }
            else if (step != 0 && now - lastTilt > 400) { post("{\"t\":\"scroll\",\"r\":" + step + ",\"rep\":1}"); lastTilt = now; }
            if (now - lastBeat > 10000) { post(event("hb", missing.length() > 0 ? ",\"missing\":\"" + missing + "\"" : "")); lastBeat = now; }
        }
        if (sentStep != 0) post("{\"t\":\"scroll\",\"r\":0}");
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
        screen.postInvalidate();
    }

    private void buzz(long[] pattern) {
        try { if (vib != null) vib.vibrate(VibrationEffect.createWaveform(pattern, -1)); } catch (Exception e) { /* no vibrator */ }
    }

    private final class Screen extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        Screen(Context c) { super(c); setBackgroundColor(0xFF000000); }

        @Override public boolean onTouchEvent(MotionEvent e) {
            if (e.getActionMasked() == MotionEvent.ACTION_DOWN) act(Detector.TAP, "touch");
            return true;
        }

        @Override protected void onDraw(Canvas c) {
            float h = getHeight(), cx = getWidth() / 2f, u = h / 100f;
            p.setTextAlign(Paint.Align.CENTER);
            boolean ok = "ok".equals(net);

            p.setColor(0xFF9AA4AE); p.setTextSize(5.5f * u); p.setFakeBoldText(false);
            c.drawText("code for X", cx, 22f * u, p);
            p.setColor(0xFFFFFFFF); p.setTextSize(17f * u); p.setFakeBoldText(true);
            c.drawText(code.substring(0, 3) + " " + code.substring(3), cx, 42f * u, p);
            p.setFakeBoldText(false);

            p.setTextSize(6.5f * u);
            if (missing.length() > 0) { p.setColor(0xFFE5534B); c.drawText("NO " + missing, cx, 54f * u, p); }
            else if (!ok) { p.setColor(sentErr > 0 ? 0xFFE5534B : 0xFFE5A23B); c.drawText(net, cx, 54f * u, p); }
            else if (pages == 0) { p.setColor(0xFFE5A23B); c.drawText("X is not open", cx, 54f * u, p); }
            else { p.setColor(0xFF4CC38A); c.drawText("sending to X", cx, 54f * u, p); }

            p.setColor(0xFFFFFFFF); p.setTextSize(6f * u);
            c.drawText(last, cx, 66f * u, p);
            p.setColor(0xFF9AA4AE); p.setTextSize(4.8f * u);
            String pose = det.pose == Detector.POSE_FLAT ? "flat" : det.pose == Detector.POSE_VERTICAL ? "vertical" : "other";
            c.drawText(pose + "  tilt " + tiltStep + "  sent " + sentOk + "/" + sentErr, cx, 75f * u, p);
            c.drawText("knock " + one(det.tapPeak) + " / " + one(det.tapThreshold), cx, 82f * u, p);
            p.setTextSize(4.2f * u);
            c.drawText(build, cx, 90f * u, p);
            postInvalidateDelayed(250);
        }
    }
}
