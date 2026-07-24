const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let lines = html.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("openSupplierBid") || lines[i].includes("closeProject")) {
    console.log("Line " + (i+1) + ":");
    console.log(lines[i].trim().substring(0, 250));
    console.log("---");
  }
}
