<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { websiteUrl } from '$lib';
	import { api, checkAutostartEnabled, disableAutostart, enableAutostart, isTauri } from '$lib/ipc';
	import type { AppSettings } from '$lib/types';

	const languageOptions: { code: string; nativeName: string }[] = [
		{ code: 'vi', nativeName: 'Tiếng Việt' },
		{ code: 'en', nativeName: 'English' },
		{ code: 'ko', nativeName: '한국어' },
		{ code: 'ja', nativeName: '日本語' },
		{ code: 'zh', nativeName: '中文' },
		{ code: 'hi', nativeName: 'हिन्दी' },
		{ code: 'tr', nativeName: 'Türkçe' },
		{ code: 'id', nativeName: 'Bahasa Indonesia' },
		{ code: 'ru', nativeName: 'Русский' },
		{ code: 'de', nativeName: 'Deutsch' },
		{ code: 'fr', nativeName: 'Français' },
		{ code: 'es', nativeName: 'Español' },
		{ code: 'it', nativeName: 'Italiano' },
		{ code: 'pt', nativeName: 'Português' },
		{ code: 'pl', nativeName: 'Polski' },
		{ code: 'nl', nativeName: 'Nederlands' },
		{ code: 'be', nativeName: 'Беларуская' }
	];

	let currentLocale = $derived(getLocale());

	function handleLanguageChange(newLocale: string) {
		if (newLocale !== currentLocale) {
			setLocale(newLocale as any);
			if (typeof window !== 'undefined' && (window as any).electronAPI?.setLocale) {
				(window as any).electronAPI.setLocale(newLocale);
			}
		}
	}

	let loading = $state(true);
	let checkingUpdates = $state(false);
	let updateFeedback = $state<string | null>(null);
	let savedToast = $state(false);

	let settings = $state<AppSettings>({
		autostart: true,
		minimizeToTray: true,
		notifyNewMovies: true,
		notifyMode: 'all',
		checkIntervalMins: 15
	});

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;
		try {
			const res = await api.getAppSettings();
			if (res) {
				settings = res;
			}
			if (isTauri()) {
				const autoEnabled = await checkAutostartEnabled();
				settings.autostart = autoEnabled;
			}
		} catch (err) {
			console.error('Failed to load app settings:', err);
		} finally {
			loading = false;
		}
	}

	async function updateSettings(newSettings: Partial<AppSettings>) {
		settings = { ...settings, ...newSettings };
		try {
			await api.saveAppSettings(settings);
			showSavedToast();
		} catch (err) {
			console.error('Failed to save settings:', err);
		}
	}

	function showSavedToast() {
		savedToast = true;
		setTimeout(() => {
			savedToast = false;
		}, 2500);
	}

	async function handleToggleAutostart() {
		const nextState = !settings.autostart;
		settings.autostart = nextState;
		if (isTauri()) {
			try {
				if (nextState) {
					await enableAutostart();
				} else {
					await disableAutostart();
				}
			} catch (err) {
				console.error('Failed to toggle autostart in OS:', err);
			}
		}
		await updateSettings({ autostart: nextState });
	}

	async function handleToggleTray() {
		const nextState = !settings.minimizeToTray;
		await updateSettings({ minimizeToTray: nextState });
	}

	async function handleToggleNotification() {
		const nextState = !settings.notifyNewMovies;
		await updateSettings({ notifyNewMovies: nextState });
	}

	async function handleCheckNow() {
		checkingUpdates = true;
		updateFeedback = null;
		try {
			const updates = await api.checkForMovieUpdates();
			if (updates && updates.length > 0) {
				updateFeedback = m.settings_scan_found({ count: updates.length });
			} else {
				updateFeedback = m.settings_scan_empty();
			}
		} catch (err) {
			updateFeedback = m.settings_scan_error();
		} finally {
			checkingUpdates = false;
			setTimeout(() => {
				updateFeedback = null;
			}, 5000);
		}
	}
</script>

<Seo
	title={`${m.sidebar_settings_title()} | BOP`}
	metadescription={m.settings_description()}
	slug={`${websiteUrl}/settings`}
/>

<section in:fade={{ duration: 250 }} class="w-full mt-4 md:mt-16 mb-16 px-4 md:px-8">
	<div class="max-w-3xl mx-auto space-y-8">
		
		<!-- Hero Header Section -->
		<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl">
			<!-- Background Glows -->
			<div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-neonPink-500/10 blur-3xl pointer-events-none"></div>
			<div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

			<div class="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
				<div class="inline-flex items-center justify-center p-4 rounded-2xl bg-neonPink-500/10 border border-neonPink-500/20 text-neonPink-400 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
						<path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
					</svg>
				</div>
				<div class="space-y-2">
					<h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
						<span class="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
							{m.settings_title()}
						</span>
					</h1>
					<p class="text-sm text-slate-400 max-w-xl">
						{m.settings_description()}
					</p>
				</div>
			</div>
		</div>

		<!-- Feedback Toast -->
		{#if savedToast}
			<div in:fade={{ duration: 150 }} class="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
					<path d="M5 12l5 5l10 -10" />
				</svg>
				<span>{m.settings_saved_status()}</span>
			</div>
		{/if}

		<!-- Group: Language & Display -->
		<div class="rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-xl">
			<div class="flex items-center gap-2.5 pb-2 border-b border-white/5">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
					<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
					<path d="M3.6 9h16.8" />
					<path d="M3.6 15h16.8" />
					<path d="M11.5 3a17 17 0 0 0 0 18" />
					<path d="M12.5 3a17 17 0 0 1 0 18" />
				</svg>
				<h2 class="text-base font-bold text-white tracking-wide">{m.settings_language_group()}</h2>
			</div>

			<div class="space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors gap-4">
					<div class="space-y-1">
						<label for="language-selector" class="text-sm font-semibold text-white block">{m.settings_language_label()}</label>
						<p class="text-xs text-slate-400 leading-relaxed">{m.settings_language_desc()}</p>
					</div>
					<div class="relative shrink-0">
						<select
							id="language-selector"
							value={currentLocale}
							onchange={(e) => handleLanguageChange((e.target as HTMLSelectElement).value)}
							class="bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-neonPink-500 cursor-pointer min-w-[180px] shadow-sm"
						>
							{#each languageOptions as lang}
								<option value={lang.code} class="bg-neutral-900 text-slate-200 py-1">
									{lang.nativeName}
								</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Group 1: Startup & Background Execution -->
		<div class="rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-xl">
			<div class="flex items-center gap-2.5 pb-2 border-b border-white/5">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
					<path d="M3 4a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-12z" />
					<path d="M7 20h10" />
					<path d="M9 16v4" />
					<path d="M15 16v4" />
				</svg>
				<h2 class="text-base font-bold text-white tracking-wide">{m.settings_system_group()}</h2>
			</div>

			<div class="space-y-4">
				<!-- Item: Autostart on boot -->
				<div class="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors gap-4">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-white">{m.settings_autostart_title()}</p>
						<p class="text-xs text-slate-400 leading-relaxed">{m.settings_autostart_desc()}</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={settings.autostart}
						aria-label={m.settings_autostart_title()}
						onclick={handleToggleAutostart}
						class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {settings.autostart ? 'bg-neonPink-600' : 'bg-neutral-800'}"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {settings.autostart ? 'translate-x-5' : 'translate-x-0'}"
						></span>
					</button>
				</div>

				<!-- Item: Minimize to tray on close -->
				<div class="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors gap-4">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-white">{m.settings_tray_title()}</p>
						<p class="text-xs text-slate-400 leading-relaxed">{m.settings_tray_desc()}</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={settings.minimizeToTray}
						aria-label={m.settings_tray_title()}
						onclick={handleToggleTray}
						class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {settings.minimizeToTray ? 'bg-neonPink-600' : 'bg-neutral-800'}"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {settings.minimizeToTray ? 'translate-x-5' : 'translate-x-0'}"
						></span>
					</button>
				</div>
			</div>
		</div>

		<!-- Group 2: New Movie Notifications -->
		<div class="rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-xl">
			<div class="flex items-center gap-2.5 pb-2 border-b border-white/5">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
					<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
					<path d="M9 17v1a3 3 0 0 0 6 0v-1" />
				</svg>
				<h2 class="text-base font-bold text-white tracking-wide">{m.settings_notification_group()}</h2>
			</div>

			<div class="space-y-4">
				<!-- Item: Enable notifications toggle -->
				<div class="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors gap-4">
					<div class="space-y-1">
						<p class="text-sm font-semibold text-white">{m.settings_notify_title()}</p>
						<p class="text-xs text-slate-400 leading-relaxed">{m.settings_notify_desc()}</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={settings.notifyNewMovies}
						aria-label={m.settings_notify_title()}
						onclick={handleToggleNotification}
						class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {settings.notifyNewMovies ? 'bg-neonPink-600' : 'bg-neutral-800'}"
					>
						<span
							class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {settings.notifyNewMovies ? 'translate-x-5' : 'translate-x-0'}"
						></span>
					</button>
				</div>

				{#if settings.notifyNewMovies}
					<!-- Option: Notification scope selection -->
					<div class="p-5 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
						<label for="scope-selector" class="block text-sm font-semibold text-white">
							{m.settings_scope_label()}
						</label>
						<div id="scope-selector" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<button
								type="button"
								onclick={() => updateSettings({ notifyMode: 'all' })}
								class="p-4 rounded-2xl text-left border transition-all text-xs {settings.notifyMode === 'all'
									? 'bg-neonPink-600/15 border-neonPink-500 text-white shadow-lg shadow-neonPink-500/10'
									: 'bg-neutral-800/60 border-white/5 text-slate-400 hover:text-white hover:border-white/10'}"
							>
								<div class="flex items-center gap-2 mb-1">
									<div class="w-2 h-2 rounded-full {settings.notifyMode === 'all' ? 'bg-neonPink-500' : 'bg-slate-600'}"></div>
									<p class="font-bold text-slate-200">{m.settings_scope_all()}</p>
								</div>
								<p class="text-[11px] opacity-75 leading-relaxed">{m.settings_scope_all_desc()}</p>
							</button>
							<button
								type="button"
								onclick={() => updateSettings({ notifyMode: 'favorites_only' })}
								class="p-4 rounded-2xl text-left border transition-all text-xs {settings.notifyMode === 'favorites_only'
									? 'bg-neonPink-600/15 border-neonPink-500 text-white shadow-lg shadow-neonPink-500/10'
									: 'bg-neutral-800/60 border-white/5 text-slate-400 hover:text-white hover:border-white/10'}"
							>
								<div class="flex items-center gap-2 mb-1">
									<div class="w-2 h-2 rounded-full {settings.notifyMode === 'favorites_only' ? 'bg-neonPink-500' : 'bg-slate-600'}"></div>
									<p class="font-bold text-slate-200">{m.settings_scope_fav()}</p>
								</div>
								<p class="text-[11px] opacity-75 leading-relaxed">{m.settings_scope_fav_desc()}</p>
							</button>
						</div>
					</div>

					<!-- Option: Background Scan Frequency -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 gap-3">
						<div class="space-y-0.5">
							<label for="interval-select" class="block text-sm font-semibold text-white">
								{m.settings_interval_label()}
							</label>
							<p class="text-xs text-slate-400">{m.settings_interval_desc()}</p>
						</div>
						<select
							id="interval-select"
							value={settings.checkIntervalMins}
							onchange={(e) => updateSettings({ checkIntervalMins: Number((e.target as HTMLSelectElement).value) })}
							class="bg-neutral-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-neonPink-500 shrink-0"
						>
							<option value={15}>{m.settings_interval_15m()}</option>
							<option value={30}>{m.settings_interval_30m()}</option>
							<option value={60}>{m.settings_interval_1h()}</option>
							<option value={120}>{m.settings_interval_2h()}</option>
						</select>
					</div>
				{/if}
			</div>

			<!-- Scan Now Section -->
			<div class="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="text-xs text-slate-400 text-center sm:text-left">
					{#if updateFeedback}
						<span class="text-neonPink-400 font-medium animate-fade-in">{updateFeedback}</span>
					{:else}
						<span>{m.settings_scan_hint()}</span>
					{/if}
				</div>

				<button
					type="button"
					onclick={handleCheckNow}
					disabled={checkingUpdates}
					class="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 transition-all active:scale-95 disabled:opacity-50 shrink-0"
				>
					{#if checkingUpdates}
						<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span>{m.settings_scanning_btn()}</span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
							<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
							<path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
						</svg>
						<span>{m.settings_scan_btn()}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
</section>
