const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname:"localhost", port:3000, path, method:"POST", headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)} }, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Test login
  let r = await post("/api/login", { account: "794474441@qq.com", password: "123456" });
  console.log("Login buyer:", r);
  
  r = await post("/api/login", { account: "supplier@test.com", password: "123456" });
  console.log("Login supplier:", r);
  
  r = await post("/api/login", { account: "reviewer@test.com", password: "123456" });
  console.log("Login reviewer:", r);

  // Test dashboard serving
  const http2 = require("http");
  r = await new Promise((resolve, reject) => {
    http2.get("http://localhost:3000/dashboard.html", res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve("Status: " + res.statusCode + ", Length: " + d.length));
    }).on("error", reject);
  });
  console.log("Dashboard:", r);
}
main().catch(console.error);
