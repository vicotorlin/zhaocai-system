var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");
console.log("Has techFileList:", h.includes('id="techFileList"'));
console.log("Has fileTech:", h.includes('id="fileTech"'));
console.log("Has cpTechParams:", h.includes('id="cpTechParams"'));
// Show the tech params section
var idx = h.indexOf('id="cpTechParams"');
console.log("\nTech params section:");
console.log(h.substring(idx - 200, idx + 400));
