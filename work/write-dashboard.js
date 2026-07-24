const fs = require("fs");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>招采管理系统 - 工作台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:#f0f2f5;color:#333;min-height:100vh}
.topbar{background:linear-gradient(135deg,#0f2027,#2c5364);color:#fff;padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.topbar .logo{font-size:18px;font-weight:600;letter-spacing:1px}
.topbar .user-area{display:flex;align-items:center;gap:14px;font-size:14px}
.topbar .role-tag{background:rgba(255,255,255,.15);padding:3px 12px;border-radius:12px;font-size:12px}
.topbar .btn-logout{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;transition:.2s}
.topbar .btn-logout:hover{background:rgba(255,255,255,.2)}
.layout{display:flex;min-height:calc(100vh - 56px)}
.sidebar{width:220px;background:#fff;border-right:1px solid #e8e8e8;padding:12px 0;flex-shrink:0;overflow-y:auto}
.sidebar .menu-group{padding:8px 24px 4px;font-size:11px;color:#bbb;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.sidebar .menu-item{display:flex;align-items:center;gap:10px;padding:12px 24px;font-size:14px;color:#555;cursor:pointer;border-left:3px solid transparent;transition:all .15s}
.sidebar .menu-item:hover{background:#f5f7fa;color:#333}
.sidebar .menu-item.active{background:#eef4f7;color:#2c5364;font-weight:600;border-left-color:#2c5364}
.sidebar .menu-divider{height:1px;background:#eee;margin:6px 16px}
.main{flex:1;padding:24px;overflow-y:auto}
.view{display:none}
.view.active{display:block}
.page-title{font-size:20px;font-weight:600;color:#1a1a2e;margin-bottom:4px}
.page-sub{font-size:13px;color:#999;margin-bottom:20px}
.stat-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
.stat-card{background:#fff;border-radius:10px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;align-items:center;gap:14px}
.stat-card .icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
.stat-card .icon.blue{background:#e8f0fe;color:#2c5364}
.stat-card .icon.green{background:#e6f7e6;color:#27ae60}
.stat-card .icon.orange{background:#fef3e6;color:#e67e22}
.stat-card .icon.purple{background:#f3e8ff;color:#7c3aed}
.stat-card .num{font-size:24px;font-weight:700}
.stat-card .lbl{font-size:12px;color:#999}
.toolbar{background:#fff;border-radius:10px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,.06);flex-wrap:wrap}
.toolbar input,.toolbar select{height:36px;border:1px solid #ddd;border-radius:6px;padding:0 12px;font-size:13px;outline:none}
.toolbar input:focus,.toolbar select:focus{border-color:#2c5364}
.toolbar input{flex:1;min-width:150px}
.btn{height:36px;padding:0 18px;border:none;border-radius:6px;font-size:13px;cursor:pointer;transition:.2s;white-space:nowrap}
.btn-primary{background:#2c5364;color:#fff}
.btn-primary:hover{background:#3a6b80}
.btn-outline{background:#fff;border:1px solid #ddd;color:#555}
.btn-outline:hover{border-color:#2c5364;color:#2c5364}
.btn-danger{background:#e74c3c;color:#fff}
.btn-sm{height:28px;padding:0 10px;font-size:11px}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
thead{background:#f7f8fa}
th,td{padding:12px 14px;text-align:left;border-bottom:1px solid #f0f0f0}
th{font-weight:600;color:#555;font-size:12px}
tr:hover td{background:#fafbfc}
.status{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:500}
.status.open{background:#e6f7e6;color:#27ae60}
.status.progress{background:#fef3e6;color:#e67e22}
.status.closed{background:#f0f0f0;color:#999}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:200;align-items:center;justify-content:center}
.modal-overlay.show{display:flex}
.modal{background:#fff;border-radius:12px;width:480px;max-width:95vw;padding:28px 32px;box-shadow:0 12px 40px rgba(0,0,0,.2)}
.modal h3{font-size:18px;margin-bottom:18px}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:4px}
.form-group input,.form-group select{width:100%;height:40px;border:1.5px solid #e0e0e0;border-radius:6px;padding:0 12px;font-size:14px;outline:none}
.form-group input:focus{border-color:#2c5364}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
.empty{text-align:center;padding:50px;color:#bbb;font-size:14px}
.toast{position:fixed;top:70px;left:50%;transform:translateX(-50%);padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:toastIn .3s ease}
.toast.success{background:#27ae60;color:#fff}
.toast.error{background:#e74c3c;color:#fff}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.loading-text{text-align:center;padding:40px;color:#999}
.text-green{color:#27ae60;font-weight:600}
.text-mono{font-family:monospace;font-size:12px}
</style>
</head>
<body>

<div class="topbar">
  <div class="logo">招采管理系统</div>
  <div class="user-area">
    你好，<strong id="displayAccount">--</strong>
    <span class="role-tag" id="displayRole">--</span>
    <button class="btn-logout" onclick="doLogout()">退出</button>
  </div>
</div>

<div class="layout">
  <div class="sidebar" id="sidebar"></div>
  <div class="main">

    <!-- SUPPLIER: 采购项目 -->
    <div class="view" id="view-supplier-projects">
      <div class="page-title">可报价采购项目</div>
      <p class="page-sub">所有采购员发布的公开采购项目</p>
      <div class="stat-cards">
        <div class="stat-card"><div class="icon blue">&#x1F4CB;</div><div><div class="num" id="sStatTotal">0</div><div class="lbl">项目总数</div></div></div>
        <div class="stat-card"><div class="icon green">&#x2705;</div><div><div class="num" id="sStatOpen">0</div><div class="lbl">进行中项目</div></div></div>
        <div class="stat-card"><div class="icon orange">&#x1F4DD;</div><div><div class="num" id="sStatQuoted">0</div><div class="lbl">已报价</div></div></div>
        <div class="stat-card"><div class="icon purple">&#x1F465;</div><div><div class="num" id="sStatBids">0</div><div class="lbl">总报价数</div></div></div>
      </div>
      <div class="toolbar">
        <input type="text" id="sSearch" placeholder="搜索项目名称...">
        <select id="sFilter"><option value="">全部状态</option><option value="open">进行中</option><option value="closed">已截止</option></select>
        <button class="btn btn-outline" onclick="loadSupplierProjects()">刷新</button>
      </div>
      <div id="sTableContainer"><div class="loading-text">加载中...</div></div>
    </div>

    <!-- BUYER: 我的采购项目 -->
    <div class="view" id="view-buyer-projects">
      <div class="page-title">我的采购项目</div>
      <p class="page-sub">仅展示您发布的采购项目</p>
      <div class="toolbar">
        <button class="btn btn-primary" onclick="showCreateProjectModal()">+ 发布新项目</button>
        <button class="btn btn-outline" onclick="loadBuyerProjects()">刷新</button>
      </div>
      <div id="bTableContainer"><div class="loading-text">加载中...</div></div>
    </div>

    <!-- BUYER: 供应商报价 -->
    <div class="view" id="view-buyer-quotes">
      <div class="page-title">供应商报价</div>
      <p class="page-sub">查看供应商对您项目的报价回执</p>
      <div class="toolbar">
        <select id="bqProjectSelect" onchange="loadBuyerQuotes()"><option value="">-- 选择项目 --</option></select>
        <button class="btn btn-outline" onclick="loadBuyerQuotes()">刷新</button>
      </div>
      <div id="bqTableContainer"><div class="empty">请先选择一个项目</div></div>
    </div>

    <!-- BUYER: 询比价结果 -->
    <div class="view" id="view-buyer-compare">
      <div class="page-title">询比价结果</div>
      <p class="page-sub">各供应商报价对比分析</p>
      <div class="toolbar">
        <select id="bcProjectSelect" onchange="loadBuyerCompare()"><option value="">-- 选择项目 --</option></select>
        <button class="btn btn-outline" onclick="loadBuyerCompare()">刷新</button>
        <button class="btn btn-primary" onclick="exportCompare()">导出Excel</button>
      </div>
      <div id="bcTableContainer"><div class="empty">请先选择一个项目</div></div>
    </div>

    <!-- REVIEWER: 所有采购项目 -->
    <div class="view" id="view-reviewer-projects">
      <div class="page-title">采购项目总览</div>
      <p class="page-sub">所有采购员发布的采购项目及询比结果</p>
      <div class="stat-cards">
        <div class="stat-card"><div class="icon blue">&#x1F4CB;</div><div><div class="num" id="rStatTotal">0</div><div class="lbl">项目总数</div></div></div>
        <div class="stat-card"><div class="icon green">&#x1F3C3;</div><div><div class="num" id="rStatOpen">0</div><div class="lbl">进行中</div></div></div>
        <div class="stat-card"><div class="icon orange">&#x1F465;</div><div><div class="num" id="rStatBids">0</div><div class="lbl">已投标项目</div></div></div>
        <div class="stat-card"><div class="icon purple">&#x1F3C6;</div><div><div class="num" id="rStatWon">0</div><div class="lbl">已定标</div></div></div>
      </div>
      <div class="toolbar"><button class="btn btn-outline" onclick="loadReviewerProjects()">刷新</button></div>
      <div id="rTableContainer"><div class="loading-text">加载中...</div></div>
    </div>

    <!-- SUPPLIER: 填写报价 iframe -->
    <div class="view" id="view-supplier-form">
      <div class="page-title">填写报价</div>
      <p class="page-sub">选择项目后填写报价明细</p>
      <div class="toolbar">
        <select id="sfProjectSelect" onchange="openSupplierForm()"><option value="">-- 选择报价项目 --</option></select>
      </div>
      <div id="sfIframeWrap" style="display:none;background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
        <iframe id="sfIframe" style="width:100%;height:600px;border:none"></iframe>
      </div>
      <div id="sfEmpty" class="empty">请选择一个项目开始填写报价</div>
    </div>

  </div>
</div>

<!-- 创建项目弹窗 -->
<div class="modal-overlay" id="createProjectModal">
  <div class="modal">
    <h3>发布新项目</h3>
    <div class="form-group"><label>项目名称</label><input id="cpName" placeholder="请输入项目名称"></div>
    <div class="form-group"><label>采购方名称</label><input id="cpBuyer" placeholder="请输入采购方名称"></div>
    <div class="form-group"><label>预算金额 (元)</label><input id="cpBudget" type="number" placeholder="请输入预算金额"></div>
    <div class="form-group"><label>截止日期</label><input id="cpDeadline" type="date"></div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal('createProjectModal')">取消</button>
      <button class="btn btn-primary" onclick="createProject()">发布</button>
    </div>
  </div>
</div>

<script>
const API = "http://localhost:3000";
const roleMap = { supplier:"供应商", buyer:"采购员", reviewer:"评审专家", admin:"管理员" };
const params = new URLSearchParams(window.location.search);
const USER = {
  account: params.get("account") || sessionStorage.getItem("zrbac_user") || "",
  role: params.get("role") || sessionStorage.getItem("zrbac_role") || "supplier"
};
sessionStorage.setItem("zrbac_user", USER.account);
sessionStorage.setItem("zrbac_role", USER.role);

function $(id) { return document.getElementById(id); }

function toast(msg, type) {
  var el = document.createElement("div");
  el.className = "toast " + (type || "success");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.remove(); }, 3000);
}

function closeModal(id) { $(id).classList.remove("show"); }

async function api(path, opt) {
  opt = opt || {};
  opt.headers = { "Content-Type": "application/json", ...(opt.headers || {}) };
  if (opt.body) opt.body = JSON.stringify(opt.body);
  var r = await fetch(API + path, opt);
  return r.json();
}

// ======================== 侧栏构建 ========================

function buildSidebar() {
  var s = $("sidebar");
  if (USER.role === "supplier") {
    s.innerHTML = [
      '<div class="menu-group">供应商工作台</div>',
      '<div class="menu-item active" data-view="supplier-projects"><span>&#x1F4CB;</span> 采购项目</div>',
      '<div class="menu-item" data-view="supplier-form"><span>&#x270F;</span> 填写报价</div>',
      '<div class="menu-divider"></div>',
      '<div class="menu-group">历史记录</div>',
      '<div class="menu-item" data-action="alert" data-msg="报价历史功能开发中"><span>&#x1F4C4;</span> 我的报价记录</div>'
    ].join("");
  } else if (USER.role === "buyer") {
    s.innerHTML = [
      '<div class="menu-group">采购员工作台</div>',
      '<div class="menu-item active" data-view="buyer-projects"><span>&#x1F4CB;</span> 采购项目</div>',
      '<div class="menu-item" data-view="buyer-quotes"><span>&#x1F4E8;</span> 供应商报价</div>',
      '<div class="menu-item" data-view="buyer-compare"><span>&#x1F4CA;</span> 询比价结果</div>'
    ].join("");
  } else if (USER.role === "reviewer") {
    s.innerHTML = [
      '<div class="menu-group">评审专家工作台</div>',
      '<div class="menu-item active" data-view="reviewer-projects"><span>&#x1F4CB;</span> 采购项目</div>',
      '<div class="menu-divider"></div>',
      '<div class="menu-group">评审工具</div>',
      '<div class="menu-item" data-action="alert" data-msg="评分功能开发中"><span>&#x2B50;</span> 技术评分</div>',
      '<div class="menu-item" data-action="alert" data-msg="商务评分功能开发中"><span>&#x1F4B0;</span> 商务评分</div>'
    ].join("");
  }

  // 绑定菜单点击事件
  s.querySelectorAll(".menu-item[data-view]").forEach(function(item) {
    item.addEventListener("click", function() {
      switchView(this.getAttribute("data-view"));
    });
  });
}

function switchView(id) {
  // 更新侧栏激活状态
  document.querySelectorAll(".sidebar .menu-item").forEach(function(m) { m.classList.remove("active"); });
  var mi = document.querySelector('.sidebar .menu-item[data-view="' + id + '"]');
  if (mi) mi.classList.add("active");

  // 切换视图
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("active"); });
  var t = $("view-" + id);
  if (t) t.classList.add("active");

  // 加载数据
  if (id === "supplier-projects") loadSupplierProjects();
  if (id === "buyer-projects") loadBuyerProjects();
  if (id === "buyer-quotes") loadBuyerProjectSelect();
  if (id === "buyer-compare") loadBuyerCompareSelect();
  if (id === "reviewer-projects") loadReviewerProjects();
  if (id === "supplier-form") loadSupplierFormSelect();
}

// 委托事件：处理 data-action 按钮
document.addEventListener("click", function(e) {
  var target = e.target.closest("[data-action]");
  if (!target) return;
  var action = target.getAttribute("data-action");
  if (action === "alert") {
    alert(target.getAttribute("data-msg") || "");
  }
});

// ======================== 供应商视图 ========================

async function loadSupplierProjects() {
  var keyword = ($("sSearch") && $("sSearch").value || "").toLowerCase();
  var status = $("sFilter") && $("sFilter").value || "";
  try {
    var r = await api("/api/reviewer/projects");
    var data = (r.data || []).filter(function(p) {
      return (!keyword || p.projectName.toLowerCase().includes(keyword)) && (!status || p.status === status);
    });
    $("sStatTotal").textContent = r.total || 0;
    $("sStatOpen").textContent = data.filter(function(p) { return p.status === "open"; }).length;
    $("sStatBids").textContent = (r.data || []).reduce(function(s, p) { return s + (p.quoteCount || 0); }, 0);
    if (data.length === 0) { $("sTableContainer").innerHTML = '<div class="empty">暂无匹配项目</div>'; return; }
    var rows = data.map(function(p) {
      var sc = p.status === "open" ? "open" : "closed";
      var st = p.status === "open" ? "进行中" : "已截止";
      var btn = p.status === "open"
        ? '<button class="btn btn-primary btn-sm" onclick="openSupplierBid(\'' + p.id + '\')">报价</button>'
        : '<span style="color:#999">--</span>';
      return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>' + p.buyer + '</td><td>&yen;' + (p.budget || "--") + '</td><td>' + p.deadline + '</td><td><span class="status ' + sc + '">' + st + '</span></td><td>' + (p.quoteCount || 0) + '</td><td>' + btn + '</td></tr>';
    }).join("");
    $("sTableContainer").innerHTML = '<table><thead><tr><th>编号</th><th>项目名称</th><th>采购单位</th><th>预算</th><th>截止</th><th>状态</th><th>报价数</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>';
  } catch (e) {
    $("sTableContainer").innerHTML = '<div class="empty">加载失败，请确认服务已启动</div>';
  }
}

window.openSupplierBid = function(pid) {
  $("sfProjectSelect").value = pid;
  openSupplierForm();
  switchView("supplier-form");
};

function loadSupplierFormSelect() {
  api("/api/reviewer/projects").then(function(r) {
    var sel = $("sfProjectSelect");
    sel.innerHTML = '<option value="">-- 选择报价项目 --</option>' +
      (r.data || []).map(function(p) {
        return '<option value="' + p.id + '">' + p.projectName + '</option>';
      }).join("");
  });
}

function openSupplierForm() {
  var pid = $("sfProjectSelect").value;
  if (!pid) { $("sfIframeWrap").style.display = "none"; $("sfEmpty").style.display = "block"; return; }
  $("sfIframeWrap").style.display = "block";
  $("sfEmpty").style.display = "none";
  $("sfIframe").src = "http://localhost:5173?projectId=" + pid;
}

// ======================== 采购员视图 ========================

async function loadBuyerProjects() {
  try {
    var r = await api("/api/buyer/projects?account=" + encodeURIComponent(USER.account));
    var data = r.data || [];
    if (data.length === 0) { $("bTableContainer").innerHTML = '<div class="empty">暂无项目，点击上方按钮发布新项目</div>'; return; }
    var rows = data.map(function(p) {
      var sc = p.status === "open" ? "open" : "closed";
      var st = p.status === "open" ? "进行中" : "已截止";
      return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>&yen;' + (p.budget || "--") + '</td><td>' + p.deadline + '</td><td><span class="status ' + sc + '">' + st + '</span></td><td>' + new Date(p.createdAt).toLocaleDateString() + '</td><td><button class="btn btn-danger btn-sm" onclick="closeProject(\'' + p.id + '\')">截止</button></td></tr>';
    }).join("");
    $("bTableContainer").innerHTML = '<table><thead><tr><th>编号</th><th>项目名称</th><th>预算</th><th>截止</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>';
  } catch (e) {
    $("bTableContainer").innerHTML = '<div class="empty">加载失败，请确认服务已启动</div>';
  }
}

function showCreateProjectModal() {
  $("cpName").value = "";
  $("cpBuyer").value = "";
  $("cpBudget").value = "";
  $("cpDeadline").value = "";
  $("createProjectModal").classList.add("show");
}

async function createProject() {
  var name = $("cpName").value.trim();
  var buyer = $("cpBuyer").value.trim();
  if (!name) return toast("请输入项目名称", "error");
  try {
    var r = await api("/api/buyer/projects", {
      method: "POST",
      body: {
        account: USER.account,
        projectName: name,
        buyer: buyer || USER.account,
        budget: Number($("cpBudget").value) || 0,
        deadline: $("cpDeadline").value
      }
    });
    if (r.success) {
      toast("项目发布成功", "success");
      closeModal("createProjectModal");
      loadBuyerProjects();
      loadBuyerProjectSelect();
    } else {
      toast(r.message, "error");
    }
  } catch (e) {
    toast("网络错误", "error");
  }
}

async function closeProject(pid) {
  if (!confirm("确定要截止该项目吗？截止后供应商将无法报价。")) return;
  try {
    var r = await api("/api/buyer/projects/" + pid, {
      method: "PUT",
      body: { account: USER.account, status: "closed" }
    });
    if (r.success) { toast("项目已截止", "success"); loadBuyerProjects(); }
    else { toast(r.message, "error"); }
  } catch (e) { toast("网络错误", "error"); }
}

async function loadBuyerProjectSelect() {
  var r = await api("/api/buyer/projects?account=" + encodeURIComponent(USER.account));
  var opts = (r.data || []).map(function(p) { return '<option value="' + p.id + '">' + p.projectName + '</option>'; }).join("");
  $("bqProjectSelect").innerHTML = '<option value="">-- 选择项目 --</option>' + opts;
  $("bcProjectSelect").innerHTML = '<option value="">-- 选择项目 --</option>' + opts;
}

async function loadBuyerQuotes() {
  var pid = $("bqProjectSelect").value;
  if (!pid) return;
  var r = await api("/api/buyer/quotes/" + pid + "?account=" + encodeURIComponent(USER.account));
  if (!r.success) return toast(r.message, "error");
  var data = r.data || [];
  if (data.length === 0) { $("bqTableContainer").innerHTML = '<div class="empty">暂无供应商报价</div>'; return; }
  $("bqTableContainer").innerHTML = '<table><thead><tr><th>供应商</th><th>物料数</th><th>总报价</th><th>IP</th><th>时间</th></tr></thead><tbody>' +
    data.map(function(q) {
      return '<tr><td><strong>' + q.supplierName + '</strong></td><td>' + q.items.length + '</td><td class="text-green">&yen;' + (q.total || 0).toLocaleString() + '</td><td class="text-mono">' + q.ip + '</td><td>' + new Date(q.submittedAt).toLocaleString() + '</td></tr>';
    }).join("") + '</tbody></table>';
}

async function loadBuyerCompareSelect() { loadBuyerProjectSelect(); }

async function loadBuyerCompare() {
  var pid = $("bcProjectSelect").value;
  if (!pid) return;
  var r = await api("/api/buyer/quotes/" + pid + "?account=" + encodeURIComponent(USER.account));
  if (!r.success) return toast(r.message, "error");
  var quotes = r.data || [];
  if (quotes.length === 0) { $("bcTableContainer").innerHTML = '<div class="empty">暂无报价数据</div>'; return; }

  var materials = [];
  var matSet = {};
  quotes.forEach(function(q) {
    q.items.forEach(function(it) {
      var name = it.materialName || it.name || "";
      if (name && !matSet[name]) { matSet[name] = true; materials.push(name); }
    });
  });

  var headerCells = '<th>物料名称</th>' + quotes.map(function(q) { return '<th>' + q.supplierName + '</th>'; }).join("") + '<th>最低价</th>';
  var bodyRows = "";
  materials.forEach(function(mat) {
    var prices = quotes.map(function(q) {
      var it = q.items.find(function(x) { return (x.materialName || x.name) === mat; });
      return it ? (it.unitPrice || it.price || 0) : 0;
    });
    var min = Math.min.apply(null, prices.filter(function(p) { return p > 0; }));
    bodyRows += '<tr><td>' + mat + '</td>' + prices.map(function(p, i) {
      var isMin = p === min && p > 0;
      return '<td style="' + (isMin ? 'background:#C6EFCE;color:#006100;font-weight:600' : '') + '">&yen;' + (p || "--") + '</td>';
    }).join("") + '<td style="font-weight:600">&yen;' + min.toLocaleString() + '</td></tr>';
  });

  var summaryRow = '<tr style="background:#f0f2f5;font-weight:600"><td>合计总价</td>' +
    quotes.map(function(q) { return '<td>&yen;' + (q.total || 0).toLocaleString() + '</td>'; }).join("") + '<td></td></tr>';

  $("bcTableContainer").innerHTML = '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + bodyRows + summaryRow + '</tbody></table>';
}

function exportCompare() {
  var pid = $("bcProjectSelect").value;
  if (!pid) return toast("请先选择项目", "error");
  window.open("http://localhost:3001/api/admin/export/" + pid, "_blank");
}

// ======================== 评审专家视图 ========================

async function loadReviewerProjects() {
  try {
    var r = await api("/api/reviewer/projects");
    var data = r.data || [];
    $("rStatTotal").textContent = data.length;
    $("rStatOpen").textContent = data.filter(function(p) { return p.status === "open"; }).length;
    $("rStatBids").textContent = data.filter(function(p) { return p.quoteCount > 0; }).length;
    $("rStatWon").textContent = data.filter(function(p) { return p.status === "closed"; }).length;
    if (data.length === 0) { $("rTableContainer").innerHTML = '<div class="empty">暂无项目</div>'; return; }
    var rows = data.map(function(p) {
      var sc = p.status === "open" ? "open" : "closed";
      var st = p.status === "open" ? "进行中" : "已截止";
      return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>' + p.buyer + '</td><td>&yen;' + (p.budget || "--") + '</td><td><span class="status ' + sc + '">' + st + '</span></td><td>' + (p.quoteCount || 0) + '</td><td class="text-green">' + (p.lowestBid ? '&yen;' + p.lowestBid.toLocaleString() : "--") + '</td><td>' + (p.winningSupplier || "--") + '</td></tr>';
    }).join("");
    $("rTableContainer").innerHTML = '<table><thead><tr><th>编号</th><th>项目名称</th><th>采购员</th><th>预算</th><th>状态</th><th>报价数</th><th>最低报价</th><th>中标方</th></tr></thead><tbody>' + rows + '</tbody></table>';
  } catch (e) {
    $("rTableContainer").innerHTML = '<div class="empty">加载失败，请确认服务已启动</div>';
  }
}

// ======================== 初始化 ========================

function doLogout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

// 显示用户信息
$("displayAccount").textContent = USER.account;
$("displayRole").textContent = roleMap[USER.role] || USER.role;

// 构建侧栏
buildSidebar();

// 根据角色切换默认视图
var defaultView = USER.role === "supplier" ? "supplier-projects"
  : USER.role === "buyer" ? "buyer-projects"
  : "reviewer-projects";
switchView(defaultView);

// 供应商搜索/筛选事件
var sSearchEl = $("sSearch");
if (sSearchEl) sSearchEl.addEventListener("input", loadSupplierProjects);
var sFilterEl = $("sFilter");
if (sFilterEl) sFilterEl.addEventListener("change", loadSupplierProjects);
</script>
</body>
</html>`;

fs.writeFileSync("outputs/dashboard.html", html, "utf8");
console.log("Dashboard written! Length:", html.length);

// Verify JS syntax
let scriptStart = html.indexOf("<script>");
let scriptEnd = html.indexOf("</script>", scriptStart);
let js = html.substring(scriptStart + 8, scriptEnd);
try {
  new Function(js);
  console.log("JS syntax: OK!");
} catch(e) {
  console.log("JS syntax error:", e.message);
}
