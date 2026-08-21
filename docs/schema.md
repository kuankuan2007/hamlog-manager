# 共享数据模型与校验

共享模型位于 `schema/`，供 Web 与服务端共同使用；服务端在 `server/schema/index.ts` 中使用 Ajv 编译并执行校验。数据库列采用 snake_case，API 和 TypeScript 类型采用 camelCase。

## 核心读取模型

### `CommunicationLog`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 数据库稳定标识 |
| `sequenceNumber` | `number` | 按 `time ASC, id ASC` 维护的全局展示序号 |
| `time` | `string` | 通联时间 |
| `callsign` | `string` | 对方呼号 |
| `frequency` | `number` | 通联频率 |
| `mode` | `string` | 通联模式 |
| `rxReport` | `number` | 接收信号报告 |
| `txReport` | `number` | 发送信号报告 |
| `summary` | `string?` | 可选摘要 |
| `hasAddress` | `boolean` | 是否关联地址记录 |
| `qslReceived` | `boolean` | 是否关联 QSL 收件记录 |
| `qslSent` | `boolean` | 是否关联 QSL 发件记录 |

后三个布尔值由 `communication_logs` 中对应外键是否为 `NULL` 计算，不代表联表返回了记录详情。

### `Address`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | `string` | 呼号 |
| `postalCode` | `string` | 邮政编码 |
| `address` | `string` | 邮寄地址 |
| `recipientName` | `string?` | 可选收件人 |
| `updatedAt` | `string` | 更新日期 |

### QSL 模型

`QSLSend` 包含 `callsign: string`、`sentAt: string`、`confirmedAt: string | null`。

`QSLReceive` 包含 `callsign: string`、`receivedAt: string`。

数据库中的 QSL `id` 和 `note` 当前不向 API 读取模型暴露。

### `CallsignDetail`

详情模型包含：

- `basic.callsign`
- `basic.communicationCount`
- `basic.firstCommunicationAt: string | null`
- `basic.lastCommunicationAt: string | null`
- `communicationLogs: CommunicationLog[]`
- `addresses: Address[]`
- `qslSends: QSLSend[]`
- `qslReceives: QSLReceive[]`

### 通用包装

分页读取使用 `PaginatedResult<T>`：`items`、`page`、`pageSize`、`total`。

HTTP 响应使用 `ServerResponse<T>`：

```json
{
  "ok": true,
  "code": 200,
  "message": "Done",
  "data": null
}
```

`message` 可选，`data` 的具体类型由接口决定。

## 写入模型与约束

所有写入对象都禁止额外字段。服务端在路由层校验一次，数据库写入层还会再次校验。

### `CreateCommunicationLogInput`

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| `time` | string | 是 | 有效的 `YYYY-MM-DD HH:mm` |
| `callsign` | string | 是 | 长度至少 1 |
| `frequency` | number | 是 | 有限数值由 JSON/Ajv 处理，未设业务范围 |
| `mode` | string | 是 | 长度至少 1 |
| `rxReport` | integer | 是 | `11` 到 `99` |
| `txReport` | integer | 是 | `11` 到 `99` |
| `summary` | string | 否 | 可为空字符串 |

> 当前信号报告约束是正整数 `11..99`。它与部分旧示例中的 FT8 负数报告不兼容；本文记录现有实现，不推断其业务意图。

### 地址输入

`CreateAddressRequest` 要求 `callsign`、`postalCode`、`address` 为非空字符串；`recipientName` 若存在也必须非空。`updatedAt` 可选，若缺省，路由会填入当前 UTC 日期。

数据库层使用的 `CreateAddressInput` 还要求 `updatedAt` 存在。当前地址 Schema 只要求该字段非空，并未应用严格日期格式校验。

### QSL 输入

| 模型 | 字段 | 日期字段 |
| --- | --- | --- |
| `CreateQSLSendInput` | `callsign`, `sentAt` | `sentAt` |
| `CreateQSLReceiveInput` | `callsign`, `receivedAt` | `receivedAt` |
| `ConfirmQSLSendInput` | `callsign`, `confirmedAt` | `confirmedAt` |

呼号必须为非空字符串，日期字段必须是有效的 `YYYY-MM-DD`。

## 日期校验

项目定义两种 Ajv 自定义格式：

- `hamlog-date`：严格匹配 `YYYY-MM-DD`。
- `hamlog-date-time`：严格匹配 `YYYY-MM-DD HH:mm`，使用 24 小时制。

校验不仅检查正则形式，还检查月份天数和闰年，因此 `2025-02-29` 会失败。时间均为无时区文本；由应用生成的“当前时间”采用 UTC，但用户提交值本身不携带时区。

## 呼号规范化

数据库读写层通过 `toUpperCase()` 将呼号转为大写。批量查询还会去除空项并去重。该规范化不执行 `trim()`；调用方应避免提交带首尾空白的呼号。

## 邮箱查询模型

`Callsign2EmailMode` 可取：`auto`、`cache`、`fallback`、`realtime`。

`Callsign2EmailResponse` 包含 `callsign`、`email`、`realtime`、`mode`，并可能包含 `comeFrom` 和 `lastUpdate`。当前实时抓取写入的来源为 `select:qrz.com`；类型本身允许数据库中存在其他来源字符串。
