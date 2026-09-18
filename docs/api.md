# HTTP API

API 默认监听 `3000` 端口的所有网络接口（服务端启动参数 `--host` / `--port` 可覆盖），所有业务路由以 `/api` 开头。读取接口使用 GET，写入接口只接受 POST。

## 响应格式

框架使用统一响应包装：

```json
{
  "ok": true,
  "code": 200,
  "msg": "Done",
  "data": {}
}
```

调用方应同时检查 HTTP 状态和响应体的 `ok`。写入成功使用业务状态 `200 / Done`；已知业务错误如下：

| `code` | `ok` | 含义 |
| --- | --- | --- |
| `200` | `true` | 操作完成 |
| `10001` | `false` | 输入或查询参数无效，`msg` 给出原因 |
| `10002` | `false` | 确认 QSL 发件时找不到指定 ID 的发件记录 |
| `10003` | `false` | 邮件发送失败，`msg` 给出失败原因 |

不支持的 HTTP 方法由框架返回 Method Not Allowed。未捕获的 JSON、数据库和外部服务错误不保证使用上述业务码。

## 接口总览

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/select/communication-log` | 分页查询通联 |
| GET | `/api/select/communication-log/id/{id}` | 按 ID 查询单条通联 |
| GET | `/api/select/communication-log/{callsign}` | 查询呼号的全部通联 |
| GET | `/api/select/communication-log/{callsign}/basic` | 查询轻量通联摘要 |
| GET | `/api/select/search-log` | 模糊搜索呼号及通联摘要 |
| GET | `/api/select/callsign-detail` | 聚合呼号详情 |
| GET | `/api/select/address` | 分页查询地址 |
| GET | `/api/select/address/{callsign}` | 查询单个地址 |
| GET | `/api/select/address-query` | 批量查询地址 |
| GET | `/api/select/qsl-send` | 查询全部 QSL 发件 |
| GET | `/api/select/qsl-send/id/{id}` | 按 ID 查询单条 QSL 发件 |
| GET | `/api/select/qsl-send/{callsign}` | 按呼号查询 QSL 发件 |
| GET | `/api/select/qsl-send-query` | 批量查询 QSL 发件 |
| GET | `/api/select/qsl-receive` | 查询全部 QSL 收件 |
| GET | `/api/select/qsl-receive/id/{id}` | 按 ID 查询单条 QSL 收件 |
| GET | `/api/select/qsl-receive/{callsign}` | 按呼号查询 QSL 收件 |
| GET | `/api/select/qsl-receive-query` | 批量查询 QSL 收件 |
| GET | `/api/auto/callsign2email` | 查询呼号邮箱 |
| GET | `/api/select/email2callsign` | 查询邮箱对应呼号 |
| POST | `/api/email/preview` | 预览按模板格式化后的 HTML |
| POST | `/api/email/send` | 发送电子邮件 |
| POST | `/api/update/new-log` | 新增通联 |
| POST | `/api/update/new-address` | 新增或更新地址 |
| POST | `/api/update/manual-email` | 手动更新呼号邮箱 |
| POST | `/api/update/new-qsl-send` | 新增 QSL 发件 |
| POST | `/api/update/new-qsl-receive` | 新增 QSL 收件 |
| POST | `/api/update/confirm-qsl-send` | 按 ID 确认 QSL 发件 |

完整字段定义见 [共享数据模型与校验](schema.md)。

## 通联读取

### 通联分页列表

`GET /api/select/communication-log`

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `page` | number | `1` | 页码；取整且最小为 1 |
| `pageSize` | number | `100` | 页大小；取整且最小为 1 |
| `qslSent` | `true` / `false` | 不筛选 | 按 QSL 发件外键筛选 |
| `qslReceived` | `true` / `false` | 不筛选 | 按 QSL 收件外键筛选 |
| `hasAddress` | `true` / `false` | 不筛选 | 按地址外键筛选 |
| `deduplicateCallsigns` | `true` / `false` | `false` | 每个呼号只保留筛选结果中的最新通联 |

布尔参数仅识别不区分大小写的 `true` 和 `false`；其他值等同未提供。多个筛选条件按 AND 组合。返回 `PaginatedResult<CommunicationLog>`，按 `time DESC, id DESC` 排序。

```text
GET /api/select/communication-log?page=1&pageSize=20&qslSent=false&hasAddress=true&deduplicateCallsigns=true
```

查询“未发送 QSL 且按呼号去重”的通联可直接使用：

```text
GET /api/select/communication-log?page=1&pageSize=100&qslSent=false&deduplicateCallsigns=true
```

### 按呼号查询

`GET /api/select/communication-log/{callsign}` 返回 `CommunicationLog[]`，按时间和 ID 倒序。呼号路径段需要 URL 编码；服务端转换为大写。

### 按 ID 查询

`GET /api/select/communication-log/id/{id}` 返回单条 `CommunicationLog`；不存在时返回 `null`。`id` 路径段必须是纯数字，因此不会与呼号路径冲突。邮件准备页按通联 ID 生成 QSO 确认稿时使用该接口。

### 轻量摘要

`GET /api/select/communication-log/{callsign}/basic` 返回：

```json
[
  {
    "date": "2026-08-17",
    "callsign": "JA1ABC",
    "frequency": 14.074
  }
]
```

`date` 是通联时间的前 10 个字符。

### 模糊搜索

`GET /api/select/search-log?query=1ABC`

空值或仅空白返回空数组。服务端将查询转为大写，并按以下优先级排列呼号：精确匹配、头部匹配、尾部匹配、输入长度不超过 3 时的倒数第三位匹配、其他包含匹配。结果结构：

```json
[
  {
    "callsign": "JA1ABC",
    "logs": [
      {
        "callsign": "JA1ABC",
        "time": "2026-08-17 12:34",
        "frequency": 14.074
      }
    ]
  }
]
```

## 呼号详情

`GET /api/select/callsign-detail?callsign=JA1ABC`

`callsign` 缺失或仅为空白时返回 `10001`。成功返回 `CallsignDetail`，聚合全部通联、地址、QSL 发件与收件。通联数为数组长度，首末通联时间由倒序通联列表推导。没有任何记录时仍返回规范化呼号，计数为 0、时间为 `null`、数组为空。

## 地址

### 地址分页列表

`GET /api/select/address?page=1&pageSize=100` 返回 `PaginatedResult<Address>`，按呼号升序。

### 单个呼号

`GET /api/select/address/{callsign}` 返回 `Address`；不存在时返回 `null`。

### 批量查询

`GET /api/select/address-query?callsign=JA1ABC,JA2DEF`

逗号分隔输入会转大写、去空项并去重，不存在的呼号不出现在结果中。返回 `Address[]`，按呼号升序。缺失参数时返回空数组。

## QSL 读取

### 发件

- `GET /api/select/qsl-send`：返回全部 `QSLSend[]`。
- `GET /api/select/qsl-send/id/{id}`：按正整数 ID 返回单条 `QSLSend`；不存在时返回 `null`。
- `GET /api/select/qsl-send/{callsign}`：返回指定呼号记录。
- `GET /api/select/qsl-send-query?callsign=JA1ABC,JA2DEF`：批量查询。

结果按 `sentAt DESC`、`id DESC` 排序。每条记录公开稳定的整数 `id`，还包含 `status` 和 `trackingNumber`：`status` 可为 `received`、`returned`、`not_received` 或 `null`，`trackingNumber` 为字符串或 `null`。

### 收件

- `GET /api/select/qsl-receive`：返回全部 `QSLReceive[]`。
- `GET /api/select/qsl-receive/id/{id}`：按正整数 ID 返回单条 `QSLReceive`；不存在时返回 `null`。
- `GET /api/select/qsl-receive/{callsign}`：返回指定呼号记录。
- `GET /api/select/qsl-receive-query?callsign=JA1ABC,JA2DEF`：批量查询。

结果按 `receivedAt DESC`、`id DESC` 排序。每条记录公开稳定的整数 `id`。批量参数处理规则与地址一致。

## 邮箱自动查询

`GET /api/auto/callsign2email?callsign=JA1ABC&mode=auto`

`callsign` 必填；`mode` 默认为 `auto`。

| 模式 | 行为 |
| --- | --- |
| `auto` | 优先缓存；未命中时实时查询 |
| `cache` | 只读缓存；未命中返回 `email: null`、`realtime: false` |
| `fallback` | 先实时查询；失败后尝试缓存 |
| `realtime` | 只实时查询；失败返回 `email: null` |

返回示例：

```json
{
  "callsign": "JA1ABC",
  "email": "operator@example.com",
  "comeFrom": "select:qrz.com",
  "realtime": true,
  "lastUpdate": "2026-08-22 08:30",
  "mode": "auto"
}
```

`comeFrom` 和 `lastUpdate` 仅在有对应缓存/查询结果时出现。当前实时来源固定写为 `select:qrz.com`。实时查询依赖 `config/values.ts` 中的 `qrzCookie` 和 QRZ.com 页面结构。

### 特殊配置呼号

用 `<>` 包裹的呼号（如 `<SELF>`）按配置映射解析，优先级高于缓存表和实时抓取：

- `config/values.ts` 的 `selfInfo.emailAddresses` 中定义了对应键（不区分大小写）时，直接返回配置邮箱，对全部四种 `mode` 均成立，不访问缓存表和 QRZ.com。此时 `comeFrom` 固定为 `config`，`realtime` 为 `true`，且没有 `lastUpdate`。
- 配置未命中时退回 `callsign_email_cache` 表查询，任何模式下都不触发实时抓取；表也未命中时返回 `email: null`、`realtime: false`。

```ts
export const selfInfo: SelfInfoConfig = {
  // ……其余字段见 config/values.template.ts
  emailAddresses: {
    SELF: 'operator@example.com',
  },
};
```

配置命中返回示例：

```json
{
  "callsign": "<SELF>",
  "email": "operator@example.com",
  "comeFrom": "config",
  "realtime": true,
  "mode": "fallback"
}
```

## 邮箱反查呼号

`GET /api/select/email2callsign?email=operator@example.com`

`email` 必填。该接口先匹配 `config/values.ts` 中 `selfInfo.emailAddresses` 配置，未命中时查询本地 `callsign_email_cache` 缓存，不触发外部抓取。

邮箱在配置中有定义时（不区分大小写），返回 `<>` 包裹的配置键，如键 `SELF` 返回 `<SELF>`；此时 `comeFrom` 为 `config`，`realtime` 为 `true`，且没有 `lastUpdate`：

```json
{
  "email": "operator@example.com",
  "callsign": "<SELF>",
  "comeFrom": "config",
  "realtime": true
}
```

缓存命中返回示例：

```json
{
  "email": "operator@example.com",
  "callsign": "JA1ABC",
  "comeFrom": "manual",
  "lastUpdate": "2026-09-15 08:30"
}
```

未命中时返回：

```json
{
  "email": "operator@example.com",
  "callsign": null
}
```

## 邮件预览

`POST /api/email/preview`

请求体与 `POST /api/email/send` 完全一致：

```json
{
  "to": ["friend1@example.com"],
  "subject": "QSL 卡片寄送通知",
  "body": "<p>您好，您的 <strong>QSL 卡片</strong> 已寄出。</p>",
  "contentType": "html"
}
```

返回值：

```json
{
  "html": "<html>...按 template.ejs 格式化后的完整 HTML...</html>"
}
```

返回值中的 `html` 是经过 `server/email/template.ejs` 渲染后的完整 HTML 字符串，可直接用于前端预览或调试。渲染结果包含固定页脚（本人呼号来自 `config/values.ts` 的 `selfInfo.callsign`，并内嵌台标图片）。其 `to`、`cc`、`bcc`、`subject`、`body`、`contentType` 约束与发送接口一致。

## 邮件发送

`POST /api/email/send`

请求体：

```json
{
  "to": ["friend1@example.com"],
  "cc": ["friend2@example.com"],
  "bcc": [],
  "subject": "QSL 卡片寄送通知",
  "body": "您好，您的 QSL 卡片已寄出。",
  "contentType": "text"
}
```

HTML 示例：

```json
{
  "to": ["friend1@example.com"],
  "subject": "QSL 卡片寄送通知",
  "body": "<p>您好，您的 <strong>QSL 卡片</strong> 已寄出。</p>",
  "contentType": "html"
}
```

约束：

- `to`、`cc`、`bcc` 都必须是字符串数组。
- `to` 为必填，且至少包含 1 个非空字符串。
- `cc` 和 `bcc` 可选；缺省时服务端按空数组处理。
- `subject` 与 `body` 为必填且非空字符串。
- `contentType` 可选，默认值为 `text`；可取 `text` 或 `html`。
- 对象不允许未声明字段。

SMTP 配置读取 `config/values.ts` 的 `email`。当前最小配置必须显式写入 `host` 和 `port`：

```ts
export const email: SmtpConfig = {
  email: 'your-account@example.com',
  password: 'your-smtp-password',
  host: 'smtp.example.com',
  port: 465,
};
```

可选字段：`secure`、`from`。`host` 和 `port` 都必须直接配置在 `config/values.ts` 中，程序不会自行推断。

## 写入

请求体为 JSON。所有对象禁止未声明字段，呼号会在数据库层转为大写。

### 新增通联

`POST /api/update/new-log`

```json
{
  "time": "2026-08-17 12:34",
  "callsign": "JA1ABC",
  "frequency": 14.074,
  "mode": "CW",
  "rxReport": 59,
  "txReport": 59,
  "summary": "备注"
}
```

`time` 必须是有效的 `YYYY-MM-DD HH:mm`；两个报告必须是 `11..99` 的整数。写入会关联该呼号已有的地址及最新 QSL 记录，并维护全局序号。

### 手动更新邮箱

`POST /api/update/manual-email`

```json
{
  "callsign": "JA1ABC",
  "email": "operator@example.com"
}
```

`callsign` 与 `email` 均为必填且非空字符串，服务端会在数据库层将呼号规范化为大写，并将缓存来源写为固定值 `manual`。该接口不接受任何 `provider` 字段，也不能通过请求覆盖另一个来源；所有通过此接口写入的邮箱记录都按 `manual` 归档。

### 新增或更新地址

`POST /api/update/new-address`

```json
{
  "callsign": "JA1ABC",
  "postalCode": "100-0001",
  "address": "Tokyo, Japan",
  "recipientName": "Taro Yamada",
  "updatedAt": "2026-08-17"
}
```

`recipientName` 和 `updatedAt` 可选。缺少 `updatedAt` 时填入当前 UTC 日期。按呼号 upsert，并关联同呼号中尚无地址的通联。

### 新增 QSL 发件

`POST /api/update/new-qsl-send`

```json
{
  "callsign": "JA1ABC",
  "sentAt": "2026-08-17"
}
```

新增记录的 `confirmedAt`、`status` 和 `trackingNumber` 均为 `null`，并关联同呼号中尚无发件记录的通联。当前新增接口不接收状态或物流单号。

### 新增 QSL 收件

`POST /api/update/new-qsl-receive`

```json
{
  "callsign": "JA1ABC",
  "receivedAt": "2026-08-18"
}
```

新增后关联同呼号中尚无收件记录的通联。

### 按 ID 确认发件

`POST /api/update/confirm-qsl-send`

```json
{
  "id": 42,
  "confirmedAt": "2026-08-20",
  "status": "received"
}
```

`id` 必须是正整数；`status` 可为 `received`（已收到）、`returned`（已退回）或 `not_received`（未收到）。服务只更新该 ID 对应发件的确认日期和状态，不修改呼号、发送日期或物流单号。记录不存在时返回 `10002`。

## 日期和呼号注意事项

- QSL 日期严格使用有效的 `YYYY-MM-DD`。
- 通联时间严格使用有效的 `YYYY-MM-DD HH:mm`。
- 时间文本不含时区。
- 服务端呼号规范化只执行 `toUpperCase()`，不会去除首尾空白。
- 路径和查询参数中的特殊字符应使用 URL 编码。
