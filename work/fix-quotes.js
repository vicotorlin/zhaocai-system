const fs = require("fs");
let html = fs.readFileSync("outputs/dashboard.html", "utf8");

// Fix the three problematic onclick handlers:
// onclick="alert('报价历史功能开发中')" → onclick="alert(\'报价历史功能开发中\')"
// onclick="alert('评分功能开发中')"   → onclick="alert(\'评分功能开发中\')"
// onclick="alert('商务评分功能开发中')" → onclick="alert(\'商务评分功能开发中\')"

let fixes = 0;

html = html.replace(
  /onclick="alert\('报价历史功能开发中'\)"/g,
  'onclick="alert(\\\'报价历史功能开发中\\\')"'
);
fixes++;

html = html.replace(
  /onclick="alert\('评分功能开发中'\)"/g,
  'onclick="alert(\\\'评分功能开发中\\\')"'
);
fixes++;

html = html.replace(
  /onclick="alert\('商务评分功能开发中'\)"/g,
  'onclick="alert(\\\'商务评分功能开发中\\\')"'
);
fixes++;

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Applied", fixes, "fixes. File size:", html.length);

// Verify
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);

try {
  new Function(js);
  console.log("JS syntax: OK - no more errors!");
} catch(e) {
  console.log("JS syntax STILL has error:", e.message);
}
