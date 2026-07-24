const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// Fix 1: Remove budget row from quote detail header
// Line 668: projHeader+='<div><span style="color:#999">预算：</span>&yen;'+(Number(projInfo.budget)||0).toLocaleString()+'</div>';
const budgetLine = "projHeader+='<div><span style=\"color:#999\">\u9884\u7b97\uff1a</span>&yen;'+(Number(projInfo.budget)||0).toLocaleString()+'</div>';";
if (content.includes(budgetLine)) {
  // Remove it (replace with empty)
  content = content.replace(budgetLine + "\n", "");
  console.log("Frontend: Removed budget row");
} else {
  console.log("Budget line not found, trying alternate pattern...");
  // Search for it
  let idx = content.indexOf("\u9884\u7b97");
  if (idx >= 0) {
    console.log("预算 found at " + idx);
    console.log(content.substring(idx - 20, idx + 100));
  }
}

// Fix 2: Also fix the supplier table to show deadline instead of buyer+预算
// The current supplier table: <th>编号</th><th>项目名称</th><th>采购员</th><th>预算</th><th>状态</th><th>操作</th>
// Change to: <th>编号</th><th>项目名称</th><th>采购单位</th><th>截止日期</th><th>状态</th><th>操作</th>

const oldHeader = "<th>\u7f16\u53f7</th><th>\u9879\u76ee\u540d\u79f0</th><th>\u91c7\u8d2d\u5458</th><th>\u9884\u7b97</th><th>\u72b6\u6001</th><th>\u64cd\u4f5c</th>";
const newHeader = "<th>\u7f16\u53f7</th><th>\u9879\u76ee\u540d\u79f0</th><th>\u91c7\u8d2d\u5355\u4f4d</th><th>\u622a\u6b62\u65e5\u671f</th><th>\u72b6\u6001</th><th>\u64cd\u4f5c</th>";

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  console.log("Frontend: Updated supplier table header");
} else {
  console.log("Supplier header not found with exact match");
  // Try to find it
  let idx = content.indexOf("\u91c7\u8d2d\u5458</th><th>\u9884\u7b97");
  if (idx >= 0) {
    console.log("Found at " + idx);
  }
}

// Fix 3: Update supplier row to show deadline instead of buyer+预算
// Old: return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>&yen;'+(p.budget||"--")+'</td><td>...
// New: return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>'+p.deadline+'</td><td>...

const oldRow = "'+p.buyer+'</td><td>&yen;'+(p.budget||\"--\")+'";
const newRow = "'+p.buyer+'</td><td>'+p.deadline+'";

if (content.includes(oldRow)) {
  content = content.replace(oldRow, newRow);
  console.log("Frontend: Updated supplier row to show deadline");
} else {
  console.log("Row pattern not found");
  let idx = content.indexOf("p.buyer+'</td><td>&yen;'");
  if (idx >= 0) {
    console.log("Found at " + idx);
    console.log(content.substring(idx, idx + 100));
  }
}

fs.writeFileSync(filePath, content, "utf8");

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
