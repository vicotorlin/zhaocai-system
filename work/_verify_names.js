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
  // 1. Login as buyer2
  const login = await api("POST", "/api/login", {
    account: "buyer2@test.com", password: "123456", role: "buyer"
  });
  console.log("1. Login buyer2:", login.success, "name:", login.data?.name);
  
  // 2. Login as supplier2
  const login2 = await api("POST", "/api/login", {
    account: "supplier2@test.com", password: "123456", role: "supplier"
  });
  console.log("2. Login supplier2:", login2.success, "name:", login2.data?.name);

  // 3. Create project
  const proj = await api("POST", "/api/buyer/projects", {
    buyerAccount: "buyer2@test.com", projectName: "名称测试项目", deadline: "2026-12-31"
  });
  console.log("3. Created project:", proj.data?.id);
  
  // 4. Submit bid
  await api("POST", "/api/supplier/bid", {
    projectId: proj.data.id, supplierAccount: "supplier2@test.com",
    supplierName: "华锦纺织有限公司", category: "标准件",
    items: [{ name: "test", unitPrice: 100 }], total: 100,
    laborCost: 0, manufacturingCost: 0, adminCost: 0, profit: 0, tax: 0
  });
  
  // 5. Check quotes - should show buyerName
  const quotes = await api("GET", "/api/buyer/quotes/" + proj.data.id + "?account=buyer2@test.com");
  console.log("4. Quotes project:", JSON.stringify(quotes.project));
  
  // 6. Check reviewer projects - should show buyerName
  const revProj = await api("GET", "/api/reviewer/projects");
  const testProj = revProj.data?.find(p => p.id === proj.data.id);
  console.log("5. Reviewer project:", JSON.stringify({ buyer: testProj?.buyer, buyerName: testProj?.buyerName }));
}
test().catch(e => console.error(e));
