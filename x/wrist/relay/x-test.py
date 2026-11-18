"""Lab check for X (release X1): the nine steps driven by spoken sentences, in a phone-sized Chrome and once at desktop size.
The model, GitHub and the browser's listening and speaking are stood in for here, in the test only: the page itself has no
test path. Usage: python3 x-test.py <base-url> [screenshot-prefix]"""
import base64, json, sys, time, urllib.request
from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787').rstrip('/')
shot = sys.argv[2] if len(sys.argv) > 2 else None
fails = 0

def check(name, ok, extra=''):
    global fails
    if not ok: fails += 1
    print(('PASS ' if ok else 'FAIL ') + name + ((' · ' + str(extra)) if extra != '' else ''), flush=True)

STUBS = """
window.__said=[];window.__ttsDelay=30;
const synth={_cur:null,speak(u){if(u.volume===0||!String(u.text).trim()){setTimeout(()=>u.onend&&u.onend({}),5);return}
  window.__said.push(u.text);this._cur=u;setTimeout(()=>{if(this._cur===u&&u.onend)u.onend({})},window.__ttsDelay)},cancel(){this._cur=null},getVoices(){return[]}};
Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
window.SpeechSynthesisUtterance=function(t){this.text=t;this.volume=1};
class SR{constructor(){window.__sr=this}start(){setTimeout(()=>this.onstart&&this.onstart({}),5)}stop(){setTimeout(()=>this.onend&&this.onend({}),5)}}
window.SpeechRecognition=SR;window.webkitSpeechRecognition=SR;
window.__hear=(t)=>{const r=[{transcript:t}];r.isFinal=true;window.__sr.onresult({resultIndex:0,results:[r]})};
"""

calls = []          # every real model call: ('read' or 'run', what was sent)
via = []            # which service answered it
down = {'venice': False, 'openrouter': False, 'anthropic': False}
repo = {'sha': 0, 'content': None, 'puts': 0}
MODELS = {'venice': ['venice-large', 'venice-small'], 'openrouter': ['or/alpha', 'or/beta'], 'anthropic': ['claude-haiku-test', 'claude-sonnet-test']}

def answer(sysm, user):
    if 'reading, gathering and composing' in sysm:
        said = json.loads(user)['said'].lower()
        calls.append(('read', user))
        if 'what do you know' in said: return {'kind': 'list'}
        if 'call it' in said: return {'kind': 'rename', 'target': 'weather traffic', 'to': 'morning'}
        if 'forget' in said: return {'kind': 'forget', 'target': 'gold'}
        if 'shorter' in said: return {'kind': 'change', 'reading': 'shorter', 'name': 'weather traffic', 'ask': 'Weather today and traffic to Irvine, in one sentence', 'parts': ['Seventy, clear, twenty two minutes to Irvine.'], 'card': '70 clear · 22 min'}
        if 'gold' in said: return {'kind': 'answer', 'reading': 'gold in the Central Valley', 'name': 'gold', 'ask': 'Natural occurrence of gold in the Central Valley', 'parts': ['Placer gold washed down from the Sierra.'], 'card': 'Placer gold along the east side rivers.', 'sources': [{'title': 'USGS', 'url': 'https://www.usgs.gov/x'}]}
        return {'kind': 'answer', 'reading': 'weather and traffic to Irvine', 'name': 'weather traffic', 'ask': 'Weather today and traffic to Irvine', 'parts': ['Seventy and clear.[REF]0[/REF] Traffic to Irvine is light, twenty two minutes. [1]', 'Rain is likely on Friday.'], 'card': '70°F clear · Irvine 22 min · rain Friday'}
    calls.append(('run', user))
    if 'Go on from there' in user: return {'kind': 'answer', 'parts': ['The weekend looks dry.'], 'card': '70°F clear · weekend dry'}
    return {'kind': 'answer', 'parts': ['Fresh today: sixty eight and sunny, twenty minutes to Irvine.'], 'card': '68°F sunny · 20 min'}

def model(route):
    rq, u = route.request, route.request.url
    who = 'venice' if 'venice.ai' in u else 'openrouter' if 'openrouter.ai' in u else 'anthropic'
    ok = lambda o, s=200: route.fulfill(status=s, content_type='application/json', body=json.dumps(o))
    if u.endswith('/auth/key'): return ok({'data': {'label': 'test'}})
    if '/models' in u: return ok({'data': [{'id': m} for m in MODELS[who]]})
    body = json.loads(rq.post_data or '{}')
    if body.get('max_tokens') == 1:      # the key-and-model test
        bad = 'bad' in (rq.headers.get('authorization', '') + rq.headers.get('x-api-key', ''))
        return ok({'error': {'message': 'bad key'}}, 401) if bad else ok({'choices': [{'message': {'content': 'p'}}], 'content': [{'type': 'text', 'text': 'p'}]})
    if down[who]: return ok({'error': {'message': 'Overloaded'}}, 529)
    if who == 'anthropic':
        o = answer(body.get('system', ''), body['messages'][0]['content']); via.append(who)
        return ok({'content': [{'type': 'server_tool_use', 'name': 'web_search'}, {'type': 'text', 'text': json.dumps(o), 'citations': [{'type': 'web_search_result_location', 'url': 'https://www.weather.gov/sgx/', 'title': 'National Weather Service'}]}]})
    o = answer(body['messages'][0]['content'], body['messages'][1]['content']); via.append(who)
    web = body.get('venice_parameters', {}).get('enable_web_search') if who == 'venice' else body.get('plugins')
    ok({'choices': [{'message': {'content': json.dumps(o), 'citations': [{'url': 'https://www.weather.gov/sgx/', 'title': 'National Weather Service'}] if web else []}}]})

def github(route):
    rq, u = route.request, route.request.url
    ok = lambda o, s=200: route.fulfill(status=s, content_type='application/json', body=json.dumps(o))
    if u.endswith('/user'): return ok({'login': 'acme'})
    if u.endswith('/repos/acme/x-memory'): return ok({'private': True, 'full_name': 'acme/x-memory'})
    if '/contents/x-memory.json' in u:
        if rq.method == 'GET':
            return ok({'message': 'Not Found'}, 404) if repo['content'] is None else ok({'sha': 's%d' % repo['sha'], 'size': len(repo['content']), 'content': repo['content']})
        d = json.loads(rq.post_data)
        if repo['content'] is not None and d.get('sha') != 's%d' % repo['sha']: return ok({'message': 'sha mismatch'}, 409)
        repo['sha'] += 1; repo['content'] = d['content']; repo['puts'] += 1
        return ok({'content': {'sha': 's%d' % repo['sha']}}, 200)
    ok({'message': 'Not Found'}, 404)

def remote_events():
    return json.loads(base64.b64decode(repo['content']).decode())['events'] if repo['content'] else []

def http(path, body=None):
    req = urllib.request.Request(base + path, data=None if body is None else body.encode(), method='GET' if body is None else 'POST')
    return urllib.request.urlopen(req, timeout=10).read().decode()

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-fake-ui-for-media-stream'])

    def device(w=412, h=915, mobile=True):
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, has_touch=mobile, is_mobile=mobile)
        ctx.add_init_script(STUBS)
        ctx.route('https://api.anthropic.com/**', model)
        ctx.route('https://api.venice.ai/**', model)
        ctx.route('https://openrouter.ai/**', model)
        ctx.route('https://api.github.com/**', github)
        p = ctx.new_page()
        PAGES.append(p)
        p.errors = []
        p.on('pageerror', lambda e: p.errors.append(str(e)))
        return p

    def setup(p, gh=True, keys=('venice',), pick=None):
        for k in keys:
            p.fill('#k_' + k, 'key-' + k); p.locator('#k_' + k).blur(); p.wait_for_timeout(350)       # a pasted key loads its models by itself
        for k, m in (pick or {}).items(): p.select_option('#m_' + k, m)
        if gh: p.fill('#fGh', 'ghp_test'); p.fill('#fRepo', 'acme/x-memory')
        p.click('#setTest'); p.wait_for_selector('#begin.show', timeout=8000)

    PAGES = []
    def PAUSE(ms):
        (PAGES[-1] if PAGES else None).wait_for_timeout(ms)
    said = lambda p: p.evaluate('() => window.__said.slice()')
    def hear(p, t, wait=0.9):
        p.evaluate('(t) => window.__hear(t)', t); p.wait_for_timeout(int(wait * 1000))
    last = lambda p: (said(p) or [''])[-1]

    pg = device()
    pg.goto(base + '/x')
    check('first visit opens setup, not a wall of tiles', pg.locator('#setup.show').count() == 1 and pg.locator('#begin.show').count() == 0)
    check('Venice is the default service on a fresh device', pg.input_value('#fActive') == 'venice')
    pg.fill('#k_venice', 'key-venice'); pg.locator('#k_venice').blur(); pg.wait_for_timeout(400)
    check('a pasted key loads that service\'s models by itself', pg.locator('#m_venice option').count() == 2 and 'models' in pg.inner_text('#st_venice'), pg.inner_text('#st_venice'))
    setup(pg, keys=('venice', 'anthropic'), pick={'venice': 'venice-small'})
    saved = pg.evaluate("() => JSON.parse(localStorage.getItem('x_cfg'))")
    check('setup: each service keeps its own key and model, Venice is the default, memory repository found', saved['active'] == 'venice' and saved['venice']['model'] == 'venice-small' and saved['venice']['ok'] and saved['anthropic']['model'] == 'claude-haiku-test' and saved['anthropic']['ok'] and not saved['openrouter']['ok'] and 'Venice.ai is the default, then Anthropic' in pg.inner_text('#beginNote') and 'repository found' in pg.inner_text('#beginNote') and pg.locator('#setup.show').count() == 0, pg.inner_text('#beginNote'))
    pg.click('#beginBtn'); PAUSE(800)
    check('after the opening touch X is listening and says it is ready', 'Ready' in last(pg) and pg.inner_text('#stateText') == 'Listening', (last(pg), pg.inner_text('#stateText')))
    check('the opening touch is not counted', pg.inner_text('#meter') == 'no touches', pg.inner_text('#meter'))

    # ---- gate 1: ask something new
    n0 = len(calls)
    hear(pg, "What's the weather and how is traffic to Irvine?")
    check('an unknown ask makes one model call, to the default service', len(calls) == n0 + 1 and calls[-1][0] == 'read' and via[-1] == 'venice', (len(calls) - n0, via[-1:]))
    check('X says its reading, then the answer, without the citation marks a service puts in the text', last(pg) == 'weather and traffic to Irvine. Seventy and clear. Traffic to Irvine is light, twenty two minutes.', last(pg))
    check('one card is in front, with its sources', 'Irvine 22 min' in pg.inner_text('#text') and pg.locator('#sources a').count() >= 1 and pg.inner_text('#reading') == 'weather and traffic to Irvine', pg.inner_text('#text'))
    if shot: pg.screenshot(path=shot + '-answer.png')

    # ---- gate 3: the five commands, in the owner's own words, with no model
    n1 = len(calls)
    hear(pg, 'go on')
    check('more: the next part is spoken', last(pg) == 'Rain is likely on Friday.', last(pg))
    hear(pg, 'Say that again.')
    check('again: the same part once more', said(pg)[-2:] == ['Rain is likely on Friday.', 'Rain is likely on Friday.'], said(pg)[-2:])
    hear(pg, 'Keep it')
    check('yes: kept as a word X names, and X says the name', last(pg) == 'Kept as weather traffic.', last(pg))
    check('the five commands made no model call', len(calls) == n1, len(calls) - n1)
    hear(pg, 'keep going')
    check('more with nothing left: X goes further by itself', calls[-1][0] == 'run' and 'Go on from there' in calls[-1][1] and last(pg) == 'The weekend looks dry.', last(pg))
    hear(pg, "that's enough")
    check('enough: nothing is in front', pg.inner_text('#text') == '' and pg.inner_text('#reading') == '')
    PAUSE(4600)
    ev = remote_events()
    check('the kept word is saved to GitHub as an event', any(e['type'] == 'word.keep' and e['p']['name'] == 'weather traffic' for e in ev) and all(k in ev[0] for k in ('id', 'dev', 'ts')), [e['type'] for e in ev])

    # ---- gate 2: the next day the word answers with no reading step
    pg.reload(); pg.wait_for_selector('#begin.show'); pg.click('#beginBtn'); PAUSE(800)
    n2 = len(calls)
    hear(pg, 'weather traffic')
    check('a known word skips the reading: the stored request is run', len(calls) == n2 + 1 and calls[-1] == ('run', 'Weather today and traffic to Irvine'), calls[-1])
    check('X says no reading for a known word', last(pg) == 'Fresh today: sixty eight and sunny, twenty minutes to Irvine.', last(pg))
    check('the card shows the word it came from', pg.inner_text('#reading') == 'weather traffic')
    hear(pg, 'yes')
    check('yes on a kept word says it is already kept', 'already kept as weather traffic' in last(pg), last(pg))

    # ---- change, rename, list, forget, all by talking
    hear(pg, 'make it shorter')
    check('saying how it should differ changes the word', last(pg).startswith('Changed.') and 'Seventy, clear' in last(pg), last(pg))
    hear(pg, 'call it morning')
    check('rename by talking', last(pg) == 'It is now called morning.', last(pg))
    hear(pg, 'show me morning please')
    check('the renamed word runs its changed request', calls[-1] == ('run', 'Weather today and traffic to Irvine, in one sentence'), calls[-1])
    hear(pg, 'what do you know?')
    check('X lists what it knows', last(pg) == 'I know 1 word: morning.' and 'morning' in pg.inner_text('#text'), last(pg))
    hear(pg, 'Look into gold in the Central Valley'); hear(pg, 'yes');
    check('a second word is kept', last(pg) == 'Kept as gold.', last(pg))
    hear(pg, 'no')
    check('no straight after a keep undoes it', last(pg) == 'Dropped gold.', last(pg))
    hear(pg, 'no')
    check('no again drops what is in front', last(pg) == 'Dropped.' and pg.inner_text('#text') == '', last(pg))

    # ---- gate 4: X speaks in parts and does not hear itself
    pg.evaluate('() => { window.__ttsDelay = 900 }')
    hear(pg, 'morning', wait=0.5)
    front_before = pg.inner_text('#text')
    hear(pg, 'enough', wait=0.2)
    check('while X is speaking the microphone is shut (turn gate)', pg.inner_text('#text') == front_before and front_before != '', front_before)
    PAUSE(1300)
    hear(pg, 'enough')
    check('once X has finished, enough is heard', pg.inner_text('#text') == '')
    pg.evaluate('() => { window.__ttsDelay = 30 }')

    # ---- gate 5: the model failing is X's problem, said plainly
    down['venice'] = True
    nv = len(via)
    hear(pg, 'how is the weather and traffic')
    check('when the default service fails, the next one that is set up answers', len(via) == nv + 1 and via[-1] == 'anthropic' and 'Seventy and clear' in last(pg), (via[nv:], last(pg)))
    down['anthropic'] = True
    hear(pg, 'how tall is Mount Whitney')
    check('when every service fails X says so and shows why, naming each', 'did not answer' in last(pg) and 'Venice.ai: Overloaded' in pg.inner_text('#text') and 'Anthropic: Overloaded' in pg.inner_text('#text'), pg.inner_text('#text'))
    down['venice'] = down['anthropic'] = False
    hear(pg, 'enough')
    all_said = ' '.join(said(pg)).lower()
    check('X never asks the owner to repeat or rephrase', not any(k in all_said for k in ('repeat', 'rephrase', 'say that again', "didn't catch", 'did not understand', 'pardon')), '')

    # ---- gate 6: hand time, the session record, the watch put to sleep
    code = '616161'
    pg.evaluate("(c) => localStorage.setItem('wrist_code', c)", code)
    pg.reload(); pg.wait_for_selector('#begin.show'); pg.click('#beginBtn'); PAUSE(1000)
    http('/e/' + code, json.dumps({'t': 'hb', 'b': 'turn07-test', 'up': 5}))
    PAUSE(500)
    check('the watch shows as present', pg.locator('#sWatch.on').count() == 1)
    hear(pg, 'morning')
    hear(pg, "I'm done", wait=0.8)
    check('saying you are done ends the session with minutes and touches', 'no touches' in last(pg) and last(pg).startswith('Done. 1 minute'), last(pg))
    r = json.loads(http('/e/' + code, json.dumps({'t': 'hb', 'b': 'turn07-test', 'up': 9})))
    check('ending X tells the watch to sleep', r.get('sleep') == 1, r)
    check('Begin is offered again and says where the memory is', pg.locator('#begin.show').count() == 1 and 'Last session' in pg.inner_text('#beginNote'), pg.inner_text('#beginNote'))
    PAUSE(600)
    ses = [e for e in pg.evaluate("() => JSON.parse(localStorage.getItem('x_events'))") if e['type'] == 'session']
    check('the session is in the journal: minutes, touches, exchanges', ses and ses[-1]['p']['touches'] == 0 and ses[-1]['p']['exchanges'] >= 1 and 'minutes' in ses[-1]['p'], ses[-1]['p'] if ses else '')
    pg.click('#beginBtn'); PAUSE(800)
    pg.tap('#front'); PAUSE(300)
    check('a touch during a session is counted and shown', pg.inner_text('#meter') == '1 touch', pg.inner_text('#meter'))
    hear(pg, "that's all", wait=0.8)
    check('and reported at the end', 'one touch' in last(pg), last(pg))

    # ---- step 7 of the build: the log holds what happened, never what was said
    PAUSE(500)
    lines = [l for l in http('/log').split('\n') if ' X {' in l]
    mine = ' '.join(lines[-80:]).lower()
    check('X wrote what happened to the log', '"ev":"turn"' in mine and '"path":"word"' in mine and '"ev":"end"' in mine, len(lines))
    check('the log holds none of the words spoken', not any(k in mine for k in ('irvine', 'weather', 'gold', 'whitney', 'morning')), '')

    # ---- memory: a word kept in one browser is known in a second one
    PAUSE(4500)
    p2 = device()
    p2.goto(base + '/x'); setup(p2)
    s2 = p2.evaluate("() => JSON.parse(localStorage.getItem('x_cfg'))")
    check('a second browser learns the words from GitHub at setup', '1 words known' in p2.inner_text('#beginNote'), p2.inner_text('#beginNote'))
    check('and takes the model chosen on the first device from memory; keys never travel', s2['venice']['model'] == 'venice-small' and 'key-venice' not in json.dumps(remote_events()) and any(e['type'] == 'cfg.ai' for e in remote_events()), s2['venice'])
    p2.click('#beginBtn'); PAUSE(800)
    n3 = len(calls)
    hear(p2, 'morning')
    check('and uses the word with no reading step', len(calls) == n3 + 1 and calls[-1][0] == 'run', calls[-1][0])
    check('no script errors on the phone-sized page', not pg.errors and not p2.errors, pg.errors + p2.errors)

    # ---- the switch: which service is the default
    p2.tap('#setupBtn'); p2.wait_for_selector('#setup.show')
    p2.fill('#k_anthropic', 'key-anthropic'); p2.locator('#k_anthropic').blur(); p2.wait_for_timeout(400)
    p2.select_option('#fActive', 'anthropic'); p2.click('#setTest'); p2.wait_for_selector('#setup', state='hidden'); p2.wait_for_selector('#begin.show')
    note = p2.inner_text('#beginNote')
    p2.click('#beginBtn'); p2.wait_for_timeout(800)
    nv = len(via)
    hear(p2, 'morning')
    check('switching the default service sends the next ask there', via[nv:] == ['anthropic'] and 'Anthropic is the default, then Venice.ai' in note, (via[nv:], note))
    p2.tap('#setupBtn'); p2.wait_for_selector('#setup.show'); p2.fill('#k_openrouter', 'bad-key'); p2.locator('#k_openrouter').blur(); p2.wait_for_timeout(400)
    p2.select_option('#fActive', 'openrouter'); p2.click('#setTest'); p2.wait_for_timeout(900)
    check('a default service whose key does not work is refused, and says so', 'the default service, OpenRouter, is not working' in p2.inner_text('#setMsg') and p2.locator('#setup.show').count() == 1, p2.inner_text('#setMsg'))

    # ---- gate 7 (lab only): the same on a desktop-sized browser
    d = device(1280, 800, mobile=False)
    d.goto(base + '/x'); setup(d)
    check('a new device with only a Venice key: Venice stands in for the usual default, and says so', 'Venice.ai is the default on this device (Anthropic, your usual default, has no key here)' in d.inner_text('#beginNote') and [e for e in remote_events() if e['type'] == 'cfg.ai'][-1]['p']['active'] == 'anthropic', d.inner_text('#beginNote'))
    d.click('#beginBtn'); PAUSE(800)
    hear(d, 'How is the weather and traffic to Irvine')
    box = d.locator('#text').bounding_box()
    check('desktop size: ask, answer, card in front, nothing off the screen', 'Seventy and clear' in last(d) and box and box['x'] >= 0 and box['x'] + box['width'] <= 1280, box)
    if shot: d.screenshot(path=shot + '-desktop.png')
    check('no script errors on the desktop-sized page', not d.errors, d.errors)
    b.close()

print('%d X checks FAILED' % fails if fails else 'all X checks passed')
sys.exit(1 if fails else 0)
