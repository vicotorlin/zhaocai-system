const fs = require("fs");
const p = require("path");

const dbPath = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "supabase-client.js");
let content = fs.readFileSync(dbPath, "utf8");

// Fix Supabase upsert to include name
const oldUpsert = '.upsert({ account, role, password, created_at: new Date().toISOString() })';
const newUpsert = '.upsert({ account, role, password, name: name || "", created_at: new Date().toISOString() })';

if (content.includes(oldUpsert)) {
  content = content.replace(oldUpsert, newUpsert);
  console.log("Fixed upsert to include name");
} else {
  console.log("Pattern not found");
}

// Also fix seedDefaultUsers to pass name
const seedBuyer = 'createUser("794474441@qq.com", "buyer", "123456", "active")';
const seedBuyerNew = 'createUser("794474441@qq.com", "buyer", "123456", "active", "采购管理员")';
if (content.includes(seedBuyer)) {
  content = content.replace(seedBuyer, seedBuyerNew);
  console.log("Fixed seed buyer name");
}

const seedSupplier = 'createUser("linguodong@corp.netease.com", "supplier", "123456", "active")';
const seedSupplierNew = 'createUser("linguodong@corp.netease.com", "supplier", "123456", "active", "恒源纺织")';
if (content.includes(seedSupplier)) {
  content = content.replace(seedSupplier, seedSupplierNew);
  console.log("Fixed seed supplier name");
}

fs.writeFileSync(dbPath, content, "utf8");
console.log("Done");
