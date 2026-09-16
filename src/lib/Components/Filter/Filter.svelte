<script lang="ts">
	import { tmdbCountries, tmdbMoviesGenres, tmdbMoviesGenresEnglish, tmdbYears } from "$lib";
	import { m } from "$lib/paraglide/messages";
	import { getLocale } from "$lib/paraglide/runtime";
	import { tmdbFilterMoviesStore } from "$lib/runes/movieStore.svelte";
	import ButtonPrimary from "../Button/ButtonPrimary.svelte";
	import CountrySelect from "./CountrySelect.svelte";
	import InputFilterSearch from "./InputFilterSearch.svelte";
	import MultiSelect from "./MultiSelect.svelte";

	let selectedMovieGenres: number[] = $state(tmdbFilterMoviesStore.value.movieGenres ?? []);
	let selectedCountries: string[] = $state(tmdbFilterMoviesStore.value.country ?? []);
	let selectedYears: string[] = $state(tmdbFilterMoviesStore.value.year ?? []);
	let inputValue = $state(tmdbFilterMoviesStore.value.movieTitle ?? '');
	let { handlers } = $props();

	// Hàm so sánh mảng
	const arraysEqual = (arr1: any[] | undefined, arr2: any[] | undefined) => JSON.stringify(arr1) === JSON.stringify(arr2);

	let filters = $state({
		movieGenres: [] as number[],
		country: [] as string[],
		year: [] as string[],
		movieTitle: ''
	});

	let hasInitializedFromStore = false;
	$effect(() => {
		if (!hasInitializedFromStore && tmdbFilterMoviesStore.state === 'ready') {
			hasInitializedFromStore = true;
			const initial = tmdbFilterMoviesStore.value;
			if (initial) {
				if (initial.movieGenres?.length && selectedMovieGenres.length === 0) {
					selectedMovieGenres = [...initial.movieGenres];
				}
				if (initial.country?.length && selectedCountries.length === 0) {
					selectedCountries = [...initial.country];
				}
				if (initial.year?.length && selectedYears.length === 0) {
					selectedYears = [...initial.year];
				}
				if (initial.movieTitle && !inputValue) {
					inputValue = initial.movieTitle;
				}
			}
		}
	});

	// Cập nhật filters dựa trên thay đổi của từng giá trị
	$effect(() => {
		if (selectedMovieGenres.length > 0) {
			filters.movieGenres = selectedMovieGenres;
		} else {
			filters.movieGenres = [];
		}
	});

	$effect(() => {
		if (selectedCountries.length > 0) {
			filters.country = selectedCountries;
		} else {
			filters.country = [];
		}
	});

	$effect(() => {
		if (selectedYears.length > 0) {
			filters.year = selectedYears;
		} else {
			filters.year = [];
		}
	});

	$effect(() => {
		if (inputValue) {
			filters.movieTitle = inputValue;
		} else {
			filters.movieTitle = '';
		}
	});

	$effect(() => {
		const storeState = tmdbFilterMoviesStore.state;
		const newFilters = filters;

		if (storeState === 'ready') {
			const current = tmdbFilterMoviesStore.value || {};
			if (
				!arraysEqual(current.movieGenres, newFilters.movieGenres) ||
				!arraysEqual(current.country, newFilters.country) ||
				!arraysEqual(current.year, newFilters.year) ||
				(current.movieTitle || '') !== (newFilters.movieTitle || '')
			) {
				tmdbFilterMoviesStore.value = {
					...current,
					...newFilters
				};
			}
		}
	});

	const handleSearchCloseClicked = () => {
		inputValue = '';
		tmdbFilterMoviesStore.value = {
			...tmdbFilterMoviesStore.value,
			movieTitle: ''
		};
		handlers.btnFilterClicked();
	};

	const handleSearchKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			handlers.btnFilterClicked();
		}
	};

	let showAdvanced = $state(false);
</script>

<div class="w-full md:w-fit h-fit flex flex-col md:flex-row md:items-center gap-3 transition-all duration-300 {handlers.class}" onkeydown={(e) => {
	e.stopPropagation();
}}>
	<!-- Top Row: Search Input + Mobile Filter Toggle Button -->
	<div class="flex items-center gap-2 w-full md:w-auto">
		<div class="flex-1 min-w-[200px]">
			<InputFilterSearch bind:inputValue onkeydown={handleSearchKeyDown} placeholder={m.inputFilterSearch_placeholder()} class="border border-slate-700 rounded-full w-full h-11 md:h-10" removeInputValue={handleSearchCloseClicked} />
		</div>
		<!-- Toggle Button (visible only on mobile) -->
		<button
			type="button"
			class="md:hidden flex-none p-3 border border-slate-700 bg-slate-800/40 rounded-full text-slate-300 hover:text-white active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center"
			onclick={() => showAdvanced = !showAdvanced}
			aria-label="Toggle Advanced Filters"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
				<path d="M4 6l8 0" />
				<path d="M16 6l4 0" />
				<path d="M6 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
				<path d="M4 12l0 0" />
				<path d="M8 12l12 0" />
				<path d="M18 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
				<path d="M4 18l12 0" />
				<path d="M20 18l0 0" />
			</svg>
		</button>
	</div>

	<!-- Advanced Filters (Collapsible on mobile, always visible on desktop) -->
	<div class="w-full md:w-fit flex-col md:flex-row gap-3 {showAdvanced ? 'flex' : 'hidden md:flex'}">
		<MultiSelect text={m.multiSelect_text_genres()} options={getLocale() === 'vi' ? tmdbMoviesGenres.genres : tmdbMoviesGenresEnglish.genres} bind:selectedOptions={selectedMovieGenres} />
		<CountrySelect text={m.multiSelect_text_country()} options={tmdbCountries} bind:selectedOptions={selectedCountries} />
		<MultiSelect text={m.multiSelect_text_year()} options={tmdbYears} bind:selectedOptions={selectedYears} />
		<ButtonPrimary onclick={handlers.btnFilterClicked} class="w-full md:w-auto">
			{m.filter_btn_title()}
		</ButtonPrimary>
	</div>
</div>