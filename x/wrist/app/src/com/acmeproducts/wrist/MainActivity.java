package com.acmeproducts.wrist;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;

/**
 * The Wrist screen is a diagnostics panel, nothing more: three still pages; a touch turns the page.
 * Everything shown here is also sent to the log, and the LINK page says when that last happened.
 * Opening Wrist starts the background reader. Holding a finger on the screen for a second stops or restarts it;
 * a brush never does. When X puts the watch to sleep, or no page has listened for three minutes, this screen closes itself.
 */
public class MainActivity extends Activity {
    private static final int GOOD = 0xFF4CC38A, BAD = 0xFFE5534B, WARN = 0xFFE5A23B, TEXT = 0xFFFFFFFF, MUTED = 0xFF9AA4AE;
    private static final String[] TITLE = {"LINK", "POWER", "READER"};
    private Screen screen;
    private String code = "------";
    private boolean stopped;
    private int page;
    private long pageSince;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        code = WristService.codeFor(this);
        screen = new Screen(this);
        setContentView(screen);
        startReader();
    }

    @Override protected void onResume() {
        super.onResume(); page = 0; pageSince = System.currentTimeMillis();
        if (WristService.inst == null && !stopped) startReader();   // opened again after X put it to sleep: start reading
    }

    private void startReader() {
        stopped = false;
        WristService.sleptWhy = null;
        try { startForegroundService(new Intent(this, WristService.class)); } catch (Exception e) { stopped = true; }
    }

    private static String ago(long ms) {
        long s = ms / 1000L;
        return s < 90 ? s + " s" : s < 5400 ? (s / 60) + " min" : (s / 3600) + " h " + ((s % 3600) / 60) + " min";
    }

    private final class Screen extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        private long downAt;
        private float y, u, cx;
        private Canvas cv;

        Screen(Context c) { super(c); setBackgroundColor(0xFF000000); }

        @Override public boolean onTouchEvent(MotionEvent e) {
            int a = e.getActionMasked();
            if (a == MotionEvent.ACTION_DOWN) downAt = e.getEventTime();
            else if (a == MotionEvent.ACTION_UP) {
                if (e.getEventTime() - downAt >= 1000) {
                    if (WristService.inst != null) { WristService.inst.askSleep("hold"); stopped = true; }
                    else startReader();
                } else if (WristService.inst == null) startReader();
                else { page = (page + 1) % TITLE.length; pageSince = System.currentTimeMillis(); }
                invalidate();
            }
            return true;
        }

        /** One "label  value" line; the value carries the colour. */
        private void row(String label, String value, int colour) {
            p.setTextSize(4.6f * u); p.setFakeBoldText(false); p.setColor(MUTED);
            float lw = p.measureText(label + "  ");
            p.setTextSize(5.6f * u); p.setFakeBoldText(true);
            float vw = p.measureText(value), x = cx - (lw + vw) / 2f;
            p.setTextAlign(Paint.Align.LEFT);
            p.setTextSize(4.6f * u); p.setFakeBoldText(false); p.setColor(MUTED); cv.drawText(label, x, y, p);
            p.setTextSize(5.6f * u); p.setFakeBoldText(true); p.setColor(colour); cv.drawText(value, x + lw, y, p);
            p.setFakeBoldText(false); p.setTextAlign(Paint.Align.CENTER);
            y += 8.6f * u;
        }

        @Override protected void onDraw(Canvas c) {
            cv = c; u = getHeight() / 100f; cx = getWidth() / 2f;
            long now = System.currentTimeMillis();
            WristService s = WristService.inst;
            p.setTextAlign(Paint.Align.CENTER);

            p.setColor(MUTED); p.setTextSize(4.4f * u); p.setFakeBoldText(true);
            c.drawText(TITLE[page] + "  " + (page + 1) + "/" + TITLE.length, cx, 13f * u, p);
            p.setFakeBoldText(false);

            if (s == null && WristService.sleptWhy != null && !stopped) { finish(); return; }   // put to sleep by X or left alone: back to the watch face
            if (s == null) {
                p.setColor(BAD); p.setTextSize(7f * u);
                c.drawText(stopped ? "Reader stopped" : "Starting", cx, 46f * u, p);
                p.setColor(MUTED); p.setTextSize(5f * u);
                c.drawText(stopped ? "touch to start" : "", cx, 56f * u, p);
                postInvalidateDelayed(400);
                return;
            }
            Diag d = s.diag;
            y = 26f * u;
            if (page == 0) {
                p.setColor(TEXT); p.setTextSize(11f * u); p.setFakeBoldText(true);
                c.drawText(code.substring(0, 3) + " " + code.substring(3), cx, 28f * u, p);
                p.setFakeBoldText(false);
                y = 40f * u;
                boolean ok = "ok".equals(s.net);
                row("", ok ? (s.pages == 0 ? "X is not open" : "sending to X") : s.net + (s.net.endsWith("connecting") ? "…" : ""), ok ? (s.pages == 0 ? WARN : GOOD) : (s.net.endsWith("connecting") ? WARN : BAD));
                row("link", d.linkName(), "none".equals(d.link) ? BAD : d.validated ? GOOD : WARN);
                row("round trip", s.rttMs < 0 ? "–" : s.rttMs + " ms", s.rttMs < 0 ? MUTED : s.rttMs < 400 ? GOOD : s.rttMs < 1200 ? WARN : BAD);
                row("sent", s.sentOk + " ok, " + s.sentErr + " failed", s.sentErr > s.sentOk ? BAD : TEXT);
                row("logged", s.lastLoggedMs == 0 ? "not yet" : new java.text.SimpleDateFormat("HH:mm", java.util.Locale.US).format(new java.util.Date(s.lastLoggedMs)), s.lastLoggedMs == 0 ? WARN : GOOD);
                if (s.netDetail.length() > 0) row("", s.netDetail, WARN);
            } else if (page == 1) {
                row("battery", d.bat + "%" + (d.charging ? " charging" : ""), d.bat >= 0 && d.bat < 15 ? BAD : TEXT);
                row("background", d.restricted ? "BLOCKED" : "allowed", d.restricted ? BAD : GOOD);
                row("power saving", d.saver ? "ON" : "off", d.saver ? BAD : GOOD);
                row("watch idle", d.idle ? "deep" : d.lightIdle ? "light" : "no", d.idle ? BAD : d.lightIdle ? WARN : GOOD);
                row("standby", d.bucketName(), d.bucket > 30 ? BAD : d.bucket > 10 ? WARN : GOOD);
                row("longest gap", ago(s.longestSilenceMs), s.longestSilenceMs > 60000 ? BAD : s.longestSilenceMs > 20000 ? WARN : GOOD);
                row("Wi-Fi radio", d.wifiOn ? "on" : "off", TEXT);
                row("pause if unused", d.unused == 1 ? "off" : d.unused == 0 ? "ON" : "unknown", d.unused == 1 ? GOOD : d.unused == 0 ? WARN : MUTED);
            } else {
                row("state", s.mode + (s.rawWanted ? ", streaming" : ""), TEXT);
                row("running", ago(s.upSeconds() * 1000L), TEXT);
                row("starts", String.valueOf(s.restarts), TEXT);
                boolean sens = d.gravity && d.gyro && d.linear;
                row("sensors", sens ? "all present" : "MISSING " + s.missing, sens ? GOOD : BAD);
                row("low-power sensor", d.wakeAccel ? "yes" : "none", d.wakeAccel ? GOOD : WARN);
                row("last motion", s.last, TEXT);
                row("", s.build + "  ·  API " + d.sdk, MUTED);
            }
            p.setColor(MUTED); p.setTextSize(3.8f * u);
            c.drawText("hold 1 s to stop", cx, 93f * u, p);
            postInvalidateDelayed(400);
        }
    }
}
