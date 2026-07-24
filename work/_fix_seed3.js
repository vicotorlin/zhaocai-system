const fs = require("fs");
const p = require("path");

const serverPath = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Fix the defaults array: add name field
content = content.replace(
  'account: "794474441@qq.com", role: "buyer", password: "123456", status: "active"',
  'account: "794474441@qq.com", role: "buyer", password: "123456", status: "active", name: "采购管理员"'
);
content = content.replace(
  'account: "linguodong@corp.netease.com", role: "supplier", password: "123456", status: "active"',
  'account: "linguodong@corp.netease.com", role: "supplier", password: "123456", status: "active", name: "恒源纺织"'
);

fs.writeFileSync(serverPath, content, "utf8");
console.log("Fixed seed defaults with names");
