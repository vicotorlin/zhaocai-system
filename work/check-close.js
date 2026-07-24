const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
// Find closeProject with onclick context
let idx = html.indexOf("closeProject(");
console.log(html.substring(idx - 10, idx + 80));
