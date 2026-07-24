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

async function main() {
  const accounts = [
    { role: "buyer", account: "buyer_n@test.com", password: "123456", name: "赵采购" },
    { role: "supplier", account: "supplier_n@test.com", password: "123456", name: "天源纺织有限公司" },
    { role: "reviewer", account: "reviewer_n@test.com", password: "123456", name: "李专家" },
  ];
  
  for (const a of accounts) {
    const r = await api("POST", "/api/dev/create-user", a);
    console.log(a.role + ": " + (r.success ? "OK" : r.message));
  }
  
  // Verify
  for (const a of accounts) {
    const l = await api("POST", "/api/login", { account: a.account, password: a.password });
    const nameHex = Buffer.from(l.data?.name || "", "utf8").toString("hex");
    console.log(a.account + " name: " + l.data?.name + " hex: " + nameHex);
  }
}
main().catch(e => console.error(e));
