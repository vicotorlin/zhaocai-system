/**
 * 招采管理系统 - API 服务器 (Supabase/PostgreSQL)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const uploadHandler = require("./upload-handler");
const XLSX = require("xlsx");
const db = require("./supabase-client");
const sms = require("./sms-client");

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

const SMS_CONFIG = {
  accessKeyId: process.env.SMS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || "",
  signName: process.env.SMS_SIGN_NAME || "招采系统",
  templateCode: process.env.SMS_TEMPLATE_CODE || "SMS_123456789",
};

const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

const CODE_EXPIRE_SECONDS = 300;
const CODE_RESEND_INTERVAL = 60;

// ===================== 工具函数 =====================
function generateCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function isValidPhone(str) { return /^1[3-9]\d{9}$/.test(str); }
function isValidEmail(str) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); }
function detectAccountType(account) {
  if (isValidPhone(account)) return "phone";
  if (isValidEmail(account)) return "email";
  return null;
}
function now() { return Date.now(); }

function parseField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; }
  }
  return [];
}

// ===================== SMTP =====================
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) return null;
  try {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log("[SMTP] 已配置邮件: " + EMAIL_CONFIG.auth.user);
    return transporter;
  } catch (e) { console.warn("[SMTP] 配置失败:", e.message); return null; }
}

// ===================== Express =====================
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
// ?????????????? JSON ??????
app.use("/uploads", express.static(path.join(__dirname, "..", "outputs", "uploads"), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Disposition", "attachment");
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
}));

app.use(express.static(path.join(__dirname, "..", "outputs"), {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
}));
// 本地文件下载服务



// ===================== 认证 APIs =====================

// 发送验证码
app.post("/api/send-code", async (req, res) => {
  const { account } = req.body;
  if (!account) return res.json({ success: false, message: "请输入账号" });
  const type = detectAccountType(account);
  if (!type) return res.json({ success: false, message: "请输入正确的手机号或邮箱" });

  // 检查重发间隔
  const dbRecord = await db.getVerificationCode(account).catch(() => null);
  if (dbRecord) {
    const lastSent = new Date(dbRecord.last_sent_at).getTime();
    if (now() - lastSent < CODE_RESEND_INTERVAL * 1000) {
      return res.json({ success: false, message: "请60秒后再试" });
    }
  }

  const code = generateCode();
  const expiresAt = now() + CODE_EXPIRE_SECONDS * 1000;

  // Supabase 存储
  await db.saveVerificationCode(account, code, expiresAt).catch(e => console.warn("[DB] saveCode:", e.message));

  if (!IS_PROD) {
    console.log("[DEV] " + account + " -> " + code);
    return res.json({ success: true, message: "验证码已发送（开发模式）", code, dev: true });
  }

  if (type === "email") {
    const t = getTransporter();
    if (!t) {
      console.log("[邮件] " + account + " -> " + code + " (SMTP未配置)");
      return res.json({ success: true, message: "验证码已生成（邮件服务未配置）", code: code });
    }
    t.sendMail({
      from: EMAIL_CONFIG.auth.user,
      to: account,
      subject: "招采系统 - 验证码",
      text: "您的验证码是：" + code + "，5分钟内有效",
      html: '<div style="padding:20px;font-family:sans-serif"><h2>招采系统</h2><p>您的验证码是：<strong style="font-size:24px;color:#2563eb">' + code + '</strong></p><p>该验证码5分钟内有效，请勿泄露。</p></div>',
    }).then(() => console.log("[邮件] 已发送至 " + account))
      .catch(e => console.error("[邮件] 发送失败:", e.message));
    return res.json({ success: true, message: "验证码已发送至邮箱" });
  }

  // 通过阿里云短信发送
  sms.sendSMS(account, code).then(result => {
    if (!result.success) {
      console.log("[短信] " + account + " -> " + code + " (发送失败，降级为直接返回)");
    }
  }).catch(e => console.error("[短信] 错误:", e.message));
  
  // 开发模式直接返回验证码
  if (!IS_PROD && !sms.isAvailable()) {
    console.log("[短信] " + account + " -> " + code + " (开发模式)");
  }
  res.json({ success: true, message: "验证码已发送" });
});

// 校验验证码
app.post("/api/verify-code", async (req, res) => {
  const { account, code } = req.body;
  if (!account || !code) return res.json({ success: false, message: "参数缺失" });

  const record = await db.getVerificationCode(account).catch(() => null);
  if (!record) return res.json({ success: false, message: "请先获取验证码" });
  if (new Date(record.expires_at).getTime() < now()) {
    return res.json({ success: false, message: "验证码已过期" });
  }
  if (record.code !== code) return res.json({ success: false, message: "验证码错误" });

  await db.markCodeVerified(account).catch(() => {});

  const token = Buffer.from(JSON.stringify({ account, timestamp: now() })).toString("base64");
  res.json({ success: true, message: "验证成功", token });
});


// 审批令牌生成
const APPROVAL_SECRET = "zhaocai_approval_2026";
function generateApprovalToken(account) {
  return crypto.createHmac("sha256", APPROVAL_SECRET).update(account + "_" + Date.now()).digest("hex").substring(0, 16);
}
const approvalTokens = {}; // account -> token mapping

// 发送审批邮件
async function sendApprovalEmail(account, role) {
  const token = generateApprovalToken(account);
  approvalTokens[account] = token;
  const roleName = { buyer: "采购方", reviewer: "评审专家", admin: "管理员" }[role] || role;
  const approveUrl = "http://localhost:3000/api/admin/approve-by-email?account=" + encodeURIComponent(account) + "&action=active&token=" + token;
  const rejectUrl = "http://localhost:3000/api/admin/approve-by-email?account=" + encodeURIComponent(account) + "&action=rejected&token=" + token;
  
  const html = '<div style="padding:24px;font-family:sans-serif;max-width:500px">' +
    '<h2 style="color:#2c5364">招采系统 - 用户注册审批</h2>' +
    '<p>新用户 <strong>' + account + '</strong> 申请注册为 <strong style="color:#e67e22">' + roleName + '</strong></p>' +
    '<p>请审核：</p>' +
    '<div style="margin:20px 0">' +
    '<a href="' + approveUrl + '" style="display:inline-block;padding:12px 28px;background:#27ae60;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;margin-right:12px">✓ 审核通过</a>' +
    '<a href="' + rejectUrl + '" style="display:inline-block;padding:12px 28px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:6px;font-size:16px">✗ 审核不通过</a>' +
    '</div>' +
    '<p style="color:#999;font-size:12px">如按钮无法点击，请复制以下链接：<br>通过：' + approveUrl + '<br>不通过：' + rejectUrl + '</p>' +
    '</div>';
  
  const t = getTransporter();
  if (!t) { console.error("[审批邮件] 邮件服务未配置"); return; }
  t.sendMail({
    from: EMAIL_CONFIG.auth.user,
    to: "linguodong@corp.netease.com",
    subject: "【招采系统】用户注册审批 - " + account + " (" + roleName + ")",
    html: html,
  }).then(() => console.log("[审批邮件] 已发送至 linguodong@corp.netease.com"))
    .catch(e => console.error("[审批邮件] 发送失败:", e.message));
}

// 注册
app.post("/api/register", async (req, res) => {
  const { role, account, password, code, token, name } = req.body;
  if (!role || !account || !password || !code) return res.json({ success: false, message: "请填写所有必填项" });
  const validRoles = ["supplier", "buyer", "reviewer", "admin"];
  if (!validRoles.includes(role)) return res.json({ success: false, message: "角色无效" });
  if (!detectAccountType(account)) return res.json({ success: false, message: "请输入正确的手机号或邮箱" });
  if (password.length < 6 || password.length > 20) return res.json({ success: false, message: "密码长度应为6-20位" });
  if (!token) return res.json({ success: false, message: "请先完成验证码验证" });

  let tokenData;
  try { tokenData = JSON.parse(Buffer.from(token, "base64").toString()); }
  catch { return res.json({ success: false, message: "Token无效" }); }
  if (tokenData.account !== account) return res.json({ success: false, message: "Token与账号不匹配" });
  if (now() - tokenData.timestamp > CODE_EXPIRE_SECONDS * 1000) return res.json({ success: false, message: "Token已过期" });

  const record = await db.getVerificationCode(account).catch(() => null);
  if (!record || !record.verified) return res.json({ success: false, message: "请先完成验证码验证" });
  if (record.code !== code) return res.json({ success: false, message: "验证码错误" });

  // 检查用户是否已存在
  const existingUser = await db.getUser(account).catch(() => null);
  if (existingUser) return res.json({ success: false, message: "该账号已注册" });

  // 创建用户
  const userStatus = "pending";  // 所有角色注册均需审批
  await db.createUser(account, role, password, userStatus, name || "").catch(e => {
    console.error("[DB] createUser:", e.message);
    return res.json({ success: false, message: "注册失败，请稍后重试" });
  });

  console.log("[注册] " + account + " (" + role + ") status=" + userStatus);
  // 发送审批邮件（非供应商）
  try { sendApprovalEmail(account, role); } catch(e) { console.error("[审批邮件] 调用失败:", e.message); }
  const msg = "注册成功，请等待管理员审核";
  res.json({ success: true, message: msg });
});

// 登录
app.post("/api/login", async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) return res.json({ success: false, message: "请输入账号和密码" });

  const user = await db.getUser(account).catch(() => null);
  if (!user) return res.json({ success: false, message: "账号不存在" });
  if (user.password !== password) return res.json({ success: false, message: "密码错误" });

  // 检查审核状态
  if (user.status === "pending") {
    return res.json({ success: false, message: "账号正在审核中，请等待管理员审核通过后再登录" });
  }
  if (user.status === "rejected") {
    return res.json({ success: false, message: "账号审核未通过，请联系管理员" });
  }

  // 检查角色匹配（如果提供了role参数）
  const { role: reqRole } = req.body;
  if (reqRole && reqRole !== user.role) {
    return res.json({ success: false, message: "账号与所选身份不匹配" });
  }

  console.log("[登录] " + account + " (" + user.role + ")");
  res.json({
    success: true,
    data: { account: user.account, role: user.role, name: user.name || user.account },
    message: "登录成功",
  });
});

// ===================== 采购方 APIs =====================

// 获取采购方项目列表
app.get("/api/buyer/projects", async (req, res) => {
  const allProjects = await db.getAllProjects().catch(() => []);
  const allBids = await db.getAllBids().catch(() => []);

  const allUsers = await db.getAllUsers().catch(() => []);
    const userMap = {};
    allUsers.forEach(u => { userMap[u.account] = u; });
    const enriched = allProjects.map(p => {
    const quotes = allBids.filter(q => q.project_id === p.id);
    const quoteCount = quotes.length;
    const totalAmounts = quotes.map(q => Number(q.total) || 0).filter(t => t > 0);
    const lowestBid = totalAmounts.length > 0 ? Math.min(...totalAmounts) : null;
    // For closed projects, use stored winning_supplier; for open, show composite winner
    let winningSupplierName = p.winning_supplier || null;
    // For open projects, calculate composite score winner
    if (p.status === "open" && quotes.length > 0) {
      const SUPPLIER_SCORES = {"优质纺织供应商":{delivery:92,quality:88},"恒源纺织有限公司":{delivery:85,quality:90},"鑫达家纺有限公司":{delivery:95,quality:85},"华锦高端家纺":{delivery:88,quality:95},"云锦纺织科技":{delivery:90,quality:87}};
      let bestSup = null, bestComp = -1;
      quotes.forEach(q => {
        let specs = q.specs || [];
        if (typeof specs === "string") try { specs = JSON.parse(specs); } catch(e) { specs = []; }
        let totalComp = 0, totalSp = 0;
        if (specs.length === 0) {
          let ss = SUPPLIER_SCORES[q.supplier_name] || {delivery:80,quality:80};
          totalComp = ss.delivery*0.25 + ss.quality*0.25;
          totalSp = 1;
        } else {
          specs.forEach(sp => {
            let spTotal = (sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0) +
              (sp.items||[]).reduce((s,it) => s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0), 0);
            let allSpTotals = [];
            quotes.forEach(qq => {
              let qqSp = qq.specs || [];
              if (typeof qqSp === "string") try { qqSp = JSON.parse(qqSp); } catch(e) { qqSp = []; }
              qqSp.forEach(ssp => {
                if (ssp.name === sp.name || (!sp.name && !ssp.name)) {
                  let st = (ssp.laborCost||0)+(ssp.manufacturingCost||0)+(ssp.adminCost||0)+(ssp.profit||0)+(ssp.tax||0) +
                    (ssp.items||[]).reduce((s,it) => s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0), 0);
                  if (st > 0) allSpTotals.push(st);
                }
              });
            });
            let minSp = allSpTotals.length > 0 ? Math.min(...allSpTotals) : 0;
            let ps = minSp > 0 ? Math.round((minSp/spTotal)*10000)/100 : 0;
            let ss = SUPPLIER_SCORES[q.supplier_name] || {delivery:80,quality:80};
            let comp = Math.round((ps*0.5 + ss.delivery*0.25 + ss.quality*0.25)*100)/100;
            totalComp += comp; totalSp++;
          });
        }
        let avg = totalSp > 0 ? totalComp/totalSp : 0;
        if (avg > bestComp) { bestComp = avg; bestSup = q.supplier_name; }
      });
      winningSupplierName = bestSup;
    }
    return {
      id: p.id,
      buyerAccount: p.buyer_account,
      projectName: p.project_name,
      buyer: p.buyer_account, buyerName: (userMap[p.buyer_account] && userMap[p.buyer_account].name) || p.buyer_account,
      budget: Number(p.budget) || 0,
      deadline: p.deadline,
      status: p.status,
      createdAt: p.created_at,
      plan: p.plan || "",
      channelDetails: p.channel_details || "",
      techParams: p.tech_params || "",
      attachments: p.attachments || [],
      quoteCount,
      lowestBid,
      winningSupplier: winningSupplierName,
    };
  });

  res.json({ success: true, total: enriched.length, data: enriched });
});


// 获取单个项目详情（含附件）
app.get("/api/projects/:id", async (req, res) => {
  const allProjects = await db.getAllProjects().catch(() => []);
  const project = allProjects.find(p => p.id === req.params.id);
  if (!project) return res.json({ success: false, message: "项目不存在" });
  res.json({
    success: true,
    data: {
      id: project.id,
      buyerAccount: project.buyer_account,
      projectName: project.project_name,
      buyer: project.buyer,
      budget: Number(project.budget) || 0,
      deadline: project.deadline,
      status: project.status,
      createdAt: project.created_at,
      plan: project.plan || "",
      channelDetails: project.channel_details || "",
      techParams: project.tech_params || "",
      attachments: project.attachments || [],
    },
  });
});

// 发布项目
app.post("/api/buyer/projects", async (req, res) => {
  const { buyerAccount, projectName, buyer, deadline, plan, channelDetails, techParams, attachments } = req.body;
  if (!buyerAccount || !projectName) return res.json({ success: false, message: "请填写项目名称" });

  const nextId = await db.getNextProjectId().catch(() => 1);
  const id = "ZB-" + String(nextId).padStart(3, "0");
  const buyerUser = await db.getUser(buyerAccount).catch(() => null);
  const buyerName = buyerUser ? (buyerUser.name || buyerAccount) : buyerAccount;
  const project = {
    id,
    buyer_account: buyerAccount,
    buyer_name: buyerName,
    project_name: projectName,
    buyer: buyer || buyerAccount,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    plan: plan || "",
    tech_params: techParams || "",
    channel_details: channelDetails || "",
    attachments: attachments || [],
    status: "open",
  };

  await db.createProject(project).catch(e => {
    console.error("[DB] createProject:", e.message);
    return res.json({ success: false, message: "创建项目失败" });
  });

  // Save attachments to memory store
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      uploadHandler.addAttachment({
        projectId: id,
        fileName: att.fileName,
        fileSize: att.fileSize,
        fileType: att.fileType,
        fileUrl: att.fileUrl,
        uploadedBy: buyerAccount,
      });
    });
  }

  console.log("[项目] " + id + " " + projectName + " (by " + buyerAccount + ")");
  res.json({
    success: true,
    data: {
      id: project.id,
      buyerAccount: project.buyer_account,
      projectName: project.project_name,
      buyer: project.buyer,
      deadline: project.deadline,
      plan: project.plan,
      techParams: project.tech_params,
      channelDetails: project.channel_details,
      attachments: project.attachments,
      status: project.status,
      createdAt: new Date().toISOString(),
    },
  });
});

// 更新项目
app.put("/api/buyer/projects/:id", async (req, res) => {
  const projectId = req.params.id;
  const { status, projectName, buyer, budget, deadline } = req.body;

  const project = await db.getProject(projectId).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });

  const updates = {};
  if (status) updates.status = status;
  if (projectName) updates.project_name = projectName;
  if (buyer) updates.buyer = buyer;
  if (budget !== undefined) updates.budget = Number(budget);
  if (deadline) updates.deadline = deadline;

  if (Object.keys(updates).length === 0) return res.json({ success: false, message: "无更新内容" });

  await db.updateProject(projectId, updates).catch(e => console.error("[DB] updateProject:", e.message));

  const updated = await db.getProject(projectId).catch(() => null);
  res.json({
    success: true,
    data: updated ? {
      id: updated.id,
      buyerAccount: updated.buyer_account,
      projectName: updated.project_name,
      buyer: updated.buyer,
      budget: Number(updated.budget) || 0,
      deadline: updated.deadline,
      status: updated.status,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    } : project,
  });
});

// 查看项目所有报价
app.get("/api/buyer/quotes/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  const project = await db.getProject(projectId).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });

  const bids = await db.getBidsByProject(projectId).catch(() => []);

    // Normalize items/specs (handle JSON string from old data)
  const quotes = bids.map(b => ({
    id: b.id,
    projectId: b.project_id,
    supplierAccount: b.supplier_account,
    supplierName: b.supplier_name,
    items: parseField(b.items),
    specs: parseField(b.specs),
    total: Number(b.total) || 0,
    laborCost: Number(b.labor_cost) || 0,
    manufacturingCost: Number(b.manufacturing_cost) || 0,
    adminCost: Number(b.admin_cost) || 0,
    profit: Number(b.profit) || 0,
    tax: Number(b.tax) || 0,
    category: b.category,
    validity: b.validity,
    attachments: b.attachments || [],
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }));

  
  // 串标检测：检查相同IP或UA
  const collusionWarnings = [];
  const ipMap = {};
  const uaMap = {};
  bids.forEach(b => {
    const ip = b.submit_ip || "";
    const ua = (b.submit_ua || "").substring(0, 100);
    if (ip) {
      if (!ipMap[ip]) ipMap[ip] = [];
      ipMap[ip].push(b.supplier_name || b.supplier_account);
    }
    if (ua) {
      if (!uaMap[ua]) uaMap[ua] = [];
      uaMap[ua].push(b.supplier_name || b.supplier_account);
    }
  });
  Object.entries(ipMap).forEach(([ip, suppliers]) => {
    if (suppliers.length > 1) {
      collusionWarnings.push({ type: "ip", detail: "相同IP报价", ip, suppliers });
    }
  });
  Object.entries(uaMap).forEach(([ua, suppliers]) => {
    if (suppliers.length > 1) {
      collusionWarnings.push({ type: "ua", detail: "相同浏览器/设备报价", ua, suppliers });
    }
  });

  const buyerUser2 = await db.getUser(project.buyer_account).catch(() => null);
  res.json({ success: true, total: quotes.length, data: quotes, collusionWarnings, project: {
    id: project.id,
    projectName: project.project_name || "",
    buyer: project.buyer_account || "", buyerName: (buyerUser2 && buyerUser2.name) || project.buyer_account || "",
    budget: project.budget || 0,
    deadline: project.deadline || "",
    status: project.status || "open"
  } });
});

// ===================== 供应商 APIs =====================

// 提交报价
app.post("/api/supplier/bid", async (req, res) => {
  const {
    projectId, supplierAccount, supplierName,
    items, specs, total, laborCost, manufacturingCost,
    adminCost, profit, tax, category, validity, attachments,
  } = req.body;

  if (!projectId || !supplierAccount) {
    return res.json({ success: false, message: "缺少项目或供应商信息" });
  }

  const project = await db.getProject(projectId).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });
  if (project.status !== "open") return res.json({ success: false, message: "项目已关闭，不可报价" });

  // 计算物料汇总金额
  let computedTotal = 0;
  if (items && Array.isArray(items)) {
    computedTotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0), 0);
  }
  const finalTotal = total !== undefined ? Number(total) : computedTotal;

  // 检查是否已有报价
  const existingBid = await db.getBidBySupplierAndProject(supplierAccount, projectId).catch(() => null);

  
  // 计算报价内容哈希（防篡改）
  // 规范化：排序键值确保 JSONB 往返后哈希一致
  const sortKeys = (obj) => {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === "object") {
      return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
    }
    return obj;
  };
  const sortItems = (arr) => [...(arr || [])].sort((a, b) =>
    (a.materialCode || a.name || "").localeCompare(b.materialCode || b.name || "")
  );
  const hashContent = JSON.stringify(sortKeys({
    project_id: projectId,
    supplier_account: supplierAccount,
    total: finalTotal,
    labor_cost: Number(laborCost) || 0,
    manufacturing_cost: Number(manufacturingCost) || 0,
    admin_cost: Number(adminCost) || 0,
    profit: Number(profit) || 0,
    tax: Number(tax) || 0,
    items: sortItems(items || []),
    specs: sortKeys(specs || []),
  }));
  const bidHash = crypto.createHash("sha256").update(hashContent, "utf8").digest("hex");
  
  const bidData = {
    project_id: projectId,
    project_name: project.project_name || "",
    supplier_account: supplierAccount,
    supplier_name: supplierName || supplierAccount,
    items: items || [],
    specs: specs || [],
    total: finalTotal,
    labor_cost: Number(laborCost) || 0,
    manufacturing_cost: Number(manufacturingCost) || 0,
    admin_cost: Number(adminCost) || 0,
    profit: Number(profit) || 0,
    tax: Number(tax) || 0,
    category: category || "",
    validity: validity || "",
    status: "submitted",
    content_hash: bidHash,
    attachments: attachments || [],
    submit_ip: req.ip || req.socket?.remoteAddress || "",
    submit_ua: (req.headers["user-agent"] || "").substring(0, 500),
  };

  let result;
  if (existingBid) {
    result = await db.updateBid(existingBid.id, bidData).catch(e => {
      console.error("[DB] updateBid:", e.message);
      return null;
    });
    console.log("[报价] " + supplierAccount + " 更新 " + projectId + " ¥" + finalTotal);
  } else {
    result = await db.createBid(bidData).catch(e => {
      console.error("[DB] createBid:", e.message);
      return null;
    });
    console.log("[报价] " + supplierAccount + " -> " + projectId + " ¥" + finalTotal);
  }

  if (!result) return res.json({ success: false, message: "提交报价失败" });

  res.json({
    success: true,
    data: {
      id: result.id || existingBid?.id,
      projectId,
      supplierAccount,
      supplierName: supplierName || supplierAccount,
      items,
      specs,
      total: finalTotal,
      laborCost: Number(laborCost) || 0,
      manufacturingCost: Number(manufacturingCost) || 0,
      adminCost: Number(adminCost) || 0,
      profit: Number(profit) || 0,
      tax: Number(tax) || 0,
      category: category || "",
      validity: validity || "",
      attachments: attachments || [],
      status: "submitted",
      createdAt: result.created_at || new Date().toISOString(),
      updatedAt: result.updated_at || new Date().toISOString(),
    },
  });
});

// 供应商报价列表
app.get("/api/supplier/bids", async (req, res) => {
  const { account } = req.query;
  if (!account) return res.json({ success: false, message: "缺少账号参数" });

  const user = await db.getUser(account).catch(() => null);
  if (!user || user.role !== "supplier") return res.json({ success: false, message: "无权限" });

  const allBids = await db.getAllBids().catch(() => []);
  const allProjects = await db.getAllProjects().catch(() => []);

  const myBids = allBids
    .filter(b => b.supplier_account === account)
    .map(b => {
      const project = allProjects.find(p => p.id === b.project_id);
      return {
        id: b.id,
        projectId: b.project_id,
        supplierAccount: b.supplier_account,
        supplierName: b.supplier_name,
        items: parseField(b.items),
        specs: parseField(b.specs),
        total: Number(b.total) || 0,
        laborCost: Number(b.labor_cost) || 0,
        manufacturingCost: Number(b.manufacturing_cost) || 0,
        adminCost: Number(b.admin_cost) || 0,
        profit: Number(b.profit) || 0,
        tax: Number(b.tax) || 0,
        category: b.category,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        projectName: project ? project.project_name : "",
        projectDeadline: project ? project.deadline : null,
        projectStatus: project ? project.status : "unknown",
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, total: myBids.length, data: myBids });
});

// 单个报价详情
app.get("/api/supplier/bid/:id", async (req, res) => {
  const { account } = req.query;
  if (!account) return res.json({ success: false, message: "缺少账号参数" });

  const bid = await db.getBid(req.params.id).catch(() => null);
  if (!bid || bid.supplier_account !== account) {
    return res.json({ success: false, message: "报价不存在或无权限" });
  }

  const project = await db.getProject(bid.project_id).catch(() => null);
  res.json({
    success: true,
    data: {
      id: bid.id,
      projectId: bid.project_id,
      supplierAccount: bid.supplier_account,
      supplierName: bid.supplier_name,
      items: bid.items,
      specs: bid.specs,
      total: Number(bid.total) || 0,
      laborCost: Number(bid.labor_cost) || 0,
      manufacturingCost: Number(bid.manufacturing_cost) || 0,
      adminCost: Number(bid.admin_cost) || 0,
      profit: Number(bid.profit) || 0,
      tax: Number(bid.tax) || 0,
      category: bid.category,
      createdAt: bid.created_at,
      updatedAt: bid.updated_at,
      projectName: project ? project.project_name : "",
      projectDeadline: project ? project.deadline : null,
    },
  });
});

// 修改报价
app.put("/api/supplier/bid/:id", async (req, res) => {
  const { account, items, total, laborCost, manufacturingCost, adminCost, profit, tax, specs, category, validity } = req.body;
  if (!account) return res.json({ success: false, message: "缺少账号参数" });

  const bid = await db.getBid(req.params.id).catch(() => null);
  if (!bid || bid.supplier_account !== account) {
    return res.json({ success: false, message: "报价不存在或无权限" });
  }

  const project = await db.getProject(bid.project_id).catch(() => null);
  if (!project || project.status !== "open") {
    return res.json({ success: false, message: "项目已关闭不可修改" });
  }

  let computedTotal = 0;
  if (items && Array.isArray(items)) {
    computedTotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0), 0);
  }
  const finalTotal = total !== undefined ? Number(total) : computedTotal;

  const updates = {};
  if (items) updates.items = items;
  if (specs !== undefined) updates.specs = specs;
  updates.total = finalTotal;
  if (laborCost !== undefined) updates.labor_cost = Number(laborCost) || 0;
  if (manufacturingCost !== undefined) updates.manufacturing_cost = Number(manufacturingCost) || 0;
  if (adminCost !== undefined) updates.admin_cost = Number(adminCost) || 0;
  if (profit !== undefined) updates.profit = Number(profit) || 0;
  if (tax !== undefined) updates.tax = Number(tax) || 0;
  if (category !== undefined) updates.category = category;
  if (validity !== undefined) updates.validity = validity;

  
  // 重算哈希
  const sortKeys = (obj) => {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === "object") {
      return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
    }
    return obj;
  };
  const sortItems = (arr) => [...(arr || [])].sort((a, b) =>
    (a.materialCode || a.name || "").localeCompare(b.materialCode || b.name || "")
  );
  const updateHashContent = JSON.stringify(sortKeys({
    project_id: bid.project_id,
    supplier_account: account,
    total: finalTotal,
    labor_cost: Number(laborCost) || 0,
    manufacturing_cost: Number(manufacturingCost) || 0,
    admin_cost: Number(adminCost) || 0,
    profit: Number(profit) || 0,
    tax: Number(tax) || 0,
    items: sortItems(items || bid.items || []),
    specs: sortKeys(specs !== undefined ? specs : (bid.specs || [])),
  }));
  updates.content_hash = crypto.createHash("sha256").update(updateHashContent, "utf8").digest("hex");

  const result = await db.updateBid(req.params.id, updates).catch(e => {
    console.error("[DB] updateBid:", e.message);
    return null;
  });

  if (!result) return res.json({ success: false, message: "更新失败" });

  console.log("[修改] " + account + " 更新 " + req.params.id);
  res.json({
    success: true,
    data: {
      id: result.id || bid.id,
      projectId: bid.project_id,
      supplierAccount: account,
      supplierName: result.supplier_name || bid.supplier_name,
      items: items || bid.items,
      specs: specs !== undefined ? specs : bid.specs,
      total: finalTotal,
      laborCost: Number(result.labor_cost) || 0,
      manufacturingCost: Number(result.manufacturing_cost) || 0,
      adminCost: Number(result.admin_cost) || 0,
      profit: Number(result.profit) || 0,
      tax: Number(result.tax) || 0,
      category: result.category || bid.category,
      validity: result.validity || bid.validity,
      updatedAt: result.updated_at || new Date().toISOString(),
    },
    message: "报价已更新",
  });
});

// ===================== 评审专家 APIs =====================

app.get("/api/reviewer/projects", async (req, res) => {
  const allProjects = await db.getAllProjects().catch(() => []);
  const allBids = await db.getAllBids().catch(() => []);

  const allUsers = await db.getAllUsers().catch(() => []);
  const userMap = {};
  allUsers.forEach(u => { userMap[u.account] = u; });
  const enriched = allProjects.map(p => {
    const quotes = allBids.filter(q => q.project_id === p.id);
    const quoteCount = quotes.length;
    const totalAmounts = quotes.map(q => Number(q.total) || 0).filter(t => t > 0);
    const lowestBid = totalAmounts.length > 0 ? Math.min(...totalAmounts) : null;
    const winningSupplier = quotes.find(q => Number(q.total) === lowestBid);
    return {
      id: p.id,
      buyerAccount: p.buyer_account,
      projectName: p.project_name,
      buyer: p.buyer_account, buyerName: (userMap[p.buyer_account] && userMap[p.buyer_account].name) || p.buyer_account,
      budget: Number(p.budget) || 0,
      deadline: p.deadline,
      status: p.status,
      createdAt: p.created_at,
      quoteCount,
      lowestBid,
      winningSupplier: winningSupplier ? winningSupplier.supplier_name : null,
    };
  });

  res.json({ success: true, total: enriched.length, data: enriched });
});


// 关闭项目（截止报价）
app.post("/api/buyer/projects/:id/close", async (req, res) => {
  const { id } = req.params;
  const { account } = req.body;
  if (!account) return res.json({ success: false, message: "缺少账号参数" });
  const project = await db.getProject(id).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });
  if (project.status !== "open") return res.json({ success: false, message: "项目已截止" });
  
  // Get all bids for this project
  const allBids = await db.getAllBids().catch(() => []);
  const quotes = allBids.filter(q => q.project_id === id);
  
  // Calculate composite score winner
  // SUPPLIER_SCORES from frontend - hardcoded for server
  const SUPPLIER_SCORES = {"优质纺织供应商":{delivery:92,quality:88},"恒源纺织有限公司":{delivery:85,quality:90},"鑫达家纺有限公司":{delivery:95,quality:85},"华锦高端家纺":{delivery:88,quality:95},"云锦纺织科技":{delivery:90,quality:87}};
  
  let bestSupplier = null;
  let bestComposite = -1;
  
  quotes.forEach(q => {
    let specs = q.specs || [];
    if (typeof specs === "string") try { specs = JSON.parse(specs); } catch(e) { specs = []; }
    let totalComposite = 0;
    let totalSpecs = 0;
    
    if (specs.length === 0 && q.items) {
      let items = q.items;
      if (typeof items === "string") try { items = JSON.parse(items); } catch(e) { items = []; }
      let ct = (q.labor_cost||0)+(q.manufacturing_cost||0)+(q.admin_cost||0)+(q.profit||0)+(q.tax||0) + 
               (items||[]).reduce((s,it) => s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0), 0);
      let ss = SUPPLIER_SCORES[q.supplier_name] || {delivery:80,quality:80};
      totalComposite = (0*0.5 + ss.delivery*0.25 + ss.quality*0.25);
      totalSpecs = 1;
    } else {
      specs.forEach(sp => {
        let specTotal = (sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0) +
                        (sp.items||[]).reduce((s,it) => s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0), 0);
        let allSpecTotals = [];
        quotes.forEach(qq => {
          let qqSpecs = qq.specs || [];
          if (typeof qqSpecs === "string") try { qqSpecs = JSON.parse(qqSpecs); } catch(e) { qqSpecs = []; }
          qqSpecs.forEach(ssp => {
            if (ssp.name === sp.name || (!sp.name && !ssp.name)) {
              let st = (ssp.laborCost||0)+(ssp.manufacturingCost||0)+(ssp.adminCost||0)+(ssp.profit||0)+(ssp.tax||0) +
                       (ssp.items||[]).reduce((s,it) => s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0), 0);
              if (st > 0) allSpecTotals.push(st);
            }
          });
        });
        let minSpecTotal = allSpecTotals.length > 0 ? Math.min(...allSpecTotals) : 0;
        let priceScore = minSpecTotal > 0 ? Math.round((minSpecTotal/specTotal)*10000)/100 : 0;
        let ss2 = SUPPLIER_SCORES[q.supplier_name] || {delivery:80,quality:80};
        let composite = Math.round((priceScore*0.5 + ss2.delivery*0.25 + ss2.quality*0.25)*100)/100;
        totalComposite += composite;
        totalSpecs++;
      });
    }
    let avgComposite = totalSpecs > 0 ? totalComposite / totalSpecs : 0;
    if (avgComposite > bestComposite) {
      bestComposite = avgComposite;
      bestSupplier = q.supplier_name;
    }
  });
  
  await db.updateProject(id, { status: "closed", winning_supplier: bestSupplier });
  res.json({ success: true, message: "项目已截止", winningSupplier: bestSupplier });
});



// 邮件审批链接处理
app.get("/api/admin/approve-by-email", async (req, res) => {
  const { account, action, token } = req.query;
  if (!account || !action || !token) return res.send("<h2>参数错误</h2>");
  if (!approvalTokens[account] || approvalTokens[account] !== token) {
    return res.send("<h2>链接无效或已过期</h2>");
  }
  if (action !== "active" && action !== "rejected") {
    return res.send("<h2>操作无效</h2>");
  }
  
  delete approvalTokens[account];
  
  const result = await db.updateUserStatus(account, action);
  if (!result) return res.send("<h2>操作失败</h2>");
  const msg = action === "active" ? "审核通过" : "审核不通过";
  res.send('<div style="padding:40px;text-align:center;font-family:sans-serif"><h1 style="color:' + (action === "active" ? "#27ae60" : "#e74c3c") + '">' + msg + '</h1><p>账号：' + account + '</p><a href="http://localhost:3000/login.html" style="color:#2563eb">返回登录页</a></div>');
});

// 管理员审核用户
app.post("/api/admin/approve-user", async (req, res) => {
  const { adminAccount, targetAccount, action } = req.body;
  if (!adminAccount || !targetAccount || !action) return res.json({ success: false, message: "参数缺失" });
  
  const admin = await db.getUser(adminAccount).catch(() => null);
  if (!admin || admin.role !== "admin") return res.json({ success: false, message: "无权限" });
  
  const result = await db.updateUserStatus(targetAccount, action);
  if (!result) return res.json({ success: false, message: "审核失败" });
  res.json({ success: true, message: "审核完成" });
});

// 管理员获取待审核用户列表
app.get("/api/admin/pending-users", async (req, res) => {
  const { account } = req.query;
  if (!account) return res.json({ success: false, message: "缺少账号参数" });
  
  const admin = await db.getUser(account).catch(() => null);
  if (!admin || admin.role !== "admin") return res.json({ success: false, message: "无权限" });
  
  const allUsers = await db.getAllUsers().catch(() => []);
  const pending = allUsers.filter(u => u.status === "pending");
  res.json({ success: true, data: pending });
});

// ===================== 管理员 APIs =====================

app.get("/api/admin/users", async (req, res) => {
  const dbUsers = await db.getAllUsers().catch(() => []);
  const users = dbUsers.map(u => ({
    account: u.account,
    role: u.role,
    name: u.name,
    createdAt: u.created_at,
  }));

  res.json({ success: true, total: users.length, data: users });
});

// ===================== 开发辅助 APIs =====================


// 开发接口：更新用户名称
// 开发接口：更新用户名称
app.post("/api/dev/update-user-name", async (req, res) => {
  const { account, name } = req.body;
  if (!account || !name) return res.json({ success: false, message: "参数缺失" });
  const result = await db.updateUserName(account, name);
  if (!result) return res.json({ success: false, message: "更新失败" });
  res.json({ success: true, message: "名称已更新" });
});
app.post("/api/dev/create-user", async (req, res) => {
  const { role, account, password, name } = req.body;
  if (!role || !account || !password) return res.json({ success: false, message: "参数缺失" });
  const validRoles = ["supplier", "buyer", "reviewer", "admin"];
  if (!validRoles.includes(role)) return res.json({ success: false, message: "角色无效" });

  const existing = await db.getUser(account).catch(() => null);
  if (existing) return res.json({ success: false, message: "账号已存在" });

  const user = await db.createUser(account, role, password, "active", name || "").catch(e => {
    console.warn("[DB] createUser:", e.message);
    return null;
  });
  if (!user) return res.json({ success: false, message: "创建失败" });

  console.log("[DEV] 创建用户: " + account + " (" + role + ")");
  res.json({ success: true, message: "用户已创建", data: { account, role } });
});

app.post("/api/dev/create-project", async (req, res) => {
  const { buyerAccount, projectName, buyer, budget, deadline } = req.body;
  if (!buyerAccount || !projectName) return res.json({ success: false, message: "参数缺失" });

  const nextId = await db.getNextProjectId().catch(() => 1);
  const id = "ZB-" + String(nextId).padStart(3, "0");
  const project = {
    id,
    buyer_account: buyerAccount,
    project_name: projectName,
    buyer: buyer || buyerAccount,
    budget: Number(budget) || 0,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open",
  };

  await db.createProject(project).catch(e => {
    console.warn("[DB] createProject:", e.message);
    return res.json({ success: false, message: "创建失败" });
  });

  console.log("[DEV] 创建项目: " + id + " " + projectName);
  res.json({
    success: true,
    data: {
      id: project.id,
      buyerAccount: project.buyer_account,
      projectName: project.project_name,
      buyer: project.buyer,
      budget: project.budget,
      deadline: project.deadline,
      status: project.status,
      createdAt: new Date().toISOString(),
    },
  });
});


// ===================== Excel 导出 =====================

// 导出项目报价对比 Excel
app.get("/api/buyer/export/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  try {
  const project = await db.getProject(projectId).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });

  const bids = await db.getBidsByProject(projectId).catch(() => []);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: 项目概览
  const overviewData = [
    ["项目编号", project.id],
    ["项目名称", project.project_name],
    ["采购单位", project.buyer || ""],
    ["预算金额", Number(project.budget) || 0],
    ["截止日期", project.deadline || ""],
    ["项目状态", project.status === "open" ? "进行中" : "已截止"],
    ["报价数量", bids.length],
    ["导出时间", new Date().toLocaleString("zh-CN")],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1["!cols"] = [{ wch: 15 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws1, "项目概览");

  // Sheet 2: 报价汇总
  const summaryHeaders = ["供应商", "总报价", "材料费(合计)", "人工费", "制造费", "管理费", "利润", "税金", "报价时间"];
  const summaryRows = bids.map(b => {
    let materialSum = 0;
    let items = b.items;
    if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
    if (Array.isArray(items)) {
      materialSum = items.reduce((s, it) => s + (Number(it.unitPrice) || 0), 0);
    }
    return [
      b.supplier_name || b.supplier_account,
      Number(b.total) || 0,
      materialSum,
      Number(b.labor_cost) || 0,
      Number(b.manufacturing_cost) || 0,
      Number(b.admin_cost) || 0,
      Number(b.profit) || 0,
      Number(b.tax) || 0,
      new Date(b.created_at).toLocaleString("zh-CN"),
    ];
  });
  const ws2Data = [summaryHeaders, ...summaryRows];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2["!cols"] = summaryHeaders.map((h, i) => ({ wch: i === 0 ? 20 : 15 }));
  XLSX.utils.book_append_sheet(wb, ws2, "报价汇总");

  // Sheet 3: 物料报价对比
  // Collect all unique materials across all bids
  const materialMap = {};
  const supplierNames = [];
  bids.forEach(b => {
    const sName = b.supplier_name || b.supplier_account;
    supplierNames.push(sName);
    let items = b.items;
    if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
    if (Array.isArray(items)) {
      items.forEach(it => {
        const mName = it.materialName || it.name || "";
        if (mName && !materialMap[mName]) {
          materialMap[mName] = { spec: it.spec || "", code: it.materialCode || "" };
        }
      });
    }
  });

  const matNames = Object.keys(materialMap);
  const compHeaders = ["物料名称", "物料编码", "规格", ...supplierNames.map(n => n + " 单价"), ...supplierNames.map(n => n + " 小计")];
  const compRows = matNames.map(mName => {
    const row = [mName, materialMap[mName].code, materialMap[mName].spec];
    // Unit prices per supplier
    bids.forEach(b => {
      let items = b.items;
      if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
      const found = Array.isArray(items) ? items.find(it => (it.materialName || it.name) === mName) : null;
      row.push(found ? Number(found.unitPrice) || 0 : "");
    });
    // Subtotals per supplier
    bids.forEach(b => {
      let items = b.items;
      if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
      const found = Array.isArray(items) ? items.find(it => (it.materialName || it.name) === mName) : null;
      row.push(found ? (Number(found.subtotal) || Number(found.unitPrice) || 0) : "");
    });
    return row;
  });

  if (matNames.length > 0) {
    const ws3 = XLSX.utils.aoa_to_sheet([compHeaders, ...compRows]);
    ws3["!cols"] = compHeaders.map((h, i) => ({ wch: i < 3 ? 18 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws3, "物料对比");
  }

  // Write to buffer and send
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeName = (projectId || "export") + "_quotes.xlsx";
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + safeName);
  res.send(buf);
  } catch (e) {
    console.error("[导出] 错误:", e.message);
    res.json({ success: false, message: "导出失败: " + e.message });
  }
});

// ===================== Excel 导入 =====================


// Multer 配置 for Excel import
const multerExcel = require("multer");
const importUpload = multerExcel({
  storage: multerExcel.diskStorage({
    destination: path.join(__dirname, "..", "outputs", "uploads"),
    filename: (req, file, cb) => {
      const uniqueName = "import_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8) + path.extname(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 .xlsx, .xls, .csv 格式"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 导入物料清单到项目
app.post("/api/buyer/projects/:id/import-items", importUpload.single("file"), async (req, res) => {
  const projectId = req.params.id;
  if (!req.file) return res.json({ success: false, message: "未选择文件" });

  const project = await db.getProject(projectId).catch(() => null);
  if (!project) return res.json({ success: false, message: "项目不存在" });

  try {
    const wb = XLSX.readFile(req.file.path);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) return res.json({ success: false, message: "文件为空或格式不正确" });

    // Auto-detect header row
    const headerRow = rows[0];
    const colMap = {};
    headerRow.forEach((h, i) => {
      const hStr = String(h || "").trim();
      if (hStr.includes("物料名称") || hStr.includes("名称") || hStr === "name") colMap.name = i;
      if (hStr.includes("物料编码") || hStr.includes("编码") || hStr.includes("料号") || hStr === "code") colMap.code = i;
      if (hStr.includes("规格") || hStr.includes("型号") || hStr === "spec") colMap.spec = i;
      if (hStr.includes("数量") || hStr.includes("用量") || hStr === "qty" || hStr === "quantity") colMap.qty = i;
      if (hStr.includes("单位") || hStr === "unit") colMap.unit = i;
      if (hStr.includes("单价") || hStr.includes("预算单价") || hStr === "unitPrice") colMap.unitPrice = i;
    });

    if (colMap.name === undefined) {
      return res.json({ success: false, message: "未找到【物料名称】列，请检查表头" });
    }

    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[colMap.name]) continue;
      items.push({
        name: String(row[colMap.name] || "").trim(),
        materialCode: colMap.code !== undefined ? String(row[colMap.code] || "").trim() : "",
        spec: colMap.spec !== undefined ? String(row[colMap.spec] || "").trim() : "",
        qty: colMap.qty !== undefined ? Number(row[colMap.qty]) || 0 : 0,
        unit: colMap.unit !== undefined ? String(row[colMap.unit] || "").trim() : "",
        unitPrice: colMap.unitPrice !== undefined ? Number(row[colMap.unitPrice]) || 0 : 0,
      });
    }

    if (items.length === 0) {
      return res.json({ success: false, message: "未解析到有效物料数据" });
    }

    // Store imported items with the project
    const importedItems = { items, importedAt: new Date().toISOString(), fileName: req.file.originalname };
    await db.updateProject(projectId, {
      description: (project.description || "") + "\n[导入物料: " + req.file.originalname + " (" + items.length + "项)]",
    }).catch(() => {});

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});

    console.log("[导入] " + projectId + " 物料 " + items.length + " 项");
    res.json({ success: true, message: "成功导入 " + items.length + " 项物料", data: items });
  } catch (e) {
    console.error("[导入] 错误:", e.message);
    // Clean up on error
    fs.unlink(req.file.path, () => {});
    res.json({ success: false, message: "导入失败: " + e.message });
  }
});



// ===================== 报价哈希验证 =====================

// 验证报价哈希（防篡改检测）
app.get("/api/buyer/verify-bid/:bidId", async (req, res) => {
  const bidId = req.params.bidId;
  const bid = await db.getBid(bidId).catch(() => null);
  if (!bid) return res.json({ success: false, message: "报价不存在" });

  // Parse items if string
  let items = bid.items;
  if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
  let specs = bid.specs;
  if (typeof specs === "string") { try { specs = JSON.parse(specs); } catch(e) { specs = []; } }

  // Recompute hash with canonical JSON
  const sortKeys = (obj) => {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === "object") {
      return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
    }
    return obj;
  };
  const sortItems = (arr) => [...(arr || [])].sort((a, b) =>
    (a.materialCode || a.name || "").localeCompare(b.materialCode || b.name || "")
  );
  const hashContent = JSON.stringify(sortKeys({
    project_id: bid.project_id,
    supplier_account: bid.supplier_account,
    total: Number(bid.total) || 0,
    labor_cost: Number(bid.labor_cost) || 0,
    manufacturing_cost: Number(bid.manufacturing_cost) || 0,
    admin_cost: Number(bid.admin_cost) || 0,
    profit: Number(bid.profit) || 0,
    tax: Number(bid.tax) || 0,
    items: sortItems(Array.isArray(items) ? items : []),
    specs: sortKeys(Array.isArray(specs) ? specs : []),
  }));
  const computedHash = crypto.createHash("sha256").update(hashContent, "utf8").digest("hex");
  const storedHash = bid.content_hash || "";

  const verified = computedHash === storedHash;

  res.json({
    success: true,
    data: {
      bidId,
      verified,
      storedHash: storedHash.substring(0, 16) + "...",
      computedHash: computedHash.substring(0, 16) + "...",
      message: verified ? "报价数据完整，未检测到篡改" : "警告：报价数据已被篡改！",
    },
  });
});



// ===================== 串标检测 =====================

// 检测项目是否存在串标嫌疑
app.get("/api/buyer/collusion-check/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const bids = await db.getBidsByProject(projectId).catch(() => []);

  const warnings = [];
  const ipMap = {};
  const uaMap = {};
  const timeWindow = 30 * 60 * 1000; // 30分钟内

  bids.forEach(b => {
    const ip = b.submit_ip || "";
    const ua = (b.submit_ua || "").substring(0, 100);
    const time = new Date(b.created_at).getTime();

    if (ip) {
      if (!ipMap[ip]) ipMap[ip] = [];
      ipMap[ip].push({ supplier: b.supplier_name || b.supplier_account, time, bidId: b.id });
    }
    if (ua) {
      if (!uaMap[ua]) uaMap[ua] = [];
      uaMap[ua].push({ supplier: b.supplier_name || b.supplier_account, time, bidId: b.id });
    }
  });

  // Check IP collusion
  Object.entries(ipMap).forEach(([ip, entries]) => {
    if (entries.length > 1 || ip === "127.0.0.1" || ip === "::1") {
      // Check time proximity
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const timeDiff = Math.abs(entries[i].time - entries[j].time);
          warnings.push({
            type: "ip",
            severity: ip === "127.0.0.1" || ip === "::1" ? "low" : "high",
            detail: entries[i].supplier + " 与 " + entries[j].supplier + " 使用相同IP: " + ip,
            timeDiff: Math.round(timeDiff / 1000) + "秒",
            suspicious: timeDiff < timeWindow,
            suppliers: entries.map(e => e.supplier),
            bids: entries.map(e => e.bidId),
          });
          break; // One warning per IP pair
        }
      }
    }
  });

  // Check UA collusion
  Object.entries(uaMap).forEach(([ua, entries]) => {
    if (entries.length > 1) {
      warnings.push({
        type: "ua",
        severity: "medium",
        detail: entries.map(e => e.supplier).join("、") + " 使用相同浏览器: " + ua.substring(0, 60) + "...",
        suppliers: entries.map(e => e.supplier),
        bids: entries.map(e => e.bidId),
      });
    }
  });

  res.json({
    success: true,
    data: {
      projectId,
      bidCount: bids.length,
      warningCount: warnings.length,
      warnings,
      riskLevel: warnings.length === 0 ? "none" : warnings.some(w => w.severity === "high") ? "high" : warnings.length > 1 ? "medium" : "low",
    },
  });
});


// ===================== 文件上传 =====================

app.post("/api/upload", uploadHandler.upload.single("file"), async (req, res) => {
  if (!req.file) return res.json({ success: false, message: "未选择文件" });
  try {
    const result = await uploadHandler.uploadFile(req.file, {
      projectId: req.body.projectId || null,
      uploadedBy: req.body.uploadedBy || "anonymous",
      uploadIp: req.ip || req.socket?.remoteAddress || "",
      originalFileName: req.body.originalFileName || null,
    });
    if (result.success) {
      console.log("[Upload] " + req.file.originalname + " -> " + result.data.storage_path);
    }
    res.json(result);
  } catch (e) {
    console.error("[Upload] 错误:", e.message);
    res.json({ success: false, message: "上传失败: " + e.message });
  }
});

app.get("/api/attachments/:projectId", (req, res) => {
  const attachments = uploadHandler.getAttachments(req.params.projectId);
  res.json({ success: true, data: attachments });
});

app.delete("/api/attachments/:attachmentId", (req, res) => {
  const result = uploadHandler.deleteAttachment(req.params.attachmentId);
  res.json(result);
});

// ===================== 启动 =====================


// ===================== 默认账号种子数据 =====================
async function seedDefaultUsers() {
  const defaults = [
    { account: "794474441@qq.com", role: "buyer", password: "123456", status: "active", name: "采购管理员" },
    { account: "linguodong@corp.netease.com", role: "supplier", password: "123456", status: "active", name: "恒源纺织" }
  ]
  for (const u of defaults) {
    const exists = await db.getUser(u.account).catch(() => null);
    if (!exists) {
      await db.createUser(u.account, u.role, u.password, u.status || "active", u.name || "").catch(e => {
        console.warn("[Seed] 创建默认用户失败 " + u.account + ":", e.message);
      });
      console.log("[Seed] 已创建默认用户: " + u.account + " (" + u.role + ")");
    }
  }
}

// Railway 健康检查
app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  seedDefaultUsers();
  // 初始化 Supabase
  const ok = db.initSupabase();
  const smsOk = sms.initSMS();
  uploadHandler.initSupabase();

  // SMS configured via sms-client module
  const emailOk = EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass;

  console.log("");
  console.log("============================================");
  console.log("    招采管理系统 API 服务器");
  console.log("    地址: http://localhost:" + PORT);
  console.log("    环境: " + NODE_ENV);
  console.log("    邮件: " + (emailOk ? "已配置" : "未配置"));
  console.log("    短信: " + (sms.isAvailable() ? "已配置(阿里云)" : "未配置"));
  console.log("    数据库: " + (ok ? "Supabase/PostgreSQL" : "未连接!"));
  if (!IS_PROD) {
    console.log("    [开发模式] - 验证码将直接返回");
  }
  console.log("============================================");
});
