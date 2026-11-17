package com.acmeproducts.wrist;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.net.Uri;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.MotionEvent;
import android.view.View;

/**
 * The watch face of Wrist. Nothing here is meant to be read in use: it shows the pairing code once,
 * and whether sending works. Opening it starts the background reader; holding a finger on it stops the reader.
 */
public class MainActivity extends Activity {
    private Screen screen;
    private String code = "------";
    private boolean stopped;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        code = WristService.codeFor(this);
        screen = new Screen(this);
        setContentView(screen);
        startReader();
        askBatteryExemption();
    }

    private void startReader() {
        stopped = false;
        try { startForegroundService(new Intent(this, WristService.class)); } catch (Exception e) { stopped = true; }
    }

    /** Without this the watch may cut the app's network a few minutes after the screen goes off. Asked on up to three opens. */
    private void askBatteryExemption() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            SharedPreferences sp = getSharedPreferences("wrist", MODE_PRIVATE);
            int asked = sp.getInt("askedExemptTimes", 0);
            if (pm.isIgnoringBatteryOptimizations(getPackageName()) || asked >= 3) return;
            sp.edit().putInt("askedExemptTimes", asked + 1).apply();
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
        } catch (Exception e) { /* this watch has no such screen; the relay log will show "exempt":0 */ }
    }

    private final class Screen extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        private long downAt;

        Screen(Context c) { super(c); setBackgroundColor(0xFF000000); }

        @Override public boolean onTouchEvent(MotionEvent e) {
            int a = e.getActionMasked();
            if (a == MotionEvent.ACTION_DOWN) downAt = e.getEventTime();
            else if (a == MotionEvent.ACTION_UP) {
                WristService s = WristService.inst;
                if (e.getEventTime() - downAt >= 900) {
                    if (s != null) { stopService(new Intent(MainActivity.this, WristService.class)); stopped = true; }
                    else startReader();
                } else if (s != null) s.act(Detector.TAP, "touch");
                else startReader();
                invalidate();
            }
            return true;
        }

        @Override protected void onDraw(Canvas c) {
            float h = getHeight(), cx = getWidth() / 2f, u = h / 100f;
            WristService s = WristService.inst;
            p.setTextAlign(Paint.Align.CENTER);

            p.setColor(0xFF9AA4AE); p.setTextSize(5.5f * u); p.setFakeBoldText(false);
            c.drawText("code for X", cx, 22f * u, p);
            p.setColor(0xFFFFFFFF); p.setTextSize(17f * u); p.setFakeBoldText(true);
            c.drawText(code.substring(0, 3) + " " + code.substring(3), cx, 42f * u, p);
            p.setFakeBoldText(false);

            p.setTextSize(6.5f * u);
            if (s == null) { p.setColor(0xFFE5534B); c.drawText(stopped ? "stopped. touch to start" : "starting", cx, 54f * u, p); }
            else if (s.missing.length() > 0) { p.setColor(0xFFE5534B); c.drawText("NO " + s.missing, cx, 54f * u, p); }
            else if (!"ok".equals(s.net)) { p.setColor(s.sentErr > 0 ? 0xFFE5534B : 0xFFE5A23B); c.drawText(s.net, cx, 54f * u, p); }
            else if (s.pages == 0) { p.setColor(0xFFE5A23B); c.drawText("X is not open", cx, 54f * u, p); }
            else { p.setColor(0xFF4CC38A); c.drawText("sending to X", cx, 54f * u, p); }

            if (s != null) {
                p.setColor(0xFFFFFFFF); p.setTextSize(6f * u);
                c.drawText(s.last, cx, 66f * u, p);
                p.setColor(0xFF9AA4AE); p.setTextSize(4.8f * u);
                c.drawText(s.mode + "  tilt " + s.tiltStep + "  sent " + s.sentOk + "/" + s.sentErr, cx, 75f * u, p);
                c.drawText("hold to stop", cx, 82f * u, p);
                p.setTextSize(4.2f * u);
                c.drawText(s.build, cx, 90f * u, p);
            }
            postInvalidateDelayed(300);
        }
    }
}
