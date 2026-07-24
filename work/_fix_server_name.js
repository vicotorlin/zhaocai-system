const fs = require("fs");
const path = require("path");

const serverPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "server", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// 1. Login API: return name
const oldLoginResp = 'res.json({ success: true, message: "登录成功", role: user.role, account: user.account, token: "session-token-xxx" })';
if (content.includes(oldLoginResp)) {
  content = content.replace(oldLoginResp, 
    'res.json({ success: true, message: "登录成功", role: user.role, account: user.account, name: user.name || user.account, token: "session-token-xxx" })');
  console.log("Login: return name");
} else {
  console.log("Login response pattern not found");
  // Try alternate
  const altLogin = 'message: "登录成功", role: user.role, account: user.account';
  if (content.includes(altLogin)) {
    content = content.replace(altLogin, 'message: "登录成功", role: user.role, account: user.account, name: user.name || user.account');
    console.log("Login: return name (alt)");
  }
}

// 2. Register API: accept name
const oldRegDestructure = 'const { role, account, password, code, token } = req.body;';
const newRegDestructure = 'const { role, account, password, code, token, name } = req.body;';
if (content.includes(oldRegDestructure)) {
  content = content.replace(oldRegDestructure, newRegDestructure);
  console.log("Register: accept name");
}

// Update createUser call in register
const oldRegCreate = 'await db.createUser(account, role, password, userStatus)';
const newRegCreate = 'await db.createUser(account, role, password, userStatus, name || "")';
if (content.includes(oldRegCreate)) {
  content = content.replace(oldRegCreate, newRegCreate);
  console.log("Register: pass name to createUser");
}

// 3. dev/create-user: accept name
const oldDevDestructure = "const { role, account, password } = req.body;";
const newDevDestructure = "const { role, account, password, name } = req.body;";
if (content.includes(oldDevDestructure)) {
  content = content.replace(oldDevDestructure, newDevDestructure);
  console.log("Dev create-user: accept name");
}

const oldDevCreate = "const user = await db.createUser(account, role, password, \"active\")";
const newDevCreate = "const user = await db.createUser(account, role, password, \"active\", name || \"\")";
if (content.includes(oldDevCreate)) {
  content = content.replace(oldDevCreate, newDevCreate);
  console.log("Dev create-user: pass name to createUser");
}

// 4. Update project response in buyer projects API to include buyer name
// Find project response mapping
const oldProjBuyer = "buyer: project.buyer_account || \"\"";
if (content.includes(oldProjBuyer)) {
  content = content.replace(oldProjBuyer, "buyer: project.buyer_account || \"\", buyerName: project.buyer_name || project.buyer_account || \"\"");
  console.log("Buyer projects: add buyerName");
}

// Also check the quotes endpoint project info for buyer name
const oldQuoteProj = "buyer: project.buyer_account || \"\"";
// This might have been already replaced, let me check after
let idx = content.indexOf("project: {");
if (idx >= 0) {
  let projBlock = content.substring(idx, idx + 200);
  console.log("Quotes project block:", projBlock.substring(0, 150));
  if (projBlock.includes('buyer: project.buyer_account') && !projBlock.includes('buyerName')) {
    content = content.replace('buyer: project.buyer_account || "",', 'buyer: project.buyer_account || "", buyerName: project.buyer_name || project.buyer_account || "",');
    console.log("Quotes endpoint: add buyerName");
  }
}

// Also update supplier bids response to include supplier name from user record
// Find GET /api/supplier/bids
// Actually the supplier name comes from the bid itself, which should be the company name

fs.writeFileSync(serverPath, content, "utf8");
console.log("server.js updated");
