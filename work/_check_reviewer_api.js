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
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d, status: res.statusCode }); } });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function test() {
  const proj = await api("GET", "/api/reviewer/projects");
  if (proj.data) {
    proj.data.forEach(p => {
      console.log("Project:", p.id, p.projectName);
      console.log("  buyer:", JSON.stringify(p.buyer));
      console.log("  buyerAccount:", p.buyerAccount);
      console.log("  budget:", p.budget);
      console.log("  deadline:", p.deadline);
      console.log("  status:", p.status);
      console.log("  All keys:", Object.keys(p));
    });
  } else {
    console.log("Response:", JSON.stringify(proj).substring(0, 500));
  }
}
test().catch(e => console.error(e));
