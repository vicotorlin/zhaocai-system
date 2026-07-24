const fs = require("fs");
const p = require("path");

const serverPath = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// Add name to seed defaults
const oldDefaults = `    const defaults = [
    { account: "794474441@qq.com", role: "buyer", password: "123456", status: "active" },
    { account: "linguodong@corp.netease.com", role: "supplier", password: "123456", status: "active" }
  ]`;

const newDefaults = `    const defaults = [
    { account: "794474441@qq.com", role: "buyer", password: "123456", status: "active", name: "采购管理员" },
    { account: "linguodong@corp.netease.com", role: "supplier", password: "123456", status: "active", name: "恒源纺织" }
  ]`;

if (content.includes(oldDefaults)) {
  content = content.replace(oldDefaults, newDefaults);
  console.log("Added names to seed defaults");
}

// Pass name to createUser
const oldCreate = "await db.createUser(u.account, u.role, u.password, u.status || \"active\")";
const newCreate = "await db.createUser(u.account, u.role, u.password, u.status || \"active\", u.name || \"\")";

if (content.includes(oldCreate)) {
  content = content.replace(oldCreate, newCreate);
  console.log("Pass name to createUser in seed");
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("Done");
