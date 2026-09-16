<script lang="ts">
	import CommonHelper from '$lib/helper/commentHelper';

	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	let textColor = 'text-slate-200';
	let textActiveColor = 'text-neonPink-500';
	let bgActiveColor = 'bg-linear-to-t from-neonPink-500/40 to-neutral-800';
	let textHoverColor = 'text-neonPink-500';
	let bgHoverColor = 'hover:bg-linear-to-t hover:from-neonPink-500/40 hover:to-neutral-800';
	interface Props {
		currentPage?: number;
		totalPages?: number;
	}

	let { currentPage = $bindable(1), totalPages = 0 }: Props = $props();
	const handlePageChange = CommonHelper.debounce((newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		currentPage = newPage;
	}, 200);

	function on_key_down(event: KeyboardEvent) {
		const { key, ctrlKey, repeat } = event;
		if (repeat) return;
		switch (key) {
			case 'ArrowLeft':
				event.preventDefault();
				currentPage in [0, 1] ? null : handlePageChange(currentPage - 1);
				break;
			case 'ArrowRight':
				event.preventDefault();
				if (currentPage === totalPages || totalPages == 0) {
					return null;
				} else {
					handlePageChange(currentPage + 1);
				}
				break;
		}
	}
</script>

<svelte:window onkeydown={on_key_down} />
<!-- pagination -->
{#if totalPages > 1}
	<div class="flex items-center justify-center mt-4 w-full">
		<div
			class="flex items-center space-x-2 w-fit h-fit px-2 py-1 border border-slate-800 rounded-s-full rounded-e-full transition-all duration-200 relative"
		>
			<div
				class="menu-bg w-full h-full absolute bottom-0 left-2 transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-to-b before:w-full before:h-full before:absolute before:bottom-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-[1px] after:w-full after:absolute after:-top-[1px] after:left-0 after:opacity-40 after:bg-linear-to-r after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
			></div>
			<button
				type="button"
				aria-label={m.paginations_prev()}
				disabled={currentPage <= 1}
				use:tooltip={{ text: `${m.paginations_prev()} ←`, position: 'left' }}
				onclick={(e) => {
					e.preventDefault();
					if (currentPage > 1) {
						handlePageChange(currentPage - 1);
					}
				}}
				class="text-slate-200 h-8 w-8 flex items-center justify-center hover:text-neonPink-500 disabled:opacity-50 disabled:pointer-events-none hover:scale-105 hover:bg-neutral-900 active:text-slate-200 rounded-full cursor-pointer transition-all duration-200 relative z-10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-chevron-left w-6 h-6"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M15 6l-6 6l6 6"
					/></svg
				>
			</button>
			<!-- So trang  -->
			<div class="flex items-center">
				<p class="text-xs {textColor}">
					{m.paginations_page()} {currentPage.toLocaleString()} / {totalPages.toLocaleString()}
				</p>
			</div>
			<div class="items-center hidden md:flex gap-x-3 relative">
				{#if totalPages > 5}
					{#if currentPage <= 3}
						{#each Array.from({ length: 5 }).map((_, i) => i + 1) as pageNumber}
							<p
								onclick={(e) => {
									e.preventDefault();
									currentPage === pageNumber ? null : `${handlePageChange(pageNumber)}`;
								}}
								class="px-2 py-1 text-sm transition-all duration-200 {currentPage === pageNumber
									? `${textActiveColor} ${bgActiveColor}`
									: `${textColor} ${bgHoverColor} hover:${textHoverColor} cursor-pointer`} rounded-md"
							>
								{pageNumber}
							</p>
						{/each}
					{:else if currentPage >= totalPages - 2}
						{#each Array.from({ length: 5 }).map((_, i) => totalPages - 4 + i) as pageNumber}
							<p
								onclick={(e) => {
									e.preventDefault();
									currentPage === pageNumber ? null : handlePageChange(pageNumber);
								}}
								class="px-2 py-1 text-sm transition-all duration-200 {currentPage === pageNumber // selected
									? `${textActiveColor} ${bgActiveColor}`
									: `${textColor} ${bgHoverColor} hover:${textHoverColor} cursor-pointer`} rounded-md"
							>
								{pageNumber}
							</p>
						{/each}
					{:else}
						<p
							onclick={() => handlePageChange(1)}
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor} cursor-pointer"
						>
							1
						</p>
						<span
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor}"
							>...</span
						>
						<p
							onclick={() => handlePageChange(currentPage - 1)}
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor} cursor-pointer"
						>
							{currentPage - 1}
						</p>
						<p
							class="px-2 py-1 text-sm transition-all duration-200 {textActiveColor} rounded-md {bgActiveColor}"
						>
							{currentPage}
						</p>
						<p
							onclick={() => handlePageChange(currentPage + 1)}
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor} cursor-pointer"
						>
							{currentPage + 1}
						</p>

						<span
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor}"
							>...</span
						>
						<p
							onclick={() => handlePageChange(totalPages)}
							class="px-2 py-1 text-sm transition-all duration-200 {textColor} rounded-md {bgHoverColor} cursor-pointer"
						>
							{totalPages}
						</p>
						<!-- <button on:click={() => handlePageChange(totalPages)}>{totalPages}</button> -->
					{/if}
				{:else}
					{#each Array.from({ length: totalPages }).map((_, i) => i + 1) as pageNumber}
						<p
							onclick={(e) => {
								e.preventDefault();
								currentPage === pageNumber ? null : handlePageChange(pageNumber);
							}}
							class="px-2 py-1 text-sm transition-all duration-200 {currentPage === pageNumber // selected
								? `${textActiveColor} ${bgActiveColor}`
								: `${textColor} ${bgHoverColor} hover:${textHoverColor} cursor-pointer`} rounded-md"
						>
							{pageNumber}
						</p>
					{/each}
				{/if}
			</div>
			<button
				type="button"
				aria-label={m.paginations_next()}
				disabled={currentPage === totalPages || totalPages == 0}
				use:tooltip={{ text: `${m.paginations_next()} →`, position: 'right' }}
				onclick={(e) => {
					e.preventDefault();
					if (currentPage !== totalPages && totalPages > 0) {
						handlePageChange(currentPage + 1);
					}
				}}
				class="text-slate-200 h-8 w-8 flex items-center justify-center hover:text-neonPink-500 disabled:opacity-50 disabled:pointer-events-none hover:scale-105 hover:bg-neutral-900 active:text-slate-200 rounded-full cursor-pointer transition-all duration-200 relative z-10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-chevron-right w-6 h-6"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M9 6l6 6l-6 6" />
				</svg>
			</button>
		</div>
	</div>
{/if}
