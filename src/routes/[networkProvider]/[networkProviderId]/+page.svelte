<script lang="ts">
	import { page } from '$app/state';
	import { tmdbService, DOMAIN_TMDB_IMAGE } from '$lib/services/tmdbService';
	import { networkProviders } from '$lib/data/providers';
	import Pagination from '$lib/Components/Pagination.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';

	let providerSlug = $derived(page.params.networkProvider as string);
	let providerId = $derived(page.params.networkProviderId as string);

	let currentProvider = $derived(
		networkProviders.find(
			(p) =>
				p.provider_id.toString() === providerId ||
				p.slug === providerSlug ||
				p.provider_name.toLowerCase().includes(providerSlug.toLowerCase())
		) || {
			provider_id: Number(providerId) || 8,
			provider_name: providerSlug.replace(/-/g, ' ').toUpperCase(),
			country: 'US',
			logo_path: '',
			slug: providerSlug
		}
	);

	let activeTab = $state<'movie' | 'tv'>('movie');
	let movies = $state<any[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const loadMovies = async (p = 1) => {
		loading = true;
		error = null;
		currentPage = p;
		try {
			const res = await tmdbService.getMoviesByNetwork(
				activeTab,
				currentProvider.provider_id,
				p
			);
			movies = res.results || [];
			totalPages = Math.min(res.total_pages || 1, 500);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err: any) {
			console.error('Failed to load network movies:', err);
			error = err?.message || 'Không thể tải danh sách phim từ nhà cung cấp.';
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		if (providerId || activeTab) {
			loadMovies(1);
		}
	});
</script>

<div class="space-y-8">
	<!-- Network Provider Banner & Tabs -->
	<section class="p-6 rounded-3xl bg-neutral-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
		<div class="flex items-center space-x-4">
			{#if currentProvider.logo_path}
				<div class="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-neutral-950 p-1 shadow-lg shrink-0">
					<img
						src="{DOMAIN_TMDB_IMAGE}/t/p/original{currentProvider.logo_path}"
						alt={currentProvider.provider_name}
						class="w-full h-full object-contain rounded-xl"
					/>
				</div>
			{/if}
			<div>
				<h1 class="text-2xl sm:text-3xl font-black text-white">
					Kênh {currentProvider.provider_name}
				</h1>
				<p class="text-xs sm:text-sm text-slate-400 mt-0.5">
					Tuyển tập các tác phẩm phát sóng chính thức trên {currentProvider.provider_name}
				</p>
			</div>
		</div>

		<!-- Switch Movie vs Series -->
		<div class="flex items-center p-1 rounded-2xl bg-neutral-950 border border-slate-800 shadow-inner">
			<button
				onclick={() => {
					activeTab = 'movie';
				}}
				class="px-5 py-2 rounded-xl text-xs font-bold transition-all {activeTab === 'movie'
					? 'bg-neonPink-500 text-white shadow-md shadow-neonPink-500/30'
					: 'text-slate-400 hover:text-white'}"
			>
				Phim lẻ
			</button>
			<button
				onclick={() => {
					activeTab = 'tv';
				}}
				class="px-5 py-2 rounded-xl text-xs font-bold transition-all {activeTab === 'tv'
					? 'bg-neonPink-500 text-white shadow-md shadow-neonPink-500/30'
					: 'text-slate-400 hover:text-white'}"
			>
				Phim bộ
			</button>
		</div>
	</section>

	{#if loading && movies.length === 0}
		<div class="w-full min-h-[50vh] relative flex items-center justify-center">
			<LoadingSubBlur />
		</div>
	{:else if error && movies.length === 0}
		<div class="w-full py-16 flex flex-col items-center justify-center space-y-4 text-center">
			<p class="text-rose-400 font-bold">{error}</p>
			<button
				onclick={() => loadMovies(currentPage)}
				class="px-5 py-2 rounded-xl bg-neonPink-500 hover:bg-neonPink-600 text-white font-bold text-xs shadow-lg transition-all"
			>
				Thử lại
			</button>
		</div>
	{:else if movies.length === 0}
		<div class="w-full py-16 text-center text-slate-400">
			<p class="text-base font-semibold">Hiện chưa có dữ liệu phim cho kênh này.</p>
		</div>
	{:else}
		<div class="relative">
			{#if loading}
				<LoadingSubBlur />
			{/if}
			<!-- Movies Grid -->
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
				{#each movies as movie (movie.id)}
					{@const title = movie.title || movie.name || movie.original_title || movie.original_name}
					<a
						href="/tim-kiem/phim?q={encodeURIComponent(title)}"
						class="group flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-md"
					>
						<div class="aspect-[2/3] bg-neutral-950 overflow-hidden relative">
							{#if movie.poster_path}
								<img
									src="{DOMAIN_TMDB_IMAGE}/t/p/w300{movie.poster_path}"
									alt={title}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									loading="lazy"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center p-2 text-center text-xs text-slate-500">
									{title}
								</div>
							{/if}
							{#if movie.vote_average}
								<div class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
									★ {movie.vote_average.toFixed(1)}
								</div>
							{/if}
						</div>
						<div class="p-2.5 space-y-0.5">
							<h3 class="text-xs font-bold text-white group-hover:text-neonPink-400 line-clamp-1" title={title}>
								{title}
							</h3>
							<p class="text-[10px] text-slate-400">
								{movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || ''}
							</p>
						</div>
					</a>
				{/each}
			</div>

			<Pagination
				{currentPage}
				{totalPages}
				onPageChange={loadMovies}
			/>
		</div>
	{/if}

	<!-- Other Channels Quick Bar -->
	<section class="space-y-3 pt-8 border-t border-slate-800/80">
		<h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
			Các kênh truyền hình & nền tảng khác:
		</h3>
		<div class="flex flex-wrap items-center gap-3">
			{#each networkProviders as provider (provider.provider_id)}
				<a
					href="/{provider.slug}/{provider.provider_id}"
					class="flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold {provider.provider_id === currentProvider.provider_id
						? 'bg-neonPink-500/15 border-neonPink-500 text-neonPink-400'
						: 'bg-neutral-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
				>
					<span>{provider.provider_name}</span>
				</a>
			{/each}
		</div>
	</section>
</div>
