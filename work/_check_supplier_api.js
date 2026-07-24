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
  // Get supplier projects to see the data structure
  const proj = await api("GET", "/api/supplier/projects");
  console.log(JSON.stringify(proj, null, 2).substring(0, 2000));
}
test().catch(e => console.error(e));
