const fs = require("fs");
const path = require("path");

// Fix getBidBySupplierAndProject and getUser return values
const dbPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "supabase-client.js");
let content = fs.readFileSync(dbPath, "utf8");

// Update the memory getUser to include name
const oldMemUser = "account: u.account, role: u.role, password: u.password, status: u.status, created_at: u.created_at";
if (content.includes(oldMemUser)) {
  content = content.replace(oldMemUser, "account: u.account, role: u.role, password: u.password, status: u.status, name: u.name || \"\", created_at: u.created_at");
  console.log("Updated memory getUser to include name");
}

// Also check for the Supabase getUser 
const oldSupUser = "account: row.account, role: row.role, password: row.password, status: row.status || \"active\"";
if (content.includes(oldSupUser)) {
  content = content.replace(oldSupUser, "account: row.account, role: row.role, password: row.password, status: row.status || \"active\", name: row.name || \"\"");
  console.log("Updated Supabase getUser to include name");
}

// Update the seedDefaultUsers to include names
const seedB = "794474441@qq.com";
if (content.includes('"794474441@qq.com", "buyer"')) {
  content = content.replace('"794474441@qq.com", "buyer", "123456", "active")', '"794474441@qq.com", "buyer", "123456", "active", "采购管理员")');
  console.log("Updated seed: buyer name");
}
if (content.includes('"linguodong@corp.netease.com", "supplier"')) {
  content = content.replace('"linguodong@corp.netease.com", "supplier", "123456", "active")', '"linguodong@corp.netease.com", "supplier", "123456", "active", "恒源纺织")');
  console.log("Updated seed: supplier name");
}

fs.writeFileSync(dbPath, content, "utf8");
console.log("All DB updates done");
