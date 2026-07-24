# 招采管理系统 — 项目交接文档

> 生成时间: 2026-07-22
> 项目路径: `C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2`

---

## 一、架构与技术栈

| 层 | 技术 | 说明 |
|------|------|------|
| 后端 | Express.js (Node) | 内存存储 (Supabase 未配置时自动回退) |
| 前端 | Vanilla HTML/JS | 单文件 SPA，RBAC 三角色仪表盘 |
| 文件上传 | multer | 本地存储于 `outputs/uploads/` |
| 邮件 | nodemailer + QQ SMTP | 794474441@qq.com |

### 核心文件

| 文件 | 大小 | 作用 |
|------|------|------|
| `outputs/dashboard.html` | 74.6KB | 主文件：登录后仪表盘 |
| `outputs/login.html` | 29.6KB | 登录/注册页 |
| `server/server.js` | 45.2KB | API 服务器 |
| `server/supabase-client.js` | 11.1KB | 数据层 (内存/Supabase) |
| `server/upload-handler.js` | 8.2KB | multer + 文件管理 |

---

## 二、服务启动

端口 3000，命令:
```
cmd /c "set SMTP_HOST=smtp.qq.com&& set SMTP_PORT=465&& set SMTP_USER=794474441@qq.com&& set SMTP_PASS=guuztpxycekqbfge&& start /B node C:\Users\linguodong\Documents\Codex\2026-07-07\new-chat-2\server\server.js > nul 2>&1"
```

> 不要用 Start-Process -WindowStyle Hidden，会丢失环境变量导致崩溃。

### 默认账号（seedDefaultUsers 自动创建）

| 身份 | 账号 | 密码 |
|------|------|------|
| 采购员 | 794474441@qq.com | 123456 |
| 供应商 | linguodong@corp.netease.com | 123456 |

---

## 三、本会话完成的工作

### 系统稳定性
- 修复 uploadHandler.addAttachment() 未定义致服务器崩溃
- 修复启动方式 (Start-Process -> cmd /c start /B)
- 修复文件下载乱码：uploads 静态路由路径匹配

### 采购方功能
- showProjectQuotes 新增费用拆分横向对比表 (costHTML)，各行最低绿色高亮 (#C6EFCE)
- 报价详情弹窗 overflow-y:auto 滚动条
- 发布新项目：新增 cpTechParams + cpTechFileInput，截止日期移到底部
- 三个附件数组 cpFiles/cpChannelFiles/cpTechFiles 均声明

### 供应商功能
- 报价弹窗顶部项目信息栏 (bidProjectInfo): 项目名称 + 截止时间
- GET /api/projects/:id 返回项目附件，下载链接可用
- 修改报价数据保留: myBidIds 存 projectId->bidId，按钮加 data-bid
- createBid 内存 ID 自动生成 (BID-001)
- 费用拆分底部费用汇总行 (bidCostSummary)
- closeBidModal()->closeModal('bidModal')
- switchMaterialTable() 新增

### 数据层
- 项目字段: plan, channel_details, tech_params, attachments
- 报价字段: labor_cost, manufacturing_cost, admin_cost, profit, tax, attachments, category

---

## 四、已知问题/可优化

1. 数据不持久化 (内存存储，重启丢失)
2. 评审专家 showProjectQuotes 未含费用对比表
3. PUT /api/supplier/bid/:id 未解构 attachments
4. 含税公式: (gramWeight===0&&specWidth===0) ? actualUsage*unitPrice : gramWeight*specWidth*actualUsage*unitPrice/100000

---

## 五、关键变量速查

| 位置 | 名称 | 说明 |
|------|------|------|
| dashboard.html | isBeddingMode | 被子件套模式开关 |
| dashboard.html | cpFiles/cpChannelFiles/cpTechFiles | 项目附件数组 |
| dashboard.html | bidFiles | 投标附件数组 |
| dashboard.html | myBidIds | {projectId: bidId} 映射 |
| dashboard.html | costHTML | 费用横向对比表 |
| dashboard.html | bidCostSummary | 报价费用汇总 |
| server.js | seedDefaultUsers() | 默认账号种子 |
| supabase-client.js | createBid() | 内存 ID 自动生成 |
| upload-handler.js | UPLOAD_DIR | outputs/uploads |

---

## 六、API 速查

```
POST /api/login
POST /api/register
GET  /api/buyer/projects?account=
POST /api/buyer/projects
GET  /api/buyer/quotes/:id?account=
GET  /api/projects/:id
POST /api/supplier/bid
GET  /api/supplier/bids?account=
GET  /api/supplier/bid/:id?account=
PUT  /api/supplier/bid/:id
POST /api/upload
POST /api/dev/create-user
```

---

## 七、新会话第一步

1. netstat -ano | findstr 3000 (检查服务)
2. 未运行则执行启动命令
3. 访问 http://localhost:3000/login.html
4. 种子用户自动创建，测试项目需手动发布
5. 改前端刷新即生效，改后端需重启