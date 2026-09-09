export type QSLReceivedConfirmMailContent = {
  callsign: string;
  qslReceivedDate: string;
  qslSendDate?: string;
}

export function formatEmailContent(callsign: string, content: string): string {
  return `友台${callsign}你好

这里是BH8HKH

${content}

VY 73！
`
}

export function createQSLReceivedConfirmMailContent(data: QSLReceivedConfirmMailContent) {
  return formatEmailContent(data.callsign, `您寄送的QSL卡片已于${data.qslReceivedDate}日收到，${data.qslSendDate ? `您的卡片也已于${data.qslSendDate}日寄出，请注意查收。` : ""}非常荣幸与您换卡`);
}
