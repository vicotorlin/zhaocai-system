const http = require("http");
function api(m,p,b) { return new Promise((resolve,reject) => {
  const d = b ? JSON.stringify(b) : null;
  const opts = { hostname:"localhost",port:3000,path:p,method:m,headers:{"Content-Type":"application/json"}};
  if(d) opts.headers["Content-Length"] = Buffer.byteLength(d);
  const r = http.request(opts,(res) => { let dd="";res.on("data",c=>dd+=c);res.on("end",()=>{try{resolve(JSON.parse(dd))}catch(e){resolve({raw:dd})}});});
  r.on("error",reject); if(d) r.write(d); r.end();
});}
async function test() {
  // Test seed users
  const l1 = await api("POST","/api/login",{account:"794474441@qq.com",password:"123456"});
  console.log("Seed buyer:", l1.success, l1.data?.name);
  
  // Create a new user
  const r = await api("POST","/api/dev/create-user",{role:"supplier",account:"test_s@test.com",password:"123456",name:"测试供应商"});
  console.log("Create user:", r.success, r.message);
  
  // Login as new user
  const l2 = await api("POST","/api/login",{account:"test_s@test.com",password:"123456"});
  console.log("New user login:", l2.success, l2.data?.name);
  
  // Create project
  const proj = await api("POST","/api/buyer/projects",{buyerAccount:"794474441@qq.com",projectName:"Supabase测试",deadline:"2026-12-31"});
  console.log("Create project:", proj.success, proj.data?.id);
}
test().catch(e=>console.error(e));
