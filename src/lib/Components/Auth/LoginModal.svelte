<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';
	import MigrationPrompt from './MigrationPrompt.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let mode: 'login' | 'register' = $state('login');
	let email = $state('');
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showMigration = $state(false);
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (dialog && open) dialog.showModal();
	});

	function resetForm() {
		email = '';
		username = '';
		password = '';
		error = '';
	}

	function switchMode(newMode: 'login' | 'register') {
		mode = newMode;
		resetForm();
	}

	function close() {
		dialog?.close();
		open = false;
		resetForm();
		mode = 'login';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
			const body: Record<string, string> = { email, password };
			if (mode === 'register') {
				body.username = username;
			}

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || m.auth_error_generic();
				return;
			}

			close();
			const hasData = await needsMigration();
			if (browser && hasData) {
				showMigration = true;
			} else {
				window.location.reload();
			}
		} catch {
			error = m.auth_error_connection();
		} finally {
			loading = false;
		}
	}

	import { idbGet } from '$lib/runes/createStore.svelte';

	async function needsMigration(): Promise<boolean> {
		if (!browser) return false;
		if (localStorage.getItem('migration_completed') === 'true') return false;
		
		try {
			const idbPlayed = await idbGet<any[]>('movies', 'playedList');
			const idbFavorites = await idbGet<any[]>('movies', 'myListMovies');
			if ((idbPlayed && idbPlayed.length > 0) || (idbFavorites && idbFavorites.length > 0)) {
				return true;
			}
		} catch (e) {
			console.error('Error checking IndexedDB for migration:', e);
		}

		const played = localStorage.getItem('playedList');
		const favorites = localStorage.getItem('myListMovies');
		return !!(played || favorites);
	}

	function onMigrationComplete() {
		showMigration = false;
		window.location.reload();
	}
</script>

<MigrationPrompt bind:open={showMigration} onComplete={onMigrationComplete} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="bg-neutral-900 border-[0.5px] border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-md"
	onclose={() => { open = false; resetForm(); mode = 'login'; }}
	onclick={() => dialog!.close()}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={(e) => e.stopPropagation()}>
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-white">
				{mode === 'login' ? m.auth_login() : m.auth_register()}
			</h2>
			<button
				onclick={close}
				class="text-neutral-400 hover:text-white transition-all duration-150 ease-in-out p-1 rounded-lg hover:bg-neutral-800 active:scale-95"
				aria-label={m.auth_close()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Error message -->
		{#if error}
			<div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
				{error}
			</div>
		{/if}

		<!-- Form -->
		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="auth-email" class="block text-sm font-medium text-neutral-300 mb-1">{m.auth_email()}</label>
				<input
					id="auth-email"
					type="email"
					bind:value={email}
					required
					autocomplete="email"
					class="w-full px-4 py-2.5 bg-neutral-800 border-[0.5px] border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neonPink-500 focus:border-transparent transition-all duration-150 ease-in-out"
					placeholder="email@example.com"
				/>
			</div>

			{#if mode === 'register'}
				<div>
					<label for="auth-username" class="block text-sm font-medium text-neutral-300 mb-1">{m.auth_username()}</label>
					<input
						id="auth-username"
						type="text"
						bind:value={username}
						required
						minlength={3}
						maxlength={30}
						pattern="^[a-zA-Z0-9_]+$"
						autocomplete="username"
						class="w-full px-4 py-2.5 bg-neutral-800 border-[0.5px] border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neonPink-500 focus:border-transparent transition-all duration-150 ease-in-out"
						placeholder={m.auth_username_placeholder()}
					/>
					<p class="mt-1 text-xs text-neutral-500">{m.auth_username_hint()}</p>
				</div>
			{/if}

			<div>
				<label for="auth-password" class="block text-sm font-medium text-neutral-300 mb-1">{m.auth_password()}</label>
				<input
					id="auth-password"
					type="password"
					bind:value={password}
					required
					minlength={6}
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					class="w-full px-4 py-2.5 bg-neutral-800 border-[0.5px] border-white/20 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neonPink-500 focus:border-transparent transition-all duration-150 ease-in-out"
					placeholder="••••••••"
				/>
				{#if mode === 'register'}
					<p class="mt-1 text-xs text-neutral-500">{m.auth_password_hint()}</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2.5 px-4 ease-in-out bg-white/20 backdrop-blur-sm hover:bg-slate-950/40 hover:text-slate-50 border-[0.5px] border-white/20 rounded-full cursor-pointer font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						{m.auth_processing()}
					</span>
				{:else}
					{mode === 'login' ? m.auth_login() : m.auth_register()}
				{/if}
			</button>
		</form>

		<!-- Switch mode -->
		<div class="mt-4 text-center text-sm text-neutral-400">
			{#if mode === 'login'}
				{m.auth_no_account()}
				<button onclick={() => switchMode('register')} class="text-neonPink-500 hover:text-neonPink-400 font-medium transition-all duration-150 ease-in-out">
					{m.auth_register_now()}
				</button>
			{:else}
				{m.auth_has_account()}
				<button onclick={() => switchMode('login')} class="text-neonPink-500 hover:text-neonPink-400 font-medium transition-all duration-150 ease-in-out">
					{m.auth_login()}
				</button>
			{/if}
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: none;
		margin: auto;
		padding: 1.5rem;
		max-width: 28rem;
		width: calc(100% - 2rem);
		background: rgb(23 23 23); /* neutral-900 */
		border-radius: 1rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		border: 0.5px solid rgba(255, 255, 255, 0.2);
		color: white;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
