"""Lab check for the hand, head, teach, assign and object cards: drives the Lab in a phone-sized Chrome with a made-up hand and head
(synth.js) in place of the camera's finders, and a made-up watch stream. The finders' models cannot run here; a device is the test of those.
Usage: python3 signals-page-test.py <base-url> <three.module.min.js url> [screenshot-prefix]   (needs playwright + Chrome)"""
import json, math, os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787').rstrip('/')
three = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:8789/three160/package/build/three.module.min.js'
shot = sys.argv[3] if len(sys.argv) > 3 else None
here = os.path.dirname(os.path.abspath(__file__))
code = '515151'
fails = 0
buzzes = []       # every buzz pattern the relay handed to the made-up watch

def check(name, ok, extra=''):
    global fails
    if not ok: fails += 1
    print(('PASS ' if ok else 'FAIL ') + name + ((' · ' + str(extra)) if extra != '' else ''), flush=True)

def http(path, body=None):
    req = urllib.request.Request(base + path, data=None if body is None else body.encode(), method='GET' if body is None else 'POST')
    return urllib.request.urlopen(req, timeout=10).read().decode()

# which tab a card lives in; every card not named here is a Watch card
TAB = {'calibrate': 'learn', 'teach': 'learn', 'assign': 'learn', 'hands': 'camera', 'head': 'camera', 'camera': 'camera', 'object': 'camera'}
def tabto(pg, t):
    if pg.get_attribute('#tabs button.on', 'data-tab') != t:
        pg.click('#tabs button[data-tab=%s]' % t); pg.wait_for_timeout(200)
def card(pg, cid):
    tabto(pg, TAB.get(cid, 'watch')); pg.click('.tile[data-id=%s]' % cid)

def post(o): return json.loads(http('/e/' + code, json.dumps(o)))

def feed(pitch, roll, seconds):
    """A steady watch pose as raw rows: 50 a second, in batches of 5."""
    p, r = math.radians(pitch), math.radians(roll)
    g = [round(981 * math.sin(p)), round(981 * math.cos(p) * math.sin(r)), round(981 * math.cos(p) * math.cos(r))]
    end = time.time() + seconds
    while time.time() < end:
        r = post({'t': 'raw', 'w': int(time.time() * 1000), 's': [[i * 20] + g + [0, 0, 0, 0, 0, 0] for i in range(5)]})
        if r.get('buzz'): buzzes.append(r['buzz'])
        time.sleep(0.085)

# the made-up body. rest = what it does when nothing is asked; show(f) = what it does f seconds into each NOW of the Teach card;
# __act(fn) = do fn(seconds since now) until told otherwise; __act(null) = back to rest.
PUPPET = """
window.__puppet = { rest: { hands: [{}] }, show: null, react: null, free: null, freeAt: 0, last: 0, wasNow: false, nowAt: 0, heard: [], spoken: [] };
window.__act = function (fn) { __puppet.free = fn; __puppet.freeAt = performance.now(); };
window.__labTestEyes = function (t) {
  var P = window.__puppet; if (t - P.last < 45) return null; P.last = t;
  var say = (document.getElementById('tSay') || {}).textContent || '', isNow = /^NOW/.test(say);
  if (isNow && !P.wasNow) P.nowAt = t; P.wasNow = isNow;
  var ask = (document.getElementById('kSay') || {}).textContent || '';
  var b = P.free ? P.free((t - P.freeAt) / 1000) : (P.react && P.react(ask)) || (isNow && P.show ? P.show((t - P.nowAt) / 1000) : P.rest);
  return Synth.seen((b.hands || []).map(Synth.hand), b.face ? Synth.face(b.face) : null);
};
window.speechSynthesis = undefined;
Object.defineProperty(window, 'speechSynthesis', { value: { cancel: function () {}, speak: function (u) { __puppet.spoken.push(u.text); setTimeout(function () { if (u.onend) u.onend(); }, 60); } } });
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
window.SpeechRecognition = function () { __puppet.heard.push(this); }; window.SpeechRecognition.prototype.start = function () {}; window.SpeechRecognition.prototype.abort = function () {};
"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, has_touch=True, is_mobile=True)
    ctx.add_init_script(path=os.path.join(here, 'synth.js'))
    ctx.add_init_script(PUPPET)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    txt = lambda sel: pg.inner_text(sel)
    ev = lambda js: pg.evaluate(js)
    wait = lambda ms: pg.wait_for_timeout(ms)
    fires = lambda name: pg.evaluate("(n) => Signals.fires.filter(e => e.name === n).length", name)
    state = lambda: json.loads(pg.get_attribute('#oCan', 'data-state') or '{}')
    def close(): pg.click('#closeBtn'); wait(700)

    pg.goto(base + '/?linksecs=5&linger=2&three=' + urllib.request.quote(three, safe=''))
    tabto(pg, 'watch'); pg.fill('#code', code)
    pg.wait_for_function("document.getElementById('statusText').textContent.indexOf('Waiting for the watch')===0", timeout=8000)
    post({'t': 'hb', 'b': 'turn07-test'})
    tiles = lambda: [x.get_attribute('data-id') for x in pg.locator('.tile').all()]
    tabto(pg, 'camera'); cam = tiles(); tabto(pg, 'learn'); learn = tiles()
    check('the Camera tab holds the camera cards and the Learn tab holds calibrate, teach and assign', cam == ['camera', 'hands', 'head', 'object'] and learn == ['calibrate', 'teach', 'assign'], (cam, learn))
    check('the page says which build it is', 'lab-r9' in txt('#meta'), txt('#meta'))

    # ---- hand numbers
    card(pg, 'hands'); wait(900)
    row = lambda label: pg.evaluate("(l) => { const r = Array.from(document.querySelectorAll('#hnT tr, #hdT tr')).find(r => r.cells[0].textContent === l); return r ? Array.from(r.cells).slice(1).map(c => c.textContent) : null }", label)
    check('hand numbers: an open right hand reads straight, and the left column is empty', txt('#hnN') == '1' and row('index curl') == ['0.00', '–'], (txt('#hnN'), row('index curl')))
    ev("() => { __puppet.rest = { hands: [{ curl: 1 }] } }"); wait(500)
    check('hand numbers: a fist reads folded', row('index curl')[0] == '1.00' and row('little curl')[0] == '1.00', row('index curl'))
    ev("() => { __puppet.rest = { hands: [{ pinch: 1, x: 0.65 }, { side: 'Left', x: 0.3, roll: 90 }] } }"); wait(500)
    check('hand numbers: two hands, each in its own column', txt('#hnN') == '2' and float(row('thumb to index')[0]) < 0.05 and float(row('thumb to index')[1]) > 0.6 and abs(abs(float(row('rolled, degrees')[1])) - 90) < 12, (row('thumb to index'), row('rolled, degrees')))
    check('hand numbers: both hands are drawn over the picture', pg.locator('.camview canvas').get_attribute('data-hands') == '2')
    if shot: pg.screenshot(path=shot + '-hands.png')
    close()
    check('hand numbers: closing saves a trial', '1 trial' in txt('.tile[data-id=hands] .foot'), txt('.tile[data-id=hands] .foot'))

    # ---- head and face
    ev("() => { __puppet.rest = { hands: [{}], face: { turn: 20, nod: -10, blend: { jawOpen: 0.8 } } } }")
    card(pg, 'head'); wait(900)
    check('head: turn, nod and jaw are shown', txt('#hdState') == 'found' and row('turn, degrees') == ['20'] and row('nod, degrees') == ['-10'] and row('jaw open') == ['0.80'], (txt('#hdState'), row('turn, degrees'), row('jaw open')))
    check('head: with the face finder alone, no hand is looked for', pg.locator('.camview canvas').get_attribute('data-hands') == '0' and pg.locator('.camview canvas').get_attribute('data-face') == '1')
    pg.click('#hdHands'); wait(900)
    check('head: Also find hands turns the hand finder on as well', pg.locator('.camview canvas').get_attribute('data-hands') == '1' and txt('#hdBoth') == 'face and hands', txt('#hdBoth'))
    ev("() => { __puppet.rest = { hands: [{}] } }"); wait(500)
    check('head: a face that goes is reported lost', txt('#hdState') == 'lost' and row('turn, degrees') == ['–'], txt('#hdState'))
    if shot: pg.screenshot(path=shot + '-head.png')
    close()

    # ---- teach
    def teach(expect_done=True):
        pg.click('#tGo')
        pg.wait_for_function("!/^(REST|NOW|BACK)/.test(document.getElementById('tSay').textContent)", timeout=20000)
        wait(300)
    def name_it(n):
        pg.fill('#tName', n); pg.click('#tSave'); wait(300)
    ev("() => { __puppet.rest = { hands: [{}], face: {} }; __puppet.show = f => ({ hands: [{ curl: f > 0.45 ? 1 : 0 }], face: {} }) }")
    card(pg, 'teach'); wait(700)
    check('teach: starts with the right hand and nothing taught', pg.input_value('#tSrc') == 'handR' and 'Nothing taught yet' in txt('#tList'), txt('#tList'))
    pg.click('#tGo'); wait(400)
    check('teach: it says REST first, on the screen and aloud', txt('#tSay') == 'REST' and ev("() => __puppet.spoken.join()") == 'rest', txt('#tSay'))
    pg.wait_for_function("/^NOW/.test(document.getElementById('tSay').textContent)", timeout=4000)
    check('teach: then NOW, counted', txt('#tSay').replace('  ', ' ') == 'NOW 1 of 3', txt('#tSay'))
    pg.wait_for_function("!/^(REST|NOW|BACK)/.test(document.getElementById('tSay').textContent)", timeout=20000); wait(500)
    check('teach: three showings were asked for, with a rest between', ev("() => __puppet.spoken.join()") == 'rest,now,back,now,back,now,got it. say its name', ev("() => __puppet.spoken.join()"))
    check('teach: a fist held three times is seen as a pose', 'I saw a pose' in txt('#tWhy') and 'curl' in txt('#tWhy') and 'Careful' not in txt('#tWhy'), txt('#tWhy'))
    check('teach: it listens for the name', txt('#tSay') == 'Say its name' and ev("() => __puppet.heard.length") == 1, txt('#tSay'))
    ev("() => { const r = __puppet.heard[0]; r.onresult({ resultIndex: 0, results: [[{ transcript: 'Fist.' }]] }) }"); wait(200)
    check('teach: the name it heard is in the box, with nothing typed', pg.input_value('#tName') == 'fist', pg.input_value('#tName'))
    if shot: pg.screenshot(path=shot + '-teach-name.png')
    pg.click('#tSave'); wait(300)
    check('teach: saved and listed', 'fist' in txt('#tList') and 'Right hand · pose' in txt('#tList') and len(json.loads(ev("() => localStorage.getItem('x_signals')"))) == 1, txt('#tList'))
    ev("() => __act(t => ({ hands: [{ curl: t > 0.3 && t < 1.6 ? 1 : 0 }], face: {} }))")
    pg.wait_for_selector('.sigrow.lit', timeout=4000)
    check('teach: making the fist lights its row', True)
    wait(1600); ev("() => __act(null)")
    check('teach: one fist, one fire', fires('fist') == 1, fires('fist'))
    teach()
    check('teach: the same thing taught again is flagged', 'Careful' in txt('#tWhy') and '“fist”' in txt('#tWhy'), txt('#tWhy'))
    pg.click('#tDrop'); wait(200)
    check('teach: Discard keeps it out', len(json.loads(ev("() => localStorage.getItem('x_signals')"))) == 1 and txt('#tSay') == 'Press Teach', txt('#tSay'))
    ev("() => { __puppet.show = null }")
    teach()
    check('teach: showing nothing is refused in plain words', txt('#tSay') == 'Not learned' and 'doing nothing' in txt('#tWhy'), txt('#tWhy'))
    pg.select_option('#tSrc', 'head'); wait(600)
    ev("() => { __puppet.show = f => ({ hands: [{}], face: { nod: f > 0.3 && f < 1.5 ? -18 * Math.sin(Math.PI * (f - 0.3) / 1.2) : 0 } }) }")
    teach()
    check('teach: a nod and back is seen as a head move', 'I saw a move: nod' in txt('#tWhy') and 'comes back' in txt('#tWhy'), txt('#tWhy'))
    name_it('nod')
    pg.select_option('#tSrc', 'watch'); wait(1200)
    check('teach: choosing the watch asks it for its sensor stream', post({'t': 'hb', 'b': 'turn07-test'}).get('raw') == 1)
    pg.click('#tGo')
    end = time.time() + 20
    while time.time() < end:
        s = txt('#tSay')
        if not (s.startswith('REST') or s.startswith('NOW') or s.startswith('BACK')): break
        feed(-45 if s.startswith('NOW') else 0, 0, 0.17)
    wait(300)
    check('teach: the watch held tilted is seen as a watch pose', 'I saw a pose' in txt('#tWhy') and 'tilt' in txt('#tWhy'), txt('#tWhy'))
    name_it('wrist down')
    feed(0, 0, 0.8); feed(-45, 0, 1.2); feed(0, 0, 0.3)
    check('teach: the taught watch pose fires from the watch', fires('wrist down') == 1, fires('wrist down'))
    check('teach: three signals listed, each with what it is', txt('#tList').count('Remove') == 3 and 'Head and face · move' in txt('#tList') and 'Watch · pose' in txt('#tList'), txt('#tList'))
    if shot: pg.screenshot(path=shot + '-teach.png')
    close()
    wait(3600)
    check('teach: a while after closing, the watch stream is no longer asked for', post({'t': 'hb'}).get('raw') == 0)

    # ---- assign and combine
    card(pg, 'assign'); wait(700)
    sel = lambda n: '#aList select[data-sig="%s"]' % n
    check('assign: each taught signal has a list of actions', pg.locator('#aList select').count() == 3 and pg.locator(sel('fist') + ' option').count() == 18, pg.locator(sel('fist') + ' option').count())
    pg.select_option(sel('fist'), 'next'); wait(150)
    pg.select_option(sel('nod'), 'next'); wait(150)
    check('assign: an action given to a second signal leaves the first', pg.input_value(sel('nod')) == 'next' and pg.input_value(sel('fist')) == '', (pg.input_value(sel('fist')), pg.input_value(sel('nod'))))
    pg.select_option(sel('fist'), 'take'); pg.select_option(sel('nod'), 'left'); pg.select_option(sel('wrist down'), 'buzz'); wait(150)
    check('assign: what each does is kept on the device', sorted(json.loads(ev("() => localStorage.getItem('x_assign')")).values()) == ['buzz', 'left', 'take'], ev("() => localStorage.getItem('x_assign')"))
    check('assign: a taught watch signal keeps the watch stream on', post({'t': 'hb', 'b': 'turn07-test'}).get('raw') == 1)
    feed(0, 0, 0.8); feed(-45, 0, 1.4); feed(0, 0, 0.3)
    check('assign: the watch pose given "buzz the watch" buzzes the watch, once', buzzes == [[0, 40, 90, 40]] and 'buzz the watch' in txt('#aFire'), (buzzes, txt('#aFire')))
    pg.select_option('#c1', label='fist'); pg.select_option('#c2', label='nod'); pg.fill('#cbName', 'fist nod'); pg.click('#cAdd'); wait(200)
    check('combine: the new signal is listed with its letters in order', pg.locator('#aList select').count() == 4 and 'fist then nod' in txt('#aList'), txt('#aList'))
    pg.select_option(sel('fist nod'), 'reset'); wait(150)
    FIST_NOD = "t => ({ hands: [{ curl: t > 0.3 && t < 1.3 ? 1 : 0 }], face: { nod: t > 1.5 && t < 2.7 ? -18 * Math.sin(Math.PI * (t - 1.5) / 1.2) : 0 } })"
    NOD = "t => ({ hands: [{}], face: { nod: t > 0.9 && t < 2.1 ? -18 * Math.sin(Math.PI * (t - 0.9) / 1.2) : 0 } })"
    ev("() => __act(%s)" % FIST_NOD); wait(3400); ev("() => __act(null)")
    check('combine: a fist and then a nod fires the combination and shows its action', fires('fist nod') == 1 and 'fist nod' in txt('#aFire') and 'put it back' in txt('#aFire'), (fires('fist nod'), txt('#aFire')))
    log = [' '.join(l.split()) for l in txt('#aLog').split('\n')]
    check('combine: the fired list shows each one, newest first', log[0].endswith('fist nod \u2192 put it back') and log[1].endswith(' nod \u2192 turn left') and log[2].endswith(' fist \u2192 take'), log)
    if shot: pg.screenshot(path=shot + '-assign.png')
    pg.select_option(sel('wrist down'), 'next'); wait(150)
    close()

    # ---- the object
    ev("() => { __puppet.rest = { hands: [], face: {} } }")
    card(pg, 'object')
    pg.wait_for_function("document.getElementById('oCan').dataset.state", timeout=15000); wait(600)
    s0 = state()
    check('object: a cup stands on the table, to the left, turned away from the task', s0['kind'] == 'cup' and abs(s0['x'] + 0.9) < 0.05 and abs(s0['faces'] + 69) < 3 and s0['held'] == '' and txt('#oSay') == 'Hold up a hand', (s0, txt('#oSay')))
    check('object: the task is stated', 'on the ring' in txt('#oTask'), txt('#oTask'))
    check('object: an assigned watch signal keeps the watch stream on', post({'t': 'hb', 'b': 'turn07-test'}).get('raw') == 1)
    # where a hand has to be in the picture for its thumb and finger to be on the object (the made-up hand's fingertips sit up and to one side of its palm)
    HX, HY = s0['px'] + 0.07, s0['py'] + 0.28
    hand = lambda x=None, y=None, pinch=0, **k: pg.evaluate("(o) => { __puppet.rest = { hands: [o], face: {} } }", dict(k, x=HX if x is None else x, y=HY if y is None else y, pinch=pinch))
    hand(x=0.2, y=0.35); wait(400)
    check('object: a hand in view is told what to do', txt('#oSay') == 'Pinch on the object to take it', txt('#oSay'))
    hand(x=0.2, y=0.35, pinch=1); wait(400)
    check('object: a pinch away from the object takes nothing', state()['held'] == '', state())
    hand(x=0.2, y=0.35); wait(300); hand(); wait(300); hand(pinch=0.6); wait(400)
    check('object: before calibration, a weak pinch (thumb and finger not quite touching) takes nothing', state()['held'] == '', state())
    hand(x=0.2, y=0.35); wait(300); hand(); wait(300); hand(pinch=1); wait(400)
    check('object: a pinch on the object takes it', state()['held'] == 'one' and txt('#oSay') == 'In your right hand', (state(), txt('#oSay')))
    hand(x=HX - 0.15, y=HY - 0.12, pinch=1); wait(400)
    s1 = state()
    check('object: it goes where the hand goes, mirrored like a mirror', s1['x'] > s0['x'] + 0.4 and s1['y'] > 0.2, s1)
    hand(x=HX - 0.15, y=HY - 0.12, pinch=1, size=0.25); wait(400)
    check('object: a hand pushed toward the screen sends it away from you', state()['z'] < s1['z'] - 0.5, (s1['z'], state()['z']))
    hand(x=HX - 0.15, y=HY - 0.12, pinch=0.5, size=0.25); wait(120); hand(x=HX - 0.15, y=HY - 0.12, pinch=1, size=0.25); wait(400)
    check('object: a pinch that flickers open for an instant does not drop it', state()['held'] == 'one', state())
    key = [x['key'] for x in json.loads(http('/trials')) if '-object-' in x['key'] and x['key'].endswith(':000')]
    wait(16000)
    key = [x['key'] for x in json.loads(http('/trials')) if '-object-' in x['key'] and x['key'].endswith(':000')]
    body = http('/trial/' + sorted(key)[-1]) if key else ''
    check('object: the record is in the lab log while the card is still open', '"open":1' in body and 'took it' in body, len(body))
    hand(x=HX - 0.15, y=HY - 0.12, pinch=1, yaw=40); wait(400)
    s2 = state()
    check('object: turning the hand turns it', abs(s2['faces'] - s1['faces']) > 25, (s1['faces'], s2['faces']))
    if shot: pg.screenshot(path=shot + '-object-held.png')
    hand(x=HX - 0.15, y=HY - 0.12, pinch=0.5, yaw=40); wait(900)      # fingers opened (the made-up hand's fingertips shift as they part, so the place is checked loosely)
    s3 = state()
    check('object: opening the fingers lets it go, and it settles upright on the table', s3['held'] == '' and abs(s3['y']) < 0.03 and s3['up'] > 0.98 and abs(s3['x'] - s2['x']) < 0.3, (s2['x'], s3))
    # both hands
    two = lambda lx, rx, ly=0.0, pl=1, pr=1: pg.evaluate("(a) => { __puppet.rest = { hands: [{ x: a[1], y: a[5], pinch: a[4] }, { side: 'Left', x: a[0], y: a[5] + a[2], pinch: a[3] }], face: {} } }", [lx, rx, ly, pl, pr, s3['py'] + 0.28])
    cx = state()['px']
    two(cx - 0.02, cx + 0.14, pl=0, pr=0); wait(300); two(cx - 0.02, cx + 0.14, pl=0, pr=1); wait(350)
    check('object: taken again with the right hand', state()['held'] == 'one', state())
    two(cx - 0.02, cx + 0.14); wait(350)
    sA = state()
    check('object: the left hand pinching it as well makes it two-handed', sA['held'] == 'two' and txt('#oSay') == 'Both hands have it', (sA, txt('#oSay')))
    two(cx - 0.10, cx + 0.22); wait(350)
    sB = state()
    check('object: hands moved apart make it bigger', sB['s'] > sA['s'] * 1.5, (sA['s'], sB['s']))
    two(cx - 0.10, cx + 0.22, ly=-0.2); wait(350)
    sC = state()
    check('object: one hand raised above the other tips it over, like a steering wheel', sC['up'] < 0.9 and sA['up'] > 0.98, (sA['up'], sC['up']))
    if shot: pg.screenshot(path=shot + '-object-two.png')
    two(cx - 0.10, cx + 0.22, pl=0); wait(600)
    check('object: one hand opening leaves it in the other', state()['held'] == 'one', state())
    two(cx - 0.10, cx + 0.22, pl=0, pr=0); wait(900)
    check('object: both open, it is let go', state()['held'] == '' and abs(state()['y']) < 0.4, state())
    # signals on the object: the word puts it back, the nod turns it, the fist takes it, the watch pose brings the next object
    ev("() => __act(%s)" % FIST_NOD); wait(3400); ev("() => __act(null)"); wait(900)
    sH = state()
    check('object: the combination given "put it back" puts it back', abs(sH['x'] + 0.9) < 0.05 and abs(sH['faces'] + 69) < 3 and abs(sH['s'] - 1) < 0.05, sH)
    n0 = fires('nod')
    ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(null)"); wait(700)
    sT = state()
    check('object: two nods given "turn left" turn the marked side to the right', fires('nod') == n0 + 2 and abs(sT['faces'] + 9) < 3, (fires('nod') - n0, sT['faces']))
    hand(x=0.2, y=0.35); wait(300); hand(); wait(300); hand(pinch=1); wait(400)
    xs = []
    for i in range(8):                       # carry it to the ring: nudge the hand until the object is over it
        st = state(); xs.append(st['x'])
        if abs(st['x'] - 1.25) < 0.12: break
        HX2 = ev("() => __puppet.rest.hands[0].x") - (1.25 - st['x']) * 0.2
        hand(x=HX2, pinch=1); wait(350)
    check('object: carried across to the ring', abs(state()['x'] - 1.25) < 0.2 and state()['held'] == 'one', xs)
    hx = ev("() => __puppet.rest.hands[0].x"); hand(x=hx, pinch=0); wait(900)
    sD = state()
    check('object: set down on the ring with the marked side to the right, the task is done', sD['done'] is True and 'Done in' in txt('#oTask'), (sD, txt('#oTask')))
    check('object: and the screen was not touched to do it', '0 touches' in txt('#oTask'), txt('#oTask'))
    if shot: pg.screenshot(path=shot + '-object-done.png')
    feed(0, 0, 0.8); feed(-45, 0, 1.2); feed(0, 0, 0.2); wait(500)
    check('object: the watch pose given "next object" brings the bowl', state()['kind'] == 'bowl' and state()['done'] is False, state())
    hand(x=0.75, y=0.4, curl=0); wait(500); hand(x=0.75, y=0.4, curl=1); wait(900)
    sF = state()
    check('object: a fist given "take" takes it from where the hand is', sF['held'] == 'one', sF)
    hand(x=0.6, y=0.4, curl=1); wait(400)
    check('object: and it follows that hand', abs(state()['x'] - sF['x']) > 0.3, (sF['x'], state()['x']))
    ev("() => __act(%s)" % NOD.replace("hands: [{}]", "hands: [{ x: 0.6, y: 0.4, curl: 1 }]")); wait(2600); ev("() => __act(null)"); wait(300)
    check('object: a nod while it is held turns it without dropping it', state()['held'] == 'one' and abs(state()['faces'] - sF['faces']) > 20, (sF['faces'], state()))
    ev("() => { __puppet.rest = { hands: [], face: {} } }"); wait(1400)
    check('object: the hand leaving the picture lets it go', state()['held'] == '' and txt('#oSay') == 'Hold up a hand', (state(), txt('#oSay')))
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-object-' in x['key'] and x['key'].endswith(':000'))
    body = http('/trial/' + key[-1]) if key else ''
    check('object: closed, the record is whole and no longer marked open', all(w in body for w in ['took it', 'let it go', 'task done', '"a":"next"', 'one hand again']) and 'landmarks' not in body and '"open":1' not in body, len(body))

    # ---- the rest of the Lab still stands
    card(pg, 'teach'); wait(500); pg.click('#notesBtn'); wait(300); pg.click('#rate button[data-v=keep]'); pg.click('#doneBtn'); wait(700)
    card(pg, 'keepers'); wait(500)
    check('keepers: a kept card that has no watch gesture does not break the Keepers card', pg.locator('.kboard').count() == 1 and 'Nothing is rated Keep' in txt('.kboard'), txt('.kboard')[:80])
    close()
    pg.reload(); wait(900)
    card(pg, 'teach'); wait(600)
    check('after a reload, everything taught is still there', txt('#tList').count('Remove') == 4 and 'combination: fist then nod' in txt('#tList') and 'does: take' in txt('#tList'), txt('#tList'))
    pg.locator('#sig_' + ev("() => Signals.signals.find(s => s.name === 'fist').id") + ' button').click(); wait(200)
    check('removing a letter removes the word made with it', txt('#tList').count('Remove') == 2 and 'fist' not in txt('#tList'), txt('#tList'))
    close()

    # ---- calibrate: the person's own pinch, reach, head and eyes
    tabto(pg, 'dash'); wait(300)
    check('dashboard: nothing is calibrated yet, and what was taught is listed', txt('.dash').count('not yet') == 4 and 'TAUGHT (2)' in txt('.dash') and 'wrist down' in txt('.dash'), txt('.dash')[:300])
    card(pg, 'calibrate'); wait(500)
    check('calibrate: four things to calibrate, none done', pg.locator('#kList .calrow').count() == 4 and txt('#kList').count('not yet') == 4, txt('#kList'))
    def calibrate(key, secs):
        pg.click('#kList button[data-k=%s]' % key)
        pg.wait_for_function("/^(Saved|Not saved)/.test(document.getElementById('kSay').textContent)", timeout=secs * 1000); wait(300)
    # a person whose pinch never quite closes, and whose hand looks twice as big pushed forward as pulled back
    ev("""() => { __puppet.react = s => /PUSH/.test(s) ? { hands: [{ pinch: 0.6, size: 0.3 }] } : /PULL/.test(s) ? { hands: [{ pinch: 0.6, size: 0.15 }] } : /^PINCH/.test(s) ? { hands: [{ pinch: 0.6 }] } : { hands: [{}] } }""")
    spoken0 = ev("() => __puppet.spoken.length")
    calibrate('handRight', 30)
    said = pg.evaluate("(n) => __puppet.spoken.slice(n).join('|')", spoken0)
    check('calibrate hand: it asks for each position on the screen and aloud', said.startswith('hold your hand up, open|open|pinch|open|pinch, and keep pinching|push toward the screen|pull back toward you'), said)
    check('calibrate hand: it says what it learned, in their numbers', txt('#kSay') == 'Saved' and 'Your pinch reads 0.4' in txt('#kOut') and '2.0 times bigger' in txt('#kOut'), txt('#kOut'))
    check('calibrate hand: the row shows it done, and it is kept on the device', 'Redo' in txt('#kList .calrow:nth-child(1)') and 'reach' in txt('#kList .calrow:nth-child(1)') and 'handRight' in ev("() => localStorage.getItem('x_cal')"), txt('#kList .calrow:nth-child(1)'))
    # a head that rests a little off centre
    ev("""() => { const R = { nod: -5, turn: 3 }, f = o => ({ hands: [], face: Object.assign({}, R, o) }); __puppet.react = s => /LEFT/.test(s) ? f({ turn: 33 }) : /RIGHT/.test(s) ? f({ turn: -25 }) : /UP/.test(s) ? f({ nod: 11 }) : /DOWN/.test(s) ? f({ nod: -25 }) : f({}) }""")
    calibrate('head', 30)
    check('calibrate head: it learns how far each way', txt('#kSay') == 'Saved' and '30\u00B0 left and 28\u00B0 right' in txt('#kOut') and '16\u00B0 up and 20\u00B0 down' in txt('#kOut'), txt('#kOut'))
    # eyes the camera names the other way round: closing the person's LEFT eye raises the number called "right"
    ev("""() => { const R = { nod: -5, turn: 3 }, f = (l, r) => ({ hands: [], face: Object.assign({}, R, { blend: { eyeBlinkLeft: l, eyeBlinkRight: r } }) }); __puppet.eyes = f;
      __puppet.react = s => /BOTH/.test(s) ? f(0.7, 0.75) : /LEFT/.test(s) ? f(0.15, 0.75) : /RIGHT/.test(s) ? f(0.7, 0.2) : f(0.05, 0.08) }""")
    calibrate('eyes', 30)
    check('calibrate eyes: three blink signals are made, and which eye is which was learned', txt('#kSay') == 'Saved' and 'Blink left, blink right and blink both are ready' in txt('#kOut') and ev("() => Signals.signals.filter(s => /^blink /.test(s.name)).length") == 3 and ev("() => Signals.cal.eyes.swap") is True, txt('#kOut'))
    if shot: pg.screenshot(path=shot + '-calibrate.png')
    close()
    body = http('/trial/' + sorted(x['key'] for x in json.loads(http('/trials')) if '-calibrate-' in x['key'] and x['key'].endswith(':000'))[-1])
    check('calibrate: the record holds the numbers learned, and no picture', body.count('"what":"saved"') == 3 and '"closed":0.4' in body and '"swap":true' in body and 'landmarks' not in body, len(body))
    # what the calibration changes
    ev("() => { __puppet.react = null; __puppet.rest = __puppet.eyes(0.05, 0.08); __puppet.rest.face.turn = 23 }")
    card(pg, 'head'); wait(900)
    check('head card: numbers are now measured from their rest, and it says which way they look', row('turn, degrees') == ['20'] and row('looking') == ['left'] and 'your rest' in row('measured from')[0], (row('turn, degrees'), row('looking'), row('measured from')))
    ev("() => { __puppet.rest = __puppet.eyes(0.05, 0.08) }"); wait(900)
    n0 = ev("() => Signals.fires.length")
    ev("() => __act(t => t > 0.2 && t < 0.4 ? __puppet.eyes(0.7, 0.75) : __puppet.eyes(0.05, 0.08))"); wait(1300)
    check('blink: a natural blink fires nothing', ev("() => Signals.fires.length") == n0, ev("() => Signals.fires.slice(-2).map(e => e.name)"))
    ev("() => __act(t => t > 0.2 && t < 1.0 ? __puppet.eyes(0.15, 0.75) : __puppet.eyes(0.05, 0.08))"); wait(1700)
    check('blink: their left eye held closed fires blink left, and only that', fires('blink left') == 1 and fires('blink right') == 0 and fires('blink both') == 0, ev("() => Signals.fires.slice(-3).map(e => e.name)"))
    ev("() => __act(t => t > 0.2 && t < 1.0 ? __puppet.eyes(0.7, 0.75) : __puppet.eyes(0.05, 0.08))"); wait(1700); ev("() => __act(null)")
    check('blink: both eyes held closed fires blink both', fires('blink both') == 1 and fires('blink left') == 1, ev("() => Signals.fires.slice(-3).map(e => e.name)"))
    close()
    ev("() => { __puppet.rest = { hands: [], face: {} } }")
    card(pg, 'object')
    pg.wait_for_function("document.getElementById('oCan').dataset.state", timeout=15000); wait(600)
    sq = state(); QX, QY = sq['px'] + 0.07, sq['py'] + 0.28
    weak = lambda **k: pg.evaluate("(o) => { __puppet.rest = { hands: [o], face: {} } }", dict(dict(x=QX, y=QY), **k))
    weak(x=0.2, y=0.35); wait(300); weak(); wait(300); weak(pinch=0.6); wait(450)
    check('object, after calibration: their weak pinch now takes it', state()['held'] == 'one', state())
    z0 = state()['z']; weak(pinch=0.6, size=0.3); wait(450)
    check('object, after calibration: their reach carries it further than the standard strength did', state()['z'] < z0 - 1.6, (z0, state()['z']))
    weak(pinch=0, size=0.3); wait(700)
    check('object, after calibration: an open hand still lets it go', state()['held'] == '', state())
    close()
    tabto(pg, 'dash'); wait(400)
    check('dashboard: shows what is calibrated, with their numbers, and how the camera is doing', 'pinch 0.4' in txt('.dash') and 'reach \u00D72.0' in txt('.dash') and 'left, right and both' in txt('.dash') and txt('.dash').count('not yet') == 1 and 'not used' not in txt('#dCam'), txt('.dash')[:400].replace('\n', ' | '))
    if shot: pg.screenshot(path=shot + '-dash.png')

    # ---- the 3D program not arriving is said plainly
    p2 = ctx.new_page(); p2.goto(base + '/?three=' + urllib.request.quote('http://127.0.0.1:9/none.js', safe='')); p2.wait_for_timeout(700)
    check('a visit that has not needed the watch keeps no link to it, even with a code on the device', 'not in use' in p2.inner_text('#dWatch'), p2.inner_text('#dWatch'))
    card(p2, 'object'); p2.wait_for_timeout(1500)
    check('object: when the 3D program does not arrive, the card says so', p2.inner_text('#oSay') == 'The object could not be drawn' and len(p2.inner_text('.cmsg')) > 5, p2.inner_text('#oSay'))
    p2.close()
    check('no script errors on the page', not errors, errors[:3])
    b.close()

print('\n%d FAILED' % fails if fails else '\nall passed')
sys.exit(1 if fails else 0)
