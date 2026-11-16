"""Lab check for the X practice page: drives it with relay events in a phone-sized Chrome.
Usage: python3 page-test.py <base-url> [screenshot.png]   (needs playwright + Chrome)"""
import json, sys, time, urllib.request
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787').rstrip('/')
shot = sys.argv[2] if len(sys.argv) > 2 else None
code = '424242'
fails = 0

def check(name, ok, extra=''):
    global fails
    if not ok: fails += 1
    print(('PASS ' if ok else 'FAIL ') + name + ((' · ' + str(extra)) if extra != '' else ''))

def post(o):
    req = urllib.request.Request(base + '/e/' + code, data=json.dumps(o).encode(), headers={'content-type': 'application/json'}, method='POST')
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2, has_touch=True, is_mobile=True)
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(base + '/')
    check('first visit asks for the watch code', pg.locator('#pair.show').count() == 1)
    pg.fill('#code', code)
    pg.wait_for_function("document.getElementById('statusText').textContent.indexOf('Waiting for the watch')===0", timeout=8000)
    check('code accepted, page linked and waiting for the watch', pg.locator('#pair.show').count() == 0)
    top = lambda: pg.evaluate("document.querySelectorAll('.scroller')[%d].scrollTop" % 0)
    name = lambda: pg.inner_text('#threadName')

    r = post({'t': 'hb', 'b': 'turn02-test'})
    check('relay sees one page', r.get('pages') == 1, r)
    pg.wait_for_function("document.getElementById('statusText').textContent.indexOf('Watch connected')===0", timeout=5000)
    check('status shows the watch connected', True, pg.inner_text('#statusText'))

    check('starts on Messages', name() == 'Messages')
    post({'t': 'swipe', 'd': 'right'}); time.sleep(0.5)
    check('swing right: next thread', name() == 'Research', name())
    post({'t': 'swipe', 'd': 'left'}); time.sleep(0.5)
    check('swing left: back again', name() == 'Messages', name())
    post({'t': 'swipe', 'd': 'left'}); time.sleep(0.5)
    check('swing left from the first thread wraps to the last', name() == 'Code', name())
    post({'t': 'swipe', 'd': 'right'}); time.sleep(0.5)

    t0 = top()
    post({'t': 'scroll', 'r': -4}); time.sleep(0.25)
    post({'t': 'scroll', 'r': -4, 'rep': 1}); time.sleep(0.25)
    t1 = top()
    check('hand lowered and held: list keeps moving down', t1 > t0 + 150, '%d -> %d' % (t0, t1))
    post({'t': 'scroll', 'r': 0}); time.sleep(0.3)
    t2 = top(); time.sleep(0.4); t3 = top()
    check('level: list stops', abs(t3 - t2) < 2, '%d -> %d' % (t2, t3))
    post({'t': 'scroll', 'r': 2}); time.sleep(0.4)
    t4 = top()
    check('hand raised: list moves up', t4 < t3 - 40, '%d -> %d' % (t3, t4))
    post({'t': 'scroll', 'r': -1}); time.sleep(0.5)
    ta = top()
    time.sleep(1.4)
    t5 = top(); time.sleep(0.4); t6 = top()
    check('tilt signal lost for 1.3 s: list was moving, then stops by itself', t5 > ta and abs(t6 - t5) < 2, '%d -> %d -> %d' % (ta, t5, t6))

    post({'t': 'tap', 'how': 'wrist', 'pk': 6.1, 'th': 3.5}); time.sleep(0.4)
    chosen = pg.evaluate("Array.from(document.querySelectorAll('.card.chosen')).map(c=>c.classList.contains('focus'))")
    check('knock chooses the centred row, and only that one', chosen == [True], chosen)
    post({'t': 'tap'}); time.sleep(0.4)
    check('second knock un-chooses it', pg.locator('.card.chosen').count() == 0)
    post({'t': 'tap'}); time.sleep(0.3)
    check('counts shown', '✓ 3' in pg.inner_text('#counts'), pg.inner_text('#counts'))
    post({'t': 'scroll', 'r': -2}); time.sleep(0.3)
    post({'t': 'mode', 'm': 'resting', 'why': 'arm down'}); time.sleep(0.4)
    tr = top(); time.sleep(0.4)
    check('watch resting: status says so and the list is stopped', pg.inner_text('#statusText').startswith('Watch resting') and abs(top() - tr) < 2, pg.inner_text('#statusText'))
    post({'t': 'mode', 'm': 'active', 'why': 'arm up'}); post({'t': 'hb', 'b': 'turn03-test'}); time.sleep(0.5)
    check('watch awake again: status shows connected', pg.inner_text('#statusText').startswith('Watch connected'), pg.inner_text('#statusText'))
    if shot: pg.screenshot(path=shot)
    check('no script errors on the page', not errors, errors)
    b.close()

print('%s' % ('%d page checks FAILED' % fails if fails else 'all page checks passed'))
sys.exit(1 if fails else 0)
