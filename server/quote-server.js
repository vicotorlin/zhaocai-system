/**
 * 招采管理系统 - 报价提交 & 串标检测 & 哈希签名 API
 *
 * 接口:
 *   POST /api/quotes            供应商提交报价(自动记录IP+UA, 生成SHA-256哈希)
 *   GET  /api/admin/quotes      管理员查看所有报价(含串标检测+哈希信息)
 *   GET  /api/admin/stats       统计信息
 *   GET  /api/admin/verify/:id  校验单条报价哈希
 *   POST /api/admin/verify-all  批量校验所有报价哈希
 *   POST /api/admin/reset       重置数据(开发用)
 *
 * 启动: node quote-server.js
 */

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const XLSX = require("xlsx");
const multer = require("multer");
const path = require("path");

const PORT = process.env.QUOTE_PORT || 3001;
// multer 配置：接收上传的 Excel 文件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".xlsx" || ext === ".xls") cb(null, true);
    else cb(new Error("仅支持 .xlsx 和 .xls 格式"));
  },
});

const BID_SALT = process.env.BID_SALT || "zhao-cai-system-secret-salt-2026";

// ===================== 内存存储 =====================
const quotes = [];
let nextId = 1;

// ===================== 工具函数 =====================

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || req.ip || "unknown";
}

function getUA(req) {
  return req.headers["user-agent"] || "unknown";
}

/**
 * 对报价数据进行 SHA-256 签名
 */
function computeBidHash(quote) {
  const payload = JSON.stringify({
    projectId: quote.projectId,
    supplierName: quote.supplierName,
    items: quote.items,
    total: quote.total,
    submittedAt: quote.submittedAt,
  });
  return crypto.createHash("sha256").update(payload + BID_SALT).digest("hex");
}

/**
 * 校验报价哈希值
 */
function verifyBidHash(quote) {
  const stored = quote.hash || "";
  const computed = computeBidHash(quote);
  return { valid: stored === computed, computed, stored };
}

function compareIPs(ipA, ipB) {
  if (!ipA || !ipB || ipA === "unknown" || ipB === "unknown") return null;
  if (ipA === ipB) return { level: 3, label: "相同 IP", detail: ipA + " = " + ipB };
  const a = ipA.split("."), b = ipB.split(".");
  if (a.length !== 4 || b.length !== 4) return null;
  if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2])
    return { level: 2, label: "同网段", detail: a[0] + "." + a[1] + "." + a[2] + ".x" };
  if (a[0] === b[0] && a[1] === b[1])
    return { level: 1, label: "同区域", detail: a[0] + "." + a[1] + ".x.x" };
  return null;
}

function detectFraud(currentId, currentIP) {
  const cur = quotes.find(x => x.id === currentId);
  const results = [];
  for (const q of quotes) {
    if (q.id === currentId) continue;
    const ipR = compareIPs(currentIP, q.ip);
    if (ipR) results.push({ matchedWith: q.id, supplierName: q.supplierName, projectName: q.projectName, level: ipR.level, label: ipR.label, detail: ipR.detail, type: "ip" });
    if (cur && q.userAgent === cur.userAgent && q.userAgent !== "unknown" && (!ipR || ipR.level < 3))
      results.push({ matchedWith: q.id, supplierName: q.supplierName, projectName: q.projectName, level: 1, label: "相同 User-Agent", detail: "可能同一设备", type: "ua" });
  }
  return results;
}

function calcRiskLevel(fraud) {
  if (fraud.length === 0) return 0;
  const mx = Math.max(...fraud.map(r => r.level));
  return mx >= 3 ? 3 : mx >= 2 ? 2 : 1;
}

// ===================== Express =====================

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  console.log("[" + new Date().toLocaleTimeString() + "] " + req.method + " " + req.path);
  next();
});

// ---------- 供应商提交报价 ----------
app.post("/api/quotes", (req, res) => {
  const { projectId, projectName, buyer, budget, items, supplierName } = req.body;
  if (!projectId || !items || !Array.isArray(items) || items.length === 0) {
    return res.json({ success: false, message: "缺少必要的报价信息" });
  }
  const ip = getClientIP(req);
  const ua = getUA(req);
  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const id = String(nextId++);
  const quote = {
    id, projectId, projectName: projectName || "", buyer: buyer || "", budget: budget || "",
    items: items.map(it => ({ materialName: it.materialName || "", spec: it.spec || "", quantity: Number(it.quantity) || 0, unitPrice: Number(it.unitPrice) || 0, subtotal: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) })),
    total, ip, userAgent: ua, supplierName: supplierName || "", submittedAt: new Date().toISOString(),
  };
  quote.hash = computeBidHash(quote);
  quotes.push(quote);
  const fraud = detectFraud(id, ip);
  console.log("[报价] ID=" + id + " IP=" + ip + " hash=" + quote.hash.substring(0, 12) + "... risk=" + calcRiskLevel(fraud));
  res.json({ success: true, message: "报价提交成功", data: { id, riskLevel: calcRiskLevel(fraud), hash: quote.hash.substring(0, 16) + "...", warnings: fraud } });
});

// ---------- 管理员查看所有报价 ----------
app.get("/api/admin/quotes", (_req, res) => {
  const enriched = quotes.map(q => {
    const fraud = detectFraud(q.id, q.ip);
    const risk = calcRiskLevel(fraud);
    const flaggedBy = [];
    for (const o of quotes) {
      if (o.id === q.id) continue;
      const r = compareIPs(q.ip, o.ip);
      if (r && r.level >= 2) flaggedBy.push({ byId: o.id, bySupplier: o.supplierName, level: r.level, label: r.label });
    }
    return { ...q, riskLevel: risk, fraudResults: fraud, flaggedBy, hashShort: q.hash ? q.hash.substring(0, 16) + "..." : null, hashVerified: verifyBidHash(q).valid };
  });
  enriched.sort((a, b) => b.riskLevel - a.riskLevel);
  res.json({ success: true, total: quotes.length, data: enriched });
});

// ---------- 统计 ----------
app.get("/api/admin/stats", (_req, res) => {
  const map = {};
  for (const q of quotes) {
    if (!map[q.projectId]) map[q.projectId] = { projectId: q.projectId, projectName: q.projectName, count: 0, quotes: [], warnings: [] };
    map[q.projectId].count++;
    map[q.projectId].quotes.push(q.id);
  }
  const projects = Object.values(map).map(p => {
    const pq = quotes.filter(q => q.projectId === p.projectId);
    for (let i = 0; i < pq.length; i++)
      for (let j = i + 1; j < pq.length; j++) {
        const r = compareIPs(pq[i].ip, pq[j].ip);
        if (r && r.level >= 2) p.warnings.push({ level: r.level, label: r.label, supplierA: pq[i].supplierName || pq[i].id, supplierB: pq[j].supplierName || pq[j].id, detail: r.detail });
      }
    return p;
  });
  const c = l => quotes.filter(q => { const f = detectFraud(q.id, q.ip); return calcRiskLevel(f) === l; }).length;
  res.json({ success: true, total: quotes.length, riskSummary: { high: c(3), mid: c(2), low: c(1), clean: quotes.length - c(3) - c(2) - c(1) }, projects });
});

// ---------- 校验单条报价哈希 ----------
app.get("/api/admin/verify/:id", (req, res) => {
  const q = quotes.find(x => x.id === req.params.id);
  if (!q) return res.json({ success: false, message: "报价不存在" });
  const v = verifyBidHash(q);
  res.json({ success: true, quoteId: q.id, ...v, message: v.valid ? "哈希校验通过，数据未被篡改" : "哈希校验失败！数据可能已被修改！" });
});

// ---------- 批量校验 ----------
app.post("/api/admin/verify-all", (_req, res) => {
  const results = quotes.map(q => {
    const v = verifyBidHash(q);
    return { id: q.id, projectId: q.projectId, supplierName: q.supplierName, valid: v.valid, hash: q.hash ? q.hash.substring(0, 16) + "..." : null };
  });
  const tampered = results.filter(r => !r.valid);
  res.json({ success: true, allValid: tampered.length === 0, total: results.length, tamperedCount: tampered.length, tampered, results });
});

// ---------- 重置 ----------
// ---------- Excel 解析上传 (SheetJS) ----------

/**
 * 预期的 Excel 模板列映射：
 *   A: 物料名称 (materialName)
 *   B: 规格型号 (spec)
 *   C: 数量     (quantity)
 *   D: 单价     (unitPrice)
 * 第 1 行为表头(跳过)，从第 2 行开始读取数据
 */
const COLUMN_MAP = {
  "物料名称": "materialName",
  "规格型号": "spec",
  "规格": "spec",
  "数量": "quantity",
  "单价": "unitPrice",
  "单价(元)": "unitPrice",
};

function parseExcelQuote(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 转为 JSON 数组（每行一个对象）
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rows.length < 2) return { error: "Excel 文件为空或只有表头" };

  // 第一行作为表头
  const headers = rows[0].map(h => String(h).trim());
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item = { materialName: "", spec: "", quantity: 0, unitPrice: 0 };

    headers.forEach((h, idx) => {
      const key = COLUMN_MAP[h];
      if (key) {
        const val = row[idx];
        if (key === "quantity" || key === "unitPrice") {
          item[key] = parseFloat(val) || 0;
        } else {
          item[key] = String(val || "").trim();
        }
      }
    });

    // 跳过空行
    if (!item.materialName && item.quantity === 0 && item.unitPrice === 0) continue;

    // 验证必填字段
    if (!item.materialName || item.quantity <= 0 || item.unitPrice <= 0) {
      return { error: `第 ${i + 1} 行数据不完整：物料名称、数量、单价为必填且须大于 0` };
    }

    item.subtotal = item.quantity * item.unitPrice;
    items.push(item);
  }

  return items.length > 0
    ? { items, total: items.reduce((s, it) => s + it.subtotal, 0) }
    : { error: "未解析到有效报价数据" };
}

app.post("/api/quotes/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, message: "请上传 Excel 文件" });

    const { projectId, projectName, buyer, budget, supplierName } = req.body;

    if (!supplierName || !projectId) {
      return res.json({ success: false, message: "缺少供应商名称或项目编号" });
    }

    const result = parseExcelQuote(req.file.buffer);
    if (result.error) return res.json({ success: false, message: result.error });

    const ip = getClientIP(req);
    const ua = getUA(req);
    const id = String(nextId++);

    const quote = {
      id, projectId, projectName: projectName || "", buyer: buyer || "", budget: budget || "",
      items: result.items,
      total: result.total,
      ip, userAgent: ua,
      supplierName,
      submittedAt: new Date().toISOString(),
      source: "excel_upload",
      fileName: req.file.originalname,
    };
    quote.hash = computeBidHash(quote);
    quotes.push(quote);

    const fraud = detectFraud(id, ip);
    console.log(`[Excel上传] ID=${id} 文件=${req.file.originalname} 解析行数=${result.items.length} 总价=¥${result.total}`);

    res.json({
      success: true,
      message: `成功解析 ${result.items.length} 条物料，总报价 ¥${result.total.toLocaleString()}`,
      data: { id, itemCount: result.items.length, total: result.total, items: result.items, warnings: fraud },
    });
  } catch (err) {
    res.json({ success: false, message: "Excel 解析失败：" + err.message });
  }
});

// ---------- 比价结果导出为 Excel（条件格式：最低价标绿） ----------

/**
 * GET /api/admin/export/:projectId?format=xlsx
 * 按项目导出比价结果，最低价行标绿背景
 */
app.get("/api/admin/export/:projectId", (req, res) => {
  const { projectId } = req.params;
  const projectQuotes = quotes.filter(q => q.projectId === projectId);

  if (projectQuotes.length === 0) {
    return res.json({ success: false, message: "该项目暂无报价数据" });
  }

  // ===== 构建比价数据 =====
  // 找出所有物料名称的并集
  const materialSet = new Set();
  for (const q of projectQuotes) {
    for (const it of q.items) {
      if (it.materialName) materialSet.add(it.materialName);
    }
  }
  const materials = Array.from(materialSet);

  // 构建比价矩阵：[物料名, 供应商A报价, 供应商B报价, ..., 最低价标记]
  const matrix = [];
  const headerRow = ["物料名称", ...projectQuotes.map(q => q.supplierName || q.id), "最低价供应商"];
  matrix.push(headerRow);

  for (const mat of materials) {
    const row = [mat];
    let lowest = Infinity;
    let lowestIdx = -1;

    for (let i = 0; i < projectQuotes.length; i++) {
      const q = projectQuotes[i];
      const item = q.items.find(it => it.materialName === mat);
      const price = item ? item.unitPrice : 0;
      row.push(price || "未报价");
      if (price > 0 && price < lowest) { lowest = price; lowestIdx = i; }
    }

    row.push(lowestIdx >= 0 ? projectQuotes[lowestIdx].supplierName || projectQuotes[lowestIdx].id : "N/A");
    matrix.push(row);
  }

  // 汇总行
  const summaryRow = ["合计总价"];
  for (const q of projectQuotes) {
    summaryRow.push(q.total);
  }
  summaryRow.push("");
  matrix.push([]);
  matrix.push(summaryRow);

  // ===== 用 SheetJS 生成 Excel =====
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(matrix);

  // 设置列宽
  ws["!cols"] = [
    { wch: 25 },
    ...projectQuotes.map(() => ({ wch: 16 })),
    { wch: 20 },
  ];

  // ===== 条件格式：最低价标绿 =====
  // 对比每个物料的报价，最低价单元格背景设为绿色
  for (let r = 1; r <= materials.length; r++) {
    let lowestCol = -1;
    let lowestVal = Infinity;

    for (let c = 1; c <= projectQuotes.length; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr];
      if (cell && typeof cell.v === "number" && cell.v > 0 && cell.v < lowestVal) {
        lowestVal = cell.v;
        lowestCol = c;
      }
    }

    // 标记最低价单元格
    if (lowestCol >= 0) {
      for (let c = 1; c <= projectQuotes.length; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
        if (c === lowestCol) {
          ws[cellAddr].s = {
            fill: { fgColor: { rgb: "C6EFCE" } },
            font: { color: { rgb: "006100" }, bold: true },
          };
        }
      }
    }
  }

  // 标题行样式
  for (let c = 0; c < headerRow.length; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = {
        fill: { fgColor: { rgb: "2C5364" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
        alignment: { horizontal: "center" },
      };
    }
  }

  // 合计行样式
  const summaryRowIdx = materials.length + 1;
  if (ws[XLSX.utils.encode_cell({ r: summaryRowIdx, c: 0 })]) {
    for (let c = 0; c < headerRow.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: summaryRowIdx, c });
      if (ws[addr]) {
        ws[addr].s = {
          fill: { fgColor: { rgb: "F0F2F5" } },
          font: { bold: true },
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "比价结果");

  // 额外 sheet: 报价详情
  const detailData = [["报价ID", "供应商", "物料数", "总价(元)", "IP", "提交时间", "哈希"]];
  for (const q of projectQuotes) {
    detailData.push([
      q.id, q.supplierName, q.items.length, q.total, q.ip,
      q.submittedAt, q.hash ? q.hash.substring(0, 12) + "..." : "",
    ]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(detailData);
  ws2["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "报价详情");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const fileName = `比价结果_${projectId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(buf);
});

// ---------- Excel 模板下载 ----------
app.get("/api/quotes/template", (_req, res) => {
  const wb = XLSX.utils.book_new();
  const data = [
    ["物料名称", "规格型号", "数量", "单价(元)"],
    ["服务器主机", "Dell PowerEdge R750xs", 2, 80000],
    ["交换机", "H3C S5130-52S-EI", 5, 5000],
    ["防火墙", "华为 USG6000E", 1, 30000],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 14 }];
  // 表头样式
  for (let c = 0; c < 4; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = { fill: { fgColor: { rgb: "D9E1F2" } }, font: { bold: true } };
  }
  XLSX.utils.book_append_sheet(wb, ws, "报价单模板");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=quote_template.xlsx");
  res.send(buf);
});

// ===================== 启动 =====================
app.post("/api/admin/reset", (_req, res) => {
  quotes.length = 0; nextId = 1;
  res.json({ success: true, message: "数据已重置" });
});

// ===================== 启动 =====================
app.listen(PORT, () => {
  const pad = "               ";
  console.log("");
  console.log("+==========================================+");
  console.log("|  招采管理系统 - 报价 & 哈希签名 API     |");
  console.log("|------------------------------------------|");
  console.log("|  地址: http://localhost:" + PORT + pad.substring(0, 13 - String(PORT).length) + "|");
  console.log("|  盐值: " + BID_SALT.substring(0, 8) + "..." + pad.substring(0, 19) + "|");
  console.log("|  功能: 报价提交 / 串标检测 / 哈希防篡改  |");
  console.log("+==========================================+");
  console.log("");
  console.log("POST /api/quotes          供应商提交报价(含哈希)");
  console.log("GET  /api/admin/quotes    管理员查看报价");
  console.log("GET  /api/admin/verify/:id 校验单条哈希");
  console.log("POST /api/admin/verify-all 批量校验哈希");
  console.log("");
});
