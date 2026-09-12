from pathlib import Path
import subprocess

p=Path('market-navigator-turn23-qa.mjs')
s=p.read_text()
old="""  let open=await geom();assert(Math.abs(open.card.t-open.view.t)<=2,'open rail chart pinned to workspace top');assert(Math.abs(open.card.b-open.view.b)<=2,'open rail chart pinned to workspace bottom');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let closed=await geom();
  assert(Math.abs(closed.card.t-open.card.t)<=2&&Math.abs(closed.card.b-open.card.b)<=2,'rail toggle changes width only');
  assert(closed.card.w>open.card.w+20,'closed rail grants chart width');assert(closed.wrap.w>open.wrap.w+20,'chart container resized');assert(Math.abs(closed.canvas.w-closed.wrap.w)<=1,'canvas redraw matches resized container');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let reopened=await geom();assert(Math.abs(reopened.card.t-open.card.t)<=2&&Math.abs(reopened.card.b-open.card.b)<=2,'reopened rail remains vertically pinned');assert(Math.abs(reopened.wrap.w-open.wrap.w)<=2,'reopened rail restores chart width');
"""
new="""  let a=await geom();assert(Math.abs(a.card.t-a.view.t)<=2,'initial rail state chart pinned to workspace top');assert(Math.abs(a.card.b-a.view.b)<=2,'initial rail state chart pinned to workspace bottom');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let b=await geom();
  assert(Math.abs(b.card.t-a.card.t)<=2&&Math.abs(b.card.b-a.card.b)<=2,'rail toggle changes width only');
  let narrow=a.rail<b.rail?a:b,wide=a.rail<b.rail?b:a;
  assert(wide.rail>narrow.rail+20,'rail toggle materially changes rail width');
  assert(narrow.card.w>wide.card.w+20,'narrow rail grants chart width');assert(narrow.wrap.w>wide.wrap.w+20,'chart container follows available width');assert(Math.abs(b.canvas.w-b.wrap.w)<=1,'canvas redraw matches toggled container');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let restored=await geom();assert(Math.abs(restored.card.t-a.card.t)<=2&&Math.abs(restored.card.b-a.card.b)<=2,'restored rail remains vertically pinned');assert(Math.abs(restored.wrap.w-a.wrap.w)<=2,'second toggle restores chart width');
"""

if old in s:
    p.write_text(s.replace(old,new,1))
    print('TURN23 RAIL QA PATCH APPLIED')
elif new in s:
    print('TURN23 RAIL QA ALREADY NORMALIZED')
else:
    raise SystemExit('rail QA anchor missing')

# Publish the normalized QA source in the same qualified commit as the generated
# HTML. npm install may dirty package metadata after this step, so enable Git's
# built-in autostash for the workflow's later pull --rebase instead of committing
# package-manager noise.
subprocess.run(['git','add',str(p)],check=True)
subprocess.run(['git','config','rebase.autoStash','true'],check=True)
