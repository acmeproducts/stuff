"""Exercise the separate gesture studio against two firmware shapes and a versioned remote library."""
import base64
import json
from urllib.parse import urlsplit, parse_qs


def check_studio(browser, url):
    from playwright.sync_api import expect
    page = browser.new_page(viewport={"width": 360, "height": 800})
    state = {"new": False}
    calls = []
    files = {}
    headers = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
               "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"}

    def respond(route, data, status=200):
        route.fulfill(status=status, headers=headers, content_type="application/json", body=json.dumps(data))

    def robot(route):
        req = route.request
        path = urlsplit(req.url).path
        if req.method == "OPTIONS":
            return respond(route, {})
        if path == "/auth":
            return respond(route, {"ok": True, "required": True, "provisioning": False, "wifi_configured": True})
        assert req.headers.get("authorization") == "Bearer robot-secret"
        if path == "/health":
            return respond(route, {"ok": True, "version": "upstream-main" if state["new"] else "v0.2.0"})
        if path == "/settings":
            return respond(route, {"ok": True, "servo_mins": [60]*5, "servo_maxs": [120]*5})
        if path == "/anim" and req.method == "GET":
            return respond(route, {"ok":True,"animation":"none"})
        if path == "/play" and req.method == "GET":
            return respond(route, {"ok": False,"error":"method not allowed" if state["new"] else "not found"},405 if state["new"] else 404)
        calls.append((path,req.url))
        if path == "/anim":
            return respond(route, {"ok": True, "animation": parse_qs(urlsplit(req.url).query)["name"][0]})
        if path == "/test/servo":
            if state["new"] and not req.post_data:
                return respond(route, {"ok":False, "error":"invalid index"},400)
            return respond(route, {"ok":True, "test":"servo", "index":0, "angle":90})
        if path.startswith("/play/"):
            assert req.post_data_buffer[:4] == b"RIFF" and req.post_data_buffer[8:12] == b"WAVE"
            return respond(route, {"ok":True,"played_ms":500})
        return respond(route, {"ok":True,"test":path.split("/")[-1]})

    def github(route):
        req = route.request
        path = urlsplit(req.url).path
        if req.method == "OPTIONS":
            return respond(route, {})
        name = path.rsplit("/",1)[-1]
        if name == "gestures":
            return respond(route, [{"name": k,"sha": v["sha"],"type":"file"} for k,v in files.items()])
        if req.method == "PUT":
            body = req.post_data_json
            assert req.headers.get("authorization") == "Bearer writer-secret"
            assert body["branch"] == "tiny-engineer-gesture-library" and "robot-secret" not in str(body)
            if name in files and body.get("sha") != files[name]["sha"]:
                return respond(route,{"message":"Conflict"},409)
            files[name] = {"sha": str(len(files)+1).zfill(40), "content": body["content"], "type":"file"}
            if state.pop("drop_reply",False):
                route.abort("connectionreset")
                return
            return respond(route, {"content":files[name]},201)
        return respond(route, files.get(name,{}),200 if name in files else 404)

    page.route("http://*.local/**",robot)
    page.route("https://api.github.com/repos/acmeproducts/stuff/contents/tiny-engineer/gestures**",github)
    page.goto(url)
    assert page.get_by_role("heading", name="Gesture studio", exact=True).is_visible(), "Separate gesture studio missing"
    page.locator("#connect").click()
    page.locator("#robotToken").fill("robot-secret")
    page.locator("#connect").click()
    expect(page.locator("#runTest")).to_be_enabled()
    page.select_option("#stock","ring")
    page.locator("#runTest").click()
    expect(page.locator("#feedback")).to_contain_text("accepted")
    assert calls[-1][1].endswith("name=ring")
    assert page.locator('#stock option[value="waiting"]').is_disabled()
    assert page.locator("#stock option").count() == 19
    for key in ["none","reading","typing","thinking","welcome","wakeup","sleep","attention","error","abort","dead","test-audio","test-bell","test-movement","test-screen","test-led"]:
        page.select_option("#stock", key)
        page.locator("#runTest").click()
        expect(page.locator("#feedback")).to_contain_text(page.locator("#stockName").inner_text()+" · accepted")
        assert calls[-1][0] == ("/anim" if not key.startswith("test-") else "/test/"+("audio/bell" if key=="test-bell" else key[5:]))
    page.locator("#libraryTab").click()
    page.locator("#name").fill("Gentle nod")
    page.select_option("#kind","joint")
    page.locator("#add").click()
    page.select_option("#kind","sound")
    page.locator("#add").click()
    page.locator("#preview").click()
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('2/2')")
    assert [x[0] for x in calls[-2:]] == ["/test/servo","/test/audio/bell"]
    page.evaluate("window.open=(href)=>{window.targetEditor=href;return null}")
    page.locator("#saveWeb").click()
    expect(page.locator("#handoff")).to_be_visible()
    parameters = urlsplit(page.evaluate("window.targetEditor"))
    assert parameters.netloc == "github.com" and parameters.path.endswith("/new/tiny-engineer-gesture-library/tiny-engineer/gestures")
    assert json.loads(parse_qs(parameters.query)["value"][0])["name"] == "Gentle nod"
    assert page.locator("#serialized").input_value().startswith("{")
    page.locator("#publishOptions").evaluate("(n)=>n.open=true")
    page.locator("#ghToken").fill("writer-secret")
    page.locator("#saveDirect").click()
    expect(page.locator("#libStatus")).to_contain_text("Saved to GitHub")
    filename = next(iter(files))
    assert json.loads(base64.b64decode(files[filename]["content"]))["name"] == "Gentle nod"
    assert "secret" not in page.evaluate("JSON.stringify(localStorage)+JSON.stringify(sessionStorage)")
    page.reload()
    page.locator("#libraryTab").click()
    page.locator("#saved").select_option(filename)
    page.locator("#load").click()
    expect(page.locator("#name")).to_have_value("Gentle nod")
    page.locator("#contextTab").click()
    page.locator("#connect").click()
    page.locator("#robotToken").fill("robot-secret")
    state["new"] = True
    page.locator("#connect").click()
    page.locator("#arm").click()
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('Reading')")
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('Daydream')")
    page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false}); document.dispatchEvent(new Event('visibilitychange'))")
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('Reading')")
    assert [x[1].split('name=')[-1] for x in calls[-3:]] == ["reading","thinking","reading"]
    page.locator("#disarm").click()
    page.locator("#libraryTab").click()
    page.locator("#new").click()
    page.locator("#name").fill("Chime")
    page.select_option("#kind","chime")
    page.locator("#add").click()
    page.locator("#preview").click()
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('Chime') && document.querySelector('#feedback').textContent.includes('1/1')")
    assert any(x[0].startswith("/play/") for x in calls)
    page.locator("#contextTab").click()
    page.locator("#readerOptions").evaluate("(n)=>n.open=true")
    page.locator("#articleText").fill("A real article to read")
    page.locator("#useText").click()
    expect(page.locator("#article")).to_have_text("A real article to read")
    page.locator("#testTab").click()
    for key in ("waiting","talking"):
        page.select_option("#stock", key)
        page.locator("#runTest").click()
        expect(page.locator("#feedback")).to_contain_text(page.locator("#stockName").inner_text()+" · accepted")
    page.locator("#libraryTab").click()
    page.locator("#saved").select_option(filename)
    page.locator("#load").click()
    expect(page.locator("#name")).to_have_value("Gentle nod")
    files[filename]["sha"]="f"*40
    files[filename]["content"]=base64.b64encode(json.dumps({"version":1,"name":"Another edit","steps":[{"kind":"pose","value":"reading"}]}).encode()).decode()
    page.locator("#publishOptions").evaluate("(n)=>n.open=true")
    page.locator("#ghToken").fill("writer-secret")
    page.locator("#saveDirect").click()
    expect(page.locator("#libStatus")).to_contain_text("draft is preserved")
    page.locator("#new").click()
    page.locator("#name").fill("Slow connection")
    page.select_option("#kind","pose")
    page.locator("#add").click()
    prior = len(files)
    state["drop_reply"]=True
    page.locator("#saveDirect").click()
    expect(page.locator("#libStatus")).to_contain_text("Saved to GitHub",timeout=5000)
    assert len(files)==prior+1
    for width in (360,800,1366):
        page.set_viewport_size({"width":width,"height":830})
        for tab in ("testTab","libraryTab","contextTab"):
            page.locator("#"+tab).click()
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
    page.close()
    print("PASS: separate studio, both robot versions, actuator and audio sequences, GitHub save/reload, reader transitions, custom WAV and responsive views")
