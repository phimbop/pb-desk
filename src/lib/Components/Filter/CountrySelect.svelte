<script lang="ts">
	import { clickOutside } from '$lib/helper/clickOutSide';
	import { quintOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import InputFilterSearch from './InputFilterSearch.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	interface Props {
		options?: TmdbCountryType[];
		selectedOptions?: string[];
		text?: string;
		iconSvg?: string;
		children?: import('svelte').Snippet;
	}

	let {
		options = $bindable([]),
		selectedOptions = $bindable([]),
		text = '',
		iconSvg = '',
		children
	}: Props = $props();

	let isOpen = $state(false);
	let expanded = $state(false);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectOption(option: string) {
		if (selectedOptions.includes(option)) {
			selectedOptions = selectedOptions.filter((item) => item !== option);
		} else {
			selectedOptions = [...selectedOptions, option];
		}
	}

	let inputValue = $state('');
	let filteredCountries: TmdbCountryType[] = $state([]);

	$effect(() => {
		expanded = selectedOptions.length > 0;
		if (inputValue) {
			const query = inputValue.trim().toLowerCase();
			filteredCountries = options.filter(
				(item) =>
					(item.native_name && item.native_name.toLowerCase().includes(query)) ||
					(item.english_name && item.english_name.toLowerCase().includes(query)) ||
					(item.iso_3166_1 && item.iso_3166_1.toLowerCase().includes(query))
			);
		} else {
			filteredCountries = options;
		}
	});
</script>

<div
	class="relative w-full lg:w-fit h-full"
	use:clickOutside={() => {
		if (isOpen) {
			toggleDropdown();
		}
	}}
>
	<button
		aria-label="Select country"
		class="relative w-full md:min-h-10 border border-slate-700 text-slate-400 px-4 py-1 rounded-full hover:text-neonPink-500 focus:bg-linear-to-t focus:from-neonPink-500/10 focus:to-transparent focus:text-neonPink-500 cursor-pointer flex items-center justify-between transition-all duration-150 {expanded
			? ' text-neonPink-500'
			: ''}"
		onclick={toggleDropdown}
	>
		<div
			class="flex space-x-2 transition-all duration-150 {selectedOptions.length > 0 ? 'mr-6' : ''}"
		>
			{@html iconSvg}
			{@render children?.()}
			<p>
				{text}
				<span
					class="px-2 ml-2 rounded-full bg-neonPink-900 text-slate-200 transition-all duration-150 {selectedOptions.length <=
					0
						? 'hidden'
						: ''}">{selectedOptions.length}</span
				>
			</p>
		</div>
	</button>
	{#if selectedOptions.length > 0}
		<button
			type="button"
			aria-label="Clear selected options"
			onclick={(e) => {
				e.stopPropagation();
				selectedOptions = [];
			}}
			class="absolute top-0 right-0 inline-flex h-full animate-background-shine cursor-pointer items-center justify-center rounded-e-full border border-slate-800 bg-[linear-gradient(110deg,#AD005C,45%,#cc006d,55%,#AD005C)] bg-[length:250%_100%] px-2 py-1 text-sm font-medium text-slate-300 backdrop-blur-3xl z-20"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="w-4 h-4"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="m12 14.122l5.303 5.303a1.5 1.5 0 0 0 2.122-2.122L14.12 12l5.304-5.303a1.5 1.5 0 1 0-2.122-2.121L12 9.879L6.697 4.576a1.5 1.5 0 1 0-2.122 2.12L9.88 12l-5.304 5.304a1.5 1.5 0 1 0 2.122 2.12z"/></g></svg>
		</button>
	{/if}
	{#if isOpen}
		<div
			in:scale={{ duration: 150, opacity: 0.95, start: 0.95 }}
			out:fade={{ duration: 150, easing: quintOut }}
			class="absolute z-40 w-[260px] h-fit mt-2 origin-top bg-neutral-800/60 backdrop-blur-xl rounded-2xl overflow-x-hidden text-ellipsis shadow-lg transition-all duration-100"
		>
			<InputFilterSearch bind:inputValue placeholder={m.inputFilterSearch_find_country()} removeInputValue={() => { inputValue = ''; }} />
			<ul class="max-h-96 overflow-y-auto scrollbar p-2">
				{#each filteredCountries as option}
					<li
						class="px-4 py-2 hover:bg-neutral-900 rounded-lg cursor-pointer flex items-center space-x-2 text-slate-400 hover:text-slate-200"
						onclick={() => selectOption(option.iso_3166_1)}
					>
						<input
							type="checkbox"
							class="focus:bg-neutral-900 text-neonPink-500 rounded-full h-4 w-4 transition-all duration-200 peer/filter-checkbox pointer-events-none"
							checked={selectedOptions.includes(option.iso_3166_1)}
						/>
						<p
							class="peer-checked/filter-checkbox:text-neonPink-500 transition duration-200 truncate select-none"
						>
							{getLocale() === 'vi' ? option.native_name : option.english_name}
						</p>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
