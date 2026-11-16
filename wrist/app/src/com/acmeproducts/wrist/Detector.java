package com.acmeproducts.wrist;

/**
 * Wrist-motion detector for the left-wrist "wearable contract". Pure Java, no Android
 * imports, so the same class runs in the lab tests (wrist/test) and on the watch.
 *
 * Inputs are the three watch sensors, in the watch's own axes:
 *   gravity (m/s^2, reads +9.81 on the axis pointing up), gyroscope (rad/s),
 *   linear acceleration (m/s^2, gravity removed).
 *
 * Outputs:
 *   scrollRate  held posture, -1..1. Positive = hand end of the forearm raised.
 *   SWIPE_LEFT / SWIPE_RIGHT  one swing of the hand while the hand is vertical.
 *   TAP  one short knock.
 */
public final class Detector {
    public static final int NONE = 0, SWIPE_LEFT = 1, SWIPE_RIGHT = 2, TAP = 3;
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
    static final float TAP_MIN = 3.5f;        // m/s^2
    static final float TAP_NOISE_X = 5f;      // or this many times the noise floor
    static final long TAP_MAX_NS = 100000000L;      // a knock is over within this
    static final long TAP_LOCK_NS = 350000000L;
    static final float GYRO_BUSY = 2.5f;      // rad/s: the arm is moving, not knocking
    static final long GYRO_QUIET_NS = 150000000L;

    /* ---- readable state (shown on the watch as diagnostics) ---- */
    public int pose = POSE_OTHER;
    public float pitchDeg, rollDeg, neutralPitch, scrollRate, yawRate, tapPeak, noise = 0.3f;
    public float tapThreshold = TAP_MIN;

    private float gx, gy, gz = 9.81f;
    private boolean haveNeutral;
    private long lastGravNs, lastGyroNs;
    private float yawAcc;
    private long yawStartNs, yawIdleSinceNs, swipeLockUntilNs;
    private long tapLockUntilNs, lastGyroBusyNs = Long.MIN_VALUE / 2, tapCandNs;
    private boolean tapCand, tapArmed = true;

    public void onGravity(float x, float y, float z, long tNs) {
        gx = x; gy = y; gz = z;
        float n = (float) Math.sqrt(x * x + y * y + z * z);
        if (n < 1f) return;
        float s = x / n; if (s > 1f) s = 1f; if (s < -1f) s = -1f;
        pitchDeg = (float) Math.toDegrees(Math.asin(s));
        rollDeg = (float) Math.toDegrees(Math.atan2(y, z));
        float ar = Math.abs(rollDeg), ap = Math.abs(pitchDeg);
        int p = POSE_OTHER;
        if (ar < 40f && ap < 60f) p = POSE_FLAT;
        else if (ar > 50f && ar < 130f && ap < 45f) p = POSE_VERTICAL;
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

    public int onGyro(float wx, float wy, float wz, long tNs) {
        float n = (float) Math.sqrt(gx * gx + gy * gy + gz * gz);
        float mag = (float) Math.sqrt(wx * wx + wy * wy + wz * wz);
        if (mag > GYRO_BUSY) lastGyroBusyNs = tNs;
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
                tapLockUntilNs = Math.max(tapLockUntilNs, tNs + TAP_LOCK_NS);
                return ev;
            }
        } else if (a < YAW_IDLE && yawAcc != 0f) {
            if (yawIdleSinceNs == 0) yawIdleSinceNs = tNs;
            else if (tNs - yawIdleSinceNs > YAW_IDLE_NS) resetYaw();
        }
        return NONE;
    }

    public int onLinear(float ax, float ay, float az, long tNs) {
        float m = (float) Math.sqrt(ax * ax + ay * ay + az * az);
        noise += (Math.min(m, 2f) - noise) * 0.01f;
        tapPeak = Math.max(m, tapPeak * 0.97f);
        float thr = Math.max(TAP_MIN, TAP_NOISE_X * noise);
        tapThreshold = thr;
        if (tapCand) {
            if (m < thr * 0.5f) {                       // it ended quickly: a knock
                tapCand = false; tapArmed = true;
                if (tNs - lastGyroBusyNs > GYRO_QUIET_NS && tNs >= tapLockUntilNs) {
                    tapLockUntilNs = tNs + TAP_LOCK_NS;
                    return TAP;
                }
            } else if (tNs - tapCandNs > TAP_MAX_NS) {  // it went on: arm movement, not a knock
                tapCand = false; tapArmed = false;
            }
            return NONE;
        }
        if (!tapArmed) { if (m < thr * 0.5f) tapArmed = true; return NONE; }
        if (m >= thr && tNs >= tapLockUntilNs && tNs - lastGyroBusyNs > GYRO_QUIET_NS) {
            tapCand = true; tapCandNs = tNs;
        }
        return NONE;
    }

    private void resetYaw() { yawAcc = 0f; yawIdleSinceNs = 0; }
}
