"""Browser-only mobile control. The two simulated robot addresses are never scanned."""
import json


def check_mobile(browser, url):
    page = browser.new_page(viewport={"width": 360, "height": 800})
    state = {"protected": False, "pose": "none", "reject": False}
    received = []

    def robot(route):
        req = route.request
        path = req.url.split(".local", 1)[1]
        common = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization",
                  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"}
        code = 200
        if req.method == "OPTIONS":
            payload = {}
        elif path == "/auth":
            payload = {"ok": True, "required": state["protected"], "provisioning": False, "wifi_configured": True}
        elif state["protected"] and req.headers.get("authorization") != "Bearer bench-token":
            code, payload = 401, {"ok": False, "error": "unauthorized"}
        elif path == "/anim" and req.method == "GET":
            payload = {"ok": True, "animation": state["pose"]}
        elif path.startswith("/anim?name=") and req.method == "POST":
            pose = path.split("=", 1)[1]
            received.append((req.url, pose))
            if state["reject"]:
                code, payload = 409, {"ok": False, "error": "busy"}
            else:
                state["pose"] = pose
                payload = {"ok": True, "animation": pose}
        else:
            raise AssertionError((req.method, path))
        route.fulfill(status=code, content_type="application/json", headers=common, body=json.dumps(payload))

    page.route("http://*.local/**", robot)
    page.goto(url + "#mobile")
    assert page.get_by_role("heading", name="Mobile controller", exact=True).is_visible(), "Mobile-first controller missing"
    assert page.locator("#mobileConnect").is_visible()
    page.locator("#mobileConnect").click()
    page.wait_for_function("document.getElementById('mobileBell').disabled === false")
    page.locator("#mobileBell").click()
    page.wait_for_function("document.getElementById('mobileStatus').textContent.includes('accepted')")
    assert received[-1][1] == "ring"
    page.locator("#mobileEditor summary").click()
    page.fill("#commandName", "Job done")
    page.select_option("#commandFirst", "typing")
    page.select_option("#commandLast", "ring")
    page.fill("#commandDelay", "1")
    page.locator("#saveCommand").click()
    button = page.get_by_role("button", name="Job done", exact=True)
    before = len(received)
    button.click()
    page.wait_for_function("document.getElementById('mobileStatus').textContent.includes('2 of 2')")
    assert [pose for _, pose in received[before:]] == ["typing", "ring"]
    page.reload()
    assert button.is_visible() and button.is_disabled()
    page.select_option("#mobileSlot", "1")
    assert button.count() == 0
    state["protected"] = True
    page.locator("#mobileConnect").click()
    page.wait_for_selector("#mobileToken", state="visible")
    page.fill("#mobileToken", "bench-token")
    page.locator("#mobileConnect").click()
    page.wait_for_function("document.getElementById('mobileBell').disabled === false")
    assert "bench-token" not in page.evaluate("JSON.stringify(localStorage) + JSON.stringify(sessionStorage)")
    state["reject"] = True
    page.locator("#mobileBell").click()
    page.wait_for_function("document.getElementById('mobileStatus').textContent.includes('409')")
    assert "bench-token" not in page.locator("#mobileHistory").inner_text()
    state["protected"] = False
    state["reject"] = False
    page.select_option("#mobileSlot", "0")
    page.locator("#mobileConnect").click()
    page.wait_for_function("document.getElementById('mobileBell').disabled === false")
    before = len(received)
    button.click()
    page.locator("#cancelCommand").click()
    page.wait_for_timeout(1250)
    assert len(received) - before <= 1
    page.get_by_role("button", name="Edit Job done").click()
    page.fill("#commandName", "All done")
    page.select_option("#commandLast", "")
    page.locator("#saveCommand").click()
    assert page.get_by_role("button", name="All done", exact=True).is_visible()
    page.get_by_role("button", name="Edit All done").click()
    page.locator("#removeCommand").click()
    assert page.get_by_role("button", name="All done", exact=True).count() == 0
    page.locator("#mobileNetwork").fill("https://example.com")
    page.locator("#mobileConnect").click()
    assert page.locator("#mobileBell").is_disabled()
    assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
    page.close()
    print("PASS: mobile entry, connect, real request shapes, commands, two-step order, per-unit storage, auth, error handling, cancel, edit and remove")
