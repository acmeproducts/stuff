# Design imperative: smart data, dumb report

The data store decides. The screen draws. Everything else follows from this.

**The data side owns every judgment and every calculation:**
batch ids and the one business-day calendar; each horizon's start and end; Horizon and Fixed rebasing; transforms; which axis a series belongs on (Y1 or Y2); whether a series has enough readings (greyed or not); carrying slower sources to each batch; units, quote text and labels.

**The front end may only:**
fetch a package, draw the arrays it was handed on equal slots, and handle interaction (focus, crosshair, add and remove series, long-press card, Analyze, the central horizon / Fixed-vs-Horizon / axis controls). Pixel mapping is the only arithmetic it does.

**It must never:** do date math, rebase or transform a value, filter series by their data, fill a gap, carry a value forward, or guess a unit. If the screen needs something the package does not hold, the package changes, not the screen.

**One drawing component** (ChartPanel) serves NOW, Analyze and every small multiple, all governed by one central state: horizon, Fixed vs Horizon, Dual axis.

**The test for any bug:** if the data package is right, can the screen still be wrong? If yes, it is a drawing bug and is fixed in the one component. If no, it is a data bug and is fixed in the data build, never patched on the screen.

**Enforced mechanically**, not by memory: `python3 mkt/check_design.py` fails when the page contains date or calculation code, or when a package breaks an invariant (see the script). Run it before every push.
