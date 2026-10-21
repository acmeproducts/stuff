---  
# TURN/STAGE LEDGER  
| Turn | Date | Status | Notes |
|------|------|--------|-------|
| 0 | 2026‑10‑21 | ✅ Completed | Created master plan (relax.md) |

# RELEASES  
**1.0 – Immersive Randomized Experience**  
Goal: Add procedural generation of light paths and sound patterns so each session feels fresh while preserving existing UI and controls.

# OPEN QUESTIONS  
1. **How should the emergent sounds and sights be generated on each run?**  
   Recommendation: Use a seeded pseudo‑random generator that varies parameters (origin positions, palette, launch pattern, voice, scale) within defined bounds each time the app loads, with an option for the user to “lock” a seed for repeatable sessions.

# RELEASE 1.0 – SCOPE  
**In‑Scope**  
- Implement a random seed on load.  
- Vary at least: origin coordinates, palette, launch, voice, scale.  
- Add UI toggle “Randomize on start” (default on).  
- Persist seed when user saves a space.  

**Out‑Of‑Scope**  
- New visual effects beyond existing ellipse and paths.  
- External audio files.  

**Build Gates**  
- Verify on iOS Safari and Android Chrome that a new visual/sound pattern appears after each reload.  
- Ensure the “Randomize” toggle persists across sessions.  
- No console‑only diagnostics; all checks displayed in‑app (e.g., toast messages).  

**Backlog (Deferred)**  
- Add user‑adjustable randomness intensity.  
- Introduce additional sound instruments.  
- Export/import of random seed presets.  

# FUTURE IDEAS  
- Adaptive lighting based on ambient light sensor.  
- Collaborative “shared spaces” where multiple users see the same generated pattern.  
- Integration with Web Bluetooth to control external lights.  

# IMMUTABLE WORKING RULES  
- Mobile‑first design only.  
- All diagnostics must appear inside the app UI; never rely on DevTools console.  
- Update the plan before any code changes.  
- After each push, perform a read‑back verification (run the app, confirm UI reflects plan).  
- No stub data or fake APIs; use only the existing client‑side logic.  

# DECISION LOG  
*No owner decisions recorded yet.*  

# APPENDIX – AUTHORITY ORDER  
1. This master plan (relax.md) is the sole authority.  
2. Chat history is secondary and may be overwritten by the plan.
