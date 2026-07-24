const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// Better approach: replace onclick alert handlers with data attributes
// And add a delegated click handler

html = html.replace(
  'onclick="alert(\\\'报价历史功能开发中\\\')"',
  'data-action="alert" data-msg="报价历史功能开发中"'
);

html = html.replace(
  'onclick="alert(\\\'评分功能开发中\\\')"',
  'data-action="alert" data-msg="评分功能开发中"'
);

html = html.replace(
  'onclick="alert(\\\'商务评分功能开发中\\\')"',
  'data-action="alert" data-msg="商务评分功能开发中"'
);

// Also need to handle the other onclick in table: onclick="openSupplierBid('+p.id+')"
// and onclick="closeProject('+p.id+')"
// These are in JS template strings using single quotes as the outer delimiter
// But these use JS variables inside the onclick, so they're different
// Let me check if these are problematic

// Actually, now let me add the delegated event handler in the JS
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

// Add delegated click handler after buildSidebar
// Listen for clicks on data-action elements
let delegHandler = `
// 委托事件：处理 data-action 按钮
document.addEventListener("click", function(e) {
  var target = e.target.closest("[data-action]");
  if (!target) return;
  var action = target.getAttribute("data-action");
  if (action === "alert") {
    var msg = target.getAttribute("data-msg") || "";
    alert(msg);
  }
});
`;

// Insert before the initialization block (before buildSidebar)
js = js.replace("buildSidebar();", delegHandler + "\nbuildSidebar();");

// Reconstruct HTML
let newHtml = html.substring(0, scriptStart + 8) + js + html.substring(scriptEnd);
fs.writeFileSync("outputs/dashboard.html", newHtml, "utf8");

// Verify
let finalHtml = fs.readFileSync("outputs/dashboard.html", "utf8");
let finalScriptStart = finalHtml.indexOf("<script>");
let finalScriptEnd = finalHtml.indexOf("</script>", finalScriptStart);
let finalJs = finalHtml.substring(finalScriptStart + 8, finalScriptEnd);

try {
  new Function(finalJs);
  console.log("JS syntax: OK!");
} catch(e) {
  console.log("JS syntax error:", e.message);
}
