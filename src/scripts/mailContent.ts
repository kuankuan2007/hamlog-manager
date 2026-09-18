import type { QSLReceive, QSLSend } from '@schema/qsl';
import { qslReceivedAddress, selfInfoData } from './selfInfo';
export function formatEmailContent(callsign: string, content: string): string {
  return `友台${callsign}你好

这里是${selfInfoData.callsign}

${content}

VY 73！
`;
}

export type QSLReceivedConfirmMailContent = {
  callsign: string;
  qslReceivedDate: string;
  qslSendDate?: string;
};

export function createQSLReceivedConfirmMailContent(data: QSLReceivedConfirmMailContent) {
  return formatEmailContent(
    data.callsign,
    `您寄送的QSL卡片已于${data.qslReceivedDate}日收到，${data.qslSendDate ? `您的卡片也已于${data.qslSendDate}日寄出，请注意查收。` : ''}非常荣幸与您换卡`
  );
}

export type QSLSentMailContent = {
  callsign: string;
  qslSentDate: string;
  trackingNumber?: string;
};

export function createQSLSentMailContent(data: QSLSentMailContent) {
  return formatEmailContent(
    data.callsign,
    `给您的QSL卡片已于${data.qslSentDate}日寄出，${data.trackingNumber ? `快递单号为${data.trackingNumber}，` : ''}请注意查收。`
  );
}

export type QSOConfirmMailContent = {
  callsign: string;
  time: string;
  frequency: number;
  mode: string;
  rst: {
    rx: number;
    tx: number;
  };
  address?: string;
  qslSend?: QSLSend | null;
  qslReceive?: QSLReceive | null;
};

function createQslSendSection(qslSend: QSOConfirmMailContent['qslSend'], address?: string): string {
  if (!qslSend) {
    return address
      ? `我会将QSL卡片寄送到以下地址，如有变更，请在回信中注明：\n${address}`
      : '我暂未获得您的地址，如需QSL卡片，请在回信中注明您的地址。';
  }
  if (qslSend.status === 'returned' || qslSend.status === 'not_received') {
    const situation = qslSend.status === 'returned' ? '已被退回' : '经确认未被收到';
    return `我于${qslSend.sentAt}寄出的QSL卡片${situation}，请确认收件信息是否有误，以及是否需要重新寄送。`;
  }
  if (qslSend.status === 'received') {
    return qslSend.confirmedAt
      ? `我于${qslSend.sentAt}寄出的QSL卡片已于${qslSend.confirmedAt}日确认签收。`
      : `我于${qslSend.sentAt}寄出的QSL卡片已确认签收。`;
  }
  return `我已于${qslSend.sentAt}寄出QSL卡片，请确认是否收到。`;
}

function createQslReceiveSection(qslReceive: QSOConfirmMailContent['qslReceive']): string {
  return qslReceive
    ? `您的QSL卡片已于${qslReceive.receivedAt}日收妥。`
    : `我的QSL收件地址为：${qslReceivedAddress}`;
}

export function createQSOConfirmMailContent(data: QSOConfirmMailContent) {
  return formatEmailContent(
    data.callsign,
    `有如下QSO信息与您确认：
时间：${data.time}
频率：${data.frequency}MHz
模式：${data.mode}
信号报告：收 ${data.rst.rx} 发 ${data.rst.tx}

${createQslSendSection(data.qslSend, data.address)}

${createQslReceiveSection(data.qslReceive)}

非常荣幸与您通联！`
  );
}
