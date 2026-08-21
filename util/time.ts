import { Temporal } from '@js-temporal/polyfill';
export { Temporal } from '@js-temporal/polyfill';

const TIME_TAG_RE = /^(\d{4})-(\d{2})-(\d{2})(?:\s(\d{2}):(\d{2}))?$/;

export function getLocalTimeZoneOffsetHours(): number {
  return -new Date().getTimezoneOffset() / 60;
}

export function timeTagStringToPlainDateTime(timeTag: string): Temporal.PlainDateTime {
  const match = TIME_TAG_RE.exec(timeTag);
  if (!match) {
    throw new Error(`Invalid TimeTagString: ${timeTag}`);
  }

  const [, y, m, d, hh = '00', mm = '00'] = match;

  return Temporal.PlainDateTime.from({
    year: Number(y),
    month: Number(m),
    day: Number(d),
    hour: Number(hh),
    minute: Number(mm),
  });
}

export function plainDateTimeToTimeTagString(dt: Temporal.PlainDateTime): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${String(dt.year).padStart(4, '0')}-${pad2(dt.month)}-${pad2(dt.day)} ${pad2(dt.hour)}:${pad2(dt.minute)}`;
}

export function getCurrentTimeTagString(): string {
  const now = Temporal.Now.instant().toZonedDateTimeISO('UTC').toPlainDateTime();
  return plainDateTimeToTimeTagString(now);
}

export function plainDateTimeToDatetimeLocalValue(
  utcDateTime: Temporal.PlainDateTime,
  timeZoneOffsetHours: number = getLocalTimeZoneOffsetHours()
): string {
  const local = utcDateTime.add({ hours: timeZoneOffsetHours });
  const pad2 = (n: number) => String(n).padStart(2, '0');

  return `${String(local.year).padStart(4, '0')}-${pad2(local.month)}-${pad2(local.day)}T${pad2(local.hour)}:${pad2(local.minute)}`;
}

export function datetimeLocalValueToPlainDateTime(
  value: string,
  timeZoneOffsetHours: number = getLocalTimeZoneOffsetHours()
): Temporal.PlainDateTime {
  if (!value) {
    throw new Error('Empty datetime-local value');
  }

  const local = Temporal.PlainDateTime.from(value);
  return local.subtract({ hours: timeZoneOffsetHours });
}
