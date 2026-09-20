# Hamlog Manager 文档

Hamlog Manager 是一个面向业余无线电通联记录的本地管理应用，由 Vue 单页应用、Node.js HTTP 服务和 SQLite 数据库组成。项目支持通联记录、地址簿、QSL 收发状态、呼号搜索及 QRZ.com 邮箱查询。

> 本目录以当前源码和 `data/logbook.db` 的实际结构为准。项目简介与入门教程见根目录 [README.md](../README.md)。

## 文档导航

- [HTTP API](api.md)：接口清单、请求参数、响应及错误。
- [共享数据模型与校验](schema.md)：TypeScript 类型、JSON 输入约束和时间格式。
- [服务端](server.md)：服务启动、路由分层、数据库访问、迁移与外部查询。
- [数据库](database.md)：当前 SQLite 表、关系、索引和维护机制。
- [Web 前端](web.md)：页面、路由、组件和前端 API 层。

## 技术栈

| 层 | 主要技术 |
| --- | --- |
| Web | Vue 3、Vue Router 5、Vite 8、Sass |
| 服务端 | Node.js、TypeScript、`@kuankuan/k-server`、Nodemailer、EJS |
| 校验 | Ajv 8、共享 JSON Schema 对象 |
| 数据库 | SQLite、`sqlite3` |
| 构建 | pnpm、Vite、Rolldown、`vue-tsc` |

Node.js 版本要求为 `^20.19.0 || >=22.12.0`，包管理器为 pnpm（版本见 `package.json` 的 `packageManager` 字段）。

## 项目结构

```text
hamlog-manager/
├─ docs/                 # 当前项目文档
├─ config/               # 统一配置：类型与默认导出装配（index.ts）、注释模版（values.template.ts）、实际值（values.ts，git 忽略）
├─ schema/               # 浏览器与服务端共享的类型和校验规则
├─ server/
│  ├─ api/               # HTTP 路由
│  ├─ auto/              # QRZ.com 等外部自动查询
│  ├─ config/            # 服务端配置转发与 selfInfo 邮箱映射
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
├─ data/                 # 运行时数据库和备份
├─ server-dist/          # 服务端构建产物
└─ vite-plugin/          # 项目自定义 Vite 插件
```

`server-dist/` 是生成目录；开发和文档应以 `server/`、`schema/`、`src/` 中的源码为准。

## 本地开发

```text
pnpm install
pnpm dev
```

首次运行前，复制 `config/values.template.ts` 为 `config/values.ts`，并按其中注释填写本人信息、QRZ Cookie 和 SMTP 配置；`config/values.ts` 含敏感值，已被 `.gitignore` 排除。

`pnpm dev` 只启动 Vite 开发服务器。API 服务需在另一个终端运行：

```text
pnpm server-start
```

首次运行且 `data/logbook.db` 不存在时，附带 `--init` 启动以创建包含完整当前结构的空数据库（文件已存在时输出警告日志并忽略该参数）：

```text
pnpm server-start -- --init
```

数据库初始化与损坏重建流程见 [数据库](database.md)，启动参数明细见 [服务端](server.md)。

Vite 会把 `/api` 代理到 `http://localhost:3000`；若用 `--host` / `--port` 修改了服务端监听，需同步调整 Vite 代理目标。服务端监听与数据库路径未通过环境变量配置；本人信息、QRZ Cookie 和 SMTP 配置的实际值统一定义在 `config/values.ts`，类型声明与默认导出装配在 `config/index.ts`，前后端分别通过 `@config` 别名及 `src/config/`、`server/config/` 转发模块引用。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Web 开发服务器 |
| `pnpm build` | 类型检查并构建 Web |
| `pnpm preview` | 预览 Web 构建产物 |
| `pnpm type-check` | 运行 Vue/TypeScript 类型检查 |
| `pnpm lint` | 运行 ESLint |
| `pnpm lint:fix` | 运行 ESLint 并自动修复 |
| `pnpm server-build` | 将服务端构建到 `server-dist/` |
| `pnpm server-start` | 构建并启动 API 服务 |

如需在启动前检查并修复通联展示序号，可执行 `pnpm server-start -- --maintain-sequence-numbers`。
