<script lang="ts">
	import { onMount } from 'svelte';
	import CardTopMovieItem from '$lib/Components/Card/CardTopMovieItem.svelte';
	import { m } from '$lib/paraglide/messages';
	import { api } from '$lib/ipc';
	import { getApiUrl } from '$lib';

	interface Props {
		transitionClass: string;
	}
	let { transitionClass }: Props = $props();
	let changedClass = $derived(transitionClass);

	let moviesList = $state<{ movie: any; watching: number }[]>([]);

	const fetchWatchingList = async () => {
		try {
			const list = await api.getWatchingList(10);
			if (list && list.length > 0) {
				moviesList = list;
				return;
			}
		} catch (err) {
			console.warn('[Watching] IPC getWatchingList failed:', err);
		}

		try {
			const res = await fetch(getApiUrl('/api/watching/list'));
			if (res.ok) {
				const json = await res.json();
				if (Array.isArray(json) && json.length > 0) {
					moviesList = json;
				}
			}
		} catch (err) {
			// Silent fallback for desktop when offline/backend unreachable
		}
	};

	onMount(() => {
		fetchWatchingList();
		const interval = setInterval(fetchWatchingList, 30000); // refresh every 30 seconds
		return () => clearInterval(interval);
	});
</script>

{#if moviesList.length === 0}
	<div class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center {changedClass}">
		<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
			<path d="M3 3l18 18" />
			<path d="M8 4h10a2 2 0 0 1 2 2v10m-2 2h-14a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" />
			<path d="M8 8v12M16 4v8M4 8h4M4 16h4M4 12h8M20 8h-4" />
		</svg>
		<p class="text-sm">{m.watching_no_movies()}</p>
	</div>
{:else}
	{#each moviesList as item, i (item.movie?.id || item.movie?._id || item.movie?.slug || i)}
		{#if i + 1 == 1}
			<div class="w-full h-full flex items-center mb-4 transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] isolate {changedClass}">
				<p class="text-slate-50 font-bold text-3xl mr-2">{i + 1}</p>
				<div class="flex-1">
					<CardTopMovieItem movie={item.movie} watching={item.watching} class="{(i + 1) < 10 ? 'pl-8' : 'pl-2'} pr-2" showDate={false} style='' /> 
				</div>
			</div>
		{:else}
			<div class="w-full h-full flex items-center mb-4 border-t border-slate-50/20 pt-2 transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] isolate {changedClass}" style="transition-delay: {(i + 1) * 75}ms;">
				<p class="text-slate-50 font-bold text-3xl mr-2">{i + 1}</p>
				<div class="cursor-pointer flex-1">
					<CardTopMovieItem showDate={false} style='' watching={item.watching} movie={item.movie} class="{(i + 1) < 10 ? 'pl-8' : 'pl-2'} pr-2" /> 
				</div>
			</div>
		{/if}
	{/each}
{/if}