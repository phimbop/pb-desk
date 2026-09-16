<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/ipc';
	import type { WatchHistory } from '$lib/types';
	import CardHistory from '$lib/Components/Card/CardHistory.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';

	let historyList = $state<WatchHistory[]>([]);
	let loading = $state(true);

	const loadHistory = async () => {
		loading = true;
		try {
			const res = await api.getWatchHistory(50);
			historyList = res;
		} catch (err) {
			console.error('Failed to load history:', err);
		} finally {
			loading = false;
		}
	};

	const clearAllHistory = async () => {
		if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?')) {
			try {
				await api.clearWatchHistory();
				historyList = [];
			} catch (err) {
				console.error('Failed to clear history:', err);
			}
		}
	};

	onMount(() => {
		loadHistory();
	});
</script>

<div class="space-y-6">
	<div class="border-b border-slate-800/80 pb-4 flex items-center justify-between">
		<div>
			<h1 class="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
				<span class="w-3 h-7 rounded-full bg-neonPink-500 inline-block"></span>
				<span>Lịch Sử Xem Phim</span>
			</h1>
			<p class="text-xs sm:text-sm text-slate-400 mt-1">
				Xem tiếp các tập phim bạn đang theo dõi dở dang
			</p>
		</div>

		{#if historyList.length > 0}
			<button
				onclick={clearAllHistory}
				class="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all"
			>
				Xóa toàn bộ
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="w-full min-h-[50vh] relative flex items-center justify-center">
			<LoadingSubBlur />
		</div>
	{:else if historyList.length === 0}
		<div class="w-full py-20 flex flex-col items-center justify-center space-y-3 text-center">
			<div class="w-16 h-16 rounded-full bg-neutral-900 border border-slate-800 flex items-center justify-center text-slate-500">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<polyline points="12 6 12 12 16 14"/>
				</svg>
			</div>
			<h3 class="text-base font-bold text-slate-300">Chưa có lịch sử xem phim</h3>
			<p class="text-xs text-slate-500 max-w-sm">
				Tiến trình xem phim sẽ tự động lưu lại đây để bạn có thể tiếp tục xem bất cứ lúc nào.
			</p>
			<a
				href="/"
				class="mt-2 px-5 py-2.5 rounded-xl bg-neonPink-500 hover:bg-neonPink-600 text-white font-bold text-xs shadow-lg transition-all"
			>
				Khám phá phim ngay
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
			{#each historyList as hist (hist.movie_slug)}
				<CardHistory
					history={hist}
					onRemove={(slug) => {
						historyList = historyList.filter((x) => x.movie_slug !== slug);
					}}
				/>
			{/each}
		</div>
	{/if}
</div>
