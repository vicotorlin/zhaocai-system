const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

// Try to narrow down where the error is by splitting the JS
let lines = js.split('\n');
console.log("Total JS lines:", lines.length);

// Check each line for basic syntax
for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line || line.startsWith("//")) continue;
  try {
    new Function(line);
  } catch(e) {
    console.log("Line", i+1, "ERROR:", e.message.substring(0, 80));
    console.log("  Content:", line.substring(0, 120));
    if (i < 5) break; // Only show first 5 errors
  }
}
