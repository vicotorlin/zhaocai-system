const http = require("http");
function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({hostname:"localhost",port:3000,path,method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}}, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}
async function main() {
  let r = await post("/api/dev/create-user", {role:"buyer",account:"794474441@qq.com",password:"123456"});
  console.log("Buyer:", r);
  r = await post("/api/dev/create-project", {buyerAccount:"794474441@qq.com",projectName:"2026年度办公设备采购",buyer:"采购员小王",budget:500000,deadline:"2026-08-15"});
  console.log("Project:", r);
  r = await post("/api/dev/create-project", {buyerAccount:"794474441@qq.com",projectName:"网络设备升级项目",buyer:"采购员小王",budget:200000,deadline:"2026-09-01"});
  console.log("Project2:", r);
  
  // Test upload endpoint
  r = await new Promise((resolve, reject) => {
    http.get("http://localhost:3000/api/upload", res => { let d="";res.on("data",c=>d+=c);res.on("end",()=>resolve(d)); }).on("error",reject);
  });
  console.log("Upload endpoint:", r);
}
main().catch(console.error);
