import type { PageLoad } from './$types';
import { api } from '$lib/ipc';

export const load: PageLoad = async () => {
	try {
		const leaderboards = await api.getLeaderboards();
		return {
			leaderboards
		};
	} catch (error) {
		console.error('[Leaderboards Load Error]:', error);
		return {
			leaderboards: {
				topWatchers: [],
				topReviewers: [],
				topCommenters: []
			}
		};
	}
};
