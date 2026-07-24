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
  // 1. Create project
  console.log("1. Create project...");
  const proj = await api("POST", "/api/buyer/projects", {
    buyerAccount: "buyer_test@test.com",
    projectName: "供应商截止测试",
    deadline: "2026-12-31"
  });
  console.log("   " + proj.success + " " + (proj.data?.id || proj.message));

  const pid = proj.data?.id;
  
  // 2. Supplier submits a bid
  console.log("2. Supplier submits bid...");
  const bid = await api("POST", "/api/supplier/bid", {
    projectId: pid,
    supplierAccount: "supplier_test@test.com",
    supplierName: "测试供应商",
    category: "标准件",
    items: [{ partName: "测试", unitPrice: 100 }],
    total: 100,
    laborCost: 0, manufacturingCost: 0, adminCost: 0, profit: 0, tax: 0
  });
  console.log("   " + bid.success + " " + (bid.data?.id || "") + " " + (bid.message || ""));

  // 3. Buyer closes project
  console.log("3. Close project...");
  const close = await api("POST", "/api/buyer/projects/" + pid + "/close", {
    account: "buyer_test@test.com"
  });
  console.log("   " + close.success + " " + close.message);

  // 4. Supplier tries to modify bid (server should reject)
  console.log("4. Supplier tries to modify bid after close...");
  const modify = await api("PUT", "/api/supplier/bid/" + bid.data.id, {
    account: "supplier_test@test.com",
    items: [{ partName: "测试", unitPrice: 999 }],
    total: 999,
    laborCost: 0, manufacturingCost: 0, adminCost: 0, profit: 0, tax: 0
  });
  console.log("   " + modify.success + " " + modify.message);
  if (!modify.success && modify.message.includes("关闭")) {
    console.log("   BLOCKED: Server correctly rejects bid modification on closed project");
  }
}
test().catch(e => console.error(e));
