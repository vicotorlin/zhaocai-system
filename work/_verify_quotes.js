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
  // Create project, submit bid, then check quotes
  const proj = await api("POST", "/api/buyer/projects", {
    buyerAccount: "buyer_test@test.com",
    projectName: "报价详情测试",
    deadline: "2026-12-31"
  });
  console.log("1. Created:", proj.data?.id);
  
  const bid = await api("POST", "/api/supplier/bid", {
    projectId: proj.data.id,
    supplierAccount: "supplier_test@test.com",
    supplierName: "测试供应商",
    category: "标准件",
    items: [{ name: "test", unitPrice: 100 }],
    total: 100,
    laborCost: 0, manufacturingCost: 0, adminCost: 0, profit: 0, tax: 0
  });
  console.log("2. Bid:", bid.data?.id);
  
  const quotes = await api("GET", "/api/buyer/quotes/" + proj.data.id + "?account=buyer_test@test.com");
  console.log("3. Quotes success:", quotes.success);
  console.log("   project:", JSON.stringify(quotes.project));
}
test().catch(e => console.error(e));
