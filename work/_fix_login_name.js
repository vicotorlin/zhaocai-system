const fs = require("fs");
const path = require("path");

const loginPath = path.join("C:", "Users", "linguodong", "Documents", "Codex", "2026-07-07", "new-chat-2", "outputs", "login.html");
let content = fs.readFileSync(loginPath, "utf8");

// 1. Add name field in registration form - after role select, before account
// Find the pattern: end of role select + regRoleError div
const roleEnd = '<div class="error-msg" id="regRoleError"></div>';
const nameField = `
                  <div class="form-group">
                      <label id="regNameLabel">供应商名称<span class="required">*</span></label>
                      <input type="text" id="regName" placeholder="请输入供应商/公司名称" autocomplete="off">
                      <div class="error-msg" id="regNameError"></div>
                  </div>`;

if (content.includes(roleEnd) && !content.includes('id="regName"')) {
  content = content.replace(roleEnd, roleEnd + nameField);
  console.log("Added name field to registration form");
}

// 2. Update the role change handler to show correct label
// When role changes, update regNameLabel and regName placeholder
// Find: var regType = "phone";
// Add role change listener
const regTypeLine = "var regType = \"phone\";";
const roleHandler = `
    function updateRegNameLabel() {
      var role = $("regRole").value;
      var lbl = $("regNameLabel");
      var inp = $("regName");
      if (role === "supplier") {
        lbl.innerHTML = '供应商名称<span class="required">*</span>';
        inp.placeholder = "请输入供应商/公司名称";
      } else {
        lbl.innerHTML = '姓名<span class="required">*</span>';
        inp.placeholder = "请输入姓名";
      }
    }
    $("regRole").addEventListener("change", updateRegNameLabel);
`;

if (content.includes(regTypeLine) && !content.includes("updateRegNameLabel")) {
  content = content.replace(regTypeLine, regTypeLine + roleHandler);
  console.log("Added role change handler for name field");
}

// 3. Update registration submit to include name
// Find: role:$("regRole").value, account:$("regAccount")
const oldRegData = "role:$(\"regRole\").value, account:$(\"regAccount\").value.trim(), code:$(\"regCode\").value.trim(),";
const newRegData = "role:$(\"regRole\").value, name:$(\"regName\").value.trim(), account:$(\"regAccount\").value.trim(), code:$(\"regCode\").value.trim(),";
if (content.includes(oldRegData) && !content.includes("regName")) {
  content = content.replace(oldRegData, newRegData);
  console.log("Updated register data to include name");
}

// 4. Update register API call to include name
const oldRegApi = "{ role:data.role, account:data.account, password:data.password, code:data.code, token:vr.token }";
const newRegApi = "{ role:data.role, name:data.name, account:data.account, password:data.password, code:data.code, token:vr.token }";
if (content.includes(oldRegApi)) {
  content = content.replace(oldRegApi, newRegApi);
  console.log("Updated register API call to include name");
}

// 5. Add name validation
// Find: if(!data.code){ showErr("regCodeError"
const codeCheck = 'if(!data.code){ showErr("regCodeError"';
const nameCheck = `if(!data.name||!data.name.trim()){ showErr("regNameError",role==="supplier"?"请输入供应商名称":"请输入姓名"); markInp("regName",true); ok=false; }
        `;
if (content.includes(codeCheck) && !content.includes("regNameError")) {
  content = content.replace(codeCheck, nameCheck + codeCheck);
  console.log("Added name validation");
}

// 6. Update login redirect to include name
const loginRedirect = 'window.location.href = "dashboard.html?account=" + encodeURIComponent(account) + "&role=" + encodeURIComponent(role);';
if (content.includes(loginRedirect)) {
  content = content.replace(loginRedirect, 
    'var userName = r.name || ""; sessionStorage.setItem("zrbac_name", userName); window.location.href = "dashboard.html?account=" + encodeURIComponent(account) + "&role=" + encodeURIComponent(role) + "&name=" + encodeURIComponent(userName);');
  console.log("Updated login redirect to include name");
}

// 7. Update error clear for registration
const regErrIds = 'var regErrIds = ["regRoleError","regAccountError","regCodeError","regPasswordError","regPasswordConfirmError"];';
const regErrIdsNew = 'var regErrIds = ["regRoleError","regNameError","regAccountError","regCodeError","regPasswordError","regPasswordConfirmError"];';
if (content.includes(regErrIds)) {
  content = content.replace(regErrIds, regErrIdsNew);
  console.log("Updated regErrIds to include name error");
}

// 8. Update realtime error clear
const rtClear = '["regRole","regAccount","regCode","regPassword","regPasswordConfirm"].forEach(function(id){';
const rtClearNew = '["regRole","regName","regAccount","regCode","regPassword","regPasswordConfirm"].forEach(function(id){';
if (content.includes(rtClear)) {
  content = content.replace(rtClear, rtClearNew);
  console.log("Updated realtime error clear for name");
}

fs.writeFileSync(loginPath, content, "utf8");
console.log("login.html updated");
