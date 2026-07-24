const fs = require("fs");
const p = require("path");
const root = p.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2");

// Fix root package.json for Railway
const pkg = {
  "name": "zhaocai-system",
  "version": "1.0.0",
  "scripts": {
    "start": "node server/server.js"
  },
  "engines": {
    "node": ">=18"
  }
};
fs.writeFileSync(p.join(root, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
console.log("Fixed root package.json");

// Create a railway.json or Procfile for Railway
// Railway uses nixpacks which auto-detects Node.js from package.json
// But we need the server's dependencies installed
// The server/package.json has dependencies, nixpacks should detect it
// Actually, let me create a nixpacks.toml for proper config
const nixpacksToml = `
[phases.setup]
nixPkgs = ["..."]

[phases.install]
cmds = ["cd server && npm install"]

[phases.build]
cmds = []

[start]
cmd = "node server/server.js"
`;
fs.writeFileSync(p.join(root, "nixpacks.toml"), nixpacksToml.trim(), "utf8");
console.log("Created nixpacks.toml");

console.log("\nReady to update git and push");
