
var API="http://localhost:3000";
var roleMap={supplier:"供应商",buyer:"采购员",reviewer:"评审专家"};
var params=new URLSearchParams(window.location.search);
var USER={account:params.get("account")||sessionStorage.getItem("zrbac_user")||"",role:params.get("role")||sessionStorage.getItem("zrbac_role")||"supplier"};
sessionStorage.setItem("zrbac_user",USER.account);sessionStorage.setItem("zrbac_role",USER.role);
function $(id){return document.getElementById(id);}
function toast(m,t){var e=document.createElement("div");e.className="toast "+(t||"success");e.textContent=m;document.body.appendChild(e);setTimeout(function(){e.remove();},3000);}
function closeModal(id){$(id).classList.remove("show");}
async function api(p,o){o=o||{};o.headers={"Content-Type":"application/json",...(o.headers||{})};if(o.body)o.body=JSON.stringify(o.body);var r=await fetch(API+p,o);return r.json();}

function switchView(id){
document.querySelectorAll(".sidebar .menu-item").forEach(function(m){m.classList.remove("active");});
var mi=document.querySelector('.sidebar .menu-item[data-view="'+id+'"]');if(mi)mi.classList.add("active");
document.querySelectorAll(".view").forEach(function(v){v.classList.remove("active");});
var t=document.getElementById("view-"+id);if(t)t.classList.add("active");
if(id==="supplier-projects")loadSupplierProjects();
if(id==="buyer-projects")loadBuyerProjects();
if(id==="buyer-quotes")loadBuyerProjectSelect();
if(id==="buyer-compare")loadBuyerCompareSelect();
if(id==="reviewer-projects")loadReviewerProjects();
if(id==="supplier-form")loadSupplierFormSelect();
}

document.addEventListener("click",function(e){
var t=e.target.closest("[data-action]");if(!t)return;
var a=t.getAttribute("data-action");
if(a==="alert"){alert(t.getAttribute("data-msg")||"");}
if(a==="supplier-bid"){openSupplierBid(t.getAttribute("data-pid")||"");}
if(a==="close-project"){closeProject(t.getAttribute("data-pid")||"");}
});

function buildSidebar(){
var sb=document.getElementById("sidebar");
if(USER.role==="supplier"){
sb.innerHTML='<div class="menu-group">供应商工作台</div><div class="menu-item active" data-view="supplier-projects"><span>&#x1F4CB;</span> 采购项目</div><div class="menu-item" data-view="supplier-form"><span>&#x270F;</span> 填写报价</div><div class="menu-divider"></div><div class="menu-group">历史记录</div><div class="menu-item" data-action="alert" data-msg="报价历史功能开发中"><span>&#x1F4C4;</span> 我的报价记录</div>';
}else if(USER.role==="buyer"){
sb.innerHTML='<div class="menu-group">采购员工作台</div><div class="menu-item active" data-view="buyer-projects"><span>&#x1F4CB;</span> 采购项目</div><div class="menu-item" data-view="buyer-quotes"><span>&#x1F4E8;</span> 供应商报价</div><div class="menu-item" data-view="buyer-compare"><span>&#x1F4CA;</span> 询比价结果</div>';
}else if(USER.role==="reviewer"){
sb.innerHTML='<div class="menu-group">评审专家工作台</div><div class="menu-item active" data-view="reviewer-projects"><span>&#x1F4CB;</span> 采购项目</div><div class="menu-divider"></div><div class="menu-group">评审工具</div><div class="menu-item" data-action="alert" data-msg="评分功能开发中"><span>&#x2B50;</span> 技术评分</div><div class="menu-item" data-action="alert" data-msg="商务评分功能开发中"><span>&#x1F4B0;</span> 商务评分</div>';
}
sb.querySelectorAll(".menu-item[data-view]").forEach(function(it){it.addEventListener("click",function(){switchView(this.getAttribute("data-view"));});});
}
async function loadSupplierProjects(){
var kw=(document.getElementById("sSearch")&&document.getElementById("sSearch").value||"").toLowerCase();
var st=(document.getElementById("sFilter")&&document.getElementById("sFilter").value||"");
try{
var r=await api("/api/reviewer/projects");
var data=(r.data||[]).filter(function(p){return (!kw||p.projectName.toLowerCase().includes(kw))&&(!st||p.status===st);});
document.getElementById("sStatTotal").textContent=r.total||0;
document.getElementById("sStatOpen").textContent=data.filter(function(p){return p.status==="open";}).length;
document.getElementById("sStatBids").textContent=(r.data||[]).reduce(function(s,p){return s+(p.quoteCount||0);},0);
if(data.length===0){document.getElementById("sTableContainer").innerHTML='<div class="empty">暂无匹配项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
var btn=p.status==="open"?'<button class="btn btn-primary btn-sm" data-action="supplier-bid" data-pid="'+p.id+'">报价</button>':'<span style="color:#999">--</span>';
return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>&yen;'+(p.budget||"--")+'</td><td>'+p.deadline+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+(p.quoteCount||0)+'</td><td>'+btn+'</td></tr>';
}).join("");
document.getElementById("sTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>采购单位</th><th>预算</th><th>截止</th><th>状态</th><th>报价数</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("sTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}
window.openSupplierBid=function(pid){document.getElementById("sfProjectSelect").value=pid;openSupplierForm();switchView("supplier-form");};
function loadSupplierFormSelect(){api("/api/reviewer/projects").then(function(r){document.getElementById("sfProjectSelect").innerHTML='<option value="">-- 选择报价项目 --</option>'+(r.data||[]).map(function(p){return '<option value="'+p.id+'">'+p.projectName+'</option>';}).join("");});}
function openSupplierForm(){var pid=document.getElementById("sfProjectSelect").value;if(!pid){document.getElementById("sfIframeWrap").style.display="none";document.getElementById("sfEmpty").style.display="block";return;}document.getElementById("sfIframeWrap").style.display="block";document.getElementById("sfEmpty").style.display="none";document.getElementById("sfIframe").src="http://localhost:5173?projectId="+pid;}
async function loadBuyerProjects(){
try{
var r=await api("/api/buyer/projects?account="+encodeURIComponent(USER.account));
var data=r.data||[];
if(data.length===0){document.getElementById("bTableContainer").innerHTML='<div class="empty">暂无项目，点击上方按钮发布新项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.deadline+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+new Date(p.createdAt).toLocaleDateString()+'</td><td><button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">截止</button></td></tr>';
}).join("");
document.getElementById("bTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>截止</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("bTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}
var planFiles=[];
var channelFiles=[];
var techFiles=[];
function showCreateProjectModal(){
document.getElementById("cpName").value="";
document.getElementById("cpPlan").value="";
document.getElementById("cpChannelVolume").value="";
document.getElementById("cpDeadline").value="";
document.getElementById("planFileList").innerHTML="";
document.getElementById("channelFileList").innerHTML="";
document.getElementById("techFileList").innerHTML="";
planFiles=[];channelFiles=[];techFiles=[];
document.getElementById("createProjectModal").classList.add("show");
}
async function uploadOneFile(file,listEl,filesArr){
var ext=file.name.split(".").pop().toLowerCase();
var allowed=["pdf","zip","rar","7z","dwg","dxf"];
if(allowed.indexOf(ext)<0){toast("不支持格式: ."+ext,"error");return;}
if(file.size>52428800){toast(file.name+" 超过50MB","error");return;}
var itemId="f-"+Date.now()+"-"+Math.random().toString(36).substr(2,5);
listEl.innerHTML+='<div class="file-item" id="'+itemId+'"><span class="file-name">'+file.name+'</span><span class="file-size">'+formatSize(file.size)+'</span><span class="file-status uploading">上传中...</span></div>';
var fd=new FormData();fd.append("file",file);fd.append("uploadedBy",USER.account);
try{
var resp=await fetch(API+"/api/upload",{method:"POST",body:fd});
var result=await resp.json();
var itemEl=document.getElementById(itemId);
if(result.success){filesArr.push(result.data);if(itemEl)itemEl.querySelector(".file-status").innerHTML='<span class="done">&#x2713;</span>';}
else{if(itemEl)itemEl.querySelector(".file-status").innerHTML='<span class="error">失败</span>';toast("上传失败: "+result.message,"error");}
}catch(e){var itemEl=document.getElementById(itemId);if(itemEl)itemEl.querySelector(".file-status").innerHTML='<span class="error">网络错误</span>';}
}
async function handlePlanFiles(files){for(var i=0;i<files.length;i++){await uploadOneFile(files[i],document.getElementById("planFileList"),planFiles);}document.getElementById("filePlan").value="";}
async function handleChannelFiles(files){for(var i=0;i<files.length;i++){await uploadOneFile(files[i],document.getElementById("channelFileList"),channelFiles);}document.getElementById("fileChannel").value="";}
async function handleTechFiles(files){for(var i=0;i<files.length;i++){await uploadOneFile(files[i],document.getElementById("techFileList"),techFiles);}document.getElementById("fileTech").value="";}
function formatSize(b){if(b<1024)return b+" B";if(b<1048576)return (b/1024).toFixed(1)+" KB";return (b/1048576).toFixed(1)+" MB";}
async function createProject(){
var name=document.getElementById("cpName").value.trim();if(!name)return toast("请输入项目名称","error");
try{
var body={account:USER.account,projectName:name,plan:document.getElementById("cpPlan").value.trim(),channelVolume:document.getElementById("cpChannelVolume").value.trim(),techParams:document.getElementById("cpTechParams").value.trim(),deadline:document.getElementById("cpDeadline").value};
if(planFiles.length>0)body.planFiles=planFiles.map(function(f){return f.id;});
if(channelFiles.length>0)body.channelFiles=channelFiles.map(function(f){return f.id;});if(techFiles.length>0)body.techFiles=techFiles.map(function(f){return f.id;});
var r=await api("/api/buyer/projects",{method:"POST",body:body});
if(r.success){toast("项目发布成功","success");closeModal("createProjectModal");loadBuyerProjects();loadBuyerProjectSelect();}
else{toast(r.message,"error");}
}catch(e){toast("网络错误，请确认服务已启动","error");}
}
async function closeProject(pid){
if(!confirm("确定要截止该项目吗？"))return;
try{var r=await api("/api/buyer/projects/"+pid,{method:"PUT",body:{account:USER.account,status:"closed"}});
if(r.success){toast("项目已截止","success");loadBuyerProjects();}else{toast(r.message,"error");}
}catch(e){toast("网络错误","error");}
}
async function loadBuyerProjectSelect(){var r=await api("/api/buyer/projects?account="+encodeURIComponent(USER.account));var o=(r.data||[]).map(function(p){return '<option value="'+p.id+'">'+p.projectName+'</option>';}).join("");document.getElementById("bqProjectSelect").innerHTML='<option value="">-- 选择项目 --</option>'+o;document.getElementById("bcProjectSelect").innerHTML='<option value="">-- 选择项目 --</option>'+o;}
async function loadBuyerQuotes(){var pid=document.getElementById("bqProjectSelect").value;if(!pid)return;var r=await api("/api/buyer/quotes/"+pid+"?account="+encodeURIComponent(USER.account));if(!r.success)return toast(r.message,"error");var d2=r.data||[];if(d2.length===0){document.getElementById("bqTableContainer").innerHTML='<div class="empty">暂无供应商报价</div>';return;}document.getElementById("bqTableContainer").innerHTML='<table><thead><tr><th>供应商</th><th>物料数</th><th>总报价</th><th>IP</th><th>时间</th></tr></thead><tbody>'+d2.map(function(q){return '<tr><td><strong>'+q.supplierName+'</strong></td><td>'+q.items.length+'</td><td class="text-green">&yen;'+(q.total||0).toLocaleString()+'</td><td class="text-mono">'+q.ip+'</td><td>'+new Date(q.submittedAt).toLocaleString()+'</td></tr>';}).join("")+'</tbody></table>';}
async function loadBuyerCompareSelect(){loadBuyerProjectSelect();}
async function loadBuyerCompare(){var pid=document.getElementById("bcProjectSelect").value;if(!pid)return;var r=await api("/api/buyer/quotes/"+pid+"?account="+encodeURIComponent(USER.account));if(!r.success)return toast(r.message,"error");var qs=r.data||[];if(qs.length===0){document.getElementById("bcTableContainer").innerHTML='<div class="empty">暂无报价数据</div>';return;}var mats=[];var ms={};qs.forEach(function(q){q.items.forEach(function(it){var n=it.materialName||it.name||"";if(n&&!ms[n]){ms[n]=true;mats.push(n);}});});var hc='<th>物料名称</th>'+qs.map(function(q){return '<th>'+q.supplierName+'</th>';}).join("")+'<th>最低价</th>';var br="";mats.forEach(function(mat){var pr=qs.map(function(q){var it=q.items.find(function(x){return (x.materialName||x.name)===mat;});return it?(it.unitPrice||it.price||0):0;});var mn=Math.min.apply(null,pr.filter(function(p){return p>0;}));br+='<tr><td>'+mat+'</td>'+pr.map(function(p,i){var isMin=p===mn&&p>0;return '<td style="'+(isMin?"background:#C6EFCE;color:#006100;font-weight:600":"")+'">¥'+(p||"--")+'</td>';}).join("")+'<td style="font-weight:600">&yen;'+mn.toLocaleString()+'</td></tr>';});var sr='<tr style="background:#f0f2f5;font-weight:600"><td>合计总价</td>'+qs.map(function(q){return '<td>&yen;'+(q.total||0).toLocaleString()+'</td>';}).join("")+'<td></td></tr>';document.getElementById("bcTableContainer").innerHTML='<table><thead><tr>'+hc+'</tr></thead><tbody>'+br+sr+'</tbody></table>';}
function exportCompare(){var pid=document.getElementById("bcProjectSelect").value;if(!pid)return toast("请先选择项目","error");window.open("http://localhost:3001/api/admin/export/"+pid,"_blank");}
async function loadReviewerProjects(){
try{var r=await api("/api/reviewer/projects");var data=r.data||[];
document.getElementById("rStatTotal").textContent=data.length;
document.getElementById("rStatOpen").textContent=data.filter(function(p){return p.status==="open";}).length;
document.getElementById("rStatBids").textContent=data.filter(function(p){return p.quoteCount>0;}).length;
document.getElementById("rStatWon").textContent=data.filter(function(p){return p.status==="closed";}).length;
if(data.length===0){document.getElementById("rTableContainer").innerHTML='<div class="empty">暂无项目</div>';return;}
var rows=data.map(function(p){
var sc=p.status==="open"?"open":"closed";
var sts=p.status==="open"?"进行中":"已截止";
return '<tr><td>'+p.id+'</td><td><strong>'+p.projectName+'</strong></td><td>'+p.buyer+'</td><td>&yen;'+(p.budget||"--")+'</td><td><span class="status '+sc+'">'+sts+'</span></td><td>'+(p.quoteCount||0)+'</td><td class="text-green">'+(p.lowestBid?"&yen;"+p.lowestBid.toLocaleString():"--")+'</td><td>'+(p.winningSupplier||"--")+'</td></tr>';
}).join("");
document.getElementById("rTableContainer").innerHTML='<table><thead><tr><th>编号</th><th>项目名称</th><th>采购员</th><th>预算</th><th>状态</th><th>报价数</th><th>最低报价</th><th>中标方</th></tr></thead><tbody>'+rows+'</tbody></table>';
}catch(e){document.getElementById("rTableContainer").innerHTML='<div class="empty">加载失败</div>';}
}
function doLogout(){sessionStorage.clear();window.location.href="login.html";}
document.getElementById("displayAccount").textContent=USER.account;
document.getElementById("displayRole").textContent=roleMap[USER.role]||USER.role;
buildSidebar();
var dv=USER.role==="supplier"?"supplier-projects":USER.role==="buyer"?"buyer-projects":"reviewer-projects";
switchView(dv);
var se=document.getElementById("sSearch");if(se)se.addEventListener("input",loadSupplierProjects);
var fe=document.getElementById("sFilter");if(fe)fe.addEventListener("change",loadSupplierProjects);
