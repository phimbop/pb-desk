<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';

	let {
		open = $bindable(false),
		onComplete
	}: {
		open: boolean;
		onComplete?: () => void;
	} = $props();

	let loading = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');

	import { idbGet, idbSet } from '$lib/runes/createStore.svelte';

	async function getLocalPlayedList(): Promise<Array<{ movie_id: string; movie_data: Record<string, unknown>; played_at?: string; updated_at?: string }>> {
		if (!browser) return [];
		try {
			const idbData = await idbGet<any[]>('movies', 'playedList');
			if (Array.isArray(idbData) && idbData.length > 0) {
				return idbData.map((item: any) => ({
					movie_id: (item.movie_id || item.id || item._id || item.slug || '').toString(),
					movie_data: item,
					played_at: item.played_at || item.updatedAt || new Date().toISOString(),
					updated_at: item.updated_at || item.updatedAt || new Date().toISOString()
				})).filter(item => item.movie_id);
			}

			const raw = localStorage.getItem('playedList');
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((item: any) => ({
				movie_id: (item.movie_id || item.id || item._id || item.slug || '').toString(),
				movie_data: item,
				played_at: item.played_at || item.updatedAt || new Date().toISOString(),
				updated_at: item.updated_at || item.updatedAt || new Date().toISOString()
			})).filter((item: { movie_id: string }) => item.movie_id);
		} catch {
			return [];
		}
	}

	async function getLocalFavorites(): Promise<Array<{ movie_id: string; movie_data: Record<string, unknown>; added_at?: string }>> {
		if (!browser) return [];
		try {
			const idbData = await idbGet<any[]>('movies', 'myListMovies');
			if (Array.isArray(idbData) && idbData.length > 0) {
				return idbData.map((item: any) => ({
					movie_id: (item.movie_id || item.id || item._id || item.slug || '').toString(),
					movie_data: item,
					added_at: item.added_at || item.createdAt || new Date().toISOString()
				})).filter(item => item.movie_id);
			}

			const raw = localStorage.getItem('myListMovies');
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((item: any) => ({
				movie_id: (item.movie_id || item.id || item._id || item.slug || '').toString(),
				movie_data: item,
				added_at: item.added_at || item.createdAt || new Date().toISOString()
			})).filter((item: { movie_id: string }) => item.movie_id);
		} catch {
			return [];
		}
	}

	async function hasLocalData(): Promise<boolean> {
		if (!browser) return false;
		const idbPlayed = await idbGet<any[]>('movies', 'playedList');
		const idbFavorites = await idbGet<any[]>('movies', 'myListMovies');
		if ((idbPlayed && idbPlayed.length > 0) || (idbFavorites && idbFavorites.length > 0)) {
			return true;
		}
		const played = localStorage.getItem('playedList');
		const favorites = localStorage.getItem('myListMovies');
		return !!(played || favorites);
	}

	async function handleMigrate() {
		loading = true;
		status = 'idle';

		try {
			const playedList = await getLocalPlayedList();
			const favorites = await getLocalFavorites();

			const payload = {
				played_list: playedList,
				favorites: favorites
			};

			const res = await fetch('/api/auth/migrate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				status = 'error';
				return;
			}

			// Success: clear local data
			await idbSet('movies', 'playedList', []);
			await idbSet('movies', 'myListMovies', []);
			localStorage.removeItem('playedList');
			localStorage.removeItem('myListMovies');
			localStorage.setItem('migration_completed', 'true');
			status = 'success';

			// Auto-close after brief delay
			setTimeout(() => {
				open = false;
				onComplete?.();
			}, 1500);
		} catch {
			status = 'error';
		} finally {
			loading = false;
		}
	}

	async function handleSkip() {
		// User chose to start fresh — mark migration as done, clear local data
		if (browser) {
			await idbSet('movies', 'playedList', []);
			await idbSet('movies', 'myListMovies', []);
			localStorage.removeItem('playedList');
			localStorage.removeItem('myListMovies');
			localStorage.setItem('migration_completed', 'true');
		}
		open = false;
		onComplete?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleSkip();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleSkip();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="migration-title"
		tabindex="-1"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="w-full max-w-md mx-4 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6">
			{#if status === 'success'}
				<div class="text-center py-4">
					<svg class="w-12 h-12 mx-auto text-green-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-green-400 font-medium">{m.auth_migration_success()}</p>
				</div>
			{:else if status === 'error'}
				<div class="text-center py-4">
					<svg class="w-12 h-12 mx-auto text-red-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<p class="text-red-400 font-medium mb-4">{m.auth_migration_error()}</p>
					<button
						onclick={handleSkip}
						class="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
					>
						OK
					</button>
				</div>
			{:else}
				<h2 id="migration-title" class="text-lg font-semibold text-white mb-4">
					{m.auth_migration_prompt()}
				</h2>

				<div class="flex flex-col gap-3">
					<button
						onclick={handleMigrate}
						disabled={loading}
						class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
					>
						{#if loading}
							<span class="inline-flex items-center justify-center gap-2">
								<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								{m.auth_migration_yes()}
							</span>
						{:else}
							{m.auth_migration_yes()}
						{/if}
					</button>

					<button
						onclick={handleSkip}
						disabled={loading}
						class="w-full py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 disabled:cursor-not-allowed text-neutral-300 hover:text-white font-medium rounded-lg transition-colors"
					>
						{m.auth_migration_no()}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
