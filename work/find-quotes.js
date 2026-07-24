const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

// Let me find ALL places where single quotes appear inside onclick handlers
// that are themselves inside single-quoted JS strings
console.log("=== All onclick in JS ===");
let onclickPattern = /onclick="([^"]+)"/g;
let match;
while ((match = onclickPattern.exec(js)) !== null) {
  let content = match[1];
  // Check if this onclick content contains unescaped single quotes
  if (content.includes("'")) {
    console.log("PROBLEM onclick:", match[0]);
    // Get surrounding context
    let pos = match.index;
    console.log("  Context:", JSON.stringify(js.substring(pos - 30, pos + match[0].length + 30)));
  }
}

// Also check for general quote issues in string assignments
console.log("\n=== String assignment analysis ===");
// Find all .innerHTML = '...'
let ihPattern = /\.innerHTML\s*=\s*'((?:[^'\\]|\\.)*)'/g;
while ((match = ihPattern.exec(js)) !== null) {
  let str = match[1];
  if (str.includes("onclick=")) {
    console.log("innerHTML with onclick:");
    console.log("  Length:", str.length);
    // Check for unescaped quotes
    let parts = str.split("'");
    if (parts.length > 1) {
      console.log("  WARNING: string contains", parts.length - 1, "unescaped single quotes!");
    }
  }
}
