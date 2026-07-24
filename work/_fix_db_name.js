const fs = require("fs");
const path = require("path");

const dbPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "supabase-client.js");
let content = fs.readFileSync(dbPath, "utf8");

// Update createUser to accept and store name
const oldCreateUser = "async function createUser(account, role, password, status) {";
const newCreateUser = "async function createUser(account, role, password, status, name) {";
if (content.includes(oldCreateUser)) {
  content = content.replace(oldCreateUser, newCreateUser);
  console.log("Updated createUser signature");
}

// Add name to user record - find the user object construction
const oldUserRecord = "var user = { account: account, role: role, password: password, status: status || \"active\", created_at: new Date().toISOString() };";
const newUserRecord = "var user = { account: account, role: role, password: password, status: status || \"active\", name: name || \"\", created_at: new Date().toISOString() };";
if (content.includes(oldUserRecord)) {
  content = content.replace(oldUserRecord, newUserRecord);
  console.log("Added name to user record (memory)");
}

// Also update the Supabase insert
const oldSupabaseInsert = ".insert({ account, role, password, status: status || \"active\", created_at: new Date().toISOString() })";
const newSupabaseInsert = ".insert({ account, role, password, name: name || \"\", status: status || \"active\", created_at: new Date().toISOString() })";
if (content.includes(oldSupabaseInsert)) {
  content = content.replace(oldSupabaseInsert, newSupabaseInsert);
  console.log("Added name to Supabase insert");
} else {
  // Try alternate pattern
  const oldSupabaseInsert2 = "account, role, password, status: status || \"active\"";
  const newSupabaseInsert2 = "account, role, password, name: name || \"\", status: status || \"active\"";
  if (content.includes(oldSupabaseInsert2)) {
    content = content.replace(oldSupabaseInsert2, newSupabaseInsert2);
    console.log("Added name to Supabase insert (alt)");
  }
}

// Update getUser to return name
const oldGetUser = "var user = { account: row.account, role: row.role, password: row.password, status: row.status || \"active\", created_at: row.created_at };";
const newGetUser = "var user = { account: row.account, role: row.role, password: row.password, status: row.status || \"active\", name: row.name || \"\", created_at: row.created_at };";
if (content.includes(oldGetUser)) {
  content = content.replace(oldGetUser, newGetUser);
  console.log("Added name to getUser response");
} else {
  console.log("getUser pattern not found");
  // Try to find it
  let idx = content.indexOf("var user = { account: row.account");
  if (idx >= 0) {
    console.log("getUser found at " + idx);
    console.log(content.substring(idx, idx + 150));
  }
}

fs.writeFileSync(dbPath, content, "utf8");
console.log("supabase-client.js updated");
