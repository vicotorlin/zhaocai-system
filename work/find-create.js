const fs = require("fs");
let server = fs.readFileSync("server/server.js", "utf8");
let idx = server.indexOf('app.post("/api/buyer/projects"');
console.log(server.substring(idx, idx + 600));
