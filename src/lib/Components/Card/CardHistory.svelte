<script lang="ts">
	import type { WatchHistory } from '$lib/types';
	import { api } from '$lib/ipc';

	interface Props {
		history: WatchHistory;
		onRemove?: (slug: string) => void;
	}

	let { history, onRemove }: Props = $props();

	const removeHistory = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await api.deleteWatchHistory(history.movie_slug);
			onRemove?.(history.movie_slug);
		} catch (err) {
			console.error('Failed to remove history item:', err);
		}
	};

	const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m}:${s < 10 ? '0' : ''}${s}`;
	};
</script>

<div class="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-300">
	<a href="/phim/{history.movie_slug}?ep={history.episode_slug}" class="relative w-full aspect-[2/3] overflow-hidden bg-neutral-950 block">
		<img
			src={history.poster_url}
			alt={history.movie_name}
			class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
			loading="lazy"
		/>

		<div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80"></div>

		<!-- Remove button -->
		<button
			onclick={removeHistory}
			class="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-950/70 text-slate-400 hover:text-red-400 hover:bg-neutral-900 transition-colors shadow"
			title="Xóa khỏi lịch sử"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		</button>

		<!-- Progress Bar -->
		<div class="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800/80">
			<div
				class="h-full bg-neonPink-500 transition-all duration-300"
				style="width: {Math.min(100, Math.max(0, history.progress_percent))}%"
			></div>
		</div>

		<!-- Episode info badge -->
		<div class="absolute bottom-3 left-2 right-2 flex items-center justify-between text-[10px] text-slate-200">
			<span class="px-1.5 py-0.5 rounded bg-black/70 font-semibold backdrop-blur-sm">
				{history.episode_name}
			</span>
			<span class="font-mono bg-black/60 px-1 rounded">
				{formatTime(history.current_time)}
			</span>
		</div>
	</a>

	<div class="p-2.5">
		<a href="/phim/{history.movie_slug}?ep={history.episode_slug}" class="block group-hover:text-neonPink-400 transition-colors">
			<h4 class="text-xs sm:text-sm font-bold text-slate-200 line-clamp-1">
				{history.movie_name}
			</h4>
		</a>
	</div>
</div>
