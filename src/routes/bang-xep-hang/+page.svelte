<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { fade, fly } from 'svelte/transition';
	import { getUserRole } from '$lib/utils/rank';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { websiteUrl } from '$lib';
	import type { Leaderboards } from '$lib/types';

	let { data } = $props<{
		data: {
			leaderboards: Leaderboards;
		};
	}>();

	let activeTab = $state<'watchers' | 'reviewers' | 'commenters'>('watchers');
	let currentUser = $derived(page.data?.user ?? null);

	const tabs = [
		{ id: 'watchers', name: m.leaderboard_top_watch(), desc: m.leaderboard_top_watch_desc(), icon: '🍿' },
		{ id: 'reviewers', name: m.leaderboard_top_rates(), desc: m.leaderboard_top_rates_desc(), icon: '⭐' },
		{ id: 'commenters', name: m.leaderboard_top_comments(), desc: m.leaderboard_top_comments_desc(), icon: '💬' }
	] as const;

	let currentList = $derived(
		activeTab === 'watchers'
			? (data?.leaderboards?.topWatchers ?? [])
			: activeTab === 'reviewers'
			? (data?.leaderboards?.topReviewers ?? [])
			: (data?.leaderboards?.topCommenters ?? [])
	);

	function getRankStyle(index: number) {
		if (index === 0) return { bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: '🏆', border: 'border-yellow-500/20' };
		if (index === 1) return { bg: 'bg-slate-300/10 border-slate-300/30 text-slate-300', icon: '🥈', border: 'border-slate-400/10' };
		if (index === 2) return { bg: 'bg-amber-650/10 border-amber-650/30 text-amber-500', icon: '🥉', border: 'border-amber-700/10' };
		return { bg: 'bg-slate-800/40 border-white/5 text-slate-400', icon: `#${index + 1}`, border: 'border-white/5' };
	}
</script>

<Seo
	title={m.sidebar_leaderboard_title()}
	metadescription={m.leaderboard_seo_description()}
	slug={`${websiteUrl}/bang-xep-hang`}
/>

<section in:fade={{ duration: 250 }} class="w-full mt-4 md:mt-24 mb-16 px-4 md:px-8">
	<div class="max-w-4xl mx-auto space-y-8">
		
		<!-- Hero Section -->
		<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 text-center shadow-2xl">
			<!-- Background Glows -->
			<div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neonPink-500/10 blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
			
			<div class="relative z-10 space-y-3">
				<div class="inline-flex items-center justify-center p-3 rounded-2xl bg-neonPink-500/10 border border-neonPink-500/20 text-neonPink-400 text-3xl mb-2">
					🏆
				</div>
				<h1 class="text-3xl md:text-4xl font-black text-white tracking-tight">
					<span class="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
						{m.leaderboard_title()}
					</span>
				</h1>
				<p class="text-sm md:text-base text-slate-400 max-w-lg mx-auto">
					{m.leaderboard_subtitle()}
				</p>
			</div>
		</div>

		<!-- Navigation Tabs -->
		<div class="flex flex-col sm:flex-row justify-center gap-2 p-1.5 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-md">
			{#each tabs as tab}
				<button
					onclick={() => (activeTab = tab.id)}
					class="relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition duration-200 select-none {activeTab === tab.id ? 'bg-neonPink-600 text-white shadow-lg shadow-neonPink-600/35' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}"
				>
					<span>{tab.icon}</span>
					<span>{tab.name}</span>
				</button>
			{/each}
		</div>

		<!-- List Content Card -->
		<div class="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/15 backdrop-blur-xl shadow-2xl p-6 min-h-[400px]">
			<!-- Decorative Gradients -->
			<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neonPink-600/5 blur-3xl pointer-events-none"></div>
			
			{#key activeTab}
				<div in:fly={{ y: 15, duration: 250 }} class="space-y-4">
					
					<!-- Tab Description Header -->
					<div class="flex items-center gap-3 pb-4 border-b border-white/5">
						<span class="w-2.5 h-2.5 rounded-full bg-neonPink-500 animate-ping"></span>
						<p class="text-sm font-semibold text-slate-300">
							{tabs.find(t => t.id === activeTab)?.desc}
						</p>
					</div>

					{#if currentList.length === 0}
						<div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
							<div class="text-4xl text-slate-600">👻</div>
							<p class="text-slate-500 text-sm">{m.profile_no_stats()}</p>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse">
								<thead>
									<tr class="text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
										<th class="py-3 px-4 font-bold text-center w-16">{m.leaderboard_rank()}</th>
										<th class="py-3 px-4 font-bold">{m.leaderboard_user()}</th>
										<th class="py-3 px-4 font-bold text-right w-40">{m.leaderboard_stats()}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-white/5">
									{#each currentList as row, index (row.userId)}
										{@const rankStyle = getRankStyle(index)}
										{@const userRole = getUserRole(row.totalWatchHours)}
										{@const isMe = currentUser && (currentUser.id === row.userId || `user:${currentUser.id}` === row.userId)}
										<tr
											class="group hover:bg-white/[0.02] transition-colors duration-200 {isMe ? 'bg-neonPink-500/5 border-l-2 border-l-neonPink-500' : ''}"
										>
											<!-- Rank Badge -->
											<td class="py-4 px-4 text-center">
												<span
													class="inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm border {rankStyle.bg}"
												>
													{rankStyle.icon}
												</span>
											</td>

											<!-- User Info & Role Badge -->
											<td class="py-4 px-4">
												<div class="flex items-center gap-3">
													<!-- Avatar -->
													<div class="relative flex-shrink-0">
														{#if row.avatarUrl}
															<img
																src={row.avatarUrl}
																alt={row.username}
																class="w-10 h-10 rounded-full object-cover ring-2 {index === 0 ? 'ring-yellow-500/40' : index === 1 ? 'ring-slate-350/40' : index === 2 ? 'ring-amber-600/40' : 'ring-white/10'}"
															/>
														{:else}
															<div
																class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-extrabold text-sm border {index === 0 ? 'border-yellow-500/40' : index === 1 ? 'border-slate-350/40' : index === 2 ? 'border-amber-600/40' : 'border-white/10'}"
															>
																{row.username.charAt(0).toUpperCase()}
															</div>
														{/if}
														
														<!-- Highlight Dot for Current User -->
														{#if isMe}
															<span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neonPink-500 border-2 border-slate-900"></span>
														{/if}
													</div>

													<!-- Name and Badge stack -->
													<div class="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1">
														<span class="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
															{row.username}
															{#if isMe}
																<span class="text-xs text-neonPink-400 ml-1 font-semibold">({m.profile_title().toLowerCase()})</span>
															{/if}
														</span>
														
														<!-- Member Title Pill -->
														{#if userRole}
															<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit {userRole.bgClass} select-none">
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
													</div>
												</div>
											</td>

											<!-- Action Stats Column -->
											<td class="py-4 px-4 text-right">
												{#if activeTab === 'watchers'}
													<div class="space-y-0.5">
														<p class="font-extrabold text-sm text-white">{m.leaderboard_hours({ hours: String(row.hours) })}</p>
														<p class="text-xs text-slate-500">{m.leaderboard_movies({ count: String(row.count) })}</p>
													</div>
												{:else if activeTab === 'reviewers'}
													<p class="font-extrabold text-sm text-white">{m.leaderboard_movies({ count: String(row.count) })}</p>
												{:else}
													<p class="font-extrabold text-sm text-white">{m.leaderboard_comments({ count: String(row.count) })}</p>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/key}
		</div>

	</div>
</section>
