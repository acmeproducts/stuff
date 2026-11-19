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
TAB = {'calibrate': 'learn', 'teach': 'learn', 'assign': 'learn', 'hands': 'camera', 'head': 'camera', 'camera': 'camera', 'object': 'camera', 'journey': 'camera', 'turns': 'voice', 'cutin': 'voice', 'gate': 'voice'}
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
Object.defineProperty(window, 'speechSynthesis', { value: { cancel: function () { clearTimeout(__puppet.talkT); }, speak: function (u) { __puppet.spoken.push(u.text); __puppet.talkT = setTimeout(function () { if (u.onend) u.onend(); }, __puppet.talkMs || 60); } } });
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
window.SpeechRecognition = function () { __puppet.heard.push(this); }; window.SpeechRecognition.prototype.start = function () { this._on = true; }; window.SpeechRecognition.prototype.abort = function () { this._on = false; };
/* the made-up voice: __hear(text, final) is what the recogniser reports; __mics() is how many recognisers are open */
window.__hear = function (text, final) { var r = __puppet.heard.filter(function (x) { return x._on && x.onresult; }).pop(); if (!r) return false; var a = [{ transcript: text, confidence: 0.9 }]; a.isFinal = final !== false; if (!r.continuous) r._on = false; r.onresult({ resultIndex: 0, results: [a] }); return true; };
window.__mics = function () { return __puppet.heard.filter(function (x) { return x._on; }).length; };
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
    check('the Camera tab holds the camera cards and the Learn tab holds calibrate, teach and assign', cam == ['camera', 'hands', 'head', 'object', 'journey'] and learn == ['calibrate', 'teach', 'assign'], (cam, learn))
    check('the page says which build it is', 'lab-r12' in txt('#meta'), txt('#meta'))

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
    check('assign: each taught signal has a list of actions', pg.locator('#aList select').count() == 3 and pg.locator(sel('fist') + ' option').count() == 20, pg.locator(sel('fist') + ' option').count())
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

    # ---- hands and things
    ev("() => { __puppet.rest = { hands: [], face: {} } }")
    card(pg, 'object')
    pg.wait_for_function("document.getElementById('oCan').dataset.state", timeout=15000); wait(600)
    st = lambda: json.loads(pg.get_attribute('#oCan', 'data-state') or '{}')
    thing = lambda kind, i=0: [o for o in st()['objs'] if o['k'] == kind][i]
    size_for = lambda z: 0.15 * 2 ** ((1.9 - z) / 3.2)       # how big a hand must look to be at depth z, over the standard reach
    HANDS = {}
    def show(): pg.evaluate("(hs) => { __puppet.rest = { hands: hs, face: {} } }", list(HANDS.values()))
    def hand(side, **k): HANDS[side] = dict(HANDS.get(side, {'side': side, 'x': 0.5, 'y': 0.5}), **k); show()
    def away(side): HANDS.pop(side, None); show()
    def aim(side, tx, ty, tz, mid=False, tries=9):
        """Move the made-up hand until its thumb and finger (or, with mid, its palm) are at a place in the scene."""
        hand(side, size=size_for(tz))
        for i in range(tries):
            wait(230); h = st()['hands'].get(side)
            if not h: continue
            dx, dy = tx - h['mx' if mid else 'x'], ty - h['my' if mid else 'y']
            if abs(dx) < 0.1 and abs(dy) < 0.1: return True
            hand(side, x=HANDS[side]['x'] - dx * 0.2, y=HANDS[side]['y'] - dy * 0.26)
        return False
    def grab(side, kind, i=0, pinch=1):
        o = thing(kind, i); aim(side, o['x'], o['cy'], o['z']); hand(side, pinch=pinch); wait(380)
    def drop(side): hand(side, pinch=0); wait(1000)
    s0 = st()
    check('things: the first goal is the cup, said on the screen and aloud', s0['goal'] == 'cup' and s0['n'] == 1 and txt('#oTask').startswith('1 of 6: Set the cup on the ring') and 'Set the cup on the ring, handle to the right.' in pg.evaluate("() => __puppet.spoken"), txt('#oTask'))
    check('things: with no hand in view it asks for one', txt('#oSay') == 'Hold up a hand' and s0['hands'] == {}, txt('#oSay'))
    hand('Right', x=0.3, y=0.4, size=0.2); wait(500)
    h1 = st()['hands'].get('Right', {})
    check('hands: a hand in view appears in the scene as a jointed hand, on its own side', h1.get('joints') == 21 and h1['mx'] > 0.3 and txt('#oSay') == 'Bring your hand to a thing', h1)
    hand('Right', size=0.27); wait(500); h2 = st()['hands']['Right']
    hand('Right', size=0.16); wait(500); h3 = st()['hands']['Right']
    check('hands: pushed toward the screen the hand goes deeper into the scene; pulled back it comes nearer', h2['mz'] < h1['mz'] - 0.8 and h3['mz'] > h1['mz'] + 0.5, (h1['mz'], h2['mz'], h3['mz']))
    hand('Right', size=0.2, yaw=45, roll=30); wait(500); h4 = st()['hands']['Right']
    check('hands: turning and rolling the hand does not move it in depth', abs(h4['mz'] - h1['mz']) < 0.12, (h1['mz'], h4['mz']))
    hand('Right', yaw=0, roll=0)
    c = thing('cup'); aim('Right', c['x'], c['cy'], c['z']); wait(250)
    check('things: a thing within reach glows, and the hand is told what to do', st()['glow'] is True and txt('#oSay') == 'Close thumb and finger to take it', (st()['glow'], txt('#oSay')))
    hand('Right', pinch=0.6); wait(400)
    check('things: before calibration, a weak pinch (thumb and finger not quite touching) takes nothing', st()['held'] is None, st()['held'])
    hand('Right', pinch=0); wait(300); hand('Right', pinch=1); wait(400)
    check('things: closing thumb and finger on it takes it', st()['held'] == {'mode': 'one', 'kind': 'cup', 'side': 'Right'} and txt('#oSay') == 'In your right hand', (st()['held'], txt('#oSay')))
    hand('Right', pinch=0.5); wait(110); hand('Right', pinch=1); wait(300)
    check('things: a pinch that reads open for an instant does not drop it', st()['held'] is not None, st()['held'])
    aim('Right', 0.2, 1.1, 0.3); c1 = thing('cup')
    check('things: it goes where the hand goes, and can be lifted', abs(c1['x'] - 0.2) < 0.45 and c1['y'] > 0.4, c1)
    hand('Right', size=size_for(-0.5)); wait(600); c2 = thing('cup')
    check('things: pushed toward the screen it goes away; depth is the hand\'s own', c2['z'] < c1['z'] - 0.5, (c1['z'], c2['z']))
    hand('Right', size=size_for(0.3), yaw=40); wait(600); c3 = thing('cup')
    check('things: turning the hand turns it', abs(c3['faces'] - c1['faces']) > 25, (c1['faces'], c3['faces']))
    if shot: pg.screenshot(path=shot + '-things-held.png')
    hand('Right', yaw=0); wait(300); drop('Right'); c4 = thing('cup')
    check('things: opening the fingers sets it down, upright on the table', st()['held'] is None and abs(c4['y']) < 0.03 and c4['up'] > 0.98, c4)
    away('Right'); wait(800)
    # the cup faces away; two nods (given "turn left") bring the handle round, then it is carried to the ring
    ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(null)"); wait(600)
    f0 = thing('cup')['faces']
    hand('Right', x=0.4, y=0.4, size=0.2, pinch=0); wait(300)
    grab('Right', 'cup'); aim('Right', 1.1, 0.5, 0.3); drop('Right')
    sD = st()
    check('goal 1: two nods given "turn left" turn the handle, and the cup set on the ring finishes the goal', sD['done'] is True and 'Done in' in txt('#oTask'), (f0, thing('cup'), txt('#oTask')))
    wait(3200)
    check('goals: the next goal follows by itself and is said aloud', st()['goal'] == 'pass' and st()['n'] == 2 and 'pass it to your other hand' in pg.evaluate("() => __puppet.spoken.slice(-1)[0]"), st()['goal'])
    # goal 2: hand to hand
    grab('Right', 'ball'); aim('Right', -0.2, 0.9, 0.4)
    b0 = thing('ball'); hand('Left', x=0.8, y=0.4, size=0.2, pinch=0); aim('Left', b0['x'], b0['cy'], b0['z']); hand('Left', pinch=1); wait(450)
    check('hand to hand: the other hand taking hold makes it two-handed', st()['held'] == {'mode': 'two', 'kind': 'ball', 'side': ''} and txt('#oSay') == 'Both hands have it', (st()['held'], txt('#oSay')))
    if shot: pg.screenshot(path=shot + '-things-two.png')
    hand('Right', pinch=0); wait(500)
    check('hand to hand: the first hand letting go leaves it in the other, and that counts as passed', st()['held'] == {'mode': 'one', 'kind': 'ball', 'side': 'Left'} and thing('ball')['passed'] is True, (st()['held'], thing('ball')))
    away('Right'); aim('Left', 1.2, 0.5, 0.4); drop('Left')
    check('goal 2: passed and set on the mat', st()['done'] is True, (thing('ball'), txt('#oTask')))
    away('Left'); wait(3200)
    # goal 3: ball in the bowl
    hand('Right', x=0.6, y=0.4, size=0.2, pinch=0); grab('Right', 'ball'); bw = thing('bowl'); aim('Right', bw['x'], 0.9, bw['z']); drop('Right')
    check('goal 3: the ball let go over the bowl lands in it', thing('ball')['on'] == 'bowl' and st()['done'] is True, thing('ball'))
    wait(3200)
    # goal 4: three blocks
    grab('Right', 'block', 0); b1 = thing('block', 1); aim('Right', b1['x'], 1.0, b1['z']); drop('Right')
    check('stack: a block let go over another sits on it', thing('block', 0)['on'] == 'block' and abs(thing('block', 0)['y'] - 0.5) < 0.05 and st()['done'] is False, thing('block', 0))
    grab('Right', 'block', 2); aim('Right', b1['x'], 1.5, b1['z']); drop('Right')
    check('goal 4: the third on top makes the tower', abs(thing('block', 2)['y'] - 1.0) < 0.05 and st()['done'] is True, thing('block', 2))
    if shot: pg.screenshot(path=shot + '-things-stack.png')
    away('Right'); wait(3200)
    # goal 5: park the car (two nods turn its nose to the right)
    ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(%s)" % NOD); wait(2600); ev("() => __act(null)"); wait(500)
    hand('Right', x=0.6, y=0.4, size=0.2, pinch=0); grab('Right', 'car'); aim('Right', 1.0, 0.5, 0.1); drop('Right')
    check('goal 5: the car set down in the bay, nose to the right', st()['done'] is True and abs(thing('car')['faces']) < 25, thing('car'))
    wait(3200)
    # goal 6: putty
    pu = thing('putty')
    check('putty: it starts as a ball', st()['goal'] == 'putty' and abs(pu['s'] - 1) < 0.01, pu)
    aim('Right', pu['x'] + 0.2, pu['cy'], pu['z']); hand('Right', pinch=1); wait(400)
    hand('Left', x=0.75, y=0.45, size=0.2, pinch=0); aim('Left', pu['x'] - 0.2, pu['cy'], pu['z']); hand('Left', pinch=1); wait(450)
    check('putty: both hands take it', st()['held'] == {'mode': 'two', 'kind': 'putty', 'side': ''}, st()['held'])
    out = 0
    for i in range(7):
        if thing('putty')['s'] >= 2.3: break
        hand('Right', x=HANDS['Right']['x'] - 0.04); hand('Left', x=HANDS['Left']['x'] + 0.04); wait(450); out += 1
    p1 = thing('putty')
    check('putty: pulled apart with both hands it stretches long, and the next step is asked for', p1['s'] >= 2.2 and abs(p1['uy']) < 0.4 and st()['stage'] == 1 and 'press it flat' in txt('#oTask'), (p1, txt('#oTask')))
    if shot: pg.screenshot(path=shot + '-putty-long.png')
    for i in range(max(1, out - 1)):
        hand('Right', x=HANDS['Right']['x'] + 0.04); hand('Left', x=HANDS['Left']['x'] - 0.04); wait(450)
    check('putty: pushed together it shortens again', thing('putty')['s'] < p1['s'] - 0.6, (p1['s'], thing('putty')['s'], out))
    hand('Right', pinch=0); hand('Left', pinch=0); wait(900); away('Left'); wait(700)
    check('putty: let go, it keeps its shape', st()['held'] is None and abs(thing('putty')['s'] - 1) > 0.05, thing('putty'))
    pu = thing('putty'); hand('Right', pinch=0, pitch=80, x=0.5, y=0.3)
    aim('Right', pu['x'], 0.9, pu['z'], mid=True); wait(300); s_before = thing('putty')['s']
    for i in range(8):
        hand('Right', y=HANDS['Right']['y'] + 0.045); wait(280)
        if st()['stage'] == 2: break
    p2s = thing('putty')
    check('putty: an open hand pressed down on it flattens it onto the table', p2s['uy'] > 0.9 and p2s['s'] <= 0.42 and st()['stage'] == 2 and 'close your fist' in txt('#oTask'), (s_before, p2s, st()['hands'].get('Right')))
    if shot: pg.screenshot(path=shot + '-putty-flat.png')
    hand('Right', pitch=0, curl=1, y=HANDS['Right']['y'] - 0.05); wait(2600)
    check('goal 6: a fist closed on it rolls it back into a ball, and that finishes the six', abs(thing('putty')['s'] - 1) <= 0.15 and st()['done'] is True and st()['doneN'] == 6, (thing('putty'), st()['doneN']))
    check('goals: all six were done without touching the screen', 'Done in' in txt('#oTask'), txt('#oTask'))
    away('Right'); wait(3200)
    check('goals: after the last, it goes back to the first', st()['goal'] == 'cup', st()['goal'])
    # signals act here too
    feed(0, 0, 0.8); feed(-45, 0, 1.2); feed(0, 0, 0.2); wait(500)
    check('signals: the watch pose given "next object" moves to the next goal', st()['goal'] == 'pass', st()['goal'])
    hand('Right', x=0.75, y=0.45, size=0.2, curl=0, pinch=0); wait(500); hand('Right', curl=1); wait(900)
    check('signals: a fist given "take" takes the nearest thing from where the hand is', st()['held'] == {'mode': 'one', 'kind': 'ball', 'side': 'Right'}, st()['held'])
    away('Right'); wait(1400)
    check('signals: the hand leaving the picture lets it go', st()['held'] is None and txt('#oSay') == 'Hold up a hand', (st()['held'], txt('#oSay')))
    ev("() => __act(%s)" % FIST_NOD); wait(3400); ev("() => __act(null)"); ev("() => { __puppet.rest = { hands: [], face: {} } }"); wait(900)
    check('signals: the combination given "put it back" starts the goal again', st()['goal'] == 'pass' and abs(thing('ball')['x'] + 1.2) < 0.05, thing('ball'))
    pg.click('#oSkip'); wait(500)
    check('things: a tap on "Next goal" is there for when no signal has been taught', st()['goal'] == 'bowl', st()['goal'])
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-object-' in x['key'] and x['key'].endswith(':000'))
    body = http('/trial/' + key[-1]) if key else ''
    check('things: the record has each goal done, the pass, the putty steps, and no picture', body.count('"what":"goal done"') == 6 and '"passed":1' in body and body.count('"what":"putty step"') == 2 and 'landmarks' not in body, len(body))

    # ---- journey: a story steered by the head. Not calibrated yet, so it takes the first second as straight ahead.
    FACE = {'turn': 3, 'nod': -8}
    def face(**k): pg.evaluate("(f) => { __puppet.rest = { hands: [], face: f } }", dict(FACE, **k))
    LOOKS = {'left': {'turn': 23}, 'right': {'turn': -17}, 'up': {'nod': -20}, 'down': {'nod': 4}}       # the camera's own signs: left +, up -
    def lookto(d, ms=1250): face(**LOOKS[d]); wait(ms); face(); wait(850)
    jst = lambda: json.loads(pg.get_attribute('#jDot', 'data-state') or '{}')
    jbtn = lambda d: pg.inner_text('.jr button[data-d=%s]' % d)
    face(); card(pg, 'journey'); wait(150)
    check('journey: with no head calibration it asks you to look straight first', txt('#jName') == 'Look straight at the screen', txt('#jName'))
    pg.wait_for_function("document.getElementById('jName').textContent === 'The beach'", timeout=8000); wait(900)
    check('journey: it starts on the beach, read on the screen and aloud', 'pebble beach' in txt('#jText') and any('pebble beach' in s for s in pg.evaluate("() => __puppet.spoken")), txt('#jText')[:60])
    check('journey: the arrows say where each way leads, and a way that does not exist is off', jbtn('left') == '← lighthouse hall' and jbtn('right') == '→ boathouse' and jbtn('down') == '↓ tide pools' and pg.is_disabled('.jr button[data-d=up]'), [jbtn(d) for d in ('left', 'right', 'up', 'down')])
    check('journey: looking straight ahead, the dot sits in the middle', abs(jst()['x']) < 0.15 and abs(jst()['y']) < 0.15 and jst()['armed'] is True, jst())
    face(turn=-17); wait(380); face(); wait(700)
    check('journey: a glance does not move you', jst()['at'] == 'beach' and jst()['moves'] == 0, jst())
    face(turn=-5); wait(1500); face(); wait(600)
    check('journey: a look less than half way does not move you', jst()['at'] == 'beach', jst())
    face(**LOOKS['right']); wait(500); mid = jst(); wait(750); face(); wait(850)
    check('journey: the dot follows the look and the choice shows while it is held', mid['dir'] == 'right' and mid['x'] > 0.6 and mid['at'] == 'beach', mid)
    check('journey: a look to the right held about a second goes right', jst()['at'] == 'boathouse' and jst()['moves'] == 1 and txt('#jName') == 'The boathouse', jst())
    face(turn=23); wait(2900)
    check('journey: one long look is one move, not two', jst()['at'] == 'beach', jst())
    face(); wait(850)
    lookto('up')
    check('journey: a way that does not exist says so and you stay', jst()['at'] == 'beach' and txt('#jText') == 'No way up from here.' and pg.evaluate("() => __puppet.spoken.slice(-1)[0]") == 'No way up from here.', txt('#jText'))
    face(**LOOKS['left']); wait(450); pg.evaluate("() => { __puppet.rest = { hands: [], face: null } }"); wait(900)
    check('journey: losing sight of the face mid-look moves nothing and says so', jst()['at'] == 'beach' and txt('#jSee') == 'I cannot see your face.', txt('#jSee'))
    face(); wait(900)
    for d in ('left', 'down'): lookto(d)
    check('journey: the cellar is dark without the lantern, and only the ways you can feel are open', jst()['at'] == 'cellar' and 'pitch dark' in txt('#jText') and pg.is_disabled('.jr button[data-d=left]'), txt('#jText')[:50])
    for d in ('up', 'right', 'right', 'up'): lookto(d)
    check('journey: looking up the ladder climbs it, and the lantern is taken', jst()['at'] == 'loft' and jst()['inv'] == ['lantern'] and txt('#jInv') == 'Carrying: lantern', (jst(), txt('#jInv')))
    for d in ('down', 'left', 'left', 'down'): lookto(d)
    check('journey: with the lantern the cellar can be seen', 'By lantern light' in txt('#jText') and jbtn('left') == '← store room', txt('#jText')[:40])
    lookto('left')
    check('journey: the locked store says what is missing', jst()['at'] == 'cellar' and txt('#jText') == 'The store room is locked. You need a key.', txt('#jText'))
    for d in ('up', 'up', 'left'): lookto(d)
    check('journey: the key is in the keeper\'s room', jst()['at'] == 'keeper' and 'key' in jst()['inv'], jst())
    for d in ('right', 'down', 'down', 'left'): lookto(d)
    check('journey: the key opens the store and the oil is taken', jst()['at'] == 'store' and 'oil' in jst()['inv'], jst())
    if shot: pg.screenshot(path=shot + '-journey.png')
    for d in ('right', 'up', 'up', 'up'): lookto(d)
    check('journey: with the oil, the lamp is lit and the story ends with how many moves it took', jst()['won'] is True and txt('#jName') == 'The lamp is lit' and 'in 23 moves' in txt('#jText'), (jst(), txt('#jText')[-60:]))
    pg.click('.jr button[data-d=up]'); wait(500)
    check('journey: the arrows can be tapped too, and up starts it again', jst()['at'] == 'beach' and jst()['moves'] == 0 and jst()['inv'] == [], jst())
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-journey-' in x['key'] and x['key'].endswith(':000'))
    body = http('/trial/' + key[-1]) if key else ''
    check('journey: the record has each move, the dead ends, what was taken and the ending, and no picture', body.count('"what":"went ') == 23 and '"what":"no way"' in body and '"what":"locked"' in body and '"what":"took lantern"' in body and '"what":"journey done"' in body and 'landmarks' not in body, len(body))

    # ---- voice: hot word and cold word, turns, cutting in. The recogniser is made up: __hear(text, final) is what it reports.
    hear = lambda text, final=True: pg.evaluate("([t, f]) => __hear(t, f)", [text, final])
    mics = lambda: pg.evaluate("() => __mics()")
    spoken = lambda: pg.evaluate("() => __puppet.spoken")
    camoff = lambda: 'off' in (pg.get_attribute('.linkbox .camview', 'class') or '')
    sigid = lambda name: pg.evaluate("(n) => Signals.signals.filter(s => s.name === n)[0].id", name)
    ev("() => { __puppet.rest = { hands: [{}], face: {} }; __puppet.heard.forEach(x => { x._on = false }) }")
    tabto(pg, 'voice'); wait(200)
    check('the Voice tab holds the three voice cards and asks for no watch code', tiles() == ['turns', 'cutin', 'gate'] and pg.locator('#pair.show').count() == 0, tiles())
    card(pg, 'gate'); wait(400)
    check('gate: it starts not listening, with nothing to open it, the microphone off and the camera off', txt('#vSay') == 'NOT LISTENING' and 'Nothing opens it yet' in txt('#vMic') and mics() == 0 and camoff() and txt('#vHot') == 'nothing yet', (txt('#vSay'), txt('#vMic'), mics()))
    pg.click('#vTHot'); wait(450)
    check('gate: teaching a word asks for it three times, each after a tone', txt('#vSay') == 'SAY IT 1 of 3' and mics() == 1, (txt('#vSay'), mics()))
    hear('Hey lab.'); wait(550); hear('hey lab'); wait(550); hear('a lab'); wait(700)
    check('gate: the word is learned as it was heard, and now opens the listening', txt('#vHot') == 'hey lab' and 'Learned “hey lab”' in txt('.vmsg') and 'also heard as “a lab”' in txt('.vmsg') and 'It starts the listening' in txt('.vmsg'), txt('.vmsg'))
    check('gate: with a hot word taught, the microphone is on and waits only for it', 'waiting only for the hot word' in txt('#vMic') and mics() == 1 and txt('#vSay') == 'NOT LISTENING', (txt('#vMic'), mics()))
    pg.click('#vTCold'); wait(450); hear('that is all'); wait(550); hear('that is all'); wait(550); hear('That is all.'); wait(700)
    check('gate: a cold word is learned the same way', txt('#vCold') == 'that is all' and 'It stops the listening' in txt('.vmsg'), (txt('#vCold'), txt('.vmsg')))
    pg.click('#vTCold'); wait(450); hear('hey lab'); wait(550); hear('hey lab'); wait(550); hear('hey lab'); wait(700)
    check('gate: a word that sounds like one already taught is refused', 'already taught' in txt('.vmsg') and txt('#vCold') == 'that is all' and txt('#vHot') == 'hey lab', txt('.vmsg'))
    hear('what a lovely day'); wait(120)
    check('gate: while not listening, what is said is let pass and not shown', txt('#vPass') == '1' and txt('#vText') == '' and txt('#vSay') == 'NOT LISTENING', (txt('#vPass'), txt('#vText')))
    hear('hey lab', False); wait(150)
    check('gate: the hot word opens it while it is still being said', txt('#vSay') == 'LISTENING' and txt('#vOpen') == '1' and 'taking down what you say' in txt('#vMic'), (txt('#vSay'), txt('#vMic')))
    hear('hey lab'); hear('buy milk and eggs'); wait(120)
    if shot: pg.screenshot(path=shot + '-gate.png')
    check('gate: while listening, what is said is taken down, and the hot word itself is not', txt('#vText') == 'buy milk and eggs.' and txt('#vTook') == '1', (txt('#vText'), txt('#vTook')))
    hear('that is all'); wait(150)
    check('gate: the cold word shuts it', txt('#vSay') == 'NOT LISTENING' and txt('#vShut') == '1', txt('#vSay'))
    hear('one more thing'); wait(120)
    check('gate: and nothing more is taken down', txt('#vText') == 'buy milk and eggs.' and txt('#vPass') == '2', (txt('#vText'), txt('#vPass')))
    close()
    # a gesture instead of the hot word: the fist is given "start listening". One action has one signal, so the word gives it up.
    pg.evaluate("(id) => Signals.setAction(id, 'listen')", sigid('fist'))
    card(pg, 'gate'); wait(900)
    check('gate, by gesture: the camera is on, and the microphone is off until the gesture', (not camoff()) and mics() == 0 and 'off until “fist”' in txt('#vMic') and txt('#vHot') == 'fist', (camoff(), mics(), txt('#vMic')))
    ev("() => { __puppet.rest = { hands: [{ curl: 1 }], face: {} } }"); wait(1300)
    check('gate, by gesture: the fist opens the listening and only then is the microphone on', txt('#vSay') == 'LISTENING' and mics() == 1, (txt('#vSay'), mics()))
    ev("() => { __puppet.rest = { hands: [{}], face: {} } }"); hear('write this down'); wait(120); hear('that is all'); wait(200)
    check('gate, by gesture: the cold word still shuts it, and the microphone goes off again', txt('#vTook') == '1' and txt('#vSay') == 'NOT LISTENING' and mics() == 0, (txt('#vTook'), txt('#vSay'), mics()))
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-gate-' in x['key'] and x['key'].endswith(':000'))
    body = ''.join(http('/trial/' + k) for k in key[-2:])
    check('gate: the record has the openings, the shuttings and counts of words, and none of what was said', '"what":"listening"' in body and '"what":"not listening"' in body and '"what":"taken down"' in body and 'milk' not in body and 'lovely' not in body and 'write this' not in body, len(body))
    pg.evaluate("(id) => Signals.setAction(id, 'listen')", sigid('hey lab'))
    pg.evaluate("(id) => Signals.setAction(id, 'take')", sigid('fist'))
    # taking turns
    ev("() => { __puppet.talkMs = 700 }")
    card(pg, 'turns'); wait(400)
    check('turns: it opens on your turn, the microphone on and the camera off', txt('#vSay') == 'Your turn' and mics() == 1 and camoff(), (txt('#vSay'), mics()))
    hear('good morn', False); wait(100)
    check('turns: words show as they are said', txt('#vLive') == 'good morn' and txt('#vN') == '0', txt('#vLive'))
    hear('good morning everyone'); wait(150)
    check('turns: a finished phrase is one turn', txt('#vSay') == 'I heard you' and txt('#vN') == '1', (txt('#vSay'), txt('#vN')))
    wait(500)
    check('turns: it says back what it heard', spoken()[-1] == 'You said: good morning everyone', spoken()[-1])
    hear('you said good morning everyone'); wait(100)
    if shot: pg.screenshot(path=shot + '-turns.png')
    check('turns: what the microphone hears while it speaks is ignored and counted', txt('#vDrop') == '1' and txt('#vN') == '1', (txt('#vDrop'), txt('#vN')))
    wait(1100)
    check('turns: then it is your turn again', txt('#vSay') == 'Your turn', txt('#vSay'))
    hear('that is all'); wait(150)
    check('turns: the cold word stops the listening and is not said back', txt('#vSay') == 'Not listening' and txt('#vGate') == 'shut' and txt('#vN') == '1', (txt('#vSay'), txt('#vGate')))
    hear('is anyone there'); wait(150)
    check('turns: while not listening nothing is a turn', txt('#vN') == '1' and txt('#vSay') == 'Not listening', txt('#vN'))
    hear('hey lab'); wait(150)
    check('turns: the hot word brings it back', txt('#vSay') == 'Your turn' and txt('#vGate') == 'open', (txt('#vSay'), txt('#vGate')))
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-turns-' in x['key'] and x['key'].endswith(':000'))
    body = http('/trial/' + key[-1]) if key else ''
    check('turns: the record has the tones, the turn and what was ignored, and none of what was said', '"kind":"rise"' in body and '"kind":"fall"' in body and '"what":"turn"' in body and '"what":"ignored"' in body and 'morning' not in body and 'anyone' not in body, len(body))
    # cutting in
    ev("() => { __puppet.talkMs = 1500 }")
    card(pg, 'cutin'); wait(500)
    check('cut in: it starts reading the first sentence aloud and marks it', txt('#vSay') == 'Reading' and spoken()[-1].startswith('The sea rises') and pg.inner_text('#vText .on').startswith('The sea rises'), (txt('#vSay'), spoken()[-1][:30]))
    hear('rises and falls twice a day', False); wait(150)
    check('cut in: its own words coming back are known as its own, counted, and it reads on', txt('#vSay') == 'Reading' and txt('#vOwn') == '1' and txt('#vVoice') == '0', (txt('#vSay'), txt('#vOwn')))
    hear('hang on a second', False); wait(150); said_n = len(spoken())
    check('cut in: other words stop it at once', txt('#vSay') == 'You cut in' and txt('#vVoice') == '1' and txt('#vLive') == 'hang on a second', (txt('#vSay'), txt('#vVoice')))
    wait(1700)
    if shot: pg.screenshot(path=shot + '-cutin.png')
    check('cut in: it stays quiet while you speak', len(spoken()) == said_n and txt('#vSay') == 'You cut in', spoken()[-1][:30])
    hear('hang on a second what is a bulge'); wait(1300)
    check('cut in: when you have finished it says so', txt('#vSay') == 'Going on' and spoken()[-1] == 'Going on.', (txt('#vSay'), spoken()[-1]))
    wait(1800)
    check('cut in: and goes on from the sentence it was in', txt('#vSay') == 'Reading' and spoken()[-1].startswith('The sea rises'), spoken()[-1][:30])
    hear('the see rice is', False); wait(150)
    check('cut in: its own voice misheard does stop it', txt('#vSay') == 'You cut in' and txt('#vVoice') == '2', (txt('#vSay'), txt('#vVoice')))
    hear('the sea rises and falls twice a day'); wait(200)
    check('cut in: but when the words turn out to be its own, that is counted as stopped for nothing and it goes on', txt('#vFalse') == '1' and txt('#vSay') == 'Going on', (txt('#vFalse'), txt('#vSay')))
    wait(1800); hear('hey lab', False); wait(200)
    check('cut in: a signal given "start listening" cuts in too', txt('#vSay') == 'You cut in' and txt('#vSig') == '1', (txt('#vSay'), txt('#vSig')))
    wait(5600)
    check('cut in: cut in by a signal and then silence, it goes on without counting it against itself', txt('#vFalse') == '1' and txt('#vSay') in ('Going on', 'Reading'), (txt('#vFalse'), txt('#vSay')))
    ev("() => { __puppet.talkMs = 40 }"); wait(3200)
    check('cut in: left alone it reads to the end', txt('#vSay') == 'The end' and pg.locator('#vText .done').count() == 10, txt('#vSay'))
    pg.click('#vAgain'); wait(200)
    check('cut in: Read it again starts over', spoken()[-1].startswith('The sea rises') or txt('#vSay') in ('Reading', 'The end'), txt('#vSay'))
    close()
    key = sorted(x['key'] for x in json.loads(http('/trials')) if '-cutin-' in x['key'] and x['key'].endswith(':000'))
    body = http('/trial/' + key[-1]) if key else ''
    check('cut in: the record has each cut-in, how, the false stop and the own-voice count, and none of what was said', body.count('"what":"cut in"') == 3 and '"what":"stopped for nothing"' in body and '"what":"own voice"' in body and '"what":"read to the end"' in body and 'bulge mean' not in body and 'hang on' not in body, len(body))
    # a word can be taught in Learn as well
    ev("() => { __puppet.talkMs = 60 }")
    card(pg, 'teach'); wait(300); pg.select_option('#tSrc', 'voice'); wait(200); pg.click('#tGo'); wait(500)
    check('teach: Voice is a source; a word is asked for three times', txt('#tSay') == 'SAY IT 1 of 3', txt('#tSay'))
    hear('next please'); wait(550); hear('next please'); wait(550); hear('next please'); wait(700)
    check('teach: the word is saved under what was heard, and listed', txt('#tSay') == 'Saved: next please' and 'next please' in txt('#tList') and 'Voice · word' in txt('#tList'), (txt('#tSay'), txt('#tList')[-80:]))
    pg.evaluate("(id) => Signals.remove(id)", sigid('next please'))
    pg.select_option('#tSrc', 'handR'); close()
    tabto(pg, 'dash'); wait(300)
    check('dashboard: says how the microphone did on this visit', txt('#dMic') == 'working', txt('#dMic'))
    ev("() => { __puppet.rest = { hands: [{}] } }")

    # ---- the rest of the Lab still stands
    card(pg, 'teach'); wait(500); pg.click('#notesBtn'); wait(300); pg.click('#rate button[data-v=keep]'); pg.click('#doneBtn'); wait(700)
    card(pg, 'keepers'); wait(500)
    check('keepers: a kept card that has no watch gesture does not break the Keepers card', pg.locator('.kboard').count() == 1 and 'Nothing is rated Keep' in txt('.kboard'), txt('.kboard')[:80])
    close()
    pg.reload(); wait(900)
    card(pg, 'teach'); wait(600)
    check('after a reload, everything taught is still there', txt('#tList').count('Remove') == 6 and 'combination: fist then nod' in txt('#tList') and 'Voice · word · does: start listening' in txt('#tList') and 'does: take' in txt('#tList'), txt('#tList'))
    pg.locator('#sig_' + ev("() => Signals.signals.find(s => s.name === 'fist').id") + ' button').click(); wait(200)
    check('removing a letter removes the word made with it', txt('#tList').count('Remove') == 4 and 'fist' not in txt('#tList'), txt('#tList'))
    close()

    # ---- calibrate: the person's own pinch, reach, head and eyes
    tabto(pg, 'dash'); wait(300)
    check('dashboard: nothing is calibrated yet, and what was taught is listed', txt('.dash').count('not yet') == 5 and 'TAUGHT (4)' in txt('.dash') and 'wrist down' in txt('.dash'), txt('.dash')[:300])
    card(pg, 'calibrate'); wait(500)
    check('calibrate: five things to calibrate, none done', pg.locator('#kList .calrow').count() == 5 and txt('#kList').count('not yet') == 5, txt('#kList'))
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
    # the watch arm: rests rolled well over, as the owner's does
    pg.click('#kList button[data-k=watch]')
    end = time.time() + 30
    while time.time() < end:
        s = txt('#kSay')
        if s.startswith('Saved') or s.startswith('Not saved'): break
        if 'RAISE' in s: feed(48, -30, 0.17)
        elif 'ROLL your' in s: feed(-7, -170, 0.17)
        elif 'ROLL it' in s: feed(-7, -85, 0.17)
        else: feed(-7, -125, 0.17)
    wait(300)
    check('calibrate watch: it learns the rest, the raise and the roll each way', txt('#kSay') == 'Saved' and 'forearm is 55\u00B0 from the desk' in txt('#kOut') and '45\u00B0 one way and 40\u00B0 the other' in txt('#kOut'), txt('#kOut'))
    if shot: pg.screenshot(path=shot + '-calibrate.png')
    close()
    body = http('/trial/' + sorted(x['key'] for x in json.loads(http('/trials')) if '-calibrate-' in x['key'] and x['key'].endswith(':000'))[-1])
    check('calibrate: the record holds the numbers learned, and no picture', body.count('"what":"saved"') == 4 and '"from":"watch"' in body and '"closed":0.4' in body and '"swap":true' in body and 'landmarks' not in body, len(body))
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
    HANDS.clear(); hand('Right', x=0.4, y=0.4, size=0.2, pinch=0); wait(300)
    grab('Right', 'cup', pinch=0.6)
    check('things, after calibration: their weak pinch now takes it', st()['held'] == {'mode': 'one', 'kind': 'cup', 'side': 'Right'}, st()['held'])
    hand('Right', pinch=0); wait(800)
    check('things, after calibration: an open hand still lets it go', st()['held'] is None, st()['held'])
    close()
    face(turn=3, nod=-5); card(pg, 'journey'); wait(1200)
    check('journey, after calibration: it starts at once, measured from their own rest', txt('#jName') == 'The beach' and jst()['armed'] is True, (txt('#jName'), jst()))
    face(turn=3 - 18, nod=-5); wait(1300); face(turn=3, nod=-5); wait(700)
    check('journey, after calibration: half of their own turn is enough', jst()['at'] == 'boathouse', jst())
    face(turn=3, nod=-5 + 9); wait(1300); face(turn=3, nod=-5); wait(700)
    check('journey, after calibration: up is whichever way their own head went for up', jst()['at'] == 'loft', jst())
    close()
    tabto(pg, 'dash'); wait(400)
    check('dashboard: lists the taught words with what they do', 'Voice, word → start listening' in txt('.dash') and 'Voice, word → stop listening' in txt('.dash'), txt('.dash')[-300:])
    check('dashboard: shows what is calibrated, with their numbers, and how the camera is doing', 'pinch 0.4' in txt('.dash') and 'reach \u00D72.0' in txt('.dash') and 'left, right and both' in txt('.dash') and txt('.dash').count('not yet') == 1 and 'not used' not in txt('#dCam'), txt('.dash')[:400].replace('\n', ' | '))
    if shot: pg.screenshot(path=shot + '-dash.png')

    # ---- the 3D program not arriving is said plainly
    p2 = ctx.new_page(); p2.goto(base + '/?three=' + urllib.request.quote('http://127.0.0.1:9/none.js', safe='')); p2.wait_for_timeout(700)
    check('a visit that has not needed the watch keeps no link to it, even with a code on the device', 'not in use' in p2.inner_text('#dWatch'), p2.inner_text('#dWatch'))
    card(p2, 'object'); p2.wait_for_timeout(1500)
    check('object: when the 3D program does not arrive, the card says so', p2.inner_text('#oSay') == 'The scene could not be drawn' and len(p2.inner_text('.cmsg')) > 5, p2.inner_text('#oSay'))
    p2.close()
    check('no script errors on the page', not errors, errors[:3])
    b.close()

print('\n%d FAILED' % fails if fails else '\nall passed')
sys.exit(1 if fails else 0)
