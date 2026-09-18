# Hamlog Manager

面向业余无线电（Ham Radio）通联记录的本地管理应用，由 Vue 3 单页应用、Node.js HTTP 服务和 SQLite 数据库组成。围绕通联记录提供地址簿、QSL 卡片收发管理、QRZ.com 邮箱自动查询与邮件通知等一站式工作流，全部数据保存在本地。

## 介绍

### 功能特性

- **通联记录**：新增、分页浏览、按呼号聚合、模糊搜索；每条记录含时间、频率、模式、信号报告与备注。
- **地址簿**：QSL 邮寄地址的新建、编辑、列表与批量打印，自动关联同呼号通联。
- **QSL 收发管理**：发件/收件登记，发件状态确认（已收到 / 已退回 / 未收到），待寄卡片筛选。
- **邮箱查询**：呼号 → 邮箱支持缓存、实时（抓取 QRZ.com）、回退、自动四种模式；邮箱 → 呼号反查；支持手动修正，实时抓取与手动更新的结果统一缓存在本地表。
- **特殊配置呼号**：`<>` 包裹的呼号（如 `<SELF>`、`<CC_SELF>`）按 `config/values.ts` 中 `selfInfo.emailAddresses` 映射直接解析，不查库、不联网，任何查询模式下均生效（响应来源标记为 `config`）。
- **邮件工作流**：从通联 / QSL 记录一键生成 QSO 确认、QSL 已寄出、QSL 已收妥邮件稿；QSO 确认正文自动附带最新 QSL 收发状态（收妥日期、退回/未收到询问、签收确认）；支持预览与 SMTP 发送，默认抄送 `<CC_SELF>` 以便留存副本。
- **共享校验**：前后端复用同一套 TypeScript 类型与 JSON Schema（Ajv），浏览器端先行校验、服务端强制校验。

### 技术栈

| 层 | 主要技术 |
| --- | --- |
| Web | Vue 3、Vue Router 5、Vite 8、Sass |
| 服务端 | Node.js、TypeScript、`@kuankuan/k-server`、Nodemailer、EJS |
| 校验 | Ajv 8、共享 JSON Schema 对象 |
| 数据库 | SQLite（`sqlite3`，WAL） |
| 构建 | pnpm、Vite、Rolldown、`vue-tsc` |

### 架构概览

Web 前端（`src/`）通过同源 `/api` 访问 HTTP 服务（`server/`，默认监听 `3000` 端口，可用 `--host` / `--port` 覆盖），服务端读写 SQLite（`data/logbook.db`）并按需抓取 QRZ.com。接口分四组：

| 前缀 | 职责 |
| --- | --- |
| `/api/select/*` | 通联、地址、QSL、邮箱反查等读取 |
| `/api/update/*` | 新增通联/地址/QSL、手动邮箱、确认发件等写入 |
| `/api/auto/callsign2email` | 呼号邮箱自动查询（缓存/实时/回退） |
| `/api/email/*` | 邮件预览与发送 |

## 入门教程

### 1. 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- pnpm（版本见 `package.json` 的 `packageManager` 字段，可用 `corepack enable` 启用）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 填写配置

复制模版并按其中注释填写：

```bash
cp config/values.template.ts config/values.ts   # Windows PowerShell: Copy-Item config/values.template.ts config/values.ts
```

| 配置项 | 说明 |
| --- | --- |
| `selfInfo` | 本人呼号、邮箱、QSL 收件地址（用于地址打印与邮件落款）；可选 `emailAddresses` 定义 `<>` 特殊呼号到邮箱的映射（如 `SELF`、`CC_SELF`） |
| `qrzCookie` | QRZ.com 登录 Cookie，仅实时邮箱查询需要；仅用缓存可留空 |
| `email` | SMTP 发信账号；`host` 与 `port` 必须显式填写，程序不会自行推断 |

`config/values.ts` 含敏感信息，已被 `.gitignore` 排除，切勿提交到版本控制。

### 4. 准备数据库

`data/logbook.db` 是**必要运行资产**，不随仓库分发。启动时的迁移只做增量升级（当前 `user_version = 6`），**不能从空文件创建全部核心表**——数据库需已包含 `communication_logs`、`addresses`、`qsl_sends`、`qsl_receives` 四张核心表。`data/` 目录同样被 git 忽略，写入前建议备份（`data/backups/` 可用于保存副本）。

### 5. 启动

需要两个终端，均从项目根目录运行：

```bash
# 终端 1：构建并启动 API 服务（http://localhost:3000）
pnpm server-start

# 终端 2：启动 Web 开发服务器
pnpm dev
```

Vite 会把 `/api` 代理到 `http://localhost:3000`，浏览器访问 Vite 输出的地址即可。

### 6. 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Web 开发服务器 |
| `pnpm build` | 类型检查并构建 Web 到 `dist/` |
| `pnpm preview` | 预览 Web 构建产物 |
| `pnpm type-check` | 运行 Vue/TypeScript 类型检查 |
| `pnpm lint` | 运行 ESLint |
| `pnpm server-build` | 将服务端构建到 `server-dist/` |
| `pnpm server-start` | 构建并启动 API 服务 |
| `pnpm server-start -- --maintain-sequence-numbers` | 启动前校验并修复通联展示序号 |

## 页面一览

| 路径 | 页面 | 功能 |
| --- | --- | --- |
| `/` | 首页 | 展示通联记录，生成并复制中英文通联文本 |
| `/callsign-search` | 呼号搜索 | 按呼号片段实时模糊搜索 |
| `/callsign/:callsign` | 呼号详情 | 聚合通联、地址、QSL 收发与邮箱 |
| `/new-log` | 新增通联 | 提交新通联记录，支持 `?callsign=` 预填 |
| `/new-address` / `/edit-address` | 新建 / 编辑地址 | 维护 QSL 邮寄地址 |
| `/address-list` | 地址列表 | 浏览全部地址 |
| `/address-print` | 地址打印 | 筛选待寄 QSL 的呼号并批量打印 |
| `/new-qsl-send` / `/new-qsl-receive` | QSL 发件 / 收件登记 | 新增收发记录 |
| `/confirm-qsl-send?id={id}` | 确认 QSL 发件 | 设置状态：已收到 / 已退回 / 未收到 |
| `/qsl-manager` | QSL 管理 | 查看全部收发记录并快速确认 |
| `/manual-email` | 手动更新邮箱 | 人工修正呼号邮箱缓存 |
| `/email-prepare` | 准备邮件 | 按记录 ID 生成 QSO 确认 / QSL 寄出 / QSL 收妥邮件稿 |
| `/send-email` | 发送邮件 | 收件人按邮箱或呼号自动解析，预览并发送 |

## 项目结构

```text
hamlog-manager/
├─ docs/                 # 项目文档（见下方文档索引）
├─ config/               # 统一配置：类型与装配（index.ts）、注释模版（values.template.ts）、实际值（values.ts，git 忽略）
├─ schema/               # 浏览器与服务端共享的类型和校验规则
├─ server/
│  ├─ api/               # HTTP 路由
│  ├─ auto/              # QRZ.com 等外部自动查询
│  ├─ config/            # 服务端配置转发与特殊呼号邮箱映射
│  ├─ database/          # SQLite 查询、写入、迁移与维护
│  ├─ email/             # SMTP 邮件发送与 EJS 模板
│  └─ schema/            # 服务端 Ajv 校验器
├─ src/
│  ├─ api/               # 前端请求封装
│  ├─ components/        # Vue 通用组件
│  ├─ config/            # 前端配置转发（仅 selfInfo）
│  ├─ router/            # 页面路由
│  ├─ scripts/           # 邮件正文、本人信息、发送链接等业务脚本
│  ├─ styles/            # 全局样式和主题
│  └─ views/             # 页面组件
├─ util/                 # 前后端共享工具
├─ data/                 # 运行时数据库和备份（git 忽略）
├─ server-dist/          # 服务端构建产物（生成目录）
└─ vite-plugin/          # 项目自定义 Vite 插件
```

## 配置体系

- `config/index.ts`：类型声明（`AppConfig`/`SelfInfoConfig`/`SmtpConfig`）与默认导出装配，纳入版本控制。
- `config/values.ts`：实际配置值，被 `.gitignore` 单独排除；新环境从 `config/values.template.ts` 复制生成。
- 前后端通过 `@config` 别名及各自的转发模块引用：`server/config/index.ts` 转发全量配置，`src/config/index.ts` 只转发 `selfInfo`——SMTP 密码与 QRZ Cookie 不会进入前端生产构建产物。
- 服务须从项目根目录启动（数据库、邮件模板等按工作目录解析）。
- 注意：Vite 开发服务器监听 `0.0.0.0` 且按源码模块提供文件，开发期间能访问该服务的网络可获取 `config/values.ts` 全文；请在可信网络中开发。

## 文档索引

文档位于 [`docs/`](docs/)，以当前源码与实际数据库结构为准：

| 文档 | 内容 |
| --- | --- |
| [docs/index.md](docs/index.md) | 文档总览：技术栈、项目结构、本地开发 |
| [docs/api.md](docs/api.md) | HTTP API：接口清单、请求参数、响应格式与错误码 |
| [docs/schema.md](docs/schema.md) | 共享数据模型与校验：TypeScript 类型、JSON Schema 约束、日期时间格式 |
| [docs/server.md](docs/server.md) | 服务端：启动与构建、目录职责、配置体系、数据库迁移、读写行为、QRZ.com 查询 |
| [docs/database.md](docs/database.md) | 数据库：表结构、索引、关联与写入语义、迁移边界、维护建议 |
| [docs/web.md](docs/web.md) | Web 前端：页面路由与行为、前端 API 层、组件、样式与构建 |

## 许可证

[Mozilla Public License 2.0](LICENSE)
