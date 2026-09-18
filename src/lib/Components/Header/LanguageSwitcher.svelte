<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';

	// Human-readable mapping of locales to display names
	const languageNames: Record<string, string> = {
		en: 'English',
		vi: 'Tiếng Việt',
		hi: 'हिन्दी',
		ja: '日本語',
		ko: '한국어',
		tr: 'Türkçe',
		id: 'Bahasa Indonesia',
		zh: '中文',
		ru: 'Русский',
		de: 'Deutsch',
		fr: 'Français',
		es: 'Español',
		it: 'Italiano',
		pt: 'Português',
		pl: 'Polski',
		nl: 'Nederlands',
		be: 'Беларуская'
	};

	let currentLocale = $derived(getLocale());
	let isOpen = $state(false);

	function changeLanguage(locale: string) {
		setLocale(locale as any);
		if (typeof window !== 'undefined' && (window as any).electronAPI?.setLocale) {
			(window as any).electronAPI.setLocale(locale);
		}
		isOpen = false;
	}

	// Close dropdown when clicking outside
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isOpen && !target.closest('.lang-switcher')) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="relative inline-block text-left lang-switcher z-[100]">
	<button
		type="button"
		class="inline-flex items-center justify-between gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-neonPink-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
		aria-expanded={isOpen}
		aria-haspopup="true"
		onclick={() => (isOpen = !isOpen)}
	>
		<span>{languageNames[currentLocale] || currentLocale}</span>
		<svg
			class="h-4 w-4 text-slate-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 bottom-12 z-50 w-44 max-h-64 overflow-y-auto origin-bottom-right rounded-lg bg-slate-800 border border-slate-700 p-1 shadow-xl focus:outline-hidden"
			role="menu"
			aria-orientation="vertical"
		>
			{#each locales as locale}
				<button
					class="w-full rounded-md text-left block px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white {locale === currentLocale
						? 'bg-slate-700/50 text-neonPink-500 font-bold'
						: ''} cursor-pointer"
					role="menuitem"
					onclick={() => changeLanguage(locale)}
				>
					{languageNames[locale] || locale}
				</button>
			{/each}
		</div>
	{/if}
</div>
