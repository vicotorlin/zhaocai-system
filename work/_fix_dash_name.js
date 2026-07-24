const fs = require("fs");
const path = require("path");

const dashPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(dashPath, "utf8");

// 1. Update USER object to include name
const oldUser = 'var USER={account:params.get("account")||sessionStorage.getItem("zrbac_user")||"",role:params.get("role")||sessionStorage.getItem("zrbac_role")||"supplier"};';
const newUser = 'var USER={account:params.get("account")||sessionStorage.getItem("zrbac_user")||"",role:params.get("role")||sessionStorage.getItem("zrbac_role")||"supplier",name:params.get("name")||sessionStorage.getItem("zrbac_name")||""};';
if (content.includes(oldUser)) {
  content = content.replace(oldUser, newUser);
  console.log("Dashboard: USER includes name");
}

// 2. Update sessionStorage to also store name
const oldSession = 'sessionStorage.setItem("zrbac_user",USER.account);sessionStorage.setItem("zrbac_role",USER.role);';
const newSession = 'sessionStorage.setItem("zrbac_user",USER.account);sessionStorage.setItem("zrbac_role",USER.role);sessionStorage.setItem("zrbac_name",USER.name);';
if (content.includes(oldSession)) {
  content = content.replace(oldSession, newSession);
  console.log("Dashboard: store name in sessionStorage");
}

// 3. Update displayAccount to show name or fallback to account
// displayAccount shows USER.account, change to show USER.name || USER.account
const oldDisplay = "document.getElementById('displayAccount').textContent=USER.account;";
const newDisplay = "document.getElementById('displayAccount').textContent=USER.name||USER.account;";
if (content.includes(oldDisplay)) {
  content = content.replace(oldDisplay, newDisplay);
  console.log("Dashboard: display name instead of email");
}

// 4. Update quote detail modal: show buyerName instead of buyer email
// projInfo.buyer -> projInfo.buyerName || projInfo.buyer
const oldBuyerDisp = "+projInfo.buyer+'</div>'";
const newBuyerDisp = "+(projInfo.buyerName||projInfo.buyer)+'</div>'";
if (content.includes(oldBuyerDisp)) {
  content = content.replace(oldBuyerDisp, newBuyerDisp);
  console.log("Dashboard: show buyer name in quote detail");
}

// 5. Update supplier table to show buyer name
// p.buyer -> p.buyerName || p.buyer
const oldSBuyer = "'+p.buyer+'</td><td>'";
const newSBuyer = "'+(p.buyerName||p.buyer)+'</td><td>'";
if (content.includes(oldSBuyer)) {
  content = content.replace(oldSBuyer, newSBuyer);
  console.log("Dashboard: show buyer name in supplier table");
}

// 6. Update bid form supplier name to use USER.name or USER.account
const oldBidSupplier = "document.getElementById(\"bidSupplierName\").value=USER.account||\"\";";
const newBidSupplier = "document.getElementById(\"bidSupplierName\").value=USER.name||USER.account||\"\";";
if (content.includes(oldBidSupplier)) {
  content = content.replace(oldBidSupplier, newBidSupplier);
  console.log("Dashboard: bid form shows supplier name");
}

// 7. Also update the bid form where it resets supplier name
const oldResetBid = "document.getElementById(\"bidSupplierName\").value=USER.account||\"\"";
// Already done above, but check for the other occurrence
// In the openBidForm reset section (before bidId check)
// Actually this is the same line, already fixed

fs.writeFileSync(dashPath, content, "utf8");

// Syntax check
const vm = require("vm");
let scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    console.log("JavaScript syntax: VALID");
  } catch(e) {
    console.log("JavaScript syntax ERROR: " + e.message);
  }
}
