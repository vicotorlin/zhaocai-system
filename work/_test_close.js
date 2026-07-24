const http = require("http");

function req(method, path, body) {
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
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d, status: res.statusCode }); }
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function test() {
  // 1. Create a test project
  console.log("1. Creating project...");
  const create = await req("POST", "/api/buyer/projects", {
    buyerAccount: "buyer_test@test.com",
    projectName: "截止测试项目",
    deadline: "2026-12-31"
  });
  console.log("   Result:", create.success, create.message || create.data?.id);

  // 2. Close it
  const pid = create.data?.id || create.id;
  if (pid) {
    console.log("2. Closing project " + pid + "...");
    const close = await req("POST", "/api/buyer/projects/" + pid + "/close", {
      account: "buyer_test@test.com"
    });
    console.log("   Result:", close.success, close.message);

    // 3. Verify supplier can't bid
    console.log("3. Supplier tries to bid on closed project...");
    const bid = await req("POST", "/api/supplier/bid", {
      projectId: pid,
      supplierAccount: "supplier_test@test.com",
      supplierName: "测试供应商",
      category: "标准件",
      items: [{ partName: "测试", unitPrice: 100 }],
      total: 100,
      laborCost: 0, manufacturingCost: 0, adminCost: 0, profit: 0, tax: 0
    });
    console.log("   Result:", bid.success, bid.message);
    if (!bid.success && bid.message.includes("关闭")) {
      console.log("   BLOCKED: Supplier correctly cannot bid on closed project");
    }
  }
}
test().catch(e => console.error(e));
