# TalkBridge Assessment — August 11, 2026

## Why iOS notifications are hard, and where yours likely fails

The full push pipeline already exists in the app (service worker, relay push sender, VAPID route). The chain has seven links, and every one must hold or nothing appears — with no error shown anywhere:

1. Page served over HTTPS
2. App **installed to the home screen from Safari** (Apple refuses push in a browser tab, and Chrome on iOS can never do it)
3. Opened **from the home-screen icon**, not from Safari
4. Permission granted from a **button tap** (iOS ignores permission requests not triggered by a touch)
5. Subscription created with the relay's public key and stored server-side
6. Relay signs a valid token and posts to Apple's push service
7. Service worker shows a notification **every single time** a push arrives (Apple revokes push from apps that stay silent)

The prototype tests exactly this chain and nothing else, and it logs which link broke. That converts "it doesn't work" into "link 6 returned status 403."

## Prototype

Files in `proto/`. One-time setup:

1. Cloudflare dashboard → create Worker named **push-proto** → paste `proto/push-worker.js`
2. In that worker: Settings → Bindings → add **KV namespace**, variable name **PUSHKV** (create a new namespace, any name)
3. Deploy. No secrets, no npm — keys self-generate on first use.

Test:

- iPhone, Safari: open `https://acmeproducts.github.io/stuff/proto/push.html` → Add to Home Screen → open from icon → tap **Enable notifications** → note the code
- Any other device: open the same URL → same code → tap **Send** → lock the iPhone → notification within seconds

If this works and the main app doesn't, the platform is fine and the defect is in the app's chain — compare link by link.

## Insights on the main app

Measured from the current base: 8,118 lines, 102 top-level global variables, 727 hard-coded pixel values, 0 responsive media queries, only 15 design tokens in use.

**Variable collisions.** 102 globals all share one namespace; any new script part can silently overwrite one. Fix without any build step: one global object per subsystem (e.g. everything call-related lives inside a single container), or wrap each part in a self-contained function scope exposing only what others need. Collisions then become impossible by construction instead of avoided by luck. The existing contract gate could additionally fail any build where two parts declare the same top-level name — a five-line check.

**Layout without hard-coding.** Three techniques replace most of the 727 fixed pixel values, all plain CSS, no build:

- **Design tokens**: name every color, spacing, and size once at the top; everything references the name. Changing a size becomes one edit instead of dozens. (The room-themes plan already pointed here.)
- **Fluid sizing**: sizes expressed as "between X and Y, scaled to the screen" — one declaration works on every phone width, killing the per-device tweaking.
- **Grid/flex with gaps** instead of positioned elements with fixed offsets — layouts reflow themselves when content or screen changes.

Done as one mechanical pass with a before/after screenshot check, this removes the whole class of "looks wrong on the other phone" defects.

**One more.** The app has 19 distinct stacking-order values sprinkled through the file — a classic source of "the overlay is under the keyboard" bugs. Tokenize those too: a single ordered list at the top defines which surface beats which.
