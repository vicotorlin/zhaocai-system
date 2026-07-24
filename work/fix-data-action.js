const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// SOLUTION: Replace all inline onclick handlers with data attributes + event delegation
// Instead of onclick="openSupplierBid('...')", use data-action="supplier-bid" data-pid="..."

// 1. Fix openSupplierBid: use data-action
html = html.replace(
  /<button class="btn btn-primary btn-sm" onclick="openSupplierBid[^"]*">报价<\/button>/g,
  '<button class="btn btn-primary btn-sm" data-action="supplier-bid" data-pid="'+p.id+'">报价</button>'
);

// Wait, this won't work inside a JS string. Let me fix the JavaScript template strings instead.

// Actually let me just completely replace the problematic table row rendering code.
// Find the loadSupplierProjects row rendering and fix it

// The current problematic code generates:
// onclick="openSupplierBid(\' + p.id + \')"
// We need: data-action="supplier-bid" data-pid="' + p.id + '"

// But we're doing string replacement in the FILE. The file contains the JS source code as text.
// So I need to find the exact text and replace it.

// Let me find the openSupplierBid button template
let oldBtn = `'<button class="btn btn-primary btn-sm" onclick="openSupplierBid(\\' + p.id + '\\')">报价</button>'`;
let newBtn = `'<button class="btn btn-primary btn-sm" data-action="supplier-bid" data-pid="' + p.id + '">报价</button>'`;

console.log("Looking for openSupplierBid button...");
let idx = html.indexOf("openSupplierBid");
if (idx >= 0) {
  let context = html.substring(idx - 30, idx + 100);
  console.log("Context:", JSON.stringify(context.substring(0, 80)));
  
  // Use a broad approach: find the entire button text and replace it
  // Find: onclick="openSupplierBid( ... )"
  // Replace: data-action="supplier-bid" data-pid="' + p.id + '"
  
  let re = /onclick="openSupplierBid\([^"]*\)"/g;
  html = html.replace(re, 'data-action="supplier-bid" data-pid="\' + p.id + \'"');
  console.log("✓ Replaced openSupplierBid onclick");
}

// Fix closeProject similarly
let re2 = /onclick="closeProject\([^"]*\)"/g;
html = html.replace(re2, 'data-action="close-project" data-pid="\' + p.id + \'"');
console.log("✓ Replaced closeProject onclick");

// Add event delegation for the new data-action handlers
// Find the existing data-action handler and extend it
let delegIdx = html.indexOf('if (action === "alert")');
if (delegIdx >= 0) {
  let newDeleg = `if (action === "alert") {
    alert(target.getAttribute("data-msg") || "");
  }
  if (action === "supplier-bid") {
    var pid = target.getAttribute("data-pid");
    if (pid) openSupplierBid(pid);
  }
  if (action === "close-project") {
    var pid = target.getAttribute("data-pid");
    if (pid) closeProject(pid);
  }`;
  
  html = html.replace('if (action === "alert") {\n    alert(target.getAttribute("data-msg") || "");\n  }', newDeleg);
  console.log("✓ Extended event delegation");
}

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Length:", html.length);

// Verify JS
let ss = html.indexOf("<script>") + 8;
let se = html.indexOf("</script>", ss);
let js = html.substring(ss, se);
fs.writeFileSync("work/_tmp_check.js", js, "utf8");
const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
if (r.stderr) console.log("JS ERROR:", r.stderr.substring(0, 400));
else console.log("JS syntax: OK!");
