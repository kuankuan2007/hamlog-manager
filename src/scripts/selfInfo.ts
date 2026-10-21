import { selfInfo } from '@/config';

export const selfInfoData = selfInfo;
export const qslReceivedAddress = `${selfInfoData.address.postalCode} ${selfInfoData.address.address} ${selfInfoData.callsign} ${selfInfoData.address.recipientName} 收`;

export function formatUpdatedBy(updatedBy: string | undefined): string | undefined {
	if (!updatedBy) return undefined;
	return updatedBy.toUpperCase() === selfInfoData.callsign.toUpperCase() ? '<YOU>' : updatedBy;
}
