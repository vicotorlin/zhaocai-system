const http = require("http");

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const jsonBody = JSON.stringify(body);
    const buf = Buffer.from(jsonBody, "utf8");
    const opts = {
      hostname: "localhost", port: 3000, path: path, method: method,
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": buf.length }
    };
    const r = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const str = Buffer.concat(chunks).toString("utf8");
        try { resolve(JSON.parse(str)); } catch(e) { resolve({ raw: str }); }
      });
    });
    r.on("error", reject);
    r.write(buf);
    r.end();
  });
}

async function test() {
  // Re-create reviewer account with proper UTF-8
  console.log("Creating reviewer_n with UTF-8...");
  const r = await api("POST", "/api/dev/create-user", {
    role: "reviewer",
    account: "reviewer_n@test.com",
    password: "123456",
    name: "李专家"
  });
  console.log("Result:", r.success, r.message);

  // Verify login
  const login = await api("POST", "/api/login", {
    account: "reviewer_n@test.com",
    password: "123456"
  });
  console.log("Login name:", login.data?.name);
  console.log("Name hex:", Buffer.from(login.data?.name || "", "utf8").toString("hex"));
  
  // Also fix buyer and supplier
  await api("POST", "/api/dev/create-user", {
    role: "buyer", account: "buyer_n@test.com", password: "123456", name: "赵采购"
  });
  await api("POST", "/api/dev/create-user", {
    role: "supplier", account: "supplier_n@test.com", password: "123456", name: "天源纺织有限公司"
  });
  
  // Verify all
  for (const acc of ["buyer_n@test.com", "supplier_n@test.com", "reviewer_n@test.com"]) {
    const l = await api("POST", "/api/login", { account: acc, password: "123456" });
    console.log(acc + " -> name:", l.data?.name);
  }
}
test().catch(e => console.error(e));
