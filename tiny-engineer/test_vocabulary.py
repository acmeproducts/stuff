"""Exercise the vocabulary editor, audio capture, portable steps and their volume."""
import base64
import io
import json
import math
import struct
import wave
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect


def check_vocabulary(browser, url):
    page = browser.new_page(viewport={"width": 360, "height": 800})
    errors = []
    played = []
    shared = {}
    page.on("pageerror", lambda error: errors.append(str(error)))

    def github(route):
        name = urlsplit(route.request.url).path.rsplit("/", 1)[-1]
        if name == "gestures":
            data = [{"name": n, "sha": "a"*40, "type": "file"} for n in shared]
        elif name in shared:
            data = {"sha": "a"*40, "content": base64.b64encode(shared[name].encode()).decode()}
        else:
            route.fulfill(status=404, json={})
            return
        route.fulfill(json=data)

    def robot(route):
        path = urlsplit(route.request.url).path
        if path == "/auth":
            data = {"required": False, "provisioning": False, "version": "current"}
        elif path == "/anim":
            data = {"animation":"none"}
        elif path == "/settings":
            data = {"volume":70, "servo_mins":[60]*5, "servo_maxs":[120]*5}
        elif path == "/play":
            route.fulfill(status=405, json={"ok":False, "error":"method not allowed"})
            return
        elif path == "/play/talking":
            with wave.open(io.BytesIO(route.request.post_data_buffer)) as wav:
                assert (wav.getnchannels(),wav.getframerate(),wav.getsampwidth()) == (1,22050,2)
                samples = [x[0] for x in struct.iter_unpack("<h",wav.readframes(wav.getnframes()))]
                played.append(max(map(abs,samples)))
            data = {"played_ms":300}
        else:
            raise AssertionError(path)
        route.fulfill(json={"ok":True,**data})

    page.route("https://api.github.com/repos/acmeproducts/stuff/contents/**",github)
    page.route("http://*.local/**",robot)
    page.goto(url)
    assert page.get_by_role("button", name="Vocabulary", exact=True).is_visible(timeout=2000), "Vocabulary tab is missing"
    page.locator("#vocabTab").click()
    page.locator("#vText").fill("Hello, human.")
    page.locator("#vName").fill("Hello")
    page.locator("#vSave").click()
    expect(page.locator("#vStatus")).to_contain_text("Saved on this device")
    page.reload()
    page.locator("#vocabTab").click()
    page.locator("#vList").select_option(label="Hello")
    expect(page.locator("#vText")).to_have_value("Hello, human.")
    page.locator("#vAdd").click()
    page.locator("#libraryTab").click()
    expect(page.locator("#steps li")).to_contain_text("Hello")
    page.locator("#name").fill("Hello routine")
    page.evaluate("window.open = () => null")
    page.locator("#saveWeb").click()
    assert json.loads(page.locator("#serialized").input_value())["steps"][0]["text"] == "Hello, human."
    page.locator("#vocabTab").click()
    page.locator("#vNew").click()
    pcm=io.BytesIO()
    with wave.open(pcm,"wb") as stream:
        stream.setparams((2,2,44100,0,'NONE','not compressed'))
        for i in range(4410):
            s=int(12000*math.sin(i*.08))
            stream.writeframesraw(struct.pack("<hh",s,s))
    page.locator("#vFile").set_input_files({"name":"Soft bell.wav","mimeType":"audio/wav","buffer":pcm.getvalue()})
    expect(page.locator("#vStatus")).to_contain_text("ready")
    page.locator("#vPhone").click()
    expect(page.locator("#vStatus")).to_contain_text("preview")
    page.locator("#connect").click()
    expect(page.locator("#vRobot")).to_be_enabled()
    for value in [100,25,0]:
        page.locator("#vVolume").evaluate("(n,value)=>{n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}))}",str(value))
        page.locator("#vRobot").click()
        page.wait_for_function("document.querySelector('#vStatus').textContent.includes('Robot played')")
    assert played[0]>11000 and abs(played[1]/played[0]-.25)<.01 and played[2]==0, played
    page.locator("#vSave").click()
    expect(page.locator("#vStatus")).to_contain_text("Saved on this device")
    page.locator("#vSharing summary").click()
    page.locator("#vShare").click()
    name = page.locator("#vShareLink").get_attribute("href")
    query = parse_qs(urlsplit(name).query)
    assert "value" not in query
    file=query["filename"][0]
    assert page.locator("#vDownload").get_attribute("download") == file
    assert "/upload/tiny-engineer-gesture-library/" in page.locator("#vUploadLink").get_attribute("href")
    assert page.locator("#vDownload").evaluate("async e => (await (await fetch(e.href)).text())") == page.locator("#vShareText").input_value()
    shared[file]=page.locator("#vShareText").input_value()
    page.locator("#vRefresh").click()
    expect(page.locator("#vStatus")).to_contain_text("Verified on GitHub")
    page.reload()
    page.locator("#vocabTab").click()
    page.locator("#vList").select_option("gh:"+file)
    expect(page.locator("#vStatus")).to_contain_text("GitHub")
    expect(page.locator("#vVolume")).to_have_value("0")
    page.locator("#libraryTab").click()
    page.locator("#new").click()
    page.locator("#name").fill("Sound in a routine")
    page.locator("#kind").select_option("voice")
    page.locator("#routineVoice").select_option("gh:"+file)
    page.locator("#add").click()
    expect(page.locator("#steps")).to_contain_text("Soft bell")
    page.locator("#saveWeb").click()
    assert "value" not in parse_qs(urlsplit(page.locator("#ghEditor").get_attribute("href")).query)
    assert json.loads(page.locator("#serialized").input_value())["steps"] == json.loads(shared[file])["steps"]
    page.locator("#connect").click()
    page.locator("#preview").click()
    page.wait_for_function("queue.then(()=>true)")
    assert played == [played[0],played[1],0,0]
    page.locator("#vocabTab").click()
    # Feed a Web Audio stream to the real MediaRecorder without using a physical microphone.
    page.evaluate("""() => { navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext(); await ctx.resume(); const osc=ctx.createOscillator(), dest=ctx.createMediaStreamDestination();
      osc.connect(dest); osc.start(); window.testMic=dest.stream; window.testAudio=ctx; return dest.stream;
    }}""")
    page.locator("#vRecord").click()
    expect(page.locator("#vStatus")).to_contain_text("Recording")
    page.wait_for_timeout(500)
    page.locator("#vStopRecord").click()
    expect(page.locator("#vStatus")).to_contain_text("ready",timeout=10000)
    assert page.evaluate("testMic.getTracks().every(t=>t.readyState==='ended')")
    # Large files are read by immutable blob SHA and drafts larger than localStorage use IndexedDB.
    big="vocab-long-tone.json"
    long_step={"kind":"voice","label":"Long tone","volume":20,"pose":"none",
               "pcm":base64.b64encode(b"\x01\x00"*441000).decode()}
    doc={"version":1,"name":"Long tone","steps":[long_step]}
    shared[big]=json.dumps(doc)
    page.route("**/contents/tiny-engineer/gestures/"+big+"?**",
               lambda r:r.fulfill(json={"sha":"b"*40,"encoding":"none","content":""}))
    page.route("**/git/blobs/"+"b"*40,lambda r:r.fulfill(json=doc))
    page.locator("#vRefresh").click()
    page.locator("#vList").select_option("gh:"+big)
    expect(page.locator("#vSource")).to_contain_text("20.0 s")
    page.locator("#vAdd").click()
    page.wait_for_function("JSON.parse(localStorage.getItem('te.studio.draft'))?.audioRevision")
    page.reload()
    page.locator("#libraryTab").click()
    expect(page.locator("#steps")).to_contain_text("Long tone")
    page.locator("#vocabTab").click()
    for width in (360,800,1366):
        page.set_viewport_size({"width":width,"height":800})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert not errors, errors
    page.close()
    print("PASS: vocabulary persistence, portable phrase and audio, stereo resampling, phone preview, robot volume, GitHub sharing and microphone stop")
