var fs = require("fs");
var h = fs.readFileSync("outputs/dashboard.html", "utf8");

// Show the full modal HTML
var start = h.indexOf("<!-- Create Project Modal -->");
var end = h.indexOf("<script>", start);
var modal = h.substring(start, end);
console.log(modal);
