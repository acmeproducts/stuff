from pathlib import Path
import json, sys, os, subprocess, threading
from http.server import BaseHTTPRequestHandler, SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
from test_mobile import check_mobile
from test_studio import check_studio
from test_vocabulary import check_vocabulary
from urllib.parse import urljoin

source=Path(sys.argv[1]).resolve()
assert source.is_file(), "Missing single-file setup guide"
events = []
class Device(BaseHTTPRequestHandler):
    def do_POST(self):
        events.append((self.path,self.headers.get("Authorization"),self.headers.get("Content-Length")))
        self.send_response(200 if self.headers.get("Authorization") == "Bearer demo-token" else 401)
        self.end_headers()
    def log_message(self,*args): pass
web=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(source.parent)))
device=ThreadingHTTPServer(("127.0.0.1",0),Device)
for server in [web,device]:
    threading.Thread(target=server.serve_forever,daemon=True).start()
url=os.environ.get("GUIDE_URL",f"http://127.0.0.1:{web.server_port}/{source.name}")
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN"),args=["--no-sandbox"])
    check_vocabulary(browser, urljoin(url, "studio.html"))
    check_studio(browser, urljoin(url, "studio.html"))
    check_mobile(browser, url)
    for w,h in [(360,800),(800,1280),(1366,850)]:
        page=browser.new_page(viewport={"width":w,"height":h})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto(url)
        assert page.get_by_role("heading", name="Setup overview").is_visible(), "Missing six-step wizard"
        assert page.locator("#stepList button").count() == 6
        page.get_by_role("button", name="Start setup").click()
        page.select_option("#wizardSlot", "4")
        page.locator("#nextStep").click()
        assert "tiny-05" in page.locator("#wifiName").inner_text()
        assert page.get_by_role("link", name="Open Wi-Fi setup", exact=True).get_attribute("href") == "http://192.168.4.1/config"
        page.reload()
        assert page.locator("#wifiName").is_visible()
        page.locator("#nextStep").click()
        page.select_option("#controller", "mobile")
        page.fill("#wizardAddress", "https://example.org/")
        page.locator("#nextStep").click()
        assert page.locator("#addressError").is_visible()
        page.fill("#wizardAddress", "192.168.13.42")
        page.locator("#nextStep").click()
        page.locator("#androidBacklog summary").click()
        assert page.get_by_role("link", name="Android companion backlog").get_attribute("href").endswith("/issues/1033")
        for integration in ["manual", "claude", "codex"]:
            page.select_option("#integration", integration)
            page.locator("#nextStep").click()
            assert page.locator("#map-" + integration).is_visible()
            if integration == "codex":
                page.select_option("#onPrompt", "thinking")
                page.select_option("#onFinish", "typing")
                assert page.locator("#install").is_visible()
            page.locator("#nextStep").click()
            assert page.locator("#testAnimations").get_attribute("href") == "http://192.168.13.42/animations"
            if integration == "codex":
                assert "Thinking" in page.locator("#reactionTest").inner_text()
                assert "Typing" in page.locator("#reactionTest").inner_text()
            page.get_by_role("button", name="No response").click()
            assert page.locator("#testTrouble").is_visible()
            page.get_by_role("button", name="It worked").click()
            assert "confirmed" in page.locator("#testResult").inner_text().lower()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.locator("#backStep").click()
            page.locator("#backStep").click()
        page.locator("#overviewButton").click()
        assert page.get_by_role("heading", name="Setup overview").is_visible()
        page.get_by_role("button",name="My robots",exact=True).click()
        page.select_option("#slot","4")
        page.fill("#address","192.168.13.42")
        page.get_by_role("button",name="Save address").click()
        assert page.locator("#animations").get_attribute("href")=="http://192.168.13.42/animations"
        page.fill("#address","https://example.com/?" )
        page.get_by_role("button",name="Save address").click()
        assert page.locator("#robotStatus").inner_text()
        page.reload()
        page.get_by_role("button",name="My robots",exact=True).click()
        assert page.locator("#slot").input_value()=="4"
        assert page.locator("#address").input_value()=="192.168.13.42"
        page.get_by_role("button",name="Coding apps",exact=True).click()
        page.get_by_role("button",name="Codex",exact=True).click()
        assert '192.168.13.42' in page.locator("#codexTarget").inner_text()
        assert page.locator("#codexTarget").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors,errors
        page.close()
    page=browser.new_page()
    page.goto(url)
    page.get_by_role("button",name="Coding apps",exact=True).click()
    page.get_by_role("button",name="Codex",exact=True).click()
    page.evaluate("""async () => {
      window.showDirectoryPicker=async()=>navigator.storage.getDirectory();
      window.root=await window.showDirectoryPicker();
      window.folder=await root.getDirectoryHandle('.codex',{create:true});
      window.file=await folder.getFileHandle('hooks.json',{create:true});
      window.setFile=async text=>{const out=await file.createWritable();await out.write(text);await out.close()};
      window.original={description:'Keep',hooks:{Stop:[{hooks:[{type:'command', command:'echo keep'}]}]}};
      await setFile(JSON.stringify(original));
    }""")
    def install(expect):
        page.locator("#install").click()
        page.wait_for_function("v=>document.getElementById('codexStatus').textContent.includes(v)",arg=expect)
    install("Installed in")
    install("already point")
    page.select_option("#agentSlot","4")
    install("Installed in")
    cfg=page.evaluate("async()=>JSON.parse(await (await file.getFile()).text())")
    assert cfg["description"]=="Keep" and cfg["hooks"]["Stop"][0]["hooks"][0]["command"]=="echo keep"
    assert len(cfg["hooks"]["Stop"])==2 and len(cfg["hooks"]["UserPromptSubmit"])==1
    for event,pose in [("UserPromptSubmit","reading"),("Stop","ring")]:
        command=cfg["hooks"][event][-1]["hooks"][0]["command"]
        assert "tiny-05.local" in command
        command=command.replace("tiny-05.local",f"127.0.0.1:{device.server_port}")
        env=dict(os.environ,TINY_ENGINEER_DESK_05_TOKEN="demo-token")
        subprocess.run(command,shell=True,check=True,timeout=8,env=env)
        assert events[-1][0]=="/anim?name="+pose and events[-1][1]=="Bearer demo-token" and events[-1][2]=="0"
        env.pop("TINY_ENGINEER_DESK_05_TOKEN")
        resp=subprocess.run(command,shell=True,timeout=8,env=env,capture_output=True,text=True)
        assert resp.returncode and "401" in resp.stderr
    page.get_by_role("button", name="Setup wizard").click()
    page.locator('[data-step="4"]').click()
    page.select_option("#integration", "codex")
    page.locator("#nextStep").click()
    page.select_option("#onPrompt", "thinking")
    page.select_option("#onFinish", "welcome")
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async s=>{window.copied=s}},configurable:true})")
    page.locator("#copyCodex").click()
    page.wait_for_function("typeof window.copied === 'string'")
    assert "Thinking" in page.evaluate("window.copied") and "Welcome" in page.evaluate("window.copied")
    install("Installed in")
    install("already point")
    custom=page.evaluate("async()=>JSON.parse(await (await file.getFile()).text())")
    assert len(custom["hooks"]["Stop"])==2 and len(custom["hooks"]["UserPromptSubmit"])==1
    assert custom["hooks"]["Stop"][0]["hooks"][0]["command"]=="echo keep"
    for event, pose in [("UserPromptSubmit","thinking"),("Stop","welcome")]:
        handler=custom["hooks"][event][-1]["hooks"][0]
        command=handler["command"].replace("tiny-05.local",f"127.0.0.1:{device.server_port}")
        subprocess.run(command,shell=True,env=dict(os.environ,TINY_ENGINEER_DESK_05_TOKEN="demo-token"),check=True,timeout=8)
        assert events[-1][0] == "/anim?name=" + pose
    awaitable="async()=>await (await file.getFile()).text()"
    page.evaluate("()=>setFile('broken JSON')")
    install("could not be parsed")
    assert page.evaluate(awaitable)=="broken JSON"
    page.evaluate("()=>setFile('false')")
    install("unexpected structure")
    assert page.evaluate(awaitable)=="false"
    page.reload()
    assert page.locator("#onPrompt").input_value()=="thinking"
    page.get_by_role("button", name="My robots", exact=True).click()
    page.select_option("#slot","0")
    page.get_by_role("button", name="Setup wizard").click()
    assert page.locator("#onPrompt").input_value()=="reading"
    assert page.locator("#onFinish").input_value()=="ring"
    page.get_by_role("button", name="Coding apps",exact=True).click()
    page.get_by_role("button", name="Codex",exact=True).click()
    assert page.locator("#install").is_visible()
    print("PASS: folder installer, unrelated hooks preserved, repeat install, retarget, invalid files preserved, both event commands, authenticated requests and 401 reporting")
    browser.close()
for server in [device,web]: server.shutdown()
print("PASS: six-step overview, three working branches, Android backlog link, editable Codex gestures, unit isolation, tablet handoff controls, and three screen widths")
