import { DOMAIN_KKPHIM } from '$lib';

const cache = new Map<number, any>();

export const getKkPhimle1 = async (page: number) => {
	try {
		if (cache.has(page)) {
			return cache.get(page);
		}
		const result = await fetch(`${DOMAIN_KKPHIM}/v1/api/danh-sach/phim-le?page=${page}&limit=20`);
		const freshData = await result.json();
		cache.set(page, freshData);
		return freshData;
	} catch (error) {
		console.error(error);
		return null;
	}
};