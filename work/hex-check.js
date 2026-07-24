const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// Find closeProject onclick and show hex bytes
let idx = html.indexOf("closeProject(");
let chunk = html.substring(idx, idx + 30);
console.log("Hex dump:");
for (let i = 0; i < chunk.length; i++) {
  let c = chunk.charCodeAt(i);
  if (c === 92) console.log("  POS", i, ": BACKSLASH (0x5C)");
  else if (c === 39) console.log("  POS", i, ": SINGLE QUOTE (0x27)");
  else console.log("  POS", i, ":", c.toString(16), String.fromCharCode(c));
}
