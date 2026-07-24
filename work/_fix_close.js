const fs = require("fs");
const path = require("path");

const filePath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "dashboard.html");
let content = fs.readFileSync(filePath, "utf8");

// 1. Add closeProject function right after closeModal (line 424)
const closeModalFn = `function closeModal(id){$(id).classList.remove("show");if(id==="createProjectModal"){cpFiles=[];cpChannelFiles=[];cpTechFiles=[];}if(id==="bidModal"){bidFiles=[];}}`;
const closeProjectFn = `async function closeProject(pid){if(!confirm("确定要截止该项目吗？截止后供应商将无法继续报价。"))return;var r=await api("/api/buyer/projects/"+pid+"/close",{method:"POST",body:{account:USER.account}});if(r.success){toast("项目已截止","success");loadBuyerProjects();}else{toast(r.message,"error");}}`;
content = content.replace(closeModalFn, closeModalFn + closeProjectFn);

// 2. Fix buyer project list: only show "截止" button for open projects
// Current: '<button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">截止</button>'
// Target: (p.status==="open"?'<button ...>截止</button>':'<span style="color:#999;font-size:12px">已截止</span>')
const oldBtn = `'<button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">截止</button>'`;
const newBtn = `(p.status==="open"?'<button class="btn btn-danger btn-sm" data-action="close-project" data-pid="'+p.id+'">截止</button>':'<span style="color:#999;font-size:12px">已截止</span>')`;
content = content.replace(oldBtn, newBtn);

fs.writeFileSync(filePath, content, "utf8");

// Verify
if (content.includes("function closeProject")) {
  console.log("closeProject function added");
} else {
  console.log("FAILED: closeProject not found");
}
if (content.includes("p.status===\"open\"?'<button class=\"btn btn-danger")) {
  console.log("Button conditional added");
} else {
  console.log("FAILED: button conditional not found");
}
