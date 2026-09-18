// 配置模版：复制本文件为 config/values.ts 后填写实际值。
// config/values.ts 包含敏感信息，已被 .gitignore 排除，不要提交到版本控制。
// 各字段的类型约束定义在 config/index.ts；字段缺失或类型错误时 pnpm type-check 会报错。

import type { SelfInfoConfig, SmtpConfig } from './index';

// 本人信息：用于地址打印、邮件正文与页脚，以及 <> 包裹特殊呼号的邮箱映射。
export const selfInfo: SelfInfoConfig = {
  // QSL 收件地址，用于邮件内容和前端地址打印
  address: {
    postalCode: '000000',
    address: '省市区街道及门牌号',
    recipientName: '收件人姓名',
  },
  // 本人呼号，用于邮件模板落款，前端地址打印等
  callsign: 'BG0AAA',
  // 本人常用邮箱
  email: 'you@example.com',
  // 可选：<> 包裹特殊呼号到邮箱的映射，键不区分大小写。
  // 正向：查询 <SELF> 返回对应邮箱；反向：查询对应邮箱返回 <SELF>。
  // 此类查询不访问缓存表和 QRZ.com，响应 comeFrom 为 config。
  // 发送邮件页默认抄送 <CC_SELF>，用于接收所有自动邮件的抄送副本。
  emailAddresses: {
    SELF: 'you@example.com',
    CC_SELF: 'cc@example.com',
  },
};

// QRZ.com 登录 Cookie：实时抓取呼号邮箱时使用。
// 在浏览器登录 qrz.com 后，从开发者工具网络面板复制请求的完整 Cookie 值。
// 仅使用缓存查询时可留空字符串。
export const qrzCookie: string = '';

// SMTP 发信配置：host 和 port 必须显式填写，程序不会自行推断。
export const email: SmtpConfig = {
  // SMTP 登录账号
  email: 'you@example.com',
  // SMTP 密码或授权码（QQ、163 等邮箱需使用授权码而非登录密码）
  password: 'your-smtp-password',
  // SMTP 服务器地址
  host: 'smtp.example.com',
  // 端口；缺省时 465 按加密连接处理
  port: 465,
  // 可选：是否使用 TLS；缺省时端口为 465 视为 true
  // secure: true,
  // 可选：发件人地址；缺省使用上面的 email 账号
  // from: 'you@example.com',
};
