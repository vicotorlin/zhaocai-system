const http = require("http");

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "localhost", port: 3000, path: path, method: method,
      headers: { "Content-Type": "application/json" }
    };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const r = http.request(opts, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function test() {
  const resp = await api("GET", "/api/buyer/quotes/ZB-001?account=buyer_test@test.com");
  console.log("project field:", JSON.stringify(resp.project));
  console.log("success:", resp.success);
}
test().catch(e => console.error(e));
