const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// Find the problematic closeProject line
let idx = html.indexOf("closeProject(");
while (idx >= 0) {
  let snippet = html.substring(idx - 5, idx + 60);
  console.log("Found at", idx, ":", snippet);
  idx = html.indexOf("closeProject(", idx + 1);
}
