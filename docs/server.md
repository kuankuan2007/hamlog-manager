# 服务端

服务端位于 `server/`，使用 TypeScript 和 `@kuankuan/k-server` 提供 HTTP API，使用 `sqlite3` 访问本地 SQLite 数据库。

## 启动与构建

入口是 `server/index.ts`。服务默认监听所有网络接口的 `3000` 端口，可用 `--host` 和 `--port` 覆盖：

```text
pnpm server-start
```

该命令先用 Rolldown 将入口构建为 `server-dist/index.js`，再由 Node.js 启动。仅构建可使用 `pnpm server-build`。

启动时默认先执行一次 WAL 检查点（`PRAGMA wal_checkpoint(TRUNCATE)`），维护动作完成后、监听端口前再执行一次。可选参数：

| 参数 | 作用 |
| --- | --- |
| `--host {地址}` | 指定监听地址（如 `127.0.0.1`）；缺省监听所有网络接口 |
| `--port {端口}` | 指定监听端口，缺省 `3000`；必须是 `0..65535` 的整数，非法值启动失败 |
| `--init` | 全新部署时使用：`data/logbook.db` 不存在则在启动前创建包含完整版本 6 结构的数据库文件；文件已存在时输出警告日志并忽略该参数 |
| `--fix` | 监听端口前修复全部通联外键，将其重新指向该呼号当前的地址与最新 QSL 收发记录（不存在时置 `NULL`），并输出修复行数 |
| `--maintain-sequence-numbers` | 监听端口前校验并修复全部通联记录序号 |
| `--no-checkpoint` | 跳过两次 WAL 检查点 |

```text
pnpm server-start -- --host 127.0.0.1 --port 8080
pnpm server-start -- --maintain-sequence-numbers
pnpm server-start -- --init
```

启动错误会写入标准错误，并设置非零退出码。

## 目录与职责

| 目录 | 职责 |
| --- | --- |
| `config/` | 统一本地配置：类型与默认导出装配（`index.ts`）、实际值（`values.ts`，git 忽略）、注释模版（`values.template.ts`） |
| `server/api/` | 路由注册、HTTP 方法检查、请求解析和状态设置 |
| `server/database/` | SQL 查询、事务写入、迁移和维护 |
| `server/auto/` | QRZ.com 外部数据抓取 |
| `server/config/` | 服务端配置转发（`@server/config`）与 `<>` 呼号邮箱映射查询 |
| `server/email/` | SMTP 邮件发送与 EJS 模板渲染 |
| `server/schema/` | 编译共享 Schema 并格式化 Ajv 错误 |
| `schema/` | 前后端共享类型和声明式校验规则 |
| `util/` | 共享时间工具 |

路由按 `/api/select`、`/api/update`、`/api/auto`、`/api/email` 四组挂载。接口明细见 [HTTP API](api.md)。

## 配置和运行时文件

当前实现没有读取 `.env`、`process.env` 或 `import.meta.env`。以下值是固定约定：

| 项目 | 当前值 |
| --- | --- |
| API 监听 | 默认所有网络接口的 `3000` 端口；可用 `--host` / `--port` 覆盖 |
| 数据库 | 相对于进程工作目录的 `data/logbook.db` |
| 统一配置 | `config/`：类型与默认导出装配在 `index.ts`，实际值在 `values.ts`，经 `@config` 别名导入 |
| 邮件头像 | 相对于进程工作目录的 `config/photo.jpg`（JPG，本地文件） |
| 邮件模板 | 相对于进程工作目录的 `server/email/template.ejs` |
| QRZ 页面 | `https://www.qrz.com/db/{callsign}` |

因此服务应从项目根目录启动。配置分为两部分：`config/index.ts` 声明类型并装配默认导出；`config/values.ts` 保存实际值——本人信息（`selfInfo`）、QRZ Cookie（`qrzCookie`）和 SMTP 配置（`email`）：

```ts
interface AppConfig {
  selfInfo: SelfInfoConfig;
  qrzCookie: string;
  email: SmtpConfig;
}
```

`config/values.ts` 属于本地敏感运行数据，已通过 `.gitignore` 单独排除，不应写入文档、日志或版本控制；带注释的模版 `config/values.template.ts` 纳入版本控制，新环境应复制为 `values.ts` 后填写。服务端通过转发模块 `server/config/index.ts`（`@server/config`）读取全部配置；前端通过 `src/config/index.ts`（`@/config`）只转发 `selfInfo`，SMTP 密码与 QRZ Cookie 不会进入生产构建产物。邮件模板头像 `config/photo.jpg` 也是本地运行文件，不随仓库分发。注意：Vite 开发服务器按源码模块提供文件，开发期间能访问开发服务器的网络同样能获取 `config/values.ts` 全文。

`selfInfo.emailAddresses` 是可选的键到邮箱映射（如 `SELF: '...'`）。`<>` 包裹的呼号（如 `<SELF>`）优先按该映射解析，反向查询命中映射中的邮箱时返回 `<>` 包裹的键名，来源标记为 `config`；没有该字段时退回缓存表。

SMTP 配置必须显式填写 `host` 和 `port` 字段，程序不会自行推断主机名或端口。

邮件预览和发送渲染时会读取 `config/photo.jpg`，并以内嵌 `data:image/jpeg;base64,...` 写入邮件 HTML；若文件缺失或不可读，相关接口会失败。

## 数据库初始化与迁移

数据库模块不再在导入时打开连接。服务端在 `startServer` 中解析完启动参数（含 `--init` 的新库创建）后，手动调用 `initializeDatabase()` 并等待完成，之后才执行检查点、维护和监听。`initializeDatabase()` 依次执行：

1. `PRAGMA foreign_keys = ON`；
2. 开始即时事务并执行可重复迁移；
3. 如有需要，为 `qsl_sends` 增加 `confirmed_at`、`status` 和 `tracking_number`；
4. 创建邮箱缓存表及索引，按邮箱去重仅保留最新记录，并创建邮箱大小写不敏感唯一索引；
5. 如有需要，重建外键仍指向 `qsl_sends_legacy` 的旧 `communication_logs` 表，使外键改指 `qsl_sends` 并将失效关联置 `NULL`；
6. 如有需要，为通联表增加并回填 `sequence_number`；
7. 创建序号唯一索引和时间/ID 索引；
8. 设置 `PRAGMA user_version = 6`；
9. 提交事务；
10. 确保呼号、时间、频率组合索引存在。

迁移只补充当前版本所需结构，并不能从空数据库创建全部核心业务表。全新部署应使用 `--init` 创建包含 `communication_logs`、`addresses`、`qsl_sends`、`qsl_receives`、`callsign_email_cache` 及全部索引的数据库文件；恢复既有数据时仍需直接提供数据库文件。实际结构见 [数据库](database.md)。

## 读取行为

- 通联列表按 `time DESC, id DESC` 排序并分页。
- 可按地址、QSL 发送、QSL 接收外键是否存在筛选。
- 呼号去重使用窗口函数，在筛选结果中保留各呼号最新记录。
- 呼号详情并行读取通联、地址、QSL 发件和收件数据。
- 地址批量查询按呼号升序；QSL 记录按对应日期和 `id` 倒序。
- SQL 值均通过参数绑定传入；批量 `IN` 的占位符数量由规范化后的呼号数量生成。

## 写入行为与事务

### 通联记录

写入使用 `BEGIN IMMEDIATE`。服务会：

1. 规范化呼号；
2. 查找该呼号最新地址、QSL 发件和 QSL 收件记录；
3. 按时间确定新记录的 `sequence_number`；
4. 必要时以两阶段偏移方式后移已有序号，避免违反唯一索引；
5. 插入通联及三个可选外键；
6. 提交事务。

同一时间的新记录排在已有同时间记录之后。

### 地址

地址按 `callsign` 执行 upsert。写入后，同一事务会把该地址关联到相同呼号且 `address_id IS NULL` 的全部通联；已有地址关联不覆盖。

### QSL 记录

新发件或收件会各自新增历史记录，并关联相同呼号中尚未关联对应 QSL 的通联。新发件的 `status` 和 `tracking_number` 默认为 `NULL`；确认发件按 ID 精确更新单条记录的确认日期和状态，ID 不存在时返回业务码 `10002`。

## 序号维护

`sequence_number` 是持久化展示序号，事实排序仍是 `time ASC, id ASC`。常规启动不会扫描全表。显式维护时，服务先统计不一致行，再在一个即时事务中使用临时偏移重建序号，避免唯一值交换冲突。

## QRZ.com 邮箱查询

外部查询使用 `config/values.ts` 中的 `qrzCookie` 请求 QRZ 呼号页面并解析邮箱。API 层提供缓存策略：

- 命中缓存时可不访问外部站点；
- 实时查询成功后写入 `callsign_email_cache`；
- 同呼号、同来源的最新邮箱相同时仅刷新时间；
- 实时失败时，`fallback` 模式可退回缓存；
- `<>` 包裹的呼号永不触发外部查询，按 `config/values.ts` 中 `selfInfo.emailAddresses` 配置或缓存表解析。

外部站点可用性、登录 Cookie 和页面结构都会影响查询结果。

## 日志与错误

服务注册控制台日志记录器，起始级别为 Info。业务输入错误通过统一状态对象返回；未被路由处理的数据库、JSON 解析或外部查询异常由框架错误处理流程接管。调用方不应假设所有失败都使用 HTTP 非 2xx；还必须检查响应体的 `ok`。

数据库相关启动步骤（`--init` 创建、迁移、检查点、维护动作）失败时，服务端在退出前输出 fatal 级错误（含堆栈）和 warn 级提示：若失败原因是数据库文件损坏或表结构不正确，可在备份 `data/logbook.db` 及伴随的 `-wal`/`-shm` 文件后将其删除，再附带 `--init` 重新启动以重建正确的表结构（见 [数据库](database.md) 的“初始化与重建”）。
