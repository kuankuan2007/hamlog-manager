# Web 前端

Web 客户端位于 `src/`，使用 Vue 3、Vue Router、Vite 和 Sass。入口 `src/main.ts` 挂载根组件并注册路由。

## 页面路由

| 路径 | 页面 | 功能 |
| --- | --- | --- |
| `/` | `HomeView` | 展示通联记录，生成和复制中英文通联文本 |
| `/callsign-search` | `CallsignSearch` | 按呼号片段实时搜索 |
| `/callsign/:callsign` | `CallsignDetail` | 展示呼号详情、通联、地址、QSL 和邮箱 |
| `/new-log` | `NewLog` | 填写并提交新通联记录 |
| `/address-print` | `AddressPrint` | 筛选待寄 QSL 的呼号、批量读取地址并打印 |
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

### 地址打印

页面先查询“未发送 QSL、已有地址、按呼号去重”的通联列表，再按呼号批量获取地址，用于打印寄送信息。该页面依赖分页接口的当前页数据，默认请求参数应与待打印规模一并考虑。

## 前端 API 层

| 模块 | 职责 |
| --- | --- |
| `src/api/util.ts` | 解析统一响应、处理 HTTP 和业务错误、发送 JSON |
| `src/api/select.ts` | 通联列表、搜索、详情、地址等读取接口 |
| `src/api/update.ts` | 新增通联和地址，并在发送前执行客户端校验 |
| `src/api/auto.ts` | 呼号邮箱查询 |
| `src/api/schema/` | 浏览器侧 Ajv 校验器 |

`getData()` 会先检查 HTTP `response.ok`，再检查 JSON 响应体的 `ok`。`sendData()` 使用 POST 和 JSON 字符串请求体；当前实现未显式设置 `Content-Type: application/json`，服务端框架仍按 JSON 读取请求体。

接口路径使用同源相对 URL。开发时 Vite 把 `/api` 代理到 `http://localhost:3000`；生产部署需要由同源服务或反向代理提供该路径。

## 组件

`src/components/input/` 包含业务输入组件：

- `KInputFreq`：频率输入；
- `KInputMode`：模式选择；
- `KInputRs`：信号报告输入；
- `KInputTime`：日期时间输入；
- `KInputTimezone`：时区输入。

`KIcon` 封装项目图标。Fontello 资源和生成配置位于 `src/assets/fontello/`。

## 样式和构建

全局样式入口为 `src/styles/main.scss`，主题变量在 `src/styles/theme.scss`。Vite 会向每个 Sass 文件注入主题、动效以及 Sass 数学和颜色模块。

Vite 插件还包括：

- Vue SFC 支持；
- Vue DevTools；
- 自动导入 Vue/Vue Router API，并生成类型声明；
- Vite Inspect；
- 构建体积可视化；
- 项目自定义构建信息插件。

## 开发注意事项

- 前端和服务端共享类型，但浏览器不能替代服务端校验。
- `server-dist/` 不是 Web 静态资源目录；Web 与服务端目前是两套独立构建。
- 当前代码未读取前端环境变量，API 基础路径固定为同源 `/api`。
- 前端允许的模式集合比服务端 Schema 更窄，修改业务模式时应同步检查 UI 类型、输入组件和服务端规则。
- 日期时间字符串不携带时区；页面当前时间工具按 UTC 生成，应在产品需求改变时统一调整前后端说明和转换逻辑。
