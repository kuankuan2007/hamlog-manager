import { Router, Statue } from '@kuankuan/k-server';
import {
	formatDateInputErrors,
	validateConfirmQSLSendInput,
	validateCreateQSLReceiveInput,
	validateCreateQSLSendInput,
} from '../../schema';
import type {
	ConfirmQSLSendInput,
	CreateQSLReceiveInput,
	CreateQSLSendInput,
} from '../../../schema/communicationLog';
import {
	confirmLatestQSLSend,
	insertQSLReceive,
	insertQSLSend,
	QSLSendNotFoundError,
} from '@server/database/update';
import { doneStatue, invalidInputStatue, qslSendNotFoundStatue } from '../status';

function invalidDateInputStatue(
	errors: Parameters<typeof formatDateInputErrors>[0],
	fieldName: string
): Statue {
	return invalidInputStatue(formatDateInputErrors(errors, fieldName));
}

export const newQSLSendRouter = new Router({
	matcher: 'new-qsl-send',
	name: 'new-qsl-send',
	onRootMatch: async (req, _res, ctx) => {
		if (req.method !== 'POST') {
			ctx.statue = Statue.METHOD_NOT_ALLOWED;
			return;
		}
		const input = (await req.json()) as CreateQSLSendInput;
		if (!validateCreateQSLSendInput(input)) {
			ctx.statue = invalidDateInputStatue(validateCreateQSLSendInput.errors, 'sentAt');
			return;
		}
		await insertQSLSend(input);
		ctx.statue = doneStatue();
	},
});

export const newQSLReceiveRouter = new Router({
	matcher: 'new-qsl-receive',
	name: 'new-qsl-receive',
	onRootMatch: async (req, _res, ctx) => {
		if (req.method !== 'POST') {
			ctx.statue = Statue.METHOD_NOT_ALLOWED;
			return;
		}
		const input = (await req.json()) as CreateQSLReceiveInput;
		if (!validateCreateQSLReceiveInput(input)) {
			ctx.statue = invalidDateInputStatue(validateCreateQSLReceiveInput.errors, 'receivedAt');
			return;
		}
		await insertQSLReceive(input);
		ctx.statue = doneStatue();
	},
});

export const confirmQSLSendRouter = new Router({
	matcher: 'confirm-qsl-send',
	name: 'confirm-qsl-send',
	onRootMatch: async (req, _res, ctx) => {
		if (req.method !== 'POST') {
			ctx.statue = Statue.METHOD_NOT_ALLOWED;
			return;
		}
		const input = (await req.json()) as ConfirmQSLSendInput;
		if (!validateConfirmQSLSendInput(input)) {
			ctx.statue = invalidDateInputStatue(validateConfirmQSLSendInput.errors, 'confirmedAt');
			return;
		}
		try {
			await confirmLatestQSLSend(input);
			ctx.statue = doneStatue();
		} catch (error) {
			if (error instanceof QSLSendNotFoundError) {
				ctx.statue = qslSendNotFoundStatue(error.message);
				return;
			}
			throw error;
		}
	},
});
