const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get("http://localhost:3000" + path, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve({status: res.statusCode, body: d}));
    }).on("error", reject);
  });
}

async function main() {
  // Test buyer API
  let r = await get("/api/buyer/projects?account=794474441%40qq.com");
  console.log("Buyer projects:", r.body.substring(0, 300));
  
  // Test reviewer API
  r = await get("/api/reviewer/projects");
  console.log("\nReviewer projects:", r.body.substring(0, 300));
  
  // Test login
  let postData = JSON.stringify({account:"794474441@qq.com",password:"123456"});
  let pres = await new Promise((resolve, reject) => {
    let req = http.request({hostname:"localhost",port:3000,path:"/api/login",method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(postData)}}, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
  console.log("\nLogin:", pres);
}
main().catch(console.error);
