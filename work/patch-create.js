const fs = require("fs");
let server = fs.readFileSync("server/server.js", "utf8");

// Find the exact project creation function
let idx = server.indexOf('app.post("/api/buyer/projects", (req, res)');
let endIdx = server.indexOf("});", idx + 500);

// Replace with new version
let newEndpoint = `app.post("/api/buyer/projects", (req, res) => {
  const { account, projectName, plan, channelVolume, deadline } = req.body;
  if (!account || !projectName) return res.json({ success: false, message: "参数不完整" });
  const user = userStore[account];
  if (!user || user.role !== "buyer") return res.json({ success: false, message: "无权限" });

  const id = "ZB-" + String(projectNextId++).padStart(3, "0");
  const project = {
    id, buyerAccount: account,
    projectName,
    plan: plan || "",
    channelVolume: channelVolume || "",
    buyer: user.account,
    budget: 0,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open", createdAt: new Date().toISOString()
  };
  projectStore.push(project);
  res.json({ success: true, data: project });
});`;

server = server.substring(0, idx) + newEndpoint + server.substring(endIdx + 3);
fs.writeFileSync("server/server.js", server, "utf8");
console.log("✓ Updated create project endpoint. New length:", server.length);

// Verify
idx = server.indexOf('app.post("/api/buyer/projects"');
console.log("New endpoint:");
console.log(server.substring(idx, idx + 400));
