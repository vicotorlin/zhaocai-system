var fs = require("fs");
var server = fs.readFileSync("server/server.js", "utf8");

// Update create project endpoint to accept techParams
server = server.replace(
  "const { account, projectName, plan, channelVolume, deadline } = req.body;",
  "const { account, projectName, plan, channelVolume, techParams, deadline } = req.body;"
);

server = server.replace(
  "channelVolume: channelVolume || \"\",",
  "channelVolume: channelVolume || \"\",\n    techParams: techParams || \"\","
);

fs.writeFileSync("server/server.js", server, "utf8");
console.log("Server updated. Has techParams:", server.includes("techParams"));
