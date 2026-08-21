# Hamlog Manager API

Hamlog Manager 提供用于查询和写入通联记录、地址簿和 QSL 收发记录的 HTTP API。

- 基础地址：`http://localhost:3000`
- 查询接口使用 `GET`，写入接口使用 `POST`
- 所有响应均为 JSON
- 呼号查询不区分大小写；服务端会将路径中的呼号转换为大写后查询。

## 响应状态

写入接口使用以下项目自定义状态。状态 `200` 表示操作成功；`10001` 与 `10002` 表示业务失败，响应中的成功标记为 `false`。

| 状态 | 消息 | 作用和表示内容 |
| --- | --- | --- |
| `200` | `Done` | 写入操作已成功完成。 |
| `10001` | 具体校验错误信息 | 请求体未通过输入校验，例如缺少必填字段、字段类型不符，或日期/时间格式无效。日期格式错误消息为 `invalid date format`，通联时间格式错误消息为 `invalid time format`。 |
| `10002` | `No QSL send record found for callsign: {callsign}` | 确认 QSL 发件收件时，指定呼号不存在任何 QSL 发件记录。 |

## 写入接口

### 新提交通联日志

`POST /api/update/new-log`

新增一条通联日志。请求体为 JSON；呼号会转换为大写后保存。`time` 必须使用 `YYYY-MM-DD HH:mm` 格式，并且必须是有效日期和时间。

```json
{
  "time": "2026-08-17 12:34",
  "callsign": "JA1ABC",
  "frequency": 14.074,
  "mode": "FT8",
  "rxReport": -10,
  "txReport": -8,
  "summary": "备注"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `time` | string | 是 | 通联时间，格式为 `YYYY-MM-DD HH:mm` |
| `callsign` | string | 是 | 对方呼号 |
| `frequency` | number | 是 | 通联频率 |
| `mode` | string | 是 | 通联模式 |
| `rxReport` | integer | 是 | 接收报告 |
| `txReport` | integer | 是 | 发送报告 |
| `summary` | string | 否 | 通联摘要 |

响应状态参见[响应状态](#响应状态)。

### 新提交对方地址

`POST /api/update/new-address`

新增或更新指定呼号的最新地址。请求体为 JSON；呼号会转换为大写后保存。

写入成功后，服务会将同呼号且尚未关联地址的通联日志关联到该地址；已有地址关联不会被覆盖。

```json
{
  "callsign": "JA1ABC",
  "postalCode": "100-0001",
  "address": "Tokyo, Japan",
  "recipientName": "Taro Yamada",
  "updatedAt": "2026-08-17"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号 |
| `postalCode` | string | 是 | 邮政编码 |
| `address` | string | 是 | 邮寄地址 |
| `recipientName` | string | 否 | 收件人名称 |
| `updatedAt` | string | 否 | 地址最后更新时间；未填写时默认为当前 UTC 日期 |

响应状态参见[响应状态](#响应状态)。

### 新提交 QSL 发件记录

`POST /api/update/new-qsl-send`

新增一条 QSL 发件记录。新记录的收件确认时间固定为 `null`，不能通过此接口传入。

写入成功后，服务会将同呼号且尚未关联 QSL 发件记录的通联日志关联到该记录；已有 QSL 发件关联不会被覆盖。

```json
{
  "callsign": "JA1ABC",
  "sentAt": "2026-08-17"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号 |
| `sentAt` | string | 是 | QSL 发件日期 |

响应状态参见[响应状态](#响应状态)。

### 新提交 QSL 收件记录

`POST /api/update/new-qsl-receive`

新增一条 QSL 收件记录。

写入成功后，服务会将同呼号且尚未关联 QSL 收件记录的通联日志关联到该记录；已有 QSL 收件关联不会被覆盖。

```json
{
  "callsign": "JA1ABC",
  "receivedAt": "2026-08-18"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号 |
| `receivedAt` | string | 是 | QSL 收件日期 |

响应状态参见[响应状态](#响应状态)。

### 确认 QSL 发件收件

`POST /api/update/confirm-qsl-send`

将指定呼号按发件日期和记录序号倒序排列后的最新一条 QSL 发件记录的收件确认时间更新为 `confirmedAt`。

```json
{
  "callsign": "JA1ABC",
  "confirmedAt": "2026-08-18"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号 |
| `confirmedAt` | string | 是 | 对方确认收到卡片的时间 |

响应状态参见[响应状态](#响应状态)。

## 数据结构

### CommunicationLog

```json
{
  "id": 1,
  "sequenceNumber": 1,
  "time": "2026-08-17 12:34:56",
  "callsign": "JA1ABC",
  "frequency": 14.074,
  "mode": "FT8",
  "rxReport": -10,
  "txReport": -8,
  "summary": "备注",
  "hasAddress": true,
  "qslReceived": true,
  "qslSent": true
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 通联记录稳定标识；用于链接定位，不作为详情页显示序号 |
| `sequenceNumber` | number | 持久化的时间顺序号；最早记录为 `1`，补录更早记录时后续序号自动顺延，列表仍按时间降序返回 |
| `time` | string | 通联时间 |
| `callsign` | string | 对方呼号 |
| `frequency` | number | 通联频率 |
| `mode` | string | 通联模式 |
| `rxReport` | number | 接收报告 |
| `txReport` | number | 发送报告 |
| `summary` | string，可选 | 通联摘要；未填写时字段不存在 |
| `hasAddress` | boolean | 关联的地址记录是否存在 |
| `qslReceived` | boolean | 关联的 QSL 收件记录是否存在 |
| `qslSent` | boolean | 关联的 QSL 发件记录是否存在 |

### Address

```json
{
  "callsign": "JA1ABC",
  "postalCode": "100-0001",
  "address": "Tokyo, Japan",
  "recipientName": "Taro Yamada",
  "updatedAt": "2026-08-17"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | string | 呼号 |
| `postalCode` | string | 邮政编码 |
| `address` | string | 邮寄地址 |
| `recipientName` | string，可选 | 收件人名称；未填写时字段不存在 |
| `updatedAt` | string | 地址最后更新时间 |

### QSLSend

```json
{
  "callsign": "JA1ABC",
  "sentAt": "2026-08-17",
  "confirmedAt": null
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | string | 呼号 |
| `sentAt` | string | QSL 发件日期 |
| `confirmedAt` | string 或 `null` | 对方确认收到卡片的时间；未确认时为 `null` |

### QSLReceive

```json
{
  "callsign": "JA1ABC",
  "receivedAt": "2026-08-18"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | string | 呼号 |
| `receivedAt` | string | QSL 收件日期 |

### 分页响应

通信记录和地址簿的列表接口返回以下分页结构：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 100,
  "total": 0
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | array | 当前页数据 |
| `page` | number | 当前页码，从 `1` 开始 |
| `pageSize` | number | 当前页大小 |
| `total` | number | 总记录数 |

`page` 与 `pageSize` 会被向下取整，且最小值为 `1`。未传 `page` 时，实际页码为 `1`；未传 `pageSize` 时，默认每页 `100` 条。

## 自动查询

### 按呼号查询电子邮箱

`GET /api/auto/callsign2email`

查询指定呼号的电子邮箱地址。默认优先返回缓存；缓存不存在时，从 QRZ.com 现场查询。现场查询成功的邮箱会以 `select:qrz.com` 为来源写入缓存；如果邮箱与该呼号、该来源的最新缓存相同，则只刷新原缓存记录的更新时间，不新增记录。不同来源的缓存相互独立，不会彼此更新。

| 查询参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 要查询的业余无线电呼号；应进行 URL 编码 |
| `mode` | string | 否 | 查询模式，默认为 `auto`；取值见下表 |

| `mode` | 行为 |
| --- | --- |
| `auto` | 有缓存时返回缓存；没有缓存时现场查询。 |
| `cache` | 只查询缓存；没有缓存时不进行现场查询。 |
| `fallback` | 强制现场查询；查询不到邮箱时返回缓存。 |
| `realtime` | 强制现场查询；查询不到邮箱时直接返回 `null`。 |

返回对象字段如下。`comeFrom` 仅在 `email` 不为 `null` 时存在。`lastUpdate` 表示缓存记录或成功现场查询写入缓存的时间；当 `email` 为 `null` 且 `realtime` 为 `false` 时该字段不存在。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | string | 规范化为大写后的查询呼号 |
| `email` | string 或 `null` | 查询到的邮箱地址 |
| `comeFrom` | string，可选 | 数据来源：`select:qrz.com` 或 `manual` |
| `realtime` | boolean | `true` 表示本次现场抓取，`false` 表示使用缓存；`manual` 缓存记录固定为 `false` |
| `lastUpdate` | string，可选 | 缓存记录的更新时间，格式为 `YYYY-MM-DD HH:mm` |
| `mode` | string | 本次使用的查询模式 |

未提供 `callsign` 时，响应状态为 `10001`，消息为 `callsign is required`。`mode` 不是 `auto`、`cache`、`fallback` 或 `realtime` 时，响应状态为 `10001`。

```text
GET /api/auto/callsign2email?callsign=JA1ABC
```

```json
{
  "callsign": "JA1ABC",
  "email": "operator@example.com",
  "comeFrom": "select:qrz.com",
  "realtime": true,
  "lastUpdate": "2026-08-18 16:43",
  "mode": "auto"
}
```

## 呼号详情

### 查询呼号完整信息

`GET /api/select/callsign-detail`

按呼号聚合基本信息、全部通联记录、地址信息以及全部 QSL 收发记录。呼号查询不区分大小写。

| 查询参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 要查询的对方呼号；应进行 URL 编码 |

返回对象格式如下：

```json
{
  "basic": {
    "callsign": "JA1ABC",
    "communicationCount": 2,
    "firstCommunicationAt": "2026-08-10 09:30",
    "lastCommunicationAt": "2026-08-17 12:34"
  },
  "communicationLogs": [],
  "addresses": [],
  "qslSends": [],
  "qslReceives": []
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `basic.callsign` | string | 规范化为大写后的查询呼号 |
| `basic.communicationCount` | number | 该呼号的通联记录总数 |
| `basic.firstCommunicationAt` | string 或 `null` | 最早通联时间；没有通联记录时为 `null` |
| `basic.lastCommunicationAt` | string 或 `null` | 最近通联时间；没有通联记录时为 `null` |
| `communicationLogs` | `CommunicationLog[]` | 全部通联记录，按通联时间和记录序号倒序 |
| `addresses` | `Address[]` | 全部地址信息；没有地址时为空数组。当前数据库以呼号唯一约束地址，因此最多一条 |
| `qslSends` | `QSLSend[]` | 全部 QSL 发件记录，按发件日期和记录序号倒序 |
| `qslReceives` | `QSLReceive[]` | 全部 QSL 收件记录，按收件日期和记录序号倒序 |

呼号在数据库中没有任何相关信息时，接口仍返回规范化后的 `basic.callsign`，其余计数、时间和数组为空值。未提供 `callsign` 或参数仅包含空白时，响应状态为 `10001`，消息为 `callsign is required`。

```text
GET /api/select/callsign-detail?callsign=JA1ABC
```

## 通联记录

### 查询通联记录列表

`GET /api/select/communication-log`

按通联时间倒序查询全部通联记录，时间相同时按记录序号倒序。

| 查询参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | number | 否 | `1` | 页码 |
| `pageSize` | number | 否 | `100` | 每页记录数 |
| `qslSent` | boolean | 否 | 不筛选 | `true` 仅保留已发出 QSL 的通联，`false` 仅保留未发出的通联 |
| `qslReceived` | boolean | 否 | 不筛选 | `true` 仅保留已收到 QSL 的通联，`false` 仅保留未收到的通联 |
| `hasAddress` | boolean | 否 | 不筛选 | `true` 仅保留有关联地址的通联，`false` 仅保留无关联地址的通联 |
| `deduplicateCallsigns` | boolean | 否 | `false` | `true` 时每个呼号仅保留符合其他筛选条件的最新一条通联 |

返回：分页 `CommunicationLog` 对象。

该接口只查询 `communication_logs` 表；不会返回地址或 QSL 明细。`hasAddress`、`qslReceived` 和 `qslSent` 分别由 `address_id`、`qsl_receive_id` 与 `qsl_send_id` 是否为 `NULL` 得出。多个状态筛选以 AND 组合；启用 `deduplicateCallsigns` 时，先完成状态筛选，再按通联时间和内部 ID 倒序为每个呼号保留一条记录，最后分页。返回列表按时间降序排列，但 `sequenceNumber` 是全体日志持久化的时间升序全局序号，因此最新记录显示最大的序号。

```text
GET /api/select/communication-log?page=1&pageSize=20&qslSent=false&qslReceived=false&hasAddress=true&deduplicateCallsigns=true
```

### 按呼号查询通联记录

`GET /api/select/communication-log/{callsign}`

查询指定呼号的全部通联记录，按通联时间和记录序号倒序返回。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：`CommunicationLog[]`。

该接口只查询 `communication_logs` 表；不会返回地址或 QSL 明细。`hasAddress`、`qslReceived` 和 `qslSent` 分别由 `address_id`、`qsl_receive_id` 与 `qsl_send_id` 是否为 `NULL` 得出。

```text
GET /api/select/communication-log/JA1ABC
```

### 按呼号查询通联摘要

`GET /api/select/communication-log/{callsign}/basic`

返回指定呼号的轻量通联信息，适用于展示该呼号的通联日期和频率。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：数组，数组元素格式如下：

```json
{
  "date": "2026-08-17",
  "callsign": "JA1ABC",
  "frequency": 14.074
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | 通联日期，取通联时间的前 10 个字符 |
| `callsign` | string | 对方呼号 |
| `frequency` | number | 通联频率 |

```text
GET /api/select/communication-log/JA1ABC/basic
```

### 模糊查询通联摘要

`GET /api/select/search-log?query=1ABCD`

按输入字符串模糊匹配呼号，并按呼号聚合返回通联时间和频率。匹配及呼号排序优先级依次为：精确匹配、从呼号头部开始匹配、从呼号尾部开始匹配、从倒数第 3 位开始匹配（仅输入长度不超过 3 时）、其他中间匹配。呼号查询不区分大小写。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `query` | string | 是 | 要匹配的呼号片段；应进行 URL 编码 |

返回按呼号聚合的数组；每个分组中的日志按通联时间倒序、记录序号倒序排列。

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

```text
GET /api/select/search-log?query=1ABCD
```

## 地址簿

### 查询地址列表

`GET /api/select/address`

按呼号升序返回地址簿记录。

| 查询参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | number | 否 | `1` | 页码 |
| `pageSize` | number | 否 | `100` | 每页记录数 |

返回：分页 `Address` 对象。

```text
GET /api/select/address?page=1&pageSize=20
```

### 按呼号查询地址

`GET /api/select/address/{callsign}`

查询指定呼号的地址信息。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：`Address` 或 `null`。没有对应地址时响应体为 `null`。

```text
GET /api/select/address/JA1ABC
```

### 批量查询地址

`GET /api/select/address-query`

按逗号分隔的呼号批量查询地址。呼号会去除空项、去重并转换为大写；不存在地址的呼号不会出现在结果中。

| 查询参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 以逗号分隔的呼号列表；应进行 URL 编码 |

返回：`Address[]`，按呼号升序排列。未提供有效呼号时返回空数组。

```text
GET /api/select/address-query?callsign=JA1ABC,JA2DEF,JA3GHI
```

## QSL 发件记录

### 查询全部 QSL 发件记录

`GET /api/select/qsl-send`

按发件日期和记录序号倒序返回全部 QSL 发件记录。

返回：`QSLSend[]`。

```text
GET /api/select/qsl-send
```

### 按呼号查询 QSL 发件记录

`GET /api/select/qsl-send/{callsign}`

按发件日期和记录序号倒序返回指定呼号的 QSL 发件记录。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：`QSLSend[]`。

```text
GET /api/select/qsl-send/JA1ABC
```

### 批量查询 QSL 发件记录

`GET /api/select/qsl-send-query`

按逗号分隔的呼号批量查询 QSL 发件记录。呼号会去除空项、去重并转换为大写；不存在发件记录的呼号不会出现在结果中。

| 查询参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 以逗号分隔的呼号列表；应进行 URL 编码 |

返回：`QSLSend[]`，按发件日期和记录序号倒序排列。未提供有效呼号时返回空数组。

```text
GET /api/select/qsl-send-query?callsign=JA1ABC,JA2DEF,JA3GHI
```

## QSL 收件记录

### 查询全部 QSL 收件记录

`GET /api/select/qsl-receive`

按收件日期和记录序号倒序返回全部 QSL 收件记录。

返回：`QSLReceive[]`。

```text
GET /api/select/qsl-receive
```

### 按呼号查询 QSL 收件记录

`GET /api/select/qsl-receive/{callsign}`

按收件日期和记录序号倒序返回指定呼号的 QSL 收件记录。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：`QSLReceive[]`。

```text
GET /api/select/qsl-receive/JA1ABC
```

### 批量查询 QSL 收件记录

`GET /api/select/qsl-receive-query`

按逗号分隔的呼号批量查询 QSL 收件记录。呼号会去除空项、去重并转换为大写；不存在收件记录的呼号不会出现在结果中。

| 查询参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 以逗号分隔的呼号列表；应进行 URL 编码 |

返回：`QSLReceive[]`，按收件日期和记录序号倒序排列。未提供有效呼号时返回空数组。

```text
GET /api/select/qsl-receive-query?callsign=JA1ABC,JA2DEF,JA3GHI
```
