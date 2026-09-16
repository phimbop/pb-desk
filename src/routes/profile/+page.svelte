<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { fade } from 'svelte/transition';
	import { getUserRole } from '$lib/utils/rank';
	import type { AuthUser, WatchStats } from '$lib/types';

	let { data } = $props<{
		data: {
			user: AuthUser;
			stats: WatchStats;
		};
	}>();
	let userRole = $derived(getUserRole(data.stats.totalHours));

	let memberSince = $derived(
		new Date(data.user.created_at || data.user.createdAt || Date.now()).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	let initial = $derived(data.user.username?.charAt(0)?.toUpperCase() ?? '?');

	function translateGenre(name: string) {
		const lower = name.toLowerCase();
		if (lower === 'single') return m.footer_movies();
		if (lower === 'series') return m.reuse_series();
		if (lower === 'hoathinh') return m.reuse_animation();
		
		const genreMap: Record<string, string> = {
			'hành động': m.kkMovieGenres_action(),
			'tình cảm': m.kkMovieGenres_romance(),
			'hài hước': m.kkMovieGenres_comedy(),
			'cổ trang': m.kkMovieGenres_period(),
			'tâm lý': m.kkMovieGenres_psychological(),
			'hình sự': m.kkMovieGenres_crime(),
			'chiến tranh': m.kkMovieGenres_war(),
			'thể thao': m.kkMovieGenres_sport(),
			'võ thuật': m.kkMovieGenres_martialArts(),
			'viễn tưởng': m.kkMovieGenres_scifi(),
			'phiêu lưu': m.kkMovieGenres_adventure(),
			'khoa học': m.kkMovieGenres_science(),
			'kinh dị': m.kkMovieGenres_horror(),
			'âm nhạc': m.kkMovieGenres_music(),
			'thần thoại': m.kkMovieGenres_mythology(),
			'tài liệu': m.kkMovieGenres_documentary(),
			'gia đình': m.kkMovieGenres_family(),
			'chính kịch': m.kkMovieGenres_drama(),
			'bí ẩn': m.kkMovieGenres_mystery(),
			'học đường': m.kkMovieGenres_school(),
			'kinh diển': m.kkMovieGenres_classic(),
			'kinh điển': m.kkMovieGenres_classic(),
			'phim 18+': m.kkMovieGenres_adult(),
			'18+': m.kkMovieGenres_adult()
		};

		const cleanName = name.trim().toLowerCase();
		if (genreMap[cleanName]) {
			return genreMap[cleanName];
		}
		
		return name;
	}
</script>

<svelte:head>
	<title>{m.profile_title()} | BOP</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section in:fade={{ duration: 250 }} class="w-full mt-24 mb-16 px-4 md:px-8">
	<div class="max-w-3xl mx-auto space-y-8">
		
		<!-- Profile Hero Banner Card -->
		<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
			<!-- Decorative Background Gradients -->
			<div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-neonPink-500/10 blur-3xl pointer-events-none"></div>
			<div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-neonPink-600/5 blur-3xl pointer-events-none"></div>
			
			<!-- Hero Header Background -->
			<div class="h-32 w-full bg-gradient-to-r from-neonPink-600/20 via-neonPink-800/10 to-slate-900/40 border-b border-white/5"></div>
			
			<div class="px-6 pb-8 pt-0 -mt-12 md:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div class="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
					<!-- Avatar Frame with Glow -->
					<div class="relative group">
						<div class="absolute -inset-0.5 bg-gradient-to-r from-neonPink-500 to-neonPink-700 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
						
						{#if data.user.avatar_url || data.user.avatarUrl}
							<img
								src={data.user.avatar_url || data.user.avatarUrl}
								alt={data.user.username}
								class="relative w-24 h-24 rounded-full border-4 border-neutral-950 object-cover shadow-xl"
							/>
						{:else}
							<div
								class="relative w-24 h-24 rounded-full border-4 border-neutral-950 bg-gradient-to-br from-neonPink-600 to-neonPink-800 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl"
							>
								{initial}
							</div>
						{/if}
					</div>

					<div class="space-y-2">
						<h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">
							{data.user.username}
						</h1>
						
						<div class="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-sm text-slate-300">
							<!-- Email link -->
							<span class="flex items-center justify-center md:justify-start gap-1.5">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
								{data.user.email}
							</span>
							
							<span class="w-1.5 h-1.5 rounded-full bg-slate-650 hidden sm:inline"></span>
							
							<!-- Join Date -->
							<span class="flex items-center justify-center md:justify-start gap-1.5">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
								{m.profile_member_since()} {memberSince}
							</span>
						</div>
					</div>
				</div>
				
				<!-- Quick Actions / Badges -->
				<div class="flex flex-wrap items-center justify-center gap-3">
					{#if userRole}
						<span class="px-4 py-1.5 rounded-full border text-xs font-bold {userRole.bgClass} flex items-center gap-1.5 select-none">
							{#if userRole.id === 'chua_te'}
								👑
							{:else if userRole.id === 'nha_phe_binh'}
								🖋️
							{:else if userRole.id === 'tin_do'}
								🔥
							{:else if userRole.id === 'mot_phim_real'}
								🍿
							{:else if userRole.id === 'mot_phim_apprentice'}
								🌱
							{:else}
								🎓
							{/if}
							<span class="bg-gradient-to-r {userRole.colorClass} bg-clip-text text-transparent">{userRole.name}</span>
						</span>
					{/if}
					<span class="px-4 py-1.5 rounded-full bg-neonPink-500/10 border border-neonPink-500/20 text-xs font-semibold text-neonPink-400">
						VIP Member
					</span>
				</div>
			</div>
		</div>

		<!-- Watch Statistics Section -->
		<div class="space-y-4">
			<h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
				{m.profile_stats_title()}
			</h2>

			{#if data.stats.totalMovies === 0}
				<div class="rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-md p-10 text-center space-y-4">
					<div class="w-16 h-16 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="17" y1="2" y2="2"/><line x1="7" x2="17" y1="22" y2="22"/><line x1="2" x2="22" y1="7" y2="7"/><line x1="2" x2="22" y1="17" y2="17"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="22" y2="22"/></svg>
					</div>
					<p class="text-slate-400 text-sm max-w-sm mx-auto">{m.profile_no_stats()}</p>
					<a
						href="/"
						class="inline-flex px-6 py-2 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-semibold rounded-full shadow-lg shadow-neonPink-500/20 transition duration-200 text-sm"
					>
						{m.profile_explore_movies()}
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
					<!-- Total Movies Card -->
					<div class="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 flex items-center gap-4 hover:border-neonPink-500/30 hover:bg-slate-900/40 transition duration-300">
						<div class="w-12 h-12 rounded-xl bg-neonPink-500/10 flex items-center justify-center text-neonPink-500">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
						</div>
						<div class="space-y-0.5">
							<p class="text-3xl font-black text-white">{data.stats.totalMovies}</p>
							<p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">{m.profile_total_movies()}</p>
						</div>
						<div class="absolute bottom-0 right-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
						</div>
					</div>

					<!-- Total Hours Card -->
					<div class="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 flex items-center gap-4 hover:border-neonPink-500/30 hover:bg-slate-900/40 transition duration-300">
						<div class="w-12 h-12 rounded-xl bg-neonPink-500/10 flex items-center justify-center text-neonPink-500">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						</div>
						<div class="space-y-0.5">
							<p class="text-3xl font-black text-white">{data.stats.totalHours}h</p>
							<p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">{m.profile_total_hours()}</p>
						</div>
						<div class="absolute bottom-0 right-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						</div>
					</div>

					<!-- Ratings Given Card -->
					<div class="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 flex items-center gap-4 hover:border-neonPink-500/30 hover:bg-slate-900/40 transition duration-300">
						<div class="w-12 h-12 rounded-xl bg-neonPink-500/10 flex items-center justify-center text-neonPink-500">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
						</div>
						<div class="space-y-0.5">
							<p class="text-3xl font-black text-white">{data.stats.ratingsCount}</p>
							<p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">{m.profile_ratings_count()}</p>
						</div>
						<div class="absolute bottom-0 right-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
						</div>
					</div>
				</div>

				<!-- Top Genres Section -->
				{#if data.stats.topGenres.length > 0}
					<div class="rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md p-6 space-y-4">
						<h3 class="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
							{m.profile_top_genres()}
						</h3>
						
						<!-- Visual progress representation -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{#each data.stats.topGenres as genre, i (genre.name)}
								<div class="space-y-1.5 p-3 rounded-xl bg-slate-900/40 border border-white/5">
									<div class="flex justify-between items-center text-sm">
										<span class="font-medium text-white">{translateGenre(genre.name)}</span>
										<span class="text-xs text-slate-400">{genre.count} {m.reuse_movies().toLowerCase()}</span>
									</div>
									<div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
										<div 
											class="h-full rounded-full bg-gradient-to-r {i === 0 ? 'from-neonPink-500 to-neonPink-600' : i === 1 ? 'from-neonPink-600 to-neonPink-700' : 'from-neonPink-700 to-neonPink-800'}"
											style="width: {Math.min(100, Math.max(15, (genre.count / data.stats.totalMovies) * 100))}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>
