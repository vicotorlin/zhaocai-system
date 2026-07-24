const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get("http://localhost:3000" + path, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    }).on("error", reject);
  });
}

async function test() {
  // 1. Login as buyer1
  console.log("1. Login as buyer1@test.com...");
  const login = await new Promise((resolve) => {
    const data = JSON.stringify({ account: "buyer1@test.com", password: "123456" });
    const req = http.request({
      hostname: "localhost", port: 3000, path: "/api/login", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, (res) => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(JSON.parse(d)));
    });
    req.write(data); req.end();
  });
  console.log("   " + (login.success ? "SUCCESS" : "FAILED") + ": " + login.message);

  // 2. Check dashboard.html serves correctly
  console.log("2. Fetch dashboard.html...");
  const dash = await get("/dashboard.html");
  console.log("   Status: " + dash.status + " Size: " + dash.body.length);
  const hasBuildSidebar = dash.body.includes("buildSidebar");
  const hasCloseBtn = dash.body.includes("closeBtn");
  const hasInit = dash.body.includes("function init");
  console.log("   buildSidebar: " + hasBuildSidebar + " closeBtn: " + hasCloseBtn + " init: " + hasInit);
}
test().catch(e => console.error(e));
