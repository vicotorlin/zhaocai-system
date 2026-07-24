const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

// Find openSupplierBid context - raw content
let osbIdx = js.indexOf("openSupplierBid");
console.log("=== openSupplierBid context (raw) ===");
console.log(js.substring(Math.max(0, osbIdx - 50), osbIdx + 80));

// Find closeProject context - raw
let cpIdx = js.indexOf("closeProject");
console.log("\n=== closeProject context (raw) ===");
console.log(js.substring(Math.max(0, cpIdx - 50), cpIdx + 80));

// Also find the actual table row template code
console.log("\n=== Table row with onclick ===");
let rowIdx = js.indexOf("openSupplierBid(");
// Go back to find the beginning of this string
let searchStart = Math.max(0, rowIdx - 200);
let chunk = js.substring(searchStart, rowIdx + 100);
console.log(chunk);
