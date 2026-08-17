import { Router, Statue } from '@kuankuan/k-server';
import {
	formatCreateAddressInputErrors,
	validateCreateAddressRequest,
} from '../../schema';
import type { CreateAddressInput, CreateAddressRequest } from '../../../schema/address';
import { upsertAddress } from '@server/database/update';

function getToday(): string {
	const today = new Date();
	return [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, '0'),
		String(today.getDate()).padStart(2, '0'),
	].join('-');
}

export const newAddressRouter = new Router({
	matcher: 'new-address',
	name: 'new-address',
	onRootMatch: async (req, res, ctx) => {
		if (req.method !== 'POST') {
			ctx.statue = Statue.METHOD_NOT_ALLOWED;
			return;
		}
		const request = (await req.json()) as CreateAddressRequest;
		if (!validateCreateAddressRequest(request)) {
			ctx.statue = new Statue(
				10001,
				formatCreateAddressInputErrors(validateCreateAddressRequest.errors),
				false
			);
			return;
		}
		const input: CreateAddressInput = {
			...request,
			updatedAt: request.updatedAt ?? getToday(),
		};
		await upsertAddress(input);
		ctx.statue = new Statue(200, 'Done', true);
	},
});
