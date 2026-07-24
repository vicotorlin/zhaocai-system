
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
        ? '<button class="btn btn-primary btn-sm" onclick="openSupplierBid(\' + p.id + \')">报价</button>'
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
      return '<tr><td>' + p.id + '</td><td><strong>' + p.projectName + '</strong></td><td>&yen;' + (p.budget || "--") + '</td><td>' + p.deadline + '</td><td><span class="status ' + sc + '">' + st + '</span></td><td>' + new Date(p.createdAt).toLocaleDateString() + '</td><td><button class="btn btn-danger btn-sm" onclick="closeProject(\' + p.id + \')">截止</button></td></tr>';
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

