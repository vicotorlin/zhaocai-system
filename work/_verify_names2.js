const http = require("http");
function api(m,p,b) { return new Promise((resolve,reject) => {
  const d = b ? JSON.stringify(b) : null;
  const opts = { hostname:"localhost",port:3000,path:p,method:m,headers:{"Content-Type":"application/json"}};
  if(d) opts.headers["Content-Length"] = Buffer.byteLength(d);
  const r = http.request(opts,(res) => { let dd="";res.on("data",c=>dd+=c);res.on("end",()=>{try{resolve(JSON.parse(dd))}catch(e){resolve({raw:dd})}});});
  r.on("error",reject); if(d) r.write(d); r.end();
});}
async function test() {
  // Create accounts with names
  await api("POST","/api/dev/create-user",{role:"buyer",account:"namebuyer@test.com",password:"123456",name:"王采购"});
  await api("POST","/api/dev/create-user",{role:"supplier",account:"namesupplier@test.com",password:"123456",name:"锦绣纺织集团"});
  
  // Create project
  const proj = await api("POST","/api/buyer/projects",{buyerAccount:"namebuyer@test.com",projectName:"名称展示测试",deadline:"2026-12-31"});
  
  // Submit bid with company name
  await api("POST","/api/supplier/bid",{projectId:proj.data.id,supplierAccount:"namesupplier@test.com",supplierName:"锦绣纺织集团",category:"标准件",items:[{name:"test",unitPrice:100}],total:100,laborCost:0,manufacturingCost:0,adminCost:0,profit:0,tax:0});
  
  // Check quotes
  const quotes = await api("GET","/api/buyer/quotes/"+proj.data.id+"?account=namebuyer@test.com");
  console.log("Quotes project:",JSON.stringify(quotes.project));
  console.log("Quote supplierName:",quotes.data[0]?.supplierName);
  
  // Check reviewer projects
  const rev = await api("GET","/api/reviewer/projects");
  const p = rev.data?.find(x=>x.id===proj.data.id);
  console.log("Reviewer buyerName:",p?.buyerName);
}
test().catch(e=>console.error(e));
