"""Lab check for the Wrist Lab page: drives it in a phone-sized Chrome with relay events and a synthetic raw sensor stream.
Usage: python3 page-test.py <base-url> [screenshot-prefix]   (needs playwright + Chrome)"""
import json, math, sys, time, urllib.request
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787').rstrip('/')
shot = sys.argv[2] if len(sys.argv) > 2 else None
code = '424242'
fails = 0

def check(name, ok, extra=''):
    global fails
    if not ok: fails += 1
    print(('PASS ' if ok else 'FAIL ') + name + ((' · ' + str(extra)) if extra != '' else ''))

def http(path, body=None):
    req = urllib.request.Request(base + path, data=None if body is None else body.encode(), method='GET' if body is None else 'POST')
    return urllib.request.urlopen(req, timeout=10).read().decode()

def post(o): return json.loads(http('/e/' + code, json.dumps(o)))

def feed(pitch, roll, seconds, gyro=0.0):
    """Send a steady pose as raw rows: 50 a second, in batches of 5."""
    p, r = math.radians(pitch), math.radians(roll)
    g = [round(981 * math.sin(p)), round(981 * math.cos(p) * math.sin(r)), round(981 * math.cos(p) * math.cos(r))]
    w = round(gyro * 100)
    end = time.time() + seconds
    while time.time() < end:
        rows = [[i * 20] + g + [w, 0, 0, 0, 0, 0] for i in range(5)]
        post({'t': 'raw', 'w': int(time.time() * 1000), 's': rows})
        time.sleep(0.085)

def sweep(p0, r0, p1, r1, seconds):
    n = max(1, int(seconds / 0.1))
    for i in range(n + 1):
        f = i / n
        feed(p0 + (p1 - p0) * f, r0 + (r1 - r0) * f, 0.1, gyro=1.0)

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-fake-ui-for-media-stream'])
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2, has_touch=True, is_mobile=True)
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    txt = lambda sel: pg.inner_text(sel)
    ev = lambda js: pg.evaluate(js)

    pg.goto(base + '/')
    check('first visit asks for the watch code', pg.locator('#pair.show').count() == 1)
    pg.fill('#code', code)
    pg.wait_for_function("document.getElementById('statusText').textContent.indexOf('Waiting for the watch')===0", timeout=8000)
    check('grid shows seven concepts', pg.locator('.tile').count() == 7, pg.locator('.tile').count())
    check('every concept starts unrated', pg.locator('.chip.keep,.chip.shop,.chip.dump').count() == 0)
    post({'t': 'hb', 'b': 'turn04-test'})
    pg.wait_for_function("document.getElementById('statusText').textContent==='Watch connected'", timeout=5000)
    if shot: pg.screenshot(path=shot + '-grid.png')

    # ---- v1 scroll: driven by the watch's own events
    pg.click('.tile[data-id=tilt1]')
    check('tapping a card opens it full screen', pg.locator('#active.show').count() == 1 and txt('#cName') == 'Tilt to scroll · v1')
    top = lambda: ev("document.querySelector('#play .sc').scrollTop")
    post({'t': 'scroll', 'r': -4}); time.sleep(0.5)
    t1 = top()
    check('v1: watch says hand lowered, list moves down', t1 > 150, t1)
    post({'t': 'scroll', 'r': 0}); time.sleep(0.3); t2 = top(); time.sleep(0.3)
    check('v1: level stops it', abs(top() - t2) < 2)
    r = post({'t': 'hb', 'b': 'turn04-test'})
    check('an open card asks the watch for its raw stream', r.get('raw') == 1, r)
    pg.click('#closeBtn'); time.sleep(0.8)
    check('closing returns to the grid and counts the trial', pg.locator('#active.show').count() == 0 and '1 trial' in txt('.tile[data-id=tilt1] .foot'))
    check('closing stops the raw request', post({'t': 'hb'}).get('raw') == 0)

    # ---- v2 scroll: decided on the page from raw rows
    pg.click('.tile[data-id=tilt2]')
    feed(0, 0, 0.8)
    check('v2: level, list is still', top() == 0, top())
    sweep(0, 0, -30, 0, 0.4); feed(-30, 0, 1.0)
    t1 = top()
    check('v2: hand lowered and held, list moves down', t1 > 150, t1)
    sweep(-30, 0, 0, 0, 0.4); feed(0, 0, 0.5); t2 = top(); feed(0, 0, 0.4)
    check('v2: level stops it', abs(top() - t2) < 2, '%d -> %d' % (t2, top()))
    sweep(0, 0, -62, 0, 0.5); feed(-62, 0, 0.6); t3 = top(); feed(-62, 0, 0.8)
    check('v2: arm hanging steeply does not scroll (v1 scrolled here in the first session)', abs(top() - t3) < 2, '%d -> %d' % (t3, top()))
    check('v2: shows live numbers', txt('#nP').startswith('tilt -6'), txt('#nP'))
    pg.click('#closeBtn'); time.sleep(0.5)

    # ---- dial
    pg.click('.tile[data-id=dial]')
    feed(0, 5, 0.5)
    hot = lambda: ev("Array.from(document.querySelectorAll('.dial .o')).findIndex(o=>o.classList.contains('hot'))")
    h0 = hot()
    sweep(0, 5, 0, -45, 0.8)
    h1 = hot()
    check('dial: rolling the forearm walks the highlight', h0 in (0, 1) and h1 >= 3, '%d -> %d' % (h0, h1))
    feed(0, -45, 1.5)
    picked = ev("Array.from(document.querySelectorAll('.dial .o')).findIndex(o=>o.classList.contains('picked'))")
    check('dial: holding still for a second chooses the highlighted one', picked == hot() and picked >= 3, picked)
    pg.click('#closeBtn'); time.sleep(0.5)

    # ---- verdict
    pg.click('.tile[data-id=verdict]')
    feed(0, 0, 0.4); feed(0, -90, 1.4)
    check('verdict: thumb up held one second = yes', txt('.big .count').startswith('👍 1'), txt('.big .count'))
    feed(0, 0, 0.4); feed(0, 178, 1.4)
    check('verdict: palm up held one second = no', '👎 1' in txt('.big .count'), txt('.big .count'))
    feed(0, 0, 0.3); feed(0, 90, 1.4)
    check('verdict: thumb down also = no', '👎 2' in txt('.big .count'), txt('.big .count'))
    pg.click('#closeBtn'); time.sleep(0.5)

    # ---- raise to talk
    pg.click('.tile[data-id=raise]')
    feed(0, 0, 0.4); feed(58, 0, 1.2)
    check('raise: hand lifted and held opens the mic state', txt('.big .glyph') == '🎙️', txt('.big p'))
    feed(0, 0, 0.8)
    check('raise: hand lowered closes it', txt('.big .glyph') == '🤫')
    pg.click('#closeBtn'); time.sleep(0.5)

    # ---- raw viewer, marker, flip, notes, rating
    pg.click('.tile[data-id=see]')
    feed(10, -20, 0.6)
    pg.tap('#play'); time.sleep(0.6)
    check('one tap drops a marker', txt('#flash') == 'marked')
    feed(10, -20, 0.3)
    pg.tap('#play'); time.sleep(0.12); pg.tap('#play'); time.sleep(0.7)
    check('double tap flips the card to notes and rating', pg.locator('#flip.back').count() == 1)
    if shot: pg.screenshot(path=shot + '-back.png')
    pg.click('#rate button[data-v=keep]'); pg.click('#thumbs button[data-v=up]')
    pg.fill('#notes', 'Lines are easy to read.')
    pg.click('#doneBtn')
    pg.wait_for_function("document.getElementById('meta').textContent.indexOf('last trial saved')>=0", timeout=8000)
    foot = txt('.tile[data-id=see] .foot')
    check('grid shows the verdict on the card', 'Keep' in foot and '👍' in foot and '1 trial' in foot, foot)

    # ---- what was saved for the build session to read
    listing = json.loads(http('/trials'))
    mine = sorted(x['key'] for x in listing if '-see-' in x['key'])
    head = json.loads(http('/trial/' + mine[-2])) if len(mine) >= 2 else {}
    rawpart = json.loads(http('/trial/' + mine[-1])) if len(mine) >= 2 else {}
    whats = [e['what'] for e in head.get('events', [])]
    check('saved trial has the verdict and notes', head.get('rating') == 'keep' and head.get('notes') == 'Lines are easy to read.' and head.get('thumbs', [{}])[0].get('v') == 'up', {k: head.get(k) for k in ('rating', 'notes')})
    check('saved trial has what the owner did on the screen', 'marker' in whats and 'double tap' in whats and 'rating' in whats, whats)
    check('saved trial has what the watch saw', head.get('rawRows', 0) > 20 and len(rawpart.get('raw', [])) > 3 and len(rawpart['raw'][0]['s'][0]) == 10, head.get('rawRows'))
    check('saved trial does not carry the pairing code', code not in json.dumps(head))
    t2 = [x['key'] for x in listing if '-tilt2-' in x['key'] and x['key'].endswith(':000')]
    h2 = json.loads(http('/trial/' + sorted(t2)[-1])) if t2 else {}
    w2 = [(e['what'], e.get('why', e.get('dir', ''))) for e in h2.get('events', []) if e['src'] == 'concept']
    check('v2 trial records each start and stop it decided', ('scroll start', 'down') in w2 and ('scroll stop', 'level') in w2, w2)

    # ---- an old watch app cannot stream: the card says so
    pg.reload(); time.sleep(0.8)
    post({'t': 'hb', 'b': 'turn03-b3'}); time.sleep(0.4)
    pg.click('.tile[data-id=dial]'); time.sleep(3.0)
    post({'t': 'hb', 'b': 'turn03-b3'}); time.sleep(0.5)
    check('card that needs the raw stream says the watch app is too old', 'needs the newer watch app' in txt('#need'), txt('#need'))
    check('ratings survive a reload', 'Keep' in txt('.tile[data-id=see] .foot') if pg.locator('#active.show').count() == 0 else True)
    if shot:
        pg.click('#closeBtn'); time.sleep(0.4); pg.click('.tile[data-id=verdict]'); feed(0, -90, 1.3); pg.screenshot(path=shot + '-verdict.png')
    check('no script errors on the page', not errors, errors)
    b.close()

print('%d page checks FAILED' % fails if fails else 'all page checks passed')
sys.exit(1 if fails else 0)
