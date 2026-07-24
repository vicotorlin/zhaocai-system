const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get("http://localhost:3000" + path, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        // Check if the HTML has proper Chinese characters
        const str = buf.toString("utf8");
        const hasRoleMap = str.includes("评审专家");
        const hasNameDisplay = str.includes("USER.name||USER.account");
        console.log("Has 评审专家 in roleMap:", hasRoleMap);
        console.log("Has USER.name||USER.account:", hasNameDisplay);
        
        // Check charset
        const hasCharset = str.includes('charset="utf-8"') || str.includes("charset=utf-8");
        console.log("Has UTF-8 charset:", hasCharset);
        
        // Check if Chinese is corrupted
        if (str.includes("璇勫")) {
          console.log("WARNING: Chinese text appears garbled (latin1 encoding)");
        }
        resolve();
      });
    }).on("error", reject);
  });
}

async function test() {
  console.log("=== Testing dashboard.html encoding ===");
  await get("/dashboard.html");
  
  // Also test login returns proper Chinese
  console.log("\n=== Testing login API ===");
  const login = await new Promise((resolve) => {
    const data = JSON.stringify({ account: "reviewer_n@test.com", password: "123456" });
    const req = http.request({
      hostname: "localhost", port: 3000, path: "/api/login", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const str = buf.toString("utf8");
        console.log("Raw response:", str);
        const json = JSON.parse(str);
        console.log("Name value:", json.data?.name);
        console.log("Name hex:", Buffer.from(json.data?.name || "", "utf8").toString("hex"));
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
}
test().catch(e => console.error(e));
