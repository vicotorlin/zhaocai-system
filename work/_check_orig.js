

var API="http://localhost:3000";
var roleMap={supplier:"供应商",buyer:"采购员",reviewer:"评审专家"};
var params=new URLSearchParams(window.location.search);
var USER={account:params.get("account")||sessionStorage.getItem("zrbac_user")||"",role:params.get("role")||sessionStorage.getItem("zrbac_role")||"supplier"};
var SUPPLIER_SCORES={"优质纺织供应商":{delivery:92,quality:88},"恒源纺织有限公司":{delivery:85,quality:90},"鑫达家纺有限公司":{delivery:95,quality:85},"华锦高端家纺":{delivery:88,quality:95}};

var isBeddingMode=false;  // 被子件套模式开关sessionStorage.setItem("zrbac_user",USER.account);sessionStorage.setItem("zrbac_role",USER.role);
function $(id){return document.getElementById(id);}
function toast(m,t){var e=document.createElement("div");e.className="toast "+(t||"success");e.textContent=m;document.body.appendChild(e);setTimeout(function(){e.remove();},3000);}

function sq(id, name) {
  return "showProjectQuotes('" + id + "','" + (name||"").replace(/'/g, "\\'") + "')";
}
function closeModal(id){$(id).classList.remove("show");if(id==="createProjectModal"){cpFiles=[];cpChannelFiles=[];cpTechFiles=[];}if(id==="bidModal"){bidFiles=[];}}
async function api(p,o){o=o||{};o.headers={"Content-Type":"application/json",...(o.headers||{})};if(o.body)o.body=JSON.stringify(o.body);var r=await fetch(API+p,o);return r.json();}
function switchView(id){
document.querySelectorAll(".sidebar .menu-item").forEach(function(m){m.classList.remove("active");});
var mi=document.querySelector('.sidebar .menu-item[data-view="'+id+'"]');if(mi)mi.classList.add("active");
document.querySelectorAll(".view").forEach(function(v){v.classList.remove("active");v.style.display="none";});
var t=document.getElementById("view-"+id);if(t){t.classList.add("active");t.style.display="block";}
if(id==="supplier-projects")loadSupplierProjects();
if(id==="buyer-projects")loadBuyerProjects();
if(id==="buyer-quotes")loadBuyerProjectSelect();
if(id==="buyer-compare")loadBuyerCompareSelect();
if(id==="reviewer-projects")loadReviewerProjects();

if(id==="supplier-history")loadSupplierHistory();
}


document.addEventListener("click", function(e){
  var t = e.target.closest('[data-action="show-quotes"]');
  if (t) {
    showProjectQuotes(t.getAttribute("data-pid"), t.getAttribute("data-pname"));
  }
});

document.addEventListener("click",function(e){
var t=e.target.closest("[data-action]");if(!t)return;
var a=t.getAttribute("data-action");
if(a==="alert"){alert(t.getAttribute("data-msg")||"");}
if(a==="supplier-bid"||a==="open-bid"){openSupplierBid(t.getAttribute("data-pid")||"",t.getAttribute("data-bid")||"");}
if(a==="edit-bid"){editSupplierBid(t.getAttribute("data-bid")||"",t.getAttribute("data-pid")||"");}
if(a==="close-project"){closeProject(t.getAttribute("data-pid")||"");}});

function buildSidebar(){
var sb=document.getElementById("sidebar");
if(!sb){console.error("Sidebar not found");return;}
if(USER.role==="supplier"){
sb.innerHTML='<div class="menu-group">供应商工作台</div><div class="menu-item active" data-view="supplier-projects"><span>📋</span> 采购项目</div><div class="menu-divider"></div><div class="menu-group">历史记录</div><div class="menu-item" data-view="supplier-history"><span>📄</span> 我的报价记录</div>';
}else if(USER.role==="buyer"){
sb.innerHTML='<div class="menu-group">采购员工作台</div><div class="menu-item active" data-view="buyer-projects"><span>📋</span> 采购项目</div><div class="menu-item" data-view="buyer-quotes"><span>📨</span> 供应商报价</div><div class="menu-item" data-view="buyer-compare"><span>📊</span> 询比价结果</div>';
}else if(USER.role==="reviewer"){
sb.innerHTML='<div class="menu-group">评审专家工作台</div><div class="menu-item active" data-view="reviewer-projects"><span>📋</span> 采购项目</div>';
}
sb.querySelectorAll(".menu-item[data-view]").forEach(function(it){it.addEventListener("click",function(){switchView(this.getAttribute("data-view"));});});
}

function doLogout(){sessionStorage.clear();window.location.href="login.html";}

async function loadSupplierProjects(){
var myBidIds={};
try{var mbRes=await api("/api/supplier/bids?account="+encodeURIComponent(USER.account));
(mbRes.data||[]).forEach(function(b){myBidIds[b.projectId]=b.id;});
}catch(e){}
var kw=(document.getElementById("sSearch")&&document.getElementById("sSearch").value||"").toLowerCase();
var st=(document.getElementById("sFilter")&&document.getElementById("sFilter").value||"");
try{
var r=await api("/api/reviewer/projects");
var data=(r.data||[]).filter(function(p){return (!kw||p.projectName.toLowerCase().includes(kw))&&(!st||p.status===st);});
if(data.length===0){document.getElementById("sTableContainer").innerHTML='<div class="empty">暂无项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
var hasBid=myBidIds[p.id];
var actionBtn=hasBid?'<button class="btn btn-primary btn-sm" data-action="open-bid" data-pid="'+p.id+'" data-bid="'+myBidIds[p.id]+'">修改报价</button>':(p.status==="open"?'<button class="btn btn-primary btn-sm" data-action="open-bid" data-pid="'+p.id+'">立即报价</button>':'<span style="color:#999;font-size:12px">已截止</span>');
return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>&yen;'+(p.budget||"--")+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+actionBtn+'</td></tr>';
}).join("");
document.getElementById("sTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>采购员</th><th>预算</th><th>状态</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("sTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}

async function loadSupplierHistory(){
var kw=(document.getElementById("shSearch")&&document.getElementById("shSearch").value||"").toLowerCase();
try{
var r=await api("/api/supplier/bids?account="+encodeURIComponent(USER.account));
var data=(r.data||[]).filter(function(b){return !kw||(b.projectName||"").toLowerCase().includes(kw);});
if(data.length===0){document.getElementById("shTableContainer").innerHTML='<div class="empty">暂无报价记录</div>';return;}
var rows=data.map(function(b){
return '<tr><td>'+b.id+'</td><td>'+b.projectName+'</td><td>&yen;'+(b.total||0).toLocaleString()+'</td><td>'+(b.category||"--")+'</td><td>'+(b.items?b.items.length:0)+' 项</td><td>'+(b.specs?b.specs.length:0)+' 规格</td><td>'+new Date(b.submittedAt||b.createdAt).toLocaleString()+'</td><td>'+(b.projectStatus==="open"?'<button class="btn btn-primary btn-sm" data-action="edit-bid" data-bid="'+b.id+'" data-pid="'+b.projectId+'">修改报价</button>':'<span style="color:#999">已截止</span>')+'</td></tr>';
}).join("");
document.getElementById("shTableContainer").innerHTML='<table><thead><tr><th>报价单号</th><th>项目</th><th>总价</th><th>类目</th><th>物料数</th><th>规格数</th><th>提交时间</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById('shTableContainer').innerHTML='<div class="empty">加载失败</div>';}
}

// (Removed old openSupplierBid/editSupplierBid; now using inline modal via openBidForm)

async function loadBuyerProjects(){
try{
var r=await api("/api/buyer/projects?account="+encodeURIComponent(USER.account));
var data=r.data||[];
if(data.length===0){document.getElementById("bTableContainer").innerHTML='<div class="empty">暂无项目，点击上方按钮发布新项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
var qc=p.quoteCount||0;
var escName=p.projectName.replace(/'/g,"\\'");var quoteBtn=qc>0?'<button class="btn btn-primary btn-sm" data-action="show-quotes" data-pid="'+p.id+'" data-pname="'+escName+'">查看报价('+qc+')</button> ':'<span style="color:#999;font-size:12px">无报价</span> ';
return '<tr><td>'+p.id+'</td><td><strong style="cursor:pointer;color:#2563eb;text-decoration:underline" data-action="show-quotes" data-pid="'+p.id+'" data-pname="'+escName+'">'+p.projectName+'</strong></td><td>'+p.deadline+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+qc+'</td><td>'+quoteBtn+'<button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">截止</button></td></tr>';
}).join("");
document.getElementById("bTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>截止</th><th>状态</th><th>报价数</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("bTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}

async function loadBuyerProjectSelect(){
var r=await api("/api/buyer/projects?account="+encodeURIComponent(USER.account));
var data=r.data||[];
var o=data.map(function(p){return '<option value="'+p.id+'">'+p.projectName+' ('+p.id+')</option>';}).join("");
document.getElementById("bqProjectSelect").innerHTML='<option value="">-- 选择项目 --</option>'+o;
document.getElementById("bcProjectSelect").innerHTML='<option value="">-- 选择项目 --</option>'+o;
}

async function loadBuyerQuotes(){
var pid=document.getElementById("bqProjectSelect").value;if(!pid)return;
var r=await api("/api/buyer/quotes/"+pid+"?account="+encodeURIComponent(USER.account));
if(!r.success)return toast(r.message,"error");
var d2=r.data||[];
if(d2.length===0){document.getElementById("bqTableContainer").innerHTML='<div class="empty">暂无供应商报价</div>';return;}
document.getElementById("bqTableContainer").innerHTML='<table><thead><tr><th>供应商</th><th>物料数</th><th>总报价</th><th>时间</th></tr></thead><tbody>'+d2.map(function(q){return '<tr><td><strong>'+q.supplierName+'</strong></td><td>'+q.items.length+'</td><td>&yen;'+(q.total||0).toLocaleString()+'</td><td>'+new Date(q.submittedAt||q.createdAt).toLocaleString()+'</td></tr>';}).join("")+'</tbody></table>';
}

async function loadBuyerCompareSelect(){
var r=await api("/api/buyer/projects?account="+encodeURIComponent(USER.account));
var data=r.data||[];
var o=data.map(function(p){return '<option value="'+p.id+'">'+p.projectName+' ('+p.id+')</option>';}).join("");
document.getElementById("bcProjectSelect").innerHTML='<option value="">-- 选择项目 --</option>'+o;
}

async function loadBuyerCompare(){
var pid=document.getElementById("bcProjectSelect").value;if(!pid)return;
var r=await api("/api/buyer/quotes/"+pid+"?account="+encodeURIComponent(USER.account));
if(!r.success)return toast(r.message,"error");
currentQuoteData=r.data||[];
// 防御性解析：确保 items/specs 为数组
currentQuoteData.forEach(function(q){
if(typeof q.items==="string"){try{q.items=JSON.parse(q.items);}catch(e){q.items=[];}}
if(!Array.isArray(q.items))q.items=[];
if(typeof q.specs==="string"){try{q.specs=JSON.parse(q.specs);}catch(e){q.specs=[];}}
if(!Array.isArray(q.specs))q.specs=[];
});
if(currentQuoteData.length===0){document.getElementById("bcTableContainer").innerHTML='<div class="empty">暂无报价数据</div>';return;}
var hasBeddingCols=currentQuoteData.some(function(q){return q.items.some(function(it){return it.partName!==undefined||it.materialCode!==undefined||it.weight!==undefined||it.netUsage!==undefined||it.wastage!==undefined;});});
if(hasBeddingCols){
var hc='<th>部件名称</th><th>物料名称</th><th>牌号</th><th>实际用量</th><th>单价</th><th>含税金额</th><th>小计</th><th>供应商</th>';
var allItems=[];
currentQuoteData.forEach(function(q){q.items.forEach(function(it){allItems.push({supplier:q.supplierName,partName:it.partName||'',materialName:it.materialName||'',materialCode:it.materialCode||'',actualUsage:((Number(it.netUsage)||0)*(1+(Number(it.wastage)||0)/100)),unitPrice:it.unitPrice||0,subtotal:it.subtotal||0});});});
var allSubtotals=allItems.map(function(it){return it.subtotal||0;});
var minSubtotal=Math.min.apply(null,allSubtotals.filter(function(p){return p>0;}));
var br=allItems.map(function(it){var isMin=it.subtotal===minSubtotal&&it.subtotal>0;var bg=isMin?'background:#C6EFCE;color:#006100;font-weight:600':'';return '<tr><td style="'+bg+'">'+it.partName+'</td><td style="'+bg+'">'+it.materialName+'</td><td style="'+bg+'">'+it.materialCode+'</td><td style="'+bg+'">'+it.actualUsage.toFixed(2)+'</td><td style="'+bg+'">¥'+it.unitPrice.toLocaleString()+'</td><td style="'+bg+'">¥'+it.subtotal.toLocaleString()+'</td><td style="'+bg+'">¥'+it.subtotal.toLocaleString()+'</td><td style="'+bg+'">'+it.supplier+'</td></tr>';}).join("");
document.getElementById("bcTableContainer").innerHTML='<table><thead><tr>'+hc+'</tr></thead><tbody>'+br+'</tbody></table>';
}else{
var mats=[];var ms={};
currentQuoteData.forEach(function(q){q.items.forEach(function(it){var n=it.materialName||it.name||"";if(n&&!ms[n]){ms[n]=true;mats.push(n);}});});
var hc2='<th>物料名称</th><th>规格</th>';currentQuoteData.forEach(function(q){hc2+='<th>'+q.supplierName+'</th>';});
var br2=mats.map(function(mat){var row='<tr><td>'+mat+'</td><td>--</td>';currentQuoteData.forEach(function(q){var found=q.items.find(function(it){return (it.materialName||it.name)===mat;});row+='<td>'+(found?'¥'+(found.unitPrice||0).toLocaleString()+'/¥'+(found.subtotal||(found.quantity*found.unitPrice)||0).toLocaleString():"--")+'</td>';});row+='</tr>';return row;}).join("");
document.getElementById("bcTableContainer").innerHTML='<table><thead><tr>'+hc2+'</tr></thead><tbody>'+br2+'</tbody></table>';
}
}

async function exportCompare(){
var pid=document.getElementById("bcProjectSelect").value;if(!pid)return toast("请先选择项目","error");
window.open("http://localhost:3000/api/buyer/export/"+pid,"_blank");
}

async function loadReviewerProjects(){
try{var r=await api("/api/reviewer/projects");var data=r.data||[];
document.getElementById("rStatTotal").textContent=data.length;
document.getElementById("rStatOpen").textContent=data.filter(function(p){return p.status==="open";}).length;
document.getElementById("rStatBids").textContent=data.filter(function(p){return p.quoteCount>0;}).length;ngth;
document.getElementById("rStatWon").textContent=data.filter(function(p){return p.status==="closed";}).length;
if(data.length===0){document.getElementById("rTableContainer").innerHTML='<div class="empty">暂无项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
var winCol=p.status==="open"?"--":"<strong style=\"color:#27ae60\">"+p.winningSupplier+"</strong>";
var escName=p.projectName.replace(/'/g,"\\'");return '<tr><td>'+p.id+'</td><td><strong style="cursor:pointer;color:#2563eb;text-decoration:underline" data-action="show-quotes" data-pid="'+p.id+'" data-pname="'+escName+'">'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>&yen;'+(p.budget||"--")+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+(p.quoteCount||0)+'</td><td class="text-green">'+(p.lowestBid?"&yen;"+p.lowestBid.toLocaleString():"--")+'</td><td>'+winCol+'</td></tr>';
}).join("");
document.getElementById("rTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>采购员</th><th>预算</th><th>状态</th><th>报价数</th><th>最低报价</th><th>中标方</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("rTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}

var currentQuoteData=[];
var currentQuoteProjectId="";

async function showProjectQuotes(projectId,projectName){
currentQuoteProjectId=projectId;
document.getElementById("qdTitle").textContent="报价详情 - "+projectName+" ("+projectId+")";
document.getElementById("qdContent").innerHTML='<div class="empty">加载中...</div>';
document.getElementById("quoteDetailModal").classList.add("show");
var r=await api("/api/buyer/quotes/"+projectId+"?account="+encodeURIComponent(USER.account));
if(!r.success){document.getElementById("qdContent").innerHTML='<div class="empty">'+r.message+'</div>';return;}
currentQuoteData=r.data||[];
if(currentQuoteData.length===0){document.getElementById("qdContent").innerHTML='<div class="empty">暂无供应商报价</div>';return;}
var projInfo=r.project||{};
var supplierList=currentQuoteData.map(function(q){return q.supplierName;}).join(" / ");
var projHeader='<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px">';
projHeader+='<h4 style="margin:0 0 10px 0;color:#1a1a2e;font-size:15px">📋 项目信息：'+projInfo.projectName+' ('+projInfo.id+')</h4>';
projHeader+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px 20px;font-size:13px;color:#555">';
projHeader+='<div><span style="color:#999">采购单位：</span>'+projInfo.buyer+'</div>';
projHeader+='<div><span style="color:#999">预算：</span>&yen;'+(Number(projInfo.budget)||0).toLocaleString()+'</div>';
projHeader+='<div><span style="color:#999">截止日期：</span>'+projInfo.deadline+'</div>';
projHeader+='<div><span style="color:#999">状态：</span><span style="color:'+(projInfo.status==="open"?"#27ae60":"#999")+'">'+(projInfo.status==="open"?"进行中":"已截止")+'</span></div>';
projHeader+='<div><span style="color:#999">投标供应商数：</span>'+currentQuoteData.length+' 家</div>';
projHeader+='<div><span style="color:#999">供应商：</span><strong>'+supplierList+'</strong></div>';
projHeader+='</div></div>';

if(USER.role==="reviewer"){
var scHTML='<div style="overflow-x:auto;margin-bottom:16px"><h4 style="margin-bottom:8px;color:#333">📊 项目报价评分表</h4><table style="width:100%;font-size:13px"><thead><tr style="background:#e8f0fe"><th>规格名称</th><th>供应商</th><th>报价总额</th><th style="color:#e74c3c">价格得分(50%)</th><th style="color:#2c5364">交付得分(25%)</th><th style="color:#27ae60">品质得分(25%)</th><th>综合得分(100%)</th></tr></thead><tbody>';
currentQuoteData.forEach(function(q){
var specs=q.specs||[];
if(specs.length===0){
var ct=(q.laborCost||0)+(q.manufacturingCost||0)+(q.adminCost||0)+(q.profit||0)+(q.tax||0)+q.items.reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
var ss=SUPPLIER_SCORES[q.supplierName]||{delivery:80,quality:80};
scHTML+='<tr><td>--</td><td><strong>'+q.supplierName+'</strong></td><td>&yen;'+ct.toLocaleString()+'</td><td style="color:#e74c3c;font-weight:600">--</td><td style="color:#2c5364;font-weight:600">'+ss.delivery+'</td><td style="color:#27ae60;font-weight:600">'+ss.quality+'</td><td style="font-weight:700">--</td></tr>';
return;
}
specs.forEach(function(sp){
var specTotal=(sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0)+(sp.items||[]).reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
var allSpecTotals=[];
currentQuoteData.forEach(function(qq){
(qq.specs||[]).forEach(function(ssp){
if(ssp.name===sp.name||(!sp.name&&!ssp.name)){
var st=(ssp.laborCost||0)+(ssp.manufacturingCost||0)+(ssp.adminCost||0)+(ssp.profit||0)+(ssp.tax||0)+(ssp.items||[]).reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
if(st>0)allSpecTotals.push(st);
}
});
});
var minSpecTotal=Math.min.apply(null,allSpecTotals);
var priceScore=minSpecTotal>0?Math.round((minSpecTotal/specTotal)*10000)/100:0;
var isBest=priceScore>=100;
var ss2=SUPPLIER_SCORES[q.supplierName]||{delivery:80,quality:80};
var deliveryScore=ss2.delivery||80;
var qualityScore=ss2.quality||80;
var composite=Math.round((priceScore*0.5+deliveryScore*0.25+qualityScore*0.25)*100)/100;
scHTML+='<tr'+(isBest?' style="background:#C6EFCE"':'')+'><td>'+(sp.name||'--')+'</td><td><strong>'+(isBest?'🏆 ':'')+q.supplierName+'</strong></td><td>&yen;'+specTotal.toLocaleString()+'</td><td style="color:#e74c3c;font-weight:600">'+priceScore.toFixed(1)+'</td><td style="color:#2c5364;font-weight:600">'+deliveryScore+'</td><td style="color:#27ae60;font-weight:600">'+qualityScore+'</td><td style="font-weight:700;font-size:14px">'+composite.toFixed(1)+'</td></tr>';
});
});
scHTML+='</tbody></table></div>';

// 串标检测
if(r.collusionWarnings&&r.collusionWarnings.length>0){
var warnHtml='<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-bottom:16px"><strong style="color:#856404">' + '串标风险提示' + '</strong><ul style="margin:8px 0 0 16px;color:#856404;font-size:13px">';
r.collusionWarnings.forEach(function(w){warnHtml+='<li>'+w.detail+'</li>';});
warnHtml+='</ul></div>';
projHeader=warnHtml+projHeader;
}
document.getElementById("qdContent").innerHTML=projHeader+scHTML;
}else{
var hasBeddingCols=currentQuoteData.some(function(q){return q.items.some(function(it){return it.partName!==undefined||it.materialCode!==undefined||it.weight!==undefined||it.netUsage!==undefined||it.wastage!==undefined;});});
var hc='';var br='';var sr='';
if(hasBeddingCols){
hc='<th>部件名称</th><th>物料名称</th><th>牌号</th><th>实际用量</th><th>单价</th><th>含税金额</th><th>小计</th><th>供应商</th>';
var allItems=[];
currentQuoteData.forEach(function(q){q.items.forEach(function(it){allItems.push({supplier:q.supplierName,partName:it.partName||'',materialName:it.materialName||'',materialCode:it.materialCode||'',actualUsage:((Number(it.netUsage)||0)*(1+(Number(it.wastage)||0)/100)),unitPrice:it.unitPrice||0,subtotal:it.subtotal||0});});});
var allSubtotals=allItems.map(function(it){return it.subtotal||0;});
var minSubtotal=Math.min.apply(null,allSubtotals.filter(function(p){return p>0;}));
allItems.forEach(function(it){var isMin=it.subtotal===minSubtotal&&it.subtotal>0;var bg=isMin?'background:#C6EFCE;color:#006100;font-weight:600':'';br+='<tr><td style="'+bg+'">'+it.partName+'</td><td style="'+bg+'">'+it.materialName+'</td><td style="'+bg+'">'+it.materialCode+'</td><td style="'+bg+'">'+it.actualUsage.toFixed(2)+'</td><td style="'+bg+'">¥'+it.unitPrice.toLocaleString()+'</td><td style="'+bg+'">¥'+it.subtotal.toLocaleString()+'</td><td style="'+bg+'">¥'+it.subtotal.toLocaleString()+'</td><td style="'+bg+'">'+it.supplier+'</td></tr>';});
}else{
var mats=[];var ms={};
currentQuoteData.forEach(function(q){q.items.forEach(function(it){var n=it.materialName||it.name||"";if(n&&!ms[n]){ms[n]=true;mats.push(n);}});});
hc='<th>物料名称</th><th>规格</th>';currentQuoteData.forEach(function(q){hc+='<th>'+q.supplierName+'</th>';});
mats.forEach(function(mat){var row='<tr><td>'+mat+'</td><td>--</td>';currentQuoteData.forEach(function(q){var found=q.items.find(function(it){return (it.materialName||it.name)===mat;});row+='<td>'+(found?'¥'+(found.unitPrice||0).toLocaleString()+" / ¥"+(found.subtotal||(found.quantity*found.unitPrice)||0).toLocaleString():"--")+'</td>';});row+='</tr>';br+=row;});
}

// Cost breakdown comparison table (horizontal)
var costHTML="";
if(currentQuoteData.length>0){
  // Calculate matCost for each supplier
  currentQuoteData.forEach(function(q){
    q._matCost=q.items.reduce(function(s,it){return s+(it.subtotal||Number(it.quantity)*Number(it.unitPrice)||0);},0);
    q._total=q._matCost+(q.laborCost||0)+(q.manufacturingCost||0)+(q.adminCost||0)+(q.profit||0)+(q.tax||0);
  });
  // Build comparison table
  costHTML+="<div style=\x27background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:12px;overflow-x:auto\x27>";
  costHTML+="<h4 style=\x27margin:0 0 10px 0;font-size:14px;color:#1a1a2e\x27>📊 费用拆分横向对比</h4>";
  costHTML+="<table style=\x27width:100%;font-size:12px;border-collapse:collapse\x27><thead><tr style=\x27background:#f8fafc\x27><th style=\x27text-align:left;padding:6px 10px\x27>费用项目</th>";
  currentQuoteData.forEach(function(q){costHTML+="<th style=\x27text-align:right;padding:6px 10px\x27>"+q.supplierName+"</th>";});
  costHTML+="</tr></thead><tbody>";
  // Row helper
  function addRow(label, key){
    var vals=currentQuoteData.map(function(q){return (key==="_matCost"?q._matCost:Number(q[key])||0);});
    var minVal=Math.min.apply(null,vals);
    costHTML+="<tr><td style=\x27padding:6px 10px;font-weight:600\x27>"+label+"</td>";
    currentQuoteData.forEach(function(q){
      var v=(key==="_matCost"?q._matCost:Number(q[key])||0);
      var isMin=v===minVal&&v>0;
      var bg=isMin?"background:#C6EFCE;color:#006100;font-weight:600":"";
      costHTML+="<td style=\x27text-align:right;padding:6px 10px;"+bg+"\x27>"+v.toLocaleString()+"</td>";
    });
    costHTML+="</tr>";
  }
  addRow("材料费用","_matCost");
  addRow("人工费用","laborCost");
  addRow("制造费用","manufacturingCost");
  addRow("管理费用","adminCost");
  addRow("利润","profit");
  addRow("税金","tax");
  // Summary row
  var totals=currentQuoteData.map(function(q){return q._total;});
  var minTotal=Math.min.apply(null,totals);
  costHTML+="<tr style=\x27background:#f0f7ff;font-weight:700\x27><td style=\x27padding:6px 10px;color:#1a1a2e\x27>💰 费用汇总</td>";
  currentQuoteData.forEach(function(q){
    var isMin=q._total===minTotal&&q._total>0;
    var bg=isMin?"background:#C6EFCE;color:#006100;font-weight:700":"";
    costHTML+="<td style=\x27text-align:right;padding:6px 10px;color:#2563eb;"+bg+"\x27>"+q._total.toLocaleString()+"</td>";
  });
  costHTML+="</tr>";
var specHTML="";
var allSpecNames=[];
currentQuoteData.forEach(function(q){
  var specs=q.specs||[];
  specs.forEach(function(sp){
    var name=sp.name||"默认规格";
    if(allSpecNames.indexOf(name)<0)allSpecNames.push(name);
  });
});
if(allSpecNames.length>0){
  allSpecNames.forEach(function(specName){
    specHTML+='<div style="overflow-x:auto;margin-bottom:16px;border:1px solid #e2e8f0;border-radius:8px;padding:12px"><h4 style="margin-bottom:8px;color:#1a1a2e">📦 规格: '+specName+'</h4>';
    specHTML+='<table style="width:100%;font-size:13px;margin-bottom:10px"><thead><tr style="background:#f1f5f9"><th>供应商</th><th>材料费</th><th>人工</th><th>制造</th><th>管理</th><th>利润</th><th>税金</th><th style="color:#2563eb">合计</th></tr></thead><tbody>';
    var specRows=[];
    currentQuoteData.forEach(function(q){
      var specs=q.specs||[];
      var sp=null;
      for(var i=0;i<specs.length;i++){
        if((specs[i].name||"默认规格")===specName){sp=specs[i];break;}
      }
      if(sp){
        var mCost=(sp.items||[]).reduce(function(s,it){return s+(Number(it.subtotal)||Number(it.quantity)*Number(it.unitPrice)||0);},0);
        var st=mCost+(sp.laborCost||0)+(sp.manufacturingCost||0)+(sp.adminCost||0)+(sp.profit||0)+(sp.tax||0);
        specRows.push({name:q.supplierName,mCost:mCost,labor:sp.laborCost||0,mfg:sp.manufacturingCost||0,admin:sp.adminCost||0,profit:sp.profit||0,tax:sp.tax||0,total:st});
      }
    });
    if(specRows.length>0){
      var minMCost=Math.min.apply(null,specRows.map(function(r){return r.mCost;}));
      var minLabor=Math.min.apply(null,specRows.map(function(r){return r.labor;}));
      var minMfg=Math.min.apply(null,specRows.map(function(r){return r.mfg;}));
      var minAdmin=Math.min.apply(null,specRows.map(function(r){return r.admin;}));
      var minProfit=Math.min.apply(null,specRows.map(function(r){return r.profit;}));
      var minTax=Math.min.apply(null,specRows.map(function(r){return r.tax;}));
      var minTotal=Math.min.apply(null,specRows.map(function(r){return r.total;}));
      specRows.forEach(function(r){
        var mc=r.mCost===minMCost?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var lc=r.labor===minLabor?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var fc=r.mfg===minMfg?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var ac=r.admin===minAdmin?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var pc=r.profit===minProfit?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var tc=r.tax===minTax?'background:#C6EFCE;color:#006100;font-weight:600':'';
        var gc=r.total===minTotal?'background:#C6EFCE;color:#006100;font-weight:600':'';
        specHTML+='<tr><td><strong>'+r.name+'</strong></td><td style="text-align:right;'+mc+'">'+r.mCost.toLocaleString()+'</td><td style="text-align:right;'+lc+'">'+r.labor.toLocaleString()+'</td><td style="text-align:right;'+fc+'">'+r.mfg.toLocaleString()+'</td><td style="text-align:right;'+ac+'">'+r.admin.toLocaleString()+'</td><td style="text-align:right;'+pc+'">'+r.profit.toLocaleString()+'</td><td style="text-align:right;'+tc+'">'+r.tax.toLocaleString()+'</td><td style="text-align:right;color:#2563eb;font-weight:600;'+gc+'">'+r.total.toLocaleString()+'</td></tr>';
      });
    }
    specHTML+='</tbody></table>';
    specHTML+='<details style="font-size:12px"><summary style="cursor:pointer;color:#2563eb;font-weight:600;margin-bottom:8px">📋 物料明细</summary>';
    specHTML+='<table style="width:100%;font-size:12px"><thead><tr style="background:#fafafa"><th>供应商</th><th>部件名称</th><th>物料名称</th><th>牌号</th><th>实际用量</th><th>单价</th><th>含税金额</th><th>小计</th></tr></thead><tbody>';
    currentQuoteData.forEach(function(q){
      var specs=q.specs||[];
      var sp=null;
      for(var i=0;i<specs.length;i++){
        if((specs[i].name||"默认规格")===specName){sp=specs[i];break;}
      }
      if(sp&&sp.items){
        sp.items.forEach(function(it){
          var au=((Number(it.netUsage)||0)*(1+(Number(it.wastage)||0)/100)).toFixed(2);
          specHTML+='<tr><td>'+q.supplierName+'</td><td>'+(it.partName||"")+'</td><td>'+(it.materialName||"")+'</td><td>'+(it.materialCode||"")+'</td><td>'+au+'</td><td>¥'+(Number(it.unitPrice)||0).toLocaleString()+'</td><td>¥'+(Number(it.subtotal)||0).toLocaleString()+'</td><td>¥'+(Number(it.subtotal)||0).toLocaleString()+'</td></tr>';
        });
      }
    });
    specHTML+='</tbody></table></details></div>';
  });
}

  costHTML+="</tbody></table></div>";
}

document.getElementById("qdContent").innerHTML=projHeader+specHTML+costHTML+'<div style="overflow-x:auto;margin-bottom:16px"><h4 style="margin-bottom:8px;color:#333">📋 物料报价对比</h4><table style="width:100%;font-size:13px"><thead><tr>'+hc+'</tr></thead><tbody>'+br+'</tbody></table></div>';
}
}

function exportProjectQuotes(){
var pid=currentQuoteProjectId;
if(!pid)return toast("请先选择项目","error");
window.open("http://localhost:3000/api/buyer/export/"+pid,"_blank");
toast("正在下载Excel...","success");
}

function showCreateProjectModal(){document.getElementById("createProjectModal").classList.add("show");}

var cpTechFiles=[];
var bidFiles=[];

var cpFiles=[];
var cpChannelFiles=[];cpTechFiles=[];
function handleCpTechFiles(fileList){
  for(var i=0;i<fileList.length;i++){
    var f=fileList[i];
    if(f.size>50*1024*1024){toast(f.name+" 超过50MB限制","error");continue;}
    var ext=f.name.split(".").pop().toLowerCase();
    if(["pdf","zip","rar","dwg","dxf"].indexOf(ext)===-1){toast(f.name+" 格式不支持，仅限PDF/ZIP/CAD","error");continue;}
    cpTechFiles.push(f);
  }
  renderCpTechFileList();
  document.getElementById("cpTechFileInput").value="";
}
function renderCpTechFileList(){
  var el=document.getElementById("cpTechAttachmentList");
  if(cpTechFiles.length===0){el.innerHTML="未选择文件";return;}
  el.innerHTML=cpTechFiles.map(function(f,i){
    var sizeMB=(f.size/1024/1024).toFixed(1);
    return "<div style=\x27font-size:10px;word-break:break-all;margin-bottom:2px\x27>"+f.name+" ("+sizeMB+"MB) <button class=\x27btn btn-outline btn-sm\x27 style=\x27padding:0 4px;font-size:10px\x27 onclick=\x27cpTechFiles.splice("+i+",1);renderCpTechFileList()\x27>\u00d7</button></div>";
  }).join("");
}
function handleCpChannelFiles(fileList){
  for(var i=0;i<fileList.length;i++){
    var f=fileList[i];
    if(f.size>50*1024*1024){toast(f.name+" 超过50MB限制","error");continue;}
    var ext=f.name.split(".").pop().toLowerCase();
    if(["pdf","zip","rar","dwg","dxf"].indexOf(ext)===-1){toast(f.name+" 格式不支持，仅限PDF/ZIP/CAD","error");continue;}
    cpChannelFiles.push(f);
  }
  renderCpChannelFileList();
  document.getElementById("cpChannelFileInput").value="";
}
function renderCpChannelFileList(){
  var el=document.getElementById("cpChannelAttachmentList");
  if(cpChannelFiles.length===0){el.innerHTML="未选择文件";return;}
  el.innerHTML=cpChannelFiles.map(function(f,i){
    var sizeMB=(f.size/1024/1024).toFixed(1);
    return "<div style='font-size:10px;word-break:break-all;margin-bottom:2px'>"+f.name+" ("+sizeMB+"MB) <button class='btn btn-outline btn-sm' style='padding:0 4px;font-size:10px' onclick='cpChannelFiles.splice("+i+",1);renderCpChannelFileList()'>×</button></div>";
  }).join("");
}
function handleCpFiles(fileList){
  for(var i=0;i<fileList.length;i++){
    var f=fileList[i];
    if(f.size>50*1024*1024){toast(f.name+" 超过50MB限制","error");continue;}
    var ext=f.name.split(".").pop().toLowerCase();
    if(["pdf","zip","rar","dwg","dxf"].indexOf(ext)===-1){toast(f.name+" 格式不支持，仅限PDF/ZIP/CAD","error");continue;}
    cpFiles.push(f);
  }
  renderCpFileList();
  document.getElementById("cpFileInput").value="";
}
function renderCpFileList(){
  var el=document.getElementById("cpAttachmentList");
  if(cpFiles.length===0){el.innerHTML="未选择文件";return;}
  el.innerHTML=cpFiles.map(function(f,i){
    var sizeMB=(f.size/1024/1024).toFixed(1);
    return "<div style='display:flex;align-items:center;gap:8px;padding:4px 8px;background:#f1f5f9;border-radius:4px;margin-bottom:4px'><span style='flex:1;font-size:12px'>"+f.name+" ("+sizeMB+"MB)</span><button class='btn btn-outline btn-sm' onclick='cpFiles.splice("+i+",1);renderCpFileList();' style='color:#e74c3c;padding:0 6px;font-size:11px'>×</button></div>";
  }).join("");
}
async function uploadCpChannelFiles(){
  var uploaded=[];
  for(var i=0;i<cpChannelFiles.length;i++){
    var fd=new FormData();
    fd.append("file",cpChannelFiles[i]);
    fd.append("projectId","new");
    fd.append("uploadedBy",USER.account);
    fd.append("originalFileName",cpChannelFiles[i].name);
    try{
      var r=await fetch(API+"/api/upload",{method:"POST",body:fd});
      var data=await r.json();
      if(data.success){uploaded.push({fileName:cpChannelFiles[i].name,fileUrl:(data.data.signed_url||data.data.storage_path),fileSize:cpChannelFiles[i].size,fileType:cpChannelFiles[i].type});}
      else{toast(cpChannelFiles[i].name+" 上传失败: "+data.message,"error");}
    }catch(e){toast(cpChannelFiles[i].name+" 上传失败","error");}
  }
  return uploaded;
}
async function uploadCpTechFiles(){
  var uploaded=[];
  for(var i=0;i<cpTechFiles.length;i++){
    var fd=new FormData();
    fd.append("file",cpTechFiles[i]);
    fd.append("projectId","new");
    fd.append("uploadedBy",USER.account);
    fd.append("originalFileName",cpTechFiles[i].name);
    try{
      var r=await fetch(API+"/api/upload",{method:"POST",body:fd});
      var data=await r.json();
      if(data.success){uploaded.push({fileName:cpTechFiles[i].name,fileUrl:(data.data.signed_url||data.data.storage_path),fileSize:cpTechFiles[i].size,fileType:cpTechFiles[i].type});}
      else{toast(cpTechFiles[i].name+" 上传失败: "+data.message,"error");}
    }catch(e){toast(cpTechFiles[i].name+" 上传失败","error");}
  }
  return uploaded;
}
async function uploadCpFiles(){
  var uploaded=[];
  for(var i=0;i<cpFiles.length;i++){
    var fd=new FormData();
    fd.append("file",cpFiles[i]);
    fd.append("projectId","new");
    fd.append("uploadedBy",USER.account);
    fd.append("originalFileName",cpFiles[i].name);
    try{
      var r=await fetch(API+"/api/upload",{method:"POST",body:fd});
      var data=await r.json();
      if(data.success){uploaded.push({fileName:cpFiles[i].name,fileUrl:(data.data.signed_url||data.data.storage_path),fileSize:cpFiles[i].size,fileType:cpFiles[i].type});}
      else{toast(cpFiles[i].name+" 上传失败: "+data.message,"error");}
    }catch(e){toast(cpFiles[i].name+" 上传失败","error");}
  }
  return uploaded;
}

async function createProject(){
var name=document.getElementById("cpName").value;
var deadline=document.getElementById("cpDeadline").value;
var plan=document.getElementById("cpPlan").value;
var channel=document.getElementById("cpChannel").value;
var techParams=document.getElementById("cpTechParams").value;
if(!name)return toast("请输入项目名称","error");
var uploadedFiles=[];
if(cpFiles.length>0){var f1=await uploadCpFiles();uploadedFiles=uploadedFiles.concat(f1);}
if(cpChannelFiles.length>0){var f2=await uploadCpChannelFiles();uploadedFiles=uploadedFiles.concat(f2);}
if(cpTechFiles.length>0){var f3=await uploadCpTechFiles();uploadedFiles=uploadedFiles.concat(f3);}
var r=await api("/api/buyer/projects",{method:"POST",body:{buyerAccount:USER.account,projectName:name,deadline:deadline,plan:plan,channelDetails:channel,techParams:techParams,attachments:uploadedFiles}});
if(r.success){closeModal("createProjectModal");loadBuyerProjects();toast("项目发布成功","success");}
else{toast(r.message,"error");}
}

function switchMaterialTable(){
  var cat=document.getElementById("bidCategory").value;
  if(cat==="被子件套"){
    isBeddingMode=true;
    renderTableHead();
    // Clear existing items and add one fresh bedding row
    document.getElementById("bidItemsBody").innerHTML="";
    addBidItem();
  }else{
    isBeddingMode=false;
    renderTableHead();
    document.getElementById("bidItemsBody").innerHTML="";
    addBidItem();
  }
}
function renderTableHead(){
var head=document.getElementById("bidItemsHead");
if(isBeddingMode){
head.innerHTML='<tr><th>部件名称</th><th>物料名称</th><th>物料牌号</th><th>克重</th><th>规格/幅宽</th><th>净用量</th><th>损耗(%)</th><th>实际用量</th><th>物料单价</th><th>含税金额</th><th>小计</th><th></th></tr>';
}else{
head.innerHTML='<tr><th>物料名称</th><th>编码</th><th>规格</th><th>数量</th><th>单位</th><th>单价(¥)</th><th>小计(¥)</th><th></th></tr>';
}
}

function addBidItem(data){
data=data||{};
var tbody=document.getElementById("bidItemsBody");
var row=document.createElement("tr");
if(isBeddingMode){
row.innerHTML='<td><input value="'+(data.partName||"")+'"></td><td><input value="'+(data.materialName||data.name||"")+'"></td><td><input value="'+(data.materialCode||"")+'"></td><td><input type="number" value="'+(data.weight||"")+'" onchange="calcBidTotal()"></td><td><input type="number" step="any" value="'+(data.spec||data.width||"")+'" onchange="calcBidTotal()"></td><td><input type="number" value="'+(data.netUsage||"")+'" onchange="calcBidTotal()"></td><td><input type="number" value="'+(data.loss||"")+'" style="width:60px" onchange="calcBidTotal()"></td><td class="item-actual">0</td><td><input type="number" value="'+(data.unitPrice||"")+'" onchange="calcBidTotal()"></td><td class="item-tax">0</td><td class="item-subtotal">0</td><td><button class="btn btn-outline btn-sm" onclick="var tr=this.closest(\x27tr\x27);if(tr)tr.remove();calcBidTotal()" style="color:#e74c3c">×</button></td>';
}else{
row.innerHTML='<td><input value="'+(data.name||"")+'"></td><td><input value="'+(data.materialCode||"")+'"></td><td><input value="'+(data.spec||"")+'"></td><td><input type="number" value="'+(data.qty||"")+'" style="width:60px" onchange="calcBidTotal()"></td><td><input value="'+(data.unit||"")+'" style="width:50px"></td><td><input type="number" value="'+(data.unitPrice||"")+'" onchange="calcBidTotal()"></td><td class="item-subtotal">0</td><td><button class="btn btn-outline btn-sm" onclick="var tr=this.closest(\x27tr\x27);if(tr)tr.remove();calcBidTotal()" style="color:#e74c3c">×</button></td>';
}
tbody.appendChild(row);
calcBidTotal();
}

function calcBidTotal(){
var materialTotal=0;
document.querySelectorAll("#bidItemsBody tr").forEach(function(row){
var inputs=row.querySelectorAll("input");
if(isBeddingMode){
var gramWeight=Number(inputs[3]&&inputs[3].value)||0;
var specWidth=Number(inputs[4]&&inputs[4].value)||0;
var netUsage=Number(inputs[5]&&inputs[5].value)||0;
var loss=Number(inputs[6]&&inputs[6].value)||0;
var actualUsage=netUsage*(1+loss/100);
var unitPrice=Number(inputs[7]&&inputs[7].value)||0;
// 如果克重和规格/幅宽同时为0，则只计算 实际用量*物料单价；否则使用完整公式
var taxAmount=(gramWeight===0&&specWidth===0)?actualUsage*unitPrice:gramWeight*specWidth*actualUsage*unitPrice/100000;
row.querySelector(".item-actual").textContent=actualUsage.toFixed(2);
row.querySelector(".item-tax").textContent=taxAmount.toFixed(2);
row.querySelector(".item-subtotal").textContent=taxAmount.toFixed(2);
materialTotal+=taxAmount;
}else{
var qty=Number(inputs[3]&&inputs[3].value)||0;
var price=Number(inputs[5]&&inputs[5].value)||0;
var subtotal=qty*price;
row.querySelector(".item-subtotal").textContent=subtotal.toLocaleString();
materialTotal+=subtotal;
}
});
document.getElementById("bidMaterialCost").value=materialTotal;
var labor=Number(document.getElementById("bidLabor").value)||0;
var mfg=Number(document.getElementById("bidMfg").value)||0;
var admin=Number(document.getElementById("bidAdmin").value)||0;
var profit=Number(document.getElementById("bidProfit").value)||0;
var tax=Number(document.getElementById("bidTax").value)||0;
var total=materialTotal+labor+mfg+admin+profit+tax;
document.getElementById("bidCostSummary").textContent="\u00A5"+total.toLocaleString();
document.getElementById("bidTotalDisplay").textContent=total.toLocaleString();
}

function collectBidItems(){
var items=[];
document.querySelectorAll("#bidItemsBody tr").forEach(function(row){
var inputs=row.querySelectorAll("input");
if(isBeddingMode){
var gw=Number(inputs[3]&&inputs[3].value)||0;
var sw=Number(inputs[4]&&inputs[4].value)||0;
var nu=Number(inputs[5]&&inputs[5].value)||0;
var lo=Number(inputs[6]&&inputs[6].value)||0;
var au=nu*(1+lo/100);
var up=Number(inputs[7]&&inputs[7].value)||0;
var ta=(gw===0&&sw===0)?au*up:gw*sw*au*up/100000;
items.push({
partName:inputs[0]&&inputs[0].value||"",
materialName:inputs[1]&&inputs[1].value||"",
materialCode:inputs[2]&&inputs[2].value||"",
weight:gw,
spec:inputs[4]&&inputs[4].value||"",
netUsage:nu,
loss:lo,
actualUsage:au,
unitPrice:up,
taxAmount:ta,
subtotal:ta
});
}else{
items.push({
name:inputs[0]&&inputs[0].value||"",
materialCode:inputs[1]&&inputs[1].value||"",
spec:inputs[2]&&inputs[2].value||"",
qty:Number(inputs[3]&&inputs[3].value)||0,
unit:inputs[4]&&inputs[4].value||"",
unitPrice:Number(inputs[5]&&inputs[5].value)||0
});
}
});
return items;
}

function handleBidFiles(fileList){
  for(var i=0;i<fileList.length;i++){
    var f=fileList[i];
    if(f.size>50*1024*1024){toast(f.name+" 超过50MB限制","error");continue;}
    bidFiles.push(f);
  }
  renderBidFileList();
  document.getElementById("bidFileInput").value="";
}
function renderBidFileList(){
  var el=document.getElementById("bidAttachmentList");
  if(bidFiles.length===0){el.innerHTML="未选择文件";return;}
  el.innerHTML=bidFiles.map(function(f,i){
    var sizeMB=(f.size/1024/1024).toFixed(1);
    return "<div style=\x27display:flex;align-items:center;gap:8px;padding:4px 8px;background:#f1f5f9;border-radius:4px;margin-bottom:4px\x27><span style=\x27flex:1;font-size:12px\x27>"+f.name+" ("+sizeMB+"MB)</span><button class=\x27btn btn-outline btn-sm\x27 onclick=\x27bidFiles.splice("+i+",1);renderBidFileList();\x27 style=\x27color:#e74c3c;padding:0 6px;font-size:11px\x27>×</button></div>";
  }).join("");
}
async function uploadBidFiles(){
  var uploaded=[];
  for(var i=0;i<bidFiles.length;i++){
    var fd=new FormData();
    fd.append("file",bidFiles[i]);
    fd.append("projectId",currentBidProjectId);
    fd.append("uploadedBy",USER.account);
    fd.append("originalFileName",bidFiles[i].name);
    try{
      var r=await fetch(API+"/api/upload",{method:"POST",body:fd});
      var data=await r.json();
      if(data.success){uploaded.push(data.data);}
      else{toast(bidFiles[i].name+" 上传失败: "+data.message,"error");}
    }catch(e){toast(bidFiles[i].name+" 上传失败","error");}
  }
  return uploaded;
}

async function submitBid(){
var items=collectBidItems();
if(items.length===0)return toast("请至少添加一个物料","error");
var supplierName=document.getElementById("bidSupplierName").value;
if(!supplierName)return toast("请输入供应商名称","error");
var materialCost=Number(document.getElementById("bidMaterialCost").value)||0;
var uploadedFiles=[];
if(bidFiles.length>0){uploadedFiles=await uploadBidFiles();}
var body={
projectId:currentBidProjectId,
supplierAccount:USER.account,
supplierName:supplierName,
items:items,
specs:[],
attachments:uploadedFiles,
total:Number(document.getElementById("bidTotalDisplay").textContent.replace(/,/g,""))||0,
laborCost:Number(document.getElementById("bidLabor").value)||0,
manufacturingCost:Number(document.getElementById("bidMfg").value)||0,
adminCost:Number(document.getElementById("bidAdmin").value)||0,
profit:Number(document.getElementById("bidProfit").value)||0,
tax:Number(document.getElementById("bidTax").value)||0,
category:document.getElementById("bidCategory").value,
validity:document.getElementById("bidValidity").value
};
var r=await api("/api/supplier/bid",{method:"POST",body:body});
if(r.success){toast("报价提交成功","success");closeModal('bidModal');loadSupplierProjects();}
else{toast(r.message,"error");}
}

async function openBidForm(pid,bidId){
currentBidProjectId=pid;
currentBidId=bidId||"";
document.getElementById("bidTitle").textContent=bidId?"修改报价":"填写报价";
document.getElementById("bidItemsBody").innerHTML="";
document.getElementById("bidSupplierName").value=USER.account||"";
document.getElementById("bidCategory").value="";
document.getElementById("bidValidity").value="";
bidFiles=[];
document.getElementById("bidAttachmentList").innerHTML="未选择文件";
document.getElementById("bidLabor").value="0";
document.getElementById("bidMfg").value="0";
document.getElementById("bidAdmin").value="0";
document.getElementById("bidProfit").value="0";
document.getElementById("bidTax").value="0";
document.getElementById("bidTotalDisplay").textContent="0";

if(bidId){
// Load existing bid data
try{
var r=await api("/api/supplier/bid/"+bidId+"?account="+encodeURIComponent(USER.account));
if(r.success&&r.data){
var b=r.data;
document.getElementById("bidSupplierName").value=b.supplierName||"";
document.getElementById("bidCategory").value=b.category||"";
if(b.category==="被子件套"){isBeddingMode=true;renderTableHead();}
document.getElementById("bidValidity").value=b.validity||"";
document.getElementById("bidLabor").value=b.laborCost||0;
document.getElementById("bidMfg").value=b.manufacturingCost||0;
document.getElementById("bidAdmin").value=b.adminCost||0;
document.getElementById("bidProfit").value=b.profit||0;
document.getElementById("bidTax").value=b.tax||0;
var items=b.items||[];
if(typeof items==="string"){try{items=JSON.parse(items);}catch(e){items=[];}}
// Check if this is a bedding bid
if(b.category==="被子件套"||(items.length>0&&items[0].partName!==undefined)){
isBeddingMode=true;
renderTableHead();
}
items.forEach(function(it){addBidItem(it);});
calcBidTotal();
}
}catch(e){toast("加载报价数据失败","error");}
}else{
isBeddingMode=false;
renderTableHead();
addBidItem();
}

  // Load project attachments
  try{
    var prjRes=await api("/api/projects/"+pid);
    if(prjRes.success&&prjRes.data){
      var prj=prjRes.data;
      // Show project name and deadline
      document.getElementById("bidProjectInfo").style.display="block";
      document.getElementById("bidProjectName").textContent=prj.projectName||"--";
      document.getElementById("bidProjectDeadline").textContent=prj.deadline||"--";
      var attHtml="";
      if(prj.plan)attHtml+="<div style=\x27margin-bottom:4px\x27><strong>项目企划：</strong>"+prj.plan+"</div>";
      if(prj.channelDetails)attHtml+="<div style=\x27margin-bottom:4px\x27><strong>渠道报量：</strong>"+prj.channelDetails+"</div>";
      if(prj.techParams)attHtml+="<div style=\x27margin-bottom:4px\x27><strong>技术参数：</strong>"+prj.techParams+"</div>";
      if(prj.attachments&&prj.attachments.length>0){
        attHtml+="<div style=\x27margin-top:8px\x27><strong>附件文件：</strong></div>";
        prj.attachments.forEach(function(att){
          attHtml+="<div style=\x27display:flex;align-items:center;gap:8px;padding:4px 8px;background:#f1f5f9;border-radius:4px;margin:4px 0\x27><span style=\x27flex:1;font-size:12px\x27>📄 "+att.fileName+"</span><a href=\x27"+(att.fileUrl&&att.fileUrl.startsWith('/')?API:'')+att.fileUrl+"\x27 target=\x27_blank\x27 class=\x27btn btn-outline btn-sm\x27 style=\x27padding:2px 10px;font-size:11px;text-decoration:none\x27>下载</a></div>";
        });
      }else{attHtml+="<div>暂无附件</div>";}
      document.getElementById("bidProjectAttachments").innerHTML=attHtml;
    }
  }catch(e){document.getElementById("bidProjectAttachments").innerHTML="加载失败";}
  document.getElementById("bidModal").classList.add("show");
}

// Replace old functions
function openSupplierBid(pid,bidId){ openBidForm(pid,bidId||""); }
function editSupplierBid(bidId,projectId){ openBidForm(projectId,bidId); }



// === INITIALIZATION ===
(function init(){
  if(!USER.account){
    window.location.href='login.html';
    return;
  }
  document.getElementById('displayAccount').textContent=USER.account;
  document.getElementById('displayRole').textContent=roleMap[USER.role]||USER.role;
  buildSidebar();
  var defaultViews={supplier:'supplier-projects',buyer:'buyer-projects',reviewer:'reviewer-projects'};
  var defaultView=defaultViews[USER.role]||'supplier-projects';
  switchView(defaultView);
})();


