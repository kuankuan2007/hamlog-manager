# 服务端

服务端位于 `server/`，使用 TypeScript 和 `@kuankuan/k-server` 提供 HTTP API，使用 `sqlite3` 访问本地 SQLite 数据库。

## 启动与构建

入口是 `server/index.ts`。服务固定监听 `3000` 端口：

```text
pnpm server-start
```

该命令先用 Rolldown 将入口构建为 `server-dist/index.js`，再由 Node.js 启动。仅构建可使用 `pnpm server-build`。

可选参数 `--maintain-sequence-numbers` 会在监听端口前校验并修复全部通联记录序号：

```text
pnpm server-start -- --maintain-sequence-numbers
```

启动错误会写入标准错误，并设置非零退出码。

## 目录与职责

| 目录 | 职责 |
| --- | --- |
| `server/api/` | 路由注册、HTTP 方法检查、请求解析和状态设置 |
| `server/database/` | SQL 查询、事务写入、迁移和维护 |
| `server/auto/` | QRZ.com 外部数据抓取 |
| `server/schema/` | 编译共享 Schema 并格式化 Ajv 错误 |
| `schema/` | 前后端共享类型和声明式校验规则 |
| `util/` | 共享时间工具 |

路由按 `/api/select`、`/api/update`、`/api/auto` 三组挂载。接口明细见 [HTTP API](api.md)。

## 配置和运行时文件

当前实现没有读取 `.env`、`process.env` 或 `import.meta.env`。以下值是固定约定：

| 项目 | 当前值 |
| --- | --- |
| API 端口 | `3000` |
| 数据库 | 相对于进程工作目录的 `data/logbook.db` |
| QRZ Cookie | 相对于进程工作目录的 `data/qrzCookie.txt` |
| QRZ 页面 | `https://www.qrz.com/db/{callsign}` |

因此服务应从项目根目录启动。`qrzCookie.txt` 属于本地敏感运行数据，不应写入文档、日志或版本控制。

## 数据库初始化与迁移

数据库模块在导入时打开连接。`ready` Promise 依次执行：

1. `PRAGMA foreign_keys = ON`；
2. 开始即时事务并执行可重复迁移；
3. 如有需要，为 `qsl_sends` 增加 `confirmed_at`；
4. 创建邮箱缓存表及索引；
5. 如有需要，为通联表增加并回填 `sequence_number`；
6. 创建序号唯一索引和时间/ID 索引；
7. 设置 `PRAGMA user_version = 3`；
8. 提交事务；
9. 确保呼号、时间、频率组合索引存在。

迁移只补充当前版本所需结构，并不能从空数据库创建全部核心业务表。部署或恢复时仍需提供含 `communication_logs`、`addresses`、`qsl_sends`、`qsl_receives` 的数据库文件。实际结构见 [数据库](database.md)。

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

新发件或收件会各自新增历史记录，并关联相同呼号中尚未关联对应 QSL 的通联。确认发件只更新按 `sent_at DESC, id DESC` 排序后的最新一条发件记录。

## 序号维护

`sequence_number` 是持久化展示序号，事实排序仍是 `time ASC, id ASC`。常规启动不会扫描全表。显式维护时，服务先统计不一致行，再在一个即时事务中使用临时偏移重建序号，避免唯一值交换冲突。

## QRZ.com 邮箱查询

外部查询读取 Cookie 后请求 QRZ 呼号页面并解析邮箱。API 层提供缓存策略：

- 命中缓存时可不访问外部站点；
- 实时查询成功后写入 `callsign_email_cache`；
- 同呼号、同来源的最新邮箱相同时仅刷新时间；
- 实时失败时，`fallback` 模式可退回缓存。

外部站点可用性、登录 Cookie 和页面结构都会影响查询结果。

## 日志与错误

服务注册控制台日志记录器，起始级别为 Info。业务输入错误通过统一状态对象返回；未被路由处理的数据库、JSON 解析或外部查询异常由框架错误处理流程接管。调用方不应假设所有失败都使用 HTTP 非 2xx；还必须检查响应体的 `ok`。
