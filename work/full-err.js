const cp = require("child_process");
let r = cp.spawnSync("node", ["--check", "work/_tmp_check.js"], { encoding: "utf8" });
console.log("FULL ERROR:");
console.log(r.stderr);
