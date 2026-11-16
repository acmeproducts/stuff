import com.acmeproducts.wrist.Detector;

/** Lab checks for the wrist detector: synthetic sensor traces at 100 Hz. Proves the logic only, not the owner's arm. */
public class DetectorTest {
    static int fails = 0, checks = 0;
    static long t;
    static final long STEP = 10000000L;
    static final float G = 9.81f;

    static void check(String name, boolean ok) { checks++; if (!ok) fails++; System.out.println((ok ? "PASS " : "FAIL ") + name); }

    /** One 10 ms frame. g = gravity, w = gyro, a = linear acceleration magnitude on z. Returns the events seen. */
    static int[] ev = new int[4];
    static void frame(Detector d, float[] g, float[] w, float a) {
        t += STEP;
        d.onGravity(g[0], g[1], g[2], t);
        ev[d.onGyro(w[0], w[1], w[2], t)]++;
        ev[d.onLinear(0, 0, a, t)]++;
    }
    static void run(Detector d, float[] g, float[] w, float a, int frames) { for (int i = 0; i < frames; i++) frame(d, g, w, a); }
    static void clear() { ev = new int[4]; }
    static float[] flat(float pitchDeg) { double p = Math.toRadians(pitchDeg); return new float[]{(float) (G * Math.sin(p)), 0, (float) (G * Math.cos(p))}; }
    static final float[] VERT = {0, -G, 0}, STILL = {0, 0, 0};
    static Detector fresh() { t = 1000000000L; clear(); return new Detector(); }

    public static void main(String[] x) {
        Detector d = fresh();
        run(d, flat(0), STILL, 0.1f, 200);
        check("flat and still: no events", ev[1] + ev[2] + ev[3] == 0);
        check("flat and still: pose is flat, no scroll", d.pose == Detector.POSE_FLAT && d.scrollRate == 0f);

        for (int i = 1; i <= 30; i++) frame(d, flat(i), STILL, 0.1f);
        run(d, flat(30), STILL, 0.1f, 200);
        check("hand raised 30 deg and held 2 s: still scrolling, positive", d.scrollRate > 0.5f);
        for (int i = 30; i >= 0; i--) frame(d, flat(i), STILL, 0.1f);
        run(d, flat(0), STILL, 0.1f, 50);
        check("back to level: scrolling stops", d.scrollRate == 0f);
        for (int i = 0; i >= -30; i--) frame(d, flat(i), STILL, 0.1f);
        run(d, flat(-30), STILL, 0.1f, 100);
        check("hand lowered 30 deg: scrolling negative", d.scrollRate < -0.5f);
        check("tilting never fired a swipe or tap", ev[1] + ev[2] + ev[3] == 0);

        d = fresh();
        run(d, flat(0), STILL, 0.1f, 100);
        for (int i = 0; i < 800; i++) frame(d, flat(i * 8f / 800f), STILL, 0.1f);
        check("slow 8 deg drift over 8 s: no scroll", d.scrollRate == 0f);

        d = fresh();
        run(d, VERT, STILL, 0.1f, 100);
        check("hand vertical: pose is vertical", d.pose == Detector.POSE_VERTICAL);
        clear();
        run(d, VERT, new float[]{0, -3f, 0}, 0.1f, 20);   // +3 rad/s about "up" = counter-clockwise from above
        run(d, VERT, new float[]{0, 3f, 0}, 0.1f, 20);    // the return swing
        run(d, VERT, STILL, 0.1f, 100);
        check("swing left and back: exactly one SWIPE_LEFT", ev[Detector.SWIPE_LEFT] == 1 && ev[Detector.SWIPE_RIGHT] == 0);
        clear();
        run(d, VERT, new float[]{0, 3f, 0}, 0.1f, 20);
        run(d, VERT, new float[]{0, -3f, 0}, 0.1f, 20);
        run(d, VERT, STILL, 0.1f, 100);
        check("swing right and back: exactly one SWIPE_RIGHT", ev[Detector.SWIPE_RIGHT] == 1 && ev[Detector.SWIPE_LEFT] == 0);
        check("swings fired no tap", ev[Detector.TAP] == 0);
        clear();
        run(d, VERT, new float[]{0, -0.6f, 0}, 0.1f, 200);
        check("slow turn while vertical: no swipe", ev[1] + ev[2] == 0);

        d = fresh();
        run(d, flat(0), STILL, 0.1f, 100);
        clear();
        run(d, flat(0), new float[]{0, 0, 3f}, 0.1f, 20);
        run(d, flat(0), STILL, 0.1f, 100);
        check("same swing with the hand flat: no swipe", ev[1] + ev[2] == 0);

        d = fresh();
        run(d, flat(0), STILL, 0.1f, 200);
        clear();
        run(d, flat(0), STILL, 8f, 2);
        run(d, flat(0), STILL, 0.1f, 100);
        check("one 20 ms knock: exactly one TAP", ev[Detector.TAP] == 1);
        clear();
        run(d, flat(0), STILL, 8f, 2); run(d, flat(0), STILL, 0.1f, 60);
        run(d, flat(0), STILL, 8f, 2); run(d, flat(0), STILL, 0.1f, 60);
        check("two knocks 0.6 s apart: two TAPs", ev[Detector.TAP] == 2);
        clear();
        run(d, flat(0), STILL, 8f, 40);
        run(d, flat(0), STILL, 0.1f, 100);
        check("0.4 s shove: no TAP", ev[Detector.TAP] == 0);
        clear();
        run(d, flat(0), new float[]{4f, 0, 0}, 0.1f, 10);
        run(d, flat(0), new float[]{4f, 0, 0}, 8f, 2);
        run(d, flat(0), STILL, 0.1f, 5);
        check("jolt while the arm is turning fast: no TAP", ev[Detector.TAP] == 0);

        System.out.println(checks - fails + "/" + checks + " lab checks passed");
        if (fails > 0) System.exit(1);
    }
}
