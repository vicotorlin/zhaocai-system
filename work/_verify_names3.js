const http = require("http");
function api(m,p,b) { return new Promise((resolve,reject) => {
  const d = b ? JSON.stringify(b) : null;
  const opts = { hostname:"localhost",port:3000,path:p,method:m,headers:{"Content-Type":"application/json"}};
  if(d) opts.headers["Content-Length"] = Buffer.byteLength(d);
  const r = http.request(opts,(res) => { let dd="";res.on("data",c=>dd+=c);res.on("end",()=>{try{resolve(JSON.parse(dd))}catch(e){resolve({raw:dd})}});});
  r.on("error",reject); if(d) r.write(d); r.end();
});}
async function test() {
  // Create accounts
  await api("POST","/api/dev/create-user",{role:"buyer",account:"bname@test.com",password:"123456",name:"赵采购"});
  await api("POST","/api/dev/create-user",{role:"supplier",account:"sname@test.com",password:"123456",name:"天源纺织有限公司"});
  
  // Create project  
  const proj = await api("POST","/api/buyer/projects",{buyerAccount:"bname@test.com",projectName:"最终名称测试",deadline:"2026-12-31"});
  await api("POST","/api/supplier/bid",{projectId:proj.data.id,supplierAccount:"sname@test.com",supplierName:"天源纺织有限公司",category:"标准件",items:[{name:"x",unitPrice:100}],total:100,laborCost:0,manufacturingCost:0,adminCost:0,profit:0,tax:0});
  
  // Test reviewer
  const rev = await api("GET","/api/reviewer/projects");
  const p = rev.data?.find(x=>x.id===proj.data.id);
  console.log("Reviewer buyerName:", p?.buyerName);
  
  // Test quotes
  const q = await api("GET","/api/buyer/quotes/"+proj.data.id+"?account=bname@test.com");
  console.log("Quotes buyerName:", q.project?.buyerName);
  console.log("Quotes supplierName:", q.data[0]?.supplierName);
}
test().catch(e=>console.error(e));
