const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

// The onclick with '' pattern: onclick="openSupplierBid(''+p.id+'')"
// In the raw JS, this might be causing issues because the JS parser 
// sees the single quotes

// Let me find and display the exact content around openSupplierBid in raw format
let idx = js.indexOf("openSupplierBid(");
console.log("=== HEX dump around openSupplierBid ===");
let chunk = js.substring(idx - 20, idx + 40);
for (let i = 0; i < chunk.length; i++) {
  let c = chunk.charCodeAt(i);
  console.log(i, c.toString(16).padStart(2, '0'), c > 31 && c < 127 ? chunk[i] : '.');
}

console.log("\n=== String content ===");
console.log(JSON.stringify(chunk));
