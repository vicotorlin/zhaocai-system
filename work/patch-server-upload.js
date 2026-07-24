const fs = require("fs");
let server = fs.readFileSync("server/server.js", "utf8");

// 1. Add upload-handler require after nodemailer
server = server.replace(
  'const nodemailer = require("nodemailer");',
  'const nodemailer = require("nodemailer");\nconst uploadHandler = require("./upload-handler");'
);

// 2. Add uploads static directory after the existing express.static line
server = server.replace(
  'app.use(express.static(path.join(__dirname, "..", "outputs")));',
  'app.use(express.static(path.join(__dirname, "..", "outputs")));\napp.use("/uploads", express.static(path.join(__dirname, "..", "outputs", "uploads")));'
);

// 3. Update the create project endpoint to accept new fields
// Replace the existing POST /api/buyer/projects
const oldCreateProject = `app.post("/api/buyer/projects", (req, res) => {
  const { account, projectName, buyer, budget, deadline } = req.body;
  if (!account || !projectName) return res.json({ success: false, message: "参数不完整" });
  const user = userStore[account];
  if (!user || user.role !== "buyer") return res.json({ success: false, message: "无权限" });

  const id = "ZB-" + String(projectNextId++).padStart(3, "0");
  const project = {
    id, buyerAccount: account,
    projectName, buyer: buyer || account,
    budget: Number(budget) || 0,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open", createdAt: new Date().toISOString(),
  };
  projectStore.push(project);
  res.json({ success: true, data: project });
});`;

const newCreateProject = `app.post("/api/buyer/projects", (req, res) => {
  const { account, projectName, plan, channelVolume, deadline } = req.body;
  if (!account || !projectName) return res.json({ success: false, message: "参数不完整" });
  const user = userStore[account];
  if (!user || user.role !== "buyer") return res.json({ success: false, message: "无权限" });

  const id = "ZB-" + String(projectNextId++).padStart(3, "0");
  const project = {
    id, buyerAccount: account,
    projectName,
    plan: plan || "",              // 项目企划
    channelVolume: channelVolume || "",  // 渠道报量明细
    budget: 0,                     // 保留兼容但不再使用
    buyer: account,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open", createdAt: new Date().toISOString(),
  };
  projectStore.push(project);
  res.json({ success: true, data: project });
});`;

if (server.includes(oldCreateProject)) {
  server = server.replace(oldCreateProject, newCreateProject);
  console.log("✓ Updated create project endpoint");
} else {
  console.log("✗ Could not find create project endpoint to replace");
  // Try to find it
  let idx = server.indexOf('app.post("/api/buyer/projects"');
  if (idx >= 0) console.log("  Found at:", idx, "- Snippet:", server.substring(idx, idx + 200));
}

// 4. Add file upload endpoint before the "启动服务" section
const uploadEndpoints = `
// ===================== 文件上传接口 =====================

// 上传文件（Supabase Storage / 本地回退）
app.post("/api/upload", uploadHandler.upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: "请选择文件" });
  }

  try {
    const result = await uploadHandler.uploadFile(req.file, {
      projectId: req.body.projectId || null,
      uploadedBy: req.body.uploadedBy || "anonymous",
      uploadIp: req.ip || req.socket?.remoteAddress || "",
    });

    if (result.success) {
      console.log("[Upload] 文件上传成功:", req.file.originalname, "->", result.data.storage_path);
      res.json(result);
    } else {
      res.json(result);
    }
  } catch (e) {
    console.error("[Upload] 上传异常:", e.message);
    res.json({ success: false, message: "文件上传失败: " + e.message });
  }
});

// 获取项目的附件列表
app.get("/api/attachments/:projectId", (req, res) => {
  const attachments = uploadHandler.getAttachments(req.params.projectId);
  res.json({ success: true, data: attachments });
});

// 删除附件
app.delete("/api/attachments/:attachmentId", (req, res) => {
  const result = uploadHandler.deleteAttachment(req.params.attachmentId);
  res.json(result);
});

`;

server = server.replace(
  "// ===================== 启动服务 =====================",
  uploadEndpoints + "\n// ===================== 启动服务 ====================="
);
console.log("✓ Added upload endpoints");

// 5. Add Supabase init in the listen callback
const oldListen = `app.listen(PORT, () => {
  const smsOk = SMS_CONFIG.accessKeyId && SMS_CONFIG.accessKeySecret;
  const emailOk = EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass;`;

const newListen = `app.listen(PORT, () => {
  // 初始化 Supabase / 文件上传
  uploadHandler.initSupabase();
  const smsOk = SMS_CONFIG.accessKeyId && SMS_CONFIG.accessKeySecret;
  const emailOk = EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass;`;

server = server.replace(oldListen, newListen);
console.log("✓ Added Supabase init");

fs.writeFileSync("server/server.js", server, "utf8");
console.log("Server patched! New length:", server.length);
