const showText: Record<string, string> = {
  sequenceNumber: '序号',
  callsign: '呼号',
  communicationCount: '通联次数',
  firstCommunicationAt: '首次通联时间',
  lastCommunicationAt: '最近通联时间',
  address: '地址',
  postalCode: '邮政编码',
  recipientName: '收件人',
  sentAt: '发送时间',
  confirmedAt: '确认时间',
  receivedAt: '接收时间',
  frequency: '频率',
  mode: '模式',
  rxReport: 'RTX RX',
  txReport: 'RTX TX',
  updatedAt: '更新时间',
  summary: '摘要',
  time: '时间',
};

function getShowText(key: string): string {
  return showText[key] ?? key;
}

export default getShowText;
