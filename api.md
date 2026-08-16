# Hamlog Manager API

Hamlog Manager 提供只读 HTTP API，用于查询通联记录、地址簿和 QSL 收发记录。

- 基础地址：`http://localhost:3000`
- 所有接口均使用 `GET`
- 所有响应均为 JSON
- 呼号查询不区分大小写；服务端会将路径中的呼号转换为大写后查询。

## 数据结构

### CommunicationLog

```json
{
  "sequenceNumber": 1,
  "time": "2026-08-17 12:34:56",
  "callsign": "JA1ABC",
  "frequency": 14.074,
  "mode": "FT8",
  "rxReport": -10,
  "txReport": -8,
  "summary": "备注",
  "qslReceived": {
    "callsign": "JA1ABC",
    "receivedAt": "2026-08-18"
  },
  "qslSent": {
    "callsign": "JA1ABC",
    "sentAt": "2026-08-17"
  },
  "address": {
    "callsign": "JA1ABC",
    "postalCode": "100-0001",
    "address": "Tokyo, Japan",
    "recipientName": "Taro Yamada",
    "updatedAt": "2026-08-17"
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sequenceNumber` | number | 通联记录序号 |
| `time` | string | 通联时间 |
| `callsign` | string | 对方呼号 |
| `frequency` | number | 通联频率 |
| `mode` | string | 通联模式 |
| `rxReport` | number | 接收报告 |
| `txReport` | number | 发送报告 |
| `summary` | string，可选 | 通联摘要；未填写时字段不存在 |
| `qslReceived` | QSLReceive 或 `null` | QSL 收件信息 |
| `qslSent` | QSLSend 或 `null` | QSL 发件信息 |
| `address` | Address，可选 | 对方地址；未关联时字段不存在 |

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
  "sentAt": "2026-08-17"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `callsign` | string | 呼号 |
| `sentAt` | string | QSL 发件日期 |

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

## 通联记录

### 查询通联记录列表

`GET /api/select/communication-log`

按通联时间倒序查询全部通联记录，时间相同时按记录序号倒序。

| 查询参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | number | 否 | `1` | 页码 |
| `pageSize` | number | 否 | `100` | 每页记录数 |

返回：分页 `CommunicationLog` 对象。

```text
GET /api/select/communication-log?page=1&pageSize=20
```

### 按呼号查询通联记录

`GET /api/select/communication-log/{callsign}`

查询指定呼号的全部通联记录，按通联时间和记录序号倒序返回。

| 路径参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `callsign` | string | 是 | 对方呼号；应进行 URL 编码 |

返回：`CommunicationLog[]`。

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