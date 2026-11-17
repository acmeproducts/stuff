package com.acmeproducts.wrist;

/**
 * Wrist-motion detector for the left-wrist "wearable contract". Pure Java, no Android
 * imports, so the same class runs in the lab tests (wrist/test) and on the watch.
 *
 * Inputs are the three watch sensors, in the watch's own axes:
 *   gravity (m/s^2, reads +9.81 on the axis pointing up), gyroscope (rad/s).
 *
 * Outputs:
 *   scrollRate  held posture, -1..1. Positive = hand end of the forearm raised.
 *   SWIPE_LEFT / SWIPE_RIGHT  one swing of the hand while the hand is vertical.
 *   (Knock detection was removed in turn04: the owner judged a knock would aggravate the wrist.)
 */
public final class Detector {
    public static final int NONE = 0, SWIPE_LEFT = 1, SWIPE_RIGHT = 2, TAP = 3;   // TAP now only ever comes from a touch on the watch face
    public static final int POSE_OTHER = 0, POSE_FLAT = 1, POSE_VERTICAL = 2;

    /* ---- tunables (turn01 first guesses; none proven on the owner's arm) ---- */
    static final float DEAD_DEG = 12f;        // tilt inside this band is "level"
    static final float FULL_DEG = 25f;        // tilt this far past the band = full speed
    static final float NEUTRAL_TAU_S = 3f;    // how fast "level" follows slow drift
    static final float YAW_START = 1.0f;      // rad/s that counts as a swing
    static final float YAW_IDLE = 0.5f;       // rad/s below which a swing has stopped
    static final float YAW_ANGLE = 0.45f;     // rad swept (about 26 deg) = a swipe
    static final long SWIPE_MAX_NS = 600000000L;
    static final long SWIPE_LOCK_NS = 800000000L;   // swallows the return swing
    static final long YAW_IDLE_NS = 150000000L;

    /* ---- readable state (shown on the watch as diagnostics) ---- */
    public int pose = POSE_OTHER;
    public float pitchDeg, rollDeg, neutralPitch, scrollRate, yawRate;

    private float gx, gy, gz = 9.81f;
    private boolean haveNeutral;
    private long lastGravNs, lastGyroNs;
    private float yawAcc;
    private long yawStartNs, yawIdleSinceNs, swipeLockUntilNs;

    public void onGravity(float x, float y, float z, long tNs) {
        gx = x; gy = y; gz = z;
        float n = (float) Math.sqrt(x * x + y * y + z * z);
        if (n < 1f) return;
        float s = x / n; if (s > 1f) s = 1f; if (s < -1f) s = -1f;
        pitchDeg = (float) Math.toDegrees(Math.asin(s));
        rollDeg = (float) Math.toDegrees(Math.atan2(y, z));
        int p = poseOf(x, y, z);
        if (p != pose) { pose = p; if (p == POSE_FLAT) haveNeutral = false; resetYaw(); }
        float dt = lastGravNs == 0 ? 0.01f : (tNs - lastGravNs) / 1e9f;
        if (dt < 0f || dt > 0.5f) dt = 0.01f;
        lastGravNs = tNs;
        if (pose != POSE_FLAT) { scrollRate = 0f; return; }
        if (!haveNeutral) { neutralPitch = pitchDeg; haveNeutral = true; }
        float d = pitchDeg - neutralPitch;
        if (Math.abs(d) < DEAD_DEG) {
            neutralPitch += d * Math.min(1f, dt / NEUTRAL_TAU_S);
            scrollRate = 0f;
        } else {
            float r = (Math.abs(d) - DEAD_DEG) / FULL_DEG; if (r > 1f) r = 1f;
            scrollRate = d > 0f ? r : -r;
        }
    }

    /** Which pose a gravity (or resting accelerometer) reading is. FLAT and VERTICAL are the two "in use" poses. */
    public static int poseOf(float x, float y, float z) {
        float n = (float) Math.sqrt(x * x + y * y + z * z);
        if (n < 1f) return POSE_OTHER;
        float s = x / n; if (s > 1f) s = 1f; if (s < -1f) s = -1f;
        float ap = Math.abs((float) Math.toDegrees(Math.asin(s)));
        float ar = Math.abs((float) Math.toDegrees(Math.atan2(y, z)));
        if (ar < 40f && ap < 60f) return POSE_FLAT;
        if (ar > 50f && ar < 130f && ap < 45f) return POSE_VERTICAL;
        return POSE_OTHER;
    }

    public int onGyro(float wx, float wy, float wz, long tNs) {
        float n = (float) Math.sqrt(gx * gx + gy * gy + gz * gz);
        yawRate = n < 1f ? 0f : (wx * gx + wy * gy + wz * gz) / n;   // + = counter-clockwise seen from above
        float dt = lastGyroNs == 0 ? 0.01f : (tNs - lastGyroNs) / 1e9f;
        if (dt < 0f || dt > 0.5f) dt = 0.01f;
        lastGyroNs = tNs;
        if (pose != POSE_VERTICAL || tNs < swipeLockUntilNs) { resetYaw(); return NONE; }
        float a = Math.abs(yawRate);
        if (a >= YAW_START) {
            if (yawAcc != 0f && (yawAcc > 0f) != (yawRate > 0f)) resetYaw();
            if (yawAcc == 0f) yawStartNs = tNs;
            yawAcc += yawRate * dt;
            yawIdleSinceNs = 0;
            if (tNs - yawStartNs > SWIPE_MAX_NS) { resetYaw(); return NONE; }
            if (Math.abs(yawAcc) >= YAW_ANGLE) {
                int ev = yawAcc > 0f ? SWIPE_LEFT : SWIPE_RIGHT;
                resetYaw();
                swipeLockUntilNs = tNs + SWIPE_LOCK_NS;
                return ev;
            }
        } else if (a < YAW_IDLE && yawAcc != 0f) {
            if (yawIdleSinceNs == 0) yawIdleSinceNs = tNs;
            else if (tNs - yawIdleSinceNs > YAW_IDLE_NS) resetYaw();
        }
        return NONE;
    }

    private void resetYaw() { yawAcc = 0f; yawIdleSinceNs = 0; }
}
