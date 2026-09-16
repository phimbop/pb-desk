<script lang="ts">
	import { onMount } from 'svelte';
	import { tmdbService, DOMAIN_TMDB_IMAGE } from '$lib/services/tmdbService';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';

	let currentPage = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let tvShows = $state<any[]>([]);

	function stringToSlug(str: string): string {
		return str
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[đĐ]/g, 'd')
			.replace(/([^0-9a-z-\s])/g, '')
			.replace(/(\s+)/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	async function loadTvShows(page = 1) {
		loading = true;
		try {
			const res = await tmdbService.getTvPopular(page);
			tvShows = res.results || [];
			currentPage = res.page || page;
			totalPages = Math.min(res.total_pages || 1, 100);
		} catch (err) {
			console.error('Failed to load popular TV shows:', err);
		} finally {
			loading = false;
		}
	}

	function goToPage(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) return;
		loadTvShows(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(() => {
		loadTvShows(1);
	});
</script>

<svelte:head>
	<title>Phim Truyền Hình & TV Shows - Phimbop Desktop</title>
</svelte:head>

<div class="min-h-screen pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pt-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
		<div>
			<h1 class="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2.5">
				<span class="w-2.5 h-7 rounded-full bg-neonPink-500 inline-block"></span>
				<span>Phim Truyền Hình Nổi Bật</span>
			</h1>
			<p class="text-xs sm:text-sm text-slate-400 mt-1">
				Khám phá các TV Series ăn khách toàn cầu từ Netflix, HBO Max, Disney+
			</p>
		</div>
		<div class="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 border border-slate-800 text-slate-400 self-start sm:self-auto">
			Trang {currentPage} / {totalPages}
		</div>
	</div>

	{#if loading && tvShows.length === 0}
		<div class="min-h-[50vh] relative flex items-center justify-center">
			<LoadingSubBlur />
		</div>
	{:else}
		<div class="relative">
			{#if loading}
				<LoadingSubBlur />
			{/if}
			<!-- Grid List -->
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
				{#each tvShows as tv (tv.id)}
					{@const slug = stringToSlug(tv.name || tv.original_name || 'tv')}
					<a
						href="/tv/{slug}/{tv.id}"
						class="group flex flex-col rounded-2xl overflow-hidden bg-neutral-900 border border-slate-800 hover:border-neonPink-500/50 transition-all duration-300 shadow-md hover:shadow-neonPink-500/10 hover:-translate-y-1"
					>
						<div class="aspect-[2/3] bg-neutral-950 overflow-hidden relative">
							{#if tv.poster_path}
								<img
									src="{DOMAIN_TMDB_IMAGE}/t/p/w400{tv.poster_path}"
									alt={tv.name}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									loading="lazy"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center text-slate-600 text-xs">No image</div>
							{/if}

							{#if tv.vote_average}
								<div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md border border-slate-700/50 flex items-center space-x-1 text-[10px] font-bold text-amber-400">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 fill-current" viewBox="0 0 24 24">
										<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
									</svg>
									<span>{tv.vote_average.toFixed(1)}</span>
								</div>
							{/if}

							{#if tv.first_air_date}
								<div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-800">
									{tv.first_air_date.slice(0, 4)}
								</div>
							{/if}
						</div>

						<div class="p-3 space-y-1">
							<h3 class="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-neonPink-400 transition-colors">
								{tv.name}
							</h3>
							<p class="text-[11px] text-slate-400 line-clamp-1">
								{tv.original_name || ''}
							</p>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center space-x-2 pt-6">
					<button
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage <= 1}
						class="px-3 py-1.5 rounded-xl bg-neutral-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-all"
					>
						Trang trước
					</button>

					<span class="text-xs font-semibold text-slate-400 px-3">
						{currentPage} / {totalPages}
					</span>

					<button
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage >= totalPages}
						class="px-3 py-1.5 rounded-xl bg-neutral-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-all"
					>
						Trang tiếp
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
