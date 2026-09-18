# Web 前端

Web 客户端位于 `src/`，使用 Vue 3、Vue Router、Vite 和 Sass。入口 `src/main.ts` 挂载根组件并注册路由。

## 页面路由

| 路径 | 页面 | 功能 |
| --- | --- | --- |
| `/` | `HomeView` | 展示通联记录，生成和复制中英文通联文本 |
| `/callsign-search` | `CallsignSearch` | 按呼号片段实时搜索 |
| `/callsign/:callsign` | `CallsignDetail` | 展示呼号详情、通联、地址、QSL 和邮箱 |
| `/new-log` | `NewLog` | 填写并提交新通联记录 |
| `/address-list` | `AddressList` | 浏览全部地址 |
| `/new-address?callsign={callsign}` | `NewAddress` | 填写并提交 QSL 邮寄地址，支持预填呼号 |
| `/edit-address?callsign={callsign}` | `EditAddress` | 按呼号载入已有地址编辑，无记录时转为新建 |
| `/address-print` | `AddressPrint` | 筛选待寄 QSL 的呼号、批量读取地址并打印 |
| `/new-qsl-send` | `NewQSLSend` | 填写并提交 QSL 发件记录 |
| `/new-qsl-receive` | `NewQSLReceive` | 填写并提交 QSL 收件记录 |
| `/confirm-qsl-send?id={id}` | `ConfirmQSLSend` | 按 ID 确认 QSL 发件并更新状态 |
| `/qsl-manager` | `QslManager` | 查看全部 QSL 收发记录并快速确认发件 |
| `/manual-email?callsign={callsign}` 或 `?email={email}` | `ManualEmail` | 手动修正呼号邮箱缓存 |
| `/email-prepare` | `EmailPrepare` | 按 QSL 发件 / QSL 收件 / 通联 ID 之一生成邮件稿 |
| `/send-email` | `SendEmail` | 解析收件人、预览并发送邮件 |
| `/:pathMatch(.*)*` | `PageNotFoundView` | 404 页面 |

页面标题由全局路由守卫设置为“页面名 - Ham Log Manager”。

## 页面行为

### 首页

首页读取第一页通联记录。界面可切换呼号显示，并可生成、复制中文或英文通联信息。

### 呼号搜索

输入变化时调用模糊搜索接口。新请求发出前会用 `AbortController` 取消上一请求，避免较旧响应覆盖最新输入；支持浏览器 CSS Highlights 时会高亮匹配文本。

### 呼号详情

详情页并行使用呼号详情和邮箱查询能力。用户可触发邮箱刷新；常规查询优先缓存，刷新流程会要求实时查询并在失败时回退缓存。

### 新通联

表单默认使用当前 UTC 时间标签。当前 UI 中模式类型和输入组件仅提供 `FM`、`AM`、`CW`，但服务端共享 Schema 接受任意非空模式字符串。输入组件还包括频率、信号报告、时间和时区处理。

### 新增 QSL 收发记录

`NewQSLSend` 和 `NewQSLReceive` 分别提交 QSL 发件与收件记录，日期默认使用当前 UTC 日期。两个页面均支持通过 `?callsign=JA1ABC` 预填目标呼号，并在提交前使用共享 Schema 进行浏览器端校验。

`ConfirmQSLSend` 通过 `?id={id}` 加载唯一一条 QSL 发件记录，可将状态设为“已收到”“已退回”或“未收到”。已有确认值会用于初始化表单，否则确认日期默认使用当前 UTC 日期。

`QslManager` 并行加载全部 QSL 发件与收件记录并显示公开 ID。每条发件记录提供按 ID 确认或更新的快捷链接。

### 地址打印

页面先查询“未发送 QSL、已有地址、按呼号去重”的通联列表，再按呼号批量获取地址，用于打印寄送信息。该页面依赖分页接口的当前页数据，默认请求参数应与待打印规模一并考虑。

### 地址管理

`AddressList` 分页聚合加载全部地址并按表格展示。`NewAddress` 支持 `?callsign=JA1ABC` 预填呼号，提交前使用共享 Schema 做浏览器端校验。`EditAddress` 按呼号载入现有地址回填表单；该呼号无地址记录时自动切换为新建模式。两者提交均走地址 upsert 接口。

### 手动更新邮箱

`ManualEmail` 支持 `?callsign=` 或 `?email=` 预填，提交后调用手动更新接口写入邮箱缓存（来源固定为 `manual`）。呼号详情页和收件人列表的“手动更新”链接均指向此页。

### 准备邮件

`EmailPrepare` 按且仅按一个查询参数生成邮件稿，参数缺失或多于一个时报错：

- `?qslSendId={id}`：QSL 寄出邮件，标题“您的QSL卡片已寄出”，正文含寄出日期和可选快递单号；
- `?qslReceiveId={id}`：QSL 收妥邮件，标题“您的QSL卡片已收妥”，正文含收妥日期和最近一次寄出日期；
- `?communicationLogId={id}`：QSO 确认邮件，按通联 ID 读取记录，标题“来自{本人呼号}的QSO确认”，正文含时间、频率、模式和信号报告，并按该呼号最新 QSL 收发状态生成收发段落：
  - 发件段落：有最新发件时，已退回或未收到则询问收件信息是否有误及是否重新寄送，待确认则询问是否收到，已收到则注明确认签收日期；无发件记录时改为展示拟寄送地址，或请对方在回信中提供地址；
  - 收件段落：有最新收件时以“您的QSL卡片已于某日收妥”替代本人 QSL 收件地址。

页面同时展示原始数据表、收件人、标题和只读正文，并提供携带完整邮件稿跳转发送页的链接。

### 发送邮件

`SendEmail` 通过 URL 参数预填标题、正文和 to/cc/bcc；抄送默认前置 `<CC_SELF>` 配置呼号以留存自动邮件副本。收件人、抄送、密送均使用 `InputEmailList`：含 `@` 的值按邮箱处理并反查呼号，其余值按呼号查询缓存邮箱（“刷新”按钮触发实时查询并在失败时回退缓存），未命中项红色加粗显示并阻止发送，列表按解析出的邮箱去重。预览调用邮件预览接口并在 iframe 中渲染 HTML；发送前校验标题、正文非空且无解析中或未解析项。

## 前端 API 层

| 模块 | 职责 |
| --- | --- |
| `src/api/util.ts` | 解析统一响应、处理 HTTP 和业务错误、发送 JSON |
| `src/api/select.ts` | 通联列表、搜索、详情、地址、QSL 和邮箱反查等读取接口 |
| `src/api/update.ts` | 新增通联、地址、QSL 收发记录及手动邮箱更新，并在发送前执行客户端校验 |
| `src/api/auto.ts` | 呼号邮箱查询 |
| `src/api/email.ts` | 邮件预览与发送请求 |
| `src/api/schema/` | 浏览器侧 Ajv 校验器 |

`getData()` 会先检查 HTTP `response.ok`，再检查 JSON 响应体的 `ok`。`sendData()` 使用 POST、`Content-Type: application/json` 和 JSON 字符串请求体。

接口路径使用同源相对 URL。开发时 Vite 把 `/api` 代理到 `http://localhost:3000`；生产部署需要由同源服务或反向代理提供该路径。

## 组件

`src/components/input/` 包含业务输入组件：

- `KInputFreq`：频率输入；
- `KInputList`：通用字符串列表输入（Enter 添加、Backspace 回删）；
- `KInputMode`：模式选择；
- `KInputRs`：信号报告输入；
- `KInputTime`：日期时间输入；
- `KInputTimezone`：时区输入；
- `InputEmailList`：邮件收件人列表输入，自动按邮箱/呼号解析并展示缓存来源与状态。

`src/components/dataDisplay/` 包含数据展示组件：`AddressTable`、`CallsignBasicTable`、`CommunicationLogTable`、`CommunicationLogBasicTable`、`QslSendTable`、`QslReceiveTable` 表格，以及 `QslActionBar`（按呼号新增 QSL 收发的快捷链接）和 `DataActionBar`（通用操作链接条）。

`EmailLink` 封装指向准备邮件或发送邮件页的链接（由 `src/scripts/sendEmail.ts` 构建 URL）；`KIcon` 封装项目图标。Fontello 资源和生成配置位于 `src/assets/fontello/`。

## 样式和构建

全局样式入口为 `src/styles/main.scss`，主题变量在 `src/styles/theme.scss`。Vite 会向每个 Sass 文件注入主题、动效以及 Sass 数学和颜色模块。

Vite 插件还包括：

- Vue SFC 支持；
- Vue DevTools；
- 自动导入 Vue/Vue Router API，并生成类型声明；
- Vite Inspect；
- 构建体积可视化；
- 项目自定义构建信息插件。

本人信息经 `src/config/index.ts` 从统一配置 `config/index.ts` 转发（仅 `selfInfo` 字段），替代了旧的 `visual:selfInfo` 虚拟模块插件；SMTP 密码与 QRZ Cookie 不进入前端生产构建产物。

## 开发注意事项

- 前端和服务端共享类型，但浏览器不能替代服务端校验。
- `server-dist/` 不是 Web 静态资源目录；Web 与服务端目前是两套独立构建。
- 当前代码未读取前端环境变量，API 基础路径固定为同源 `/api`。
- 前端允许的模式集合比服务端 Schema 更窄，修改业务模式时应同步检查 UI 类型、输入组件和服务端规则。
- 日期时间字符串不携带时区；页面当前时间工具按 UTC 生成，应在产品需求改变时统一调整前后端说明和转换逻辑。
