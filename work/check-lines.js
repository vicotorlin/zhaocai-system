const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html","utf8");
let lines = html.split("\n");
// Find the problematic line
for (let i=0;i<lines.length;i++) {
  if (lines[i].includes("openSupplierBid") || lines[i].includes("closeProject(")) {
    console.log("Line",i+1,":",lines[i].trim().substring(0,200));
  }
}
