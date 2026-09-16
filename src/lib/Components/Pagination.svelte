<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	}

	let { currentPage = 1, totalPages = 1, onPageChange }: Props = $props();

	let visiblePages = $derived.by(() => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible + 2) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			if (start > 2) pages.push('...');
			for (let i = start; i <= end; i++) pages.push(i);
			if (end < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	});
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-center space-x-1.5 py-8">
		<!-- Previous Button -->
		<button
			onclick={() => onPageChange(Math.max(1, currentPage - 1))}
			disabled={currentPage <= 1}
			class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
		>
			Trước
		</button>

		<!-- Page Numbers -->
		{#each visiblePages as p, index (index)}
			{#if typeof p === 'number'}
				<button
					onclick={() => onPageChange(p)}
					class="w-8 h-8 rounded-lg text-xs font-bold transition-all {p === currentPage
						? 'bg-neonPink-500 text-white shadow-lg shadow-neonPink-500/40 ring-1 ring-neonPink-400'
						: 'bg-neutral-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}"
				>
					{p}
				</button>
			{:else}
				<span class="w-8 h-8 flex items-center justify-center text-xs text-slate-500 font-bold">
					...
				</span>
			{/if}
		{/each}

		<!-- Next Button -->
		<button
			onclick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
			disabled={currentPage >= totalPages}
			class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
		>
			Sau
		</button>
	</div>
{/if}
