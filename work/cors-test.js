const http = require("http");

http.get("http://localhost:3000/api/reviewer/projects", res => {
  console.log("Status:", res.statusCode);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
  let d = ""; res.on("data", c => d += c); res.on("end", () => {
    console.log("Body length:", d.length);
    try { let j = JSON.parse(d); console.log("Success:", j.success, "Total:", j.total); } catch(e) { console.log("Parse error:", e.message); }
  });
}).on("error", e => console.log("Error:", e.message));
