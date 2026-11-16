package com.acmeproducts.wrist;

import android.app.Activity;
import android.content.Context;
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

/**
 * Wrist turn01: a practice screen that proves the wearable contract on the owner's arm.
 * Nothing leaves the watch in this build. Tilt moves the list, a swing with the hand
 * vertical changes thread, a knock (or a touch anywhere) ticks the centred row.
 */
public class MainActivity extends Activity implements SensorEventListener {
    private static final int ROWS = 30, THREADS = 4;
    private static final float ROWS_PER_SEC = 6f;
    private static final int[] THREAD_COLOR = {0xFF39C5CF, 0xFFE5A23B, 0xFF8BC34A, 0xFFE5534B};

    private final Detector det = new Detector();
    private SensorManager sm;
    private Vibrator vib;
    private Screen screen;
    private String build = "?", missing = "";
    private float pos;                      // list position, in rows
    private int thread, lastRow = -1;
    private final boolean[][] ticked = new boolean[THREADS][ROWS];
    private int nLeft, nRight, nTap;
    private String last = "none yet";
    private long lastFrameNs;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        try { PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0); build = pi.versionName; } catch (Exception e) { build = "?"; }
        sm = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        screen = new Screen(this);
        setContentView(screen);
    }

    @Override protected void onResume() {
        super.onResume();
        missing = "";
        listen(Sensor.TYPE_GRAVITY, "gravity");
        listen(Sensor.TYPE_GYROSCOPE, "gyroscope");
        listen(Sensor.TYPE_LINEAR_ACCELERATION, "linear acceleration");
        lastFrameNs = 0;
        screen.invalidate();
    }

    private void listen(int type, String name) {
        Sensor s = sm == null ? null : sm.getDefaultSensor(type);
        if (s == null || !sm.registerListener(this, s, 10000)) missing += (missing.length() > 0 ? ", " : "") + name;
    }

    @Override protected void onPause() { super.onPause(); if (sm != null) sm.unregisterListener(this); }

    @Override public void onAccuracyChanged(Sensor s, int a) { }

    @Override public void onSensorChanged(SensorEvent e) {
        float[] v = e.values;
        int ev = Detector.NONE;
        switch (e.sensor.getType()) {
            case Sensor.TYPE_GRAVITY: det.onGravity(v[0], v[1], v[2], e.timestamp); break;
            case Sensor.TYPE_GYROSCOPE: ev = det.onGyro(v[0], v[1], v[2], e.timestamp); break;
            case Sensor.TYPE_LINEAR_ACCELERATION: ev = det.onLinear(v[0], v[1], v[2], e.timestamp); break;
            default: break;
        }
        if (ev != Detector.NONE) act(ev, "wrist");
    }

    private void act(int ev, String how) {
        if (ev == Detector.SWIPE_LEFT) { thread = (thread + THREADS - 1) % THREADS; nLeft++; last = "swipe left"; buzz(new long[]{0, 35}); }
        else if (ev == Detector.SWIPE_RIGHT) { thread = (thread + 1) % THREADS; nRight++; last = "swipe right"; buzz(new long[]{0, 35}); }
        else if (ev == Detector.TAP) {
            int r = row();
            ticked[thread][r] = !ticked[thread][r];
            nTap++; last = "tap (" + how + ")"; buzz(new long[]{0, 25, 70, 25});
        }
        screen.invalidate();
    }

    private int row() { int r = Math.round(pos); return r < 0 ? 0 : (r > ROWS - 1 ? ROWS - 1 : r); }

    private void buzz(long[] pattern) {
        try { if (vib != null) vib.vibrate(VibrationEffect.createWaveform(pattern, -1)); } catch (Exception e) { /* no vibrator: the screen still shows it */ }
    }

    private final class Screen extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        Screen(Context c) { super(c); setBackgroundColor(0xFF000000); }

        @Override public boolean onTouchEvent(MotionEvent e) {
            if (e.getActionMasked() == MotionEvent.ACTION_DOWN) act(Detector.TAP, "touch");
            return true;
        }

        @Override protected void onDraw(Canvas c) {
            long now = System.nanoTime();
            float dt = lastFrameNs == 0 ? 0f : (now - lastFrameNs) / 1e9f;
            if (dt > 0.1f) dt = 0.1f;
            lastFrameNs = now;
            /* hand raised = towards the top of the list */
            pos -= det.scrollRate * ROWS_PER_SEC * dt;
            if (pos < 0f) pos = 0f;
            if (pos > ROWS - 1) pos = ROWS - 1;
            int r = row();
            if (r != lastRow) { if (lastRow >= 0 && det.scrollRate != 0f) buzz(new long[]{0, 8}); lastRow = r; }

            float w = getWidth(), h = getHeight(), cx = w / 2f, cy = h / 2f, u = h / 100f;
            p.setTextAlign(Paint.Align.CENTER);

            p.setColor(THREAD_COLOR[thread]); p.setTextSize(7.5f * u); p.setFakeBoldText(true);
            c.drawText("Thread " + (thread + 1) + " of " + THREADS, cx, 15f * u, p);
            p.setFakeBoldText(false);

            String poseName = det.pose == Detector.POSE_FLAT ? "FLAT: tilt to move" : det.pose == Detector.POSE_VERTICAL ? "VERTICAL: swing to switch" : "other pose";
            p.setColor(0xFF9AA4AE); p.setTextSize(5f * u);
            c.drawText(poseName, cx, 22f * u, p);

            float rowH = 11f * u;
            for (int i = r - 1; i <= r + 1; i++) {
                if (i < 0 || i >= ROWS) continue;
                float y = cy + 3f * u + (i - pos) * rowH;
                float dist = Math.abs(i - pos);
                boolean centre = i == r;
                p.setTextSize((centre ? 10f : 7f) * u);
                p.setFakeBoldText(centre);
                int alpha = dist > 1.6f ? 0 : (int) (255 * (1f - dist / 1.8f));
                p.setColor(centre ? 0xFFFFFFFF : 0xFF7C8791); p.setAlpha(centre ? 255 : alpha);
                c.drawText((ticked[thread][i] ? "✓ " : "") + "Row " + (i + 1), cx, y, p);
            }
            p.setFakeBoldText(false); p.setAlpha(255);

            p.setColor(0xFFFFFFFF); p.setTextSize(5.5f * u);
            c.drawText("last: " + last, cx, 74f * u, p);
            p.setColor(0xFF9AA4AE); p.setTextSize(4.6f * u);
            c.drawText("L " + nLeft + "  R " + nRight + "  tap " + nTap, cx, 80f * u, p);
            c.drawText("tilt " + Math.round(det.pitchDeg - det.neutralPitch) + "\u00B0  roll " + Math.round(det.rollDeg) + "\u00B0", cx, 85.5f * u, p);
            c.drawText("knock " + fmt(det.tapPeak) + " / " + fmt(det.tapThreshold), cx, 90.5f * u, p);
            p.setTextSize(4f * u);
            c.drawText(missing.length() > 0 ? "NO " + missing : build, cx, 95f * u, p);
            if (missing.length() > 0) { p.setColor(0xFFE5534B); c.drawText("sensor missing", cx, 28f * u, p); }

            postInvalidateOnAnimation();
        }

        private String fmt(float v) { return String.valueOf(Math.round(v * 10f) / 10f); }
    }
}
