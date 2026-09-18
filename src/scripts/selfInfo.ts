import { selfInfo } from '@/config';

export const selfInfoData = selfInfo;
export const qslReceivedAddress = `${selfInfoData.address.postalCode} ${selfInfoData.address.address} ${selfInfoData.address.recipientName}`;
