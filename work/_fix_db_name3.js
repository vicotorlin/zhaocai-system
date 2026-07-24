const fs = require("fs");
const path = require("path");

const dbPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "supabase-client.js");
let content = fs.readFileSync(dbPath, "utf8");

// Fix createUser memory: add name
const oldMemUser = 'id: genUUID(), account, role, password, status: userStatus, created_at: new Date().toISOString()';
const newMemUser = 'id: genUUID(), account, role, password, status: userStatus, name: name || "", created_at: new Date().toISOString()';
if (content.includes(oldMemUser)) {
  content = content.replace(oldMemUser, newMemUser);
  console.log("Fixed: memory createUser to store name");
}

// Fix createUser Supabase: add name  
const oldSupInsert = '.upsert({ account, role, password, created_at: new Date().toISOString() })';
const newSupInsert = '.upsert({ account, role, password, name: name || "", created_at: new Date().toISOString() })';
if (content.includes(oldSupInsert)) {
  content = content.replace(oldSupInsert, newSupInsert);
  console.log("Fixed: Supabase createUser to store name");
}

// Fix seedDefaultUsers to pass name
const seedCreate = 'createUser("794474441@qq.com", "buyer", "123456", "active")';
if (content.includes(seedCreate)) {
  content = content.replace(seedCreate, 'createUser("794474441@qq.com", "buyer", "123456", "active", "采购管理员")');
  console.log("Fixed: seed buyer name");
}

const seedSupplier = 'createUser("linguodong@corp.netease.com", "supplier", "123456", "active")';
if (content.includes(seedSupplier)) {
  content = content.replace(seedSupplier, 'createUser("linguodong@corp.netease.com", "supplier", "123456", "active", "恒源纺织")');
  console.log("Fixed: seed supplier name");
}

fs.writeFileSync(dbPath, content, "utf8");
console.log("supabase-client.js fixed");
