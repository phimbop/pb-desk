import { page } from '$app/state';
import { browser } from '$app/environment';

const DB_NAME = 'phimbop_local';
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (!browser) {
			reject(new Error('IndexedDB is only available in the browser'));
			return;
		}
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			const stores = ['kkPhim', 'tmdb', 'movies'];
			stores.forEach((store) => {
				if (!db.objectStoreNames.contains(store)) {
					db.createObjectStore(store);
				}
			});
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export function idbGet<T>(storeName: string, key: string): Promise<T | null> {
	return new Promise(async (resolve, reject) => {
		if (!browser) {
			resolve(null);
			return;
		}
		try {
			const db = await getDb();
			const transaction = db.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);
			const request = store.get(key);
			request.onsuccess = () => resolve(request.result !== undefined ? request.result : null);
			request.onerror = () => reject(request.error);
		} catch (err) {
			reject(err);
		}
	});
}

export function idbSet<T>(storeName: string, key: string, value: T): Promise<void> {
	return new Promise(async (resolve, reject) => {
		if (!browser) {
			resolve();
			return;
		}
		try {
			// Svelte 5 reactive proxies cannot be cloned by IndexedDB.
			// $state.snapshot strips proxies and retrieves the raw plain JS object/array.
			const rawValue = $state.snapshot(value);
			const db = await getDb();
			const transaction = db.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.put(rawValue, key);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		} catch (err) {
			reject(err);
		}
	});
}

// Optimized useLocalStorage (without CryptoJS)
export const useLocalStorage = <T>(key: string, value: T) => {
	let storage = $state<{ value: T }>({ value });
	if (browser) {
		const item = localStorage.getItem(key);
		if (item) {
			try {
				storage.value = JSON.parse(item);
			} catch (e) {
				console.error('[LocalStorage Error]', e);
				localStorage.setItem(key, JSON.stringify(storage.value));
			}
		} else {
			localStorage.setItem(key, JSON.stringify(storage.value));
		}
	}
	return {
		get value() {
			return storage.value;
		},
		set value(newValue: T) {
			storage.value = newValue;
			if (browser) {
				localStorage.setItem(key, JSON.stringify(storage.value));
			}
		}
	};
};

const parseTime = (dateStr: any) => {
	if (!dateStr) return 0;
	const t = new Date(dateStr).getTime();
	return isNaN(t) ? 0 : t;
};

const mergePlayedLists = (local: any[], server: any[]) => {
	const map = new Map<string, any>();
	for (const item of server) {
		const key = item?._id || item?.id || item?.slug;
		if (key) map.set(key, item);
	}
	for (const item of local) {
		const key = item?._id || item?.id || item?.slug;
		if (!key) continue;
		const existing = map.get(key);
		if (!existing) {
			map.set(key, item);
		} else {
			const localTime = parseTime(item.updatedAt);
			const serverTime = parseTime(existing.updatedAt);
			if (localTime > serverTime) {
				map.set(key, item);
			} else if (localTime === serverTime) {
				if ((item.playedTime || 0) > (existing.playedTime || 0)) {
					map.set(key, item);
				}
			}
		}
	}
	const merged = Array.from(map.values());
	return merged;
};

const mergeFavoritesLists = (local: any[], server: any[]) => {
	const map = new Map<string, any>();
	for (const item of server) {
		const key = item?._id || item?.id || item?.slug;
		if (key) map.set(key, item);
	}
	for (const item of local) {
		const key = item?._id || item?.id || item?.slug;
		if (key && !map.has(key)) {
			map.set(key, item);
		}
	}
	return Array.from(map.values());
};

const getPlayedListMigrationPayload = (local: any[], server: any[]) => {
	const serverMap = new Map<string, any>();
	for (const s of server) {
		const key = s?._id || s?.id || s?.slug;
		if (key) serverMap.set(key, s);
	}

	const toMigrate: any[] = [];
	for (const l of local) {
		const key = l?._id || l?.id || l?.slug;
		if (!key) continue;
		const s = serverMap.get(key);
		if (!s) {
			toMigrate.push({
				movie_id: key.toString(),
				movie_data: l,
				played_at: l.played_at || l.updatedAt || new Date().toISOString(),
				updated_at: l.updated_at || l.updatedAt || new Date().toISOString()
			});
		} else {
			const localTime = parseTime(l.updatedAt);
			const serverTime = parseTime(s.updatedAt);
			if (localTime > serverTime) {
				toMigrate.push({
					movie_id: key.toString(),
					movie_data: l,
					played_at: l.played_at || l.updatedAt || new Date().toISOString(),
					updated_at: l.updated_at || l.updatedAt || new Date().toISOString()
				});
			}
		}
	}
	return toMigrate;
};

const getFavoritesMigrationPayload = (local: any[], server: any[]) => {
	const serverMap = new Map<string, any>();
	for (const s of server) {
		const key = s?._id || s?.id || s?.slug;
		if (key) serverMap.set(key, s);
	}

	const toMigrate: any[] = [];
	for (const l of local) {
		const key = l?._id || l?.id || l?.slug;
		if (!key) continue;
		if (!serverMap.has(key)) {
			toMigrate.push({
				movie_id: key.toString(),
				movie_data: l,
				added_at: l.added_at || l.createdAt || new Date().toISOString()
			});
		}
	}
	return toMigrate;
};

// Drop-in IndexedDB replacement for useSurrealDB
export const useSurrealDB = <T>(table: string, id: string, initialValue: T) => {
	const state = $state({
		value: initialValue,
		state: 'load' as 'load' | 'ready',
		error: null as string | null
	});

	const loadFromDB = async () => {
		if (!browser) {
			state.state = 'ready';
			return;
		}
		try {
			// If user is logged in, fetch from SurrealDB server database
			const user = page.data?.user;
			if (user) {
				let syncUrl = '';
				if (table === 'movies' && id === 'playedList') {
					syncUrl = '/api/user/played-list';
				} else if (table === 'movies' && id === 'myListMovies') {
					syncUrl = '/api/user/favorites';
				}

				if (syncUrl) {
					try {
						const res = await fetch(syncUrl);
						if (res.ok) {
							const serverData = await res.json();
							const localData = (await idbGet<any[]>(table, id)) || [];
							
							let mergedData = serverData;
							let toMigrate: any[] = [];

							if (id === 'playedList') {
								mergedData = mergePlayedLists(localData, serverData);
								toMigrate = getPlayedListMigrationPayload(localData, serverData);
							} else if (id === 'myListMovies') {
								mergedData = mergeFavoritesLists(localData, serverData);
								toMigrate = getFavoritesMigrationPayload(localData, serverData);
							}

							state.value = mergedData as unknown as T;
							await idbSet<T>(table, id, mergedData as unknown as T);
							state.state = 'ready';

							if (toMigrate.length > 0) {
								const payload = id === 'playedList'
									? { played_list: toMigrate }
									: { favorites: toMigrate };

								fetch('/api/auth/migrate', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify(payload)
								}).catch((err) => console.error(`Auto migration for ${id} failed:`, err));
							}
							return;
						} else {
							console.warn(`[useSurrealDB] Fetch ${syncUrl} failed with status:`, res.status);
						}
					} catch (syncErr) {
						console.error(`Error syncing ${id} from server:`, syncErr);
					}
				}
			}

			// Guest fallback or server fetch fail
			const data = await idbGet<T>(table, id);
			if (data !== null) {
				state.value = data;
			}
		} catch (error) {
			console.error(`[useSurrealDB] loadFromDB table=${table} id=${id} failed:`, error);
			state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			state.state = 'ready';
		}
	};

	let saving = $state(false);
	const saveToDB = async (newValue: T) => {
		if (!browser) return;
		if (saving) {
			return;
		}
		saving = true;
		try {
			await idbSet<T>(table, id, newValue);
		} catch (error) {
			console.error(`[useSurrealDB] saveToDB table=${table} id=${id} failed:`, error);
			state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			saving = false;
			state.state = 'ready';
		}
	};

	if (browser) {
		loadFromDB();
	}

	return {
		get value() {
			return state.value;
		},
		set value(newValue: T) {
			state.value = newValue;
			saveToDB(newValue);
		},
		get state() {
			return state.state;
		},
		get isSaving() {
			return saving;
		},
		get error() {
			return state.error;
		},
		load: loadFromDB
	};
};
