const fs = require("fs");
let js = fs.readFileSync("work/_tmp_check.js", "utf8");
let lines = js.split("\n");
console.log("Line 119:", lines[118]);
console.log("Line 120:", lines[119]);
console.log("Line 121:", lines[120]);
console.log("Line 122:", lines[121]);
console.log("Line 123:", lines[122]);
