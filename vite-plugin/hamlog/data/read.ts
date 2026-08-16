import xlsx from 'xlsx';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function excelSerialToDateUTC(serial: number | string, date1904 = false): Date | null {
  if (serial === null || serial === undefined || serial === '') return null;

  const n = Number(serial);
  if (!Number.isFinite(n)) return null;

  // Excel serial -> Unix ms (UTC基准)
  const base = date1904 ? 24107 : 25569;
  const ms = Math.round((n - base) * 86400 * 1000);
  return new Date(ms);
}

/** UTC: yyyy-mm-dd */
export function excelToYMD_UTC(serial: number | string, date1904 = false): string | null {
  const d = excelSerialToDateUTC(serial, date1904);
  if (!d) return null;

  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
}

/** UTC: yyyy-mm-dd hh:mm */
export function excelToYMDHM_UTC(serial: number | string, date1904 = false): string | null {
  const d = excelSerialToDateUTC(serial, date1904);
  if (!d) return null;

  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());

  return `${y}-${m}-${day} ${hh}:${mm}`;
}

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
export function readExcelFile(filePath: string): LogBook {
  const workbook = xlsx.readFile(filePath);

  const AddressData = xlsx.utils
    .sheet_to_json<Record<string, unknown>>(workbook.Sheets['地址信息'])
    .map(
      (row: Record<string, unknown>) =>
        ({
          callsign: row['对方呼号'],
          postalCode: row['邮编'],
          address: row['地址'],
          recipientName: row['收件人'],
          updatedAt: excelToYMD_UTC(row['更新日期'] as number | string),
        }) as Address
    );

  const QSLReceiveData = xlsx.utils
    .sheet_to_json<Record<string, unknown>>(workbook.Sheets['QSL收件日志'])
    .map(
      (row: Record<string, unknown>) =>
        ({
          callsign: row['对方呼号'],
          receivedAt: excelToYMD_UTC(row['收件日期'] as number | string),
        }) as QSLReceive
    );

  const QSLSendData = xlsx.utils
    .sheet_to_json<Record<string, unknown>>(workbook.Sheets['QSL发件日志'])
    .map(
      (row: Record<string, unknown>) =>
        ({
          callsign: row['对方呼号'],
          sentAt: excelToYMD_UTC(row['发件日期'] as number | string),
        }) as QSLSend
    );

  const CommunicationLogs = xlsx.utils
    .sheet_to_json<Record<string, unknown>>(workbook.Sheets['日志'])
    .map(
      (row: Record<string, unknown>) =>
        ({
          sequenceNumber: row['序号'],
          time: excelToYMDHM_UTC(Number(row['日期']) + Number(row['时间'])),
          callsign: row['对方呼号'],
          frequency: row['通联频率'],
          mode: row['通联模式'],
          rxReport: row['RX RX'],
          txReport: row['RX TX'],
          summary: row['摘要'],
          qslReceived: QSLReceiveData.find((qsl) => qsl.callsign === row['对方呼号']) ?? null,
          qslSent: QSLSendData.find((qsl) => qsl.callsign === row['对方呼号']) ?? null,
          address: AddressData.find((addr) => addr.callsign === row['对方呼号']) ?? null,
        }) as CommunicationLog
    );
  import('fs/promises').then((fs) => {
    fs.writeFile(
      'temp/data.json',
      JSON.stringify(
        {
          communicationLogs: CommunicationLogs,
          addresses: AddressData,
          qslSends: QSLSendData,
          qslReceives: QSLReceiveData,
        },
        null,
        2
      )
    );
  });
  return {
    communicationLogs: CommunicationLogs,
    addresses: AddressData,
    qslSends: QSLSendData,
    qslReceives: QSLReceiveData,
  };
}
