# 招采管理系统 — 项目交接文档

> 生成时间: 2026-07-28
> 项目路径: `C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2`
> GitHub: `https://github.com/vicotorlin/zhaocai-system`
> 当前分支: `main` (commit d637602)

---

## 一、核心文件

| 文件 | 作用 |
|------|------|
| `server/server.js` | Express API 服务器（端口3000） |
| `server/supabase-client.js` | 数据层（已禁用Supabase，纯内存模式）|
| `server/upload-handler.js` | 文件上传 |
| `outputs/dashboard.html` | 采购系统仪表盘 SPA |
| `outputs/login.html` | 登录/注册页面 |
| `server/.env` | 环境配置（不含Supabase，仅SMTP）|
| `server/.env.bak` | 旧配置备份（含Supabase，恢复时改名）|

---

## 二、当前部署方式

### 线上方案
- **Railway**: 已部署但免费额度用完 → 不可用
- **Zeabur / Koyeb**: 尚未部署成功

### 当前使用：本地 + Cloudflare Tunnel

**启动方式：**
```powershell
# 1. 启动服务器
cmd /c "start /B node C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\server\server.js > nul 2>&1"

# 2. 启动隧道
cmd /c "start /B cloudflared tunnel --url http://localhost:3000 > cf.log 2>&1"

# 3. 从 cf.log 中提取 URL（搜索 trycloudflare.com）
```
隧道URL格式：`https://xxx.trycloudflare.com/login.html`

### 守护脚本
`C:\Users\linguodong\Documents\严选招采系统\守护.cmd` — 双击启动，自动监控并重启服务。

---

## 三、本会话完成的关键修复

### 1. 验证码发送失败
- **根因**: Supabase连接后验证码保存到Supabase但表不存在，静默失败
- **修复**: 禁用Supabase（`.env`仅保留SMTP），验证码强制走内存存储
- **send-code代码**: 移除了`IS_PROD`门控，SMTP未配置时直接返回code

### 2. API地址硬编码
- `dashboard.html`和`login.html`中`var API="http://localhost:3000"`改为`window.location.origin`
- 部署到任何域名都能自动适配

### 3. 注册流程—验证码验证失败
- `saveVerificationCode`/`getVerificationCode`/`markCodeVerified`三个函数如果走Supabase会静默失败
- 禁用Supabase后全部走内存，正常

### 4. Railway部署问题
- 添加`railway.json`配置Web Service类型
- 添加`/health`和`/`路由用于healthcheck
- 但免费额度用完，改用本地方案

### 5. 新增dev调试端点
```javascript
GET  /api/dev/get-code/:account    // 获取某账号的验证码
DELETE /api/dev/delete-user/:account // 删除用户
GET  /api/version                  // 查看服务器版本
```

---

## 四、环境配置

### 当前.env（server/.env）
```
PORT=3000
NODE_ENV=development
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=794474441@qq.com
SMTP_PASS=guuztpxycekqbfge
```

### 恢复Supabase
将`server/.env.bak`改名为`server/.env`即可恢复Supabase模式。
但需确保Supabase有`verification_codes`表，否则验证码会静默失败。

---

## 五、默认账号

| 身份 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 采购员 | 794474441@qq.com | 123456 | 种子用户 |
| 供应商 | linguodong@corp.netease.com | 123456 | 种子用户 |
| 管理员 | admin@test.com | 123456 | 需手动创建 |
| 评审专家 | reviewer1@test.com | 123456 | 需手动创建 |

### 创建新账号
```powershell
# 通过dev API创建
Invoke-RestMethod -Uri "URL/api/dev/create-user" -Method POST -ContentType "application/json" -Body '{"account":"xxx","password":"xxx","role":"supplier","name":"名称"}'

# 或通过注册页面正常注册（验证码会通过QQ邮箱发送）
```

---

## 六、API速查

```
POST /api/send-code          # 发送验证码
POST /api/verify-code        # 校验验证码
POST /api/register           # 注册
POST /api/login              # 登录

GET  /api/buyer/projects?account=       # 采购方项目列表
POST /api/buyer/projects                 # 发布项目
GET  /api/buyer/quotes/:id?account=     # 查看报价

POST /api/supplier/bid                   # 提交报价
GET  /api/supplier/bids?account=        # 供应商报价列表

GET  /api/dev/get-code/:account         # 获取验证码（调试用）
DELETE /api/dev/delete-user/:account    # 删除用户（调试用）
POST /api/dev/create-user               # 创建用户（调试用）

POST /api/admin/approve-user            # 审核用户
GET  /api/admin/pending-users?account=  # 待审核列表
```

---

## 七、已知问题

1. **数据不持久化** — 内存存储，重启丢失所有数据（种子用户自动重建）
2. **Tunnel URL不稳定** — 每次重启cloudflared URL变化
3. **端口冲突** — 启动前检查3000端口是否被占用
4. **Supabase模式有bug** — verification_codes表不存在时验证码静默失败

---

## 八、新会话启动步骤

1. 检查端口：`netstat -ano | findstr 3000`
2. 有占用则`taskkill /F /PID xxx`
3. 启动服务器和隧道（见第二章）
4. 从cf.log提取URL，格式：`https://xxx.trycloudflare.com/login.html`
5. 种子用户自动创建，测试项目需手动发布
