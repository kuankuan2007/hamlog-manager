export interface CommunicationLog {
  //序号	日期	时间	对方呼号	通联频率	通联模式	RX RX	RX TX	摘要	QSL收	QSL发	收件邮编	收件地址	收件人
  sequenceNumber: number;
  time: string;
  callsign: string;
  frequency: number;
  mode: string;
  rxReport: number;
  txReport: number;
  summary?: string;
  qslReceived: QSLReceive | null;
  qslSent: QSLSend | null;
  address?: Address;
}

export interface Address {
  // 对方呼号	邮编	地址	收件人	更新日期
  callsign: string;
  postalCode: string;
  address: string;
  recipientName?: string;
  updatedAt: string;
}

export interface QSLSend {
  //对方呼号	发件日期
  callsign: string;
  sentAt: string;
}

export interface QSLReceive {
  //对方呼号	收件日期
  callsign: string;
  receivedAt: string;
}
export interface LogBook {
  communicationLogs: CommunicationLog[];
  addresses: Address[];
  qslSends: QSLSend[];
  qslReceives: QSLReceive[];
}
