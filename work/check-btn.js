var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");

// Check the button
var btnIdx = h.indexOf("showCreateProjectModal");
console.log("Button context:");
console.log(h.substring(btnIdx - 60, btnIdx + 80));

// Check if the function exists
var funcIdx = h.indexOf("function showCreateProjectModal");
console.log("\nFunction context:");
if (funcIdx > 0) {
  console.log(h.substring(funcIdx, funcIdx + 300));
} else {
  console.log("FUNCTION NOT FOUND!");
}

// Check for duplicate functions or syntax issues
var allFuncs = h.match(/function showCreateProjectModal/g);
console.log("\nOccurrences:", allFuncs ? allFuncs.length : 0);

// Check if modal element exists
console.log("\nHas createProjectModal:", h.includes('id="createProjectModal"'));
console.log("Has cpTechParams:", h.includes('id="cpTechParams"'));
