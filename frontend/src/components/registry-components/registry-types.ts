// src/types/index.ts

export interface Key {
	uk_id: string;
	signing_pub: string;
	encryption_pub: string;
	// Note: valid_from and valid_till are removed as per the new data structure
}

export interface Uri {
	id: string;
	uri: string;
}

export interface Location {
	id: string;
	city: string[];
	country: string[];
}

export interface Mapping {
	id: string;
	domain: string;
	type: string;
	uri: string;
	// location_id: string;
	location_country: string;
	location_city: string[];
}

export interface SubscriberData {
	keys: Key[];
	mappings: Mapping[];
	// uris: Uri[];
	// locations: Location[];
}
