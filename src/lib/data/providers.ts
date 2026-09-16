export interface NetworkProviderItem {
	provider_id: number;
	provider_name: string;
	country: string;
	logo_path: string;
	slug?: string;
}

export const networkProviders: NetworkProviderItem[] = [
	{
		provider_id: 8,
		provider_name: 'Netflix',
		country: 'US',
		logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
		slug: 'netflix'
	},
	{
		provider_id: 9,
		provider_name: 'Amazon Prime Video',
		country: 'US',
		logo_path: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
		slug: 'amazon-prime'
	},
	{
		provider_id: 337,
		provider_name: 'Disney Plus',
		country: 'US',
		logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg',
		slug: 'disney-plus'
	},
	{
		provider_id: 2,
		provider_name: 'Apple TV',
		country: 'US',
		logo_path: '/9ghgSC0MA082EL6HLCW3GalykFD.jpg',
		slug: 'apple-tv'
	},
	{
		provider_id: 1899,
		provider_name: 'HBO Max',
		country: 'US',
		logo_path: '/jbe4gVSfRlbPTdESXhEKpornsfu.jpg',
		slug: 'hbo-max'
	},
	{
		provider_id: 38,
		provider_name: 'BBC iPlayer',
		country: 'GB',
		logo_path: '/nc8Tpsr8SqCbsTUogPDD06gGzB3.jpg',
		slug: 'bbc-iplayer'
	},
	{
		provider_id: 130,
		provider_name: 'Sky Store',
		country: 'IE',
		logo_path: '/6AKbY2ayaEuH4zKg2prqoVQ9iaY.jpg',
		slug: 'sky-store'
	},
	{
		provider_id: 234,
		provider_name: 'Arte',
		country: 'FR',
		logo_path: '/vPZrjHe7wvALuwJEXT2kwYLi0gV.jpg',
		slug: 'arte'
	},
	{
		provider_id: 537,
		provider_name: 'ZDF',
		country: 'DE',
		logo_path: '/tDnDBkSLLLQgFb03J9ttQhZQxZs.jpg',
		slug: 'zdf'
	},
	{
		provider_id: 1773,
		provider_name: 'SkyShowtime',
		country: 'PL',
		logo_path: '/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg',
		slug: 'skyshowtime'
	},
	{
		provider_id: 122,
		provider_name: 'Hotstar',
		country: 'TH',
		logo_path: '/5B0WB5ohGxRtON8qCuCkGgGCO18.jpg',
		slug: 'hotstar'
	},
	{
		provider_id: 84,
		provider_name: 'U-NEXT',
		country: 'JP',
		logo_path: '/a5T7vNaGvoeckYO6rQkHolvyYf4.jpg',
		slug: 'u-next'
	},
	{
		provider_id: 158,
		provider_name: 'Viu',
		country: 'ID',
		logo_path: '/o7WsYI2r1llIf9h6JTGVX9yTHPx.jpg',
		slug: 'viu'
	},
	{
		provider_id: 581,
		provider_name: 'iQIYI',
		country: 'HK',
		logo_path: '/c4eVkfMna2VzHzZ8N2vWXUnMrlD.jpg',
		slug: 'iqiyi'
	},
	{
		provider_id: 623,
		provider_name: 'WeTV',
		country: 'HK',
		logo_path: '/r3tmJFjecQGAfHjWOafhr1pux6b.jpg',
		slug: 'wetv'
	},
	{
		provider_id: 232,
		provider_name: 'ZEE5',
		country: 'IN',
		logo_path: '/h9Gf7Cq8zR4qC84nQ2W21nL9NqD.jpg',
		slug: 'zee5'
	}
];
