export interface CreateCommunicationLogInput {
	time: string;
	callsign: string;
	frequency: number;
	mode: string;
	rxReport: number;
	txReport: number;
	summary?: string;
}

export const dateTimePattern = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
export const DateTimeFormatName = 'hamlog-date-time';

export function isLeapYear(year: number): boolean {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
	if (month === 2) return isLeapYear(year) ? 29 : 28;
	return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidDateTime(value: string): boolean {
	const match = dateTimePattern.exec(value);
	if (match === null) return false;

	const [, yearText, monthText, dayText, hourText, minuteText] = match;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const hour = Number(hourText);
	const minute = Number(minuteText);

	return day <= getDaysInMonth(year, month)
		&& hour <= 23
		&& minute <= 59;
}

export const DateTimeSchema = {
	type: 'string',
	pattern: dateTimePattern.source,
	format: DateTimeFormatName,
};

export const CreateCommunicationLogInputSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		time: DateTimeSchema,
		callsign: { type: 'string', minLength: 1 },
		frequency: { type: 'number' },
		mode: { type: 'string', minLength: 1 },
		rxReport: { type: 'integer' },
		txReport: { type: 'integer' },
		summary: { type: 'string' },
	},
	required: ['time', 'callsign', 'frequency', 'mode', 'rxReport', 'txReport'],
};
