export interface Address {
	callsign: string;
	postalCode: string;
	address: string;
	recipientName?: string;
	updatedAt: string;
}

export interface CreateAddressInput {
	callsign: string;
	postalCode: string;
	address: string;
	recipientName?: string;
	updatedAt: string;
}

export interface CreateAddressRequest extends Omit<CreateAddressInput, 'updatedAt'> {
	updatedAt?: string;
}

export const CreateAddressInputSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		callsign: { type: 'string', minLength: 1 },
		postalCode: { type: 'string', minLength: 1 },
		address: { type: 'string', minLength: 1 },
		recipientName: { type: 'string', minLength: 1 },
		updatedAt: { type: 'string', minLength: 1 },
	},
	required: ['callsign', 'postalCode', 'address', 'updatedAt'],
};

export const CreateAddressRequestSchema = {
	...CreateAddressInputSchema,
	required: ['callsign', 'postalCode', 'address'],
};
