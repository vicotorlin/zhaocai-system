const http = require("http");
function api(m,p,b) { return new Promise((resolve,reject) => {
  const d = b ? JSON.stringify(b) : null;
  const opts = { hostname:"localhost",port:3000,path:p,method:m,headers:{"Content-Type":"application/json"}};
  if(d) opts.headers["Content-Length"] = Buffer.byteLength(d);
  const r = http.request(opts,(res) => { let dd="";res.on("data",c=>dd+=c);res.on("end",()=>{try{resolve(JSON.parse(dd))}catch(e){resolve({raw:dd})}});});
  r.on("error",reject); if(d) r.write(d); r.end();
});}

async function test() {
  // Check login returns name
  const login = await api("POST","/api/login",{account:"reviewer2@test.com",password:"123456"});
  console.log("Login:", login.success, "data:", JSON.stringify(login.data));
  
  // Check if name stored in DB
  const user = await api("POST","/api/dev/create-user",{role:"reviewer",account:"reviewer2@test.com",password:"123456",name:"李专家"});
  console.log("Create:", user.success, user.message);
  
  // Login again
  const login2 = await api("POST","/api/login",{account:"reviewer2@test.com",password:"123456"});
  console.log("Login2:", login2.success, "data:", JSON.stringify(login2.data));
}
test().catch(e=>console.error(e));
