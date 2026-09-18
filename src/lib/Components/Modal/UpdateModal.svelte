<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { updater } from '$lib/services/updater.svelte';
	import { fade, scale } from 'svelte/transition';

	function formatBytes(bytes: number): string {
		if (bytes <= 0) return '0 MB';
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	}
</script>

{#if updater.modalOpen}
	<!-- Overlay Backdrop -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
	>
		<!-- Modal Card -->
		<div
			transition:scale={{ duration: 200, start: 0.95 }}
			class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100"
		>
			<!-- Ambient Glow -->
			<div
				class="absolute -right-16 -top-16 -z-10 h-48 w-48 rounded-full bg-neonPink-500/20 blur-3xl pointer-events-none"
			></div>
			<div
				class="absolute -left-16 -bottom-16 -z-10 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"
			></div>

			<!-- Close Button (chỉ hiển thị khi không phải critical) -->
			{#if !updater.updateInfo?.isCritical && updater.status !== 'downloading'}
				<button
					aria-label={m.updater_close()}
					onclick={() => updater.closeModal()}
					class="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-5 h-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			{/if}

			<!-- HEADER -->
			<div class="flex items-center gap-3 mb-5">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-neonPink-500/15 border border-neonPink-500/30 text-neonPink-500 shadow-lg shadow-neonPink-500/20">
					{#if updater.status === 'downloading'}
						<svg class="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
					{:else if updater.status === 'downloaded'}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
							<path d="M5 12l5 5l10 -10" />
						</svg>
					{:else if updater.status === 'up-to-date'}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
							<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
							<path d="M9 12l2 2l4 -4" />
						</svg>
					{:else if updater.status === 'error'}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7 10 12 15 17 10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
					{/if}
				</div>
				<div>
					<h3 class="text-lg font-bold text-white tracking-tight">
						{#if updater.status === 'available'}
							{m.updater_status_available()}
						{:else if updater.status === 'downloading'}
							{m.updater_status_downloading()}
						{:else if updater.status === 'downloaded'}
							{m.updater_status_downloaded()}
						{:else if updater.status === 'up-to-date'}
							{m.updater_status_up_to_date()}
						{:else if updater.status === 'error'}
							{m.updater_status_error()}
						{:else}
							{m.updater_check_btn()}
						{/if}
					</h3>
					<p class="text-xs text-slate-400">
						{#if updater.updateInfo}
							{m.updater_new_version()} <span class="font-semibold text-neonPink-400">v{updater.updateInfo.version}</span>
							{m.updater_current_version({ version: updater.updateInfo.currentVersion })}
						{:else}
							PHIMBOP Desktop
						{/if}
					</p>
				</div>
			</div>

			<!-- BODY: Content based on status -->
			{#if updater.status === 'available'}
				<!-- Critical Alert Banner -->
				{#if updater.updateInfo?.isCritical}
					<div class="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 text-rose-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
						<div>
							<span class="font-bold">{m.updater_critical_badge()}</span> {m.updater_critical_desc()}
						</div>
					</div>
				{/if}

				<!-- Changelog -->
				<div class="mb-6 rounded-2xl border border-white/5 bg-black/40 p-4">
					<p class="mb-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">{m.updater_changelog_title()}</p>
					<div class="max-h-48 overflow-y-auto text-xs text-slate-300 space-y-1 pr-2 whitespace-pre-wrap leading-relaxed">
						{updater.updateInfo?.releaseNotes || m.updater_changelog_default()}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-3">
					{#if !updater.updateInfo?.isCritical}
						<button
							type="button"
							onclick={() => updater.closeModal()}
							class="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
						>
							{m.updater_btn_later()}
						</button>
					{/if}
					<button
						type="button"
						onclick={() => updater.downloadAndInstall()}
						class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-neonPink-600 to-indigo-600 hover:from-neonPink-500 hover:to-indigo-500 shadow-lg shadow-neonPink-500/25 transition-all active:scale-95"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="7 10 12 15 17 10"></polyline>
							<line x1="12" y1="15" x2="12" y2="3"></line>
						</svg>
						<span>{m.updater_btn_update_now()}</span>
					</button>
				</div>

			{:else if updater.status === 'downloading'}
				<!-- Progress Bar -->
				<div class="space-y-4 my-6">
					<div class="flex justify-between text-xs text-slate-400">
						<span>{m.updater_downloading_pkg()}</span>
						<span class="font-bold text-white">{updater.progress}%</span>
					</div>
					<div class="w-full h-3 rounded-full bg-neutral-800 overflow-hidden border border-white/5">
						<div
							class="h-full bg-gradient-to-r from-neonPink-500 to-indigo-500 transition-all duration-300 rounded-full"
							style="width: {updater.progress}%"
						></div>
					</div>
					{#if updater.totalBytes > 0}
						<div class="text-right text-[11px] text-slate-500">
							{formatBytes(updater.downloadedBytes)} / {formatBytes(updater.totalBytes)}
						</div>
					{/if}
				</div>

			{:else if updater.status === 'downloaded'}
				<div class="my-6 text-sm text-slate-300">
					{m.updater_downloaded_desc()}
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => updater.relaunch()}
						class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
							<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
							<path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
						</svg>
						<span>{m.updater_btn_restart_now()}</span>
					</button>
				</div>

			{:else if updater.status === 'up-to-date'}
				<div class="my-6 text-sm text-slate-300 leading-relaxed">
					{m.updater_up_to_date_desc()}
				</div>
				<div class="flex justify-end">
					<button
						type="button"
						onclick={() => updater.closeModal()}
						class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-all"
					>
						{m.updater_btn_dismiss()}
					</button>
				</div>

			{:else if updater.status === 'error'}
				<div class="my-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
					{updater.error || m.updater_error_default()}
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => updater.checkForUpdates(true)}
						class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-all"
					>
						{m.updater_btn_retry()}
					</button>
					<button
						type="button"
						onclick={() => updater.closeModal()}
						class="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
					>
						{m.updater_close()}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
