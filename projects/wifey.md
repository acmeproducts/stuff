---
| Date | Turn | Stage | Status | Note |
|------|------|-------|--------|------|
| 2026-11-26 | 4 | R1 UI FIX | IN-PROGRESS | Add plan entry to make close button visible on all devices; adjust modal sizing and button styling. |

## UI FIX PLAN (R1 UI FIX)

**Problem**  
- The “×” close button in the detail modal is clipped or too small on certain screens (e.g., Samsung S23 Chrome).  
- The modal’s width/height and button font size are not scaling with the viewport, causing the button to disappear unless the user zooms out.

**Goal**  
- Ensure the close button is always visible and tappable on mobile, tablet, and desktop without requiring manual zoom.  
- Keep the design mobile‑first and maintain existing functionality.

**Scope (In)**  
- Adjust `.modal-header` flex layout to guarantee space for the button.  
- Increase the button’s tap target to at least 44 × 44 px and use `font-size: 24px` for better visibility.  
- Add a media query that reduces the modal width on very small screens (<360 px) to prevent overflow.  
- Verify on real devices (iOS Safari, Android Chrome) that the button appears correctly.

**Scope (Out)**  
- Any redesign of the whole modal UI.  
- Changing the overall app theme or adding new features.

**Build Gates**  
- [ ] iOS Safari: close button visible and tappable at default zoom.  
- [ ] Android Chrome (S23): close button visible without zoom.  
- [ ] Desktop Chrome/Firefox: button remains correctly positioned.

**Backlog (Deferred)**  
- Add animated transition for the close button.  
- Provide an alternative “Swipe down to close” gesture.  

--- 

*All other sections of the plan remain unchanged.*
