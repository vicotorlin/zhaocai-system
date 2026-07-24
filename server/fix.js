const fs = require("fs");
const path = "C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/server/server.js";
let c = fs.readFileSync(path, "utf8");
const idx = c.indexOf("const defaults = [");
const endIdx = c.indexOf("];", idx);
const replacement = "const defaults = [\r\n    { account: \"794474441@qq.com\", role: \"buyer\", password: \"123456\", status: \"active\" },\r\n    { account: \"linguodong@corp.netease.com\", role: \"supplier\", password: \"123456\", status: \"active\" }\r\n  ]";
c = c.substring(0, idx) + replacement + c.substring(endIdx + 2);
fs.writeFileSync(path, c);
console.log("Fixed:", c.includes("794474441@qq.com") ? "OK" : "FAIL");
