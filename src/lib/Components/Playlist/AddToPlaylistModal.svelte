<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';

	interface Props {
		open: boolean;
		movieId: number | string;
		title: string;
		posterPath: string | null | undefined;
		isTv?: boolean;
	}

	let { open = $bindable(false), movieId, title, posterPath, isTv = false }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let playlists: any[] = $state([]);
	let loading = $state(false);
	let error = $state('');

	// Create new playlist form state
	let newName = $state('');
	let newDesc = $state('');
	let newPublic = $state(false);
	let creating = $state(false);
	let showCreateForm = $state(false);

	async function fetchPlaylists() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/playlists');
			if (res.ok) {
				playlists = await res.json();
			} else {
				error = m.alert_error_occurred();
			}
		} catch {
			error = m.alert_error_occurred();
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open) {
			fetchPlaylists();
			if (dialog) dialog.showModal();
		}
	});

	function close() {
		dialog?.close();
		open = false;
		showCreateForm = false;
		newName = '';
		newDesc = '';
		newPublic = false;
	}

	function isMovieInPlaylist(playlist: any) {
		return playlist.movies?.some((m: any) => m.tmdb_id === movieId) ?? false;
	}

	async function handleTogglePlaylist(playlist: any, check: boolean) {
		try {
			if (check) {
				const res = await fetch(`/api/playlists/${playlist.id}/movies`, {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'Origin': window.location.origin
					},
					body: JSON.stringify({
						tmdb_id: movieId,
						title,
						poster_path: posterPath ?? '',
						is_tv: isTv
					})
				});
				if (!res.ok) {
					const data = await res.json();
					alert(data.error || m.alert_error_occurred());
					await fetchPlaylists(); // reset
				} else {
					const updated = await res.json();
					playlists = playlists.map(p => p.id === playlist.id ? updated : p);
				}
			} else {
				const res = await fetch(`/api/playlists/${playlist.id}/movies/${movieId}`, {
					method: 'DELETE',
					headers: {
						'Origin': window.location.origin
					}
				});
				if (!res.ok) {
					const data = await res.json();
					alert(data.error || m.alert_error_occurred());
					await fetchPlaylists(); // reset
				} else {
					const updated = await res.json();
					playlists = playlists.map(p => p.id === playlist.id ? updated : p);
				}
			}
		} catch (err) {
			console.error('Failed to toggle playlist movie:', err);
			alert(m.alert_error_occurred());
			await fetchPlaylists();
		}
	}

	async function handleCreatePlaylist(e: Event) {
		e.preventDefault();
		if (!newName.trim()) return;

		creating = true;
		try {
			const res = await fetch('/api/playlists', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Origin': window.location.origin
				},
				body: JSON.stringify({
					name: newName.trim(),
					description: newDesc.trim(),
					public: newPublic
				})
			});

			if (res.ok) {
				const newPlaylist = await res.json();
				// Reset form
				newName = '';
				newDesc = '';
				newPublic = false;
				showCreateForm = false;
				playlists = [newPlaylist, ...playlists];

				// Automatically add the movie to the newly created playlist
				await handleTogglePlaylist(newPlaylist, true);
			} else {
				const data = await res.json();
				alert(data.error || m.alert_error_occurred());
			}
		} catch (err) {
			console.error('Failed to create playlist:', err);
			alert(m.alert_error_occurred());
		} finally {
			creating = false;
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="bg-neutral-900 border-[0.5px] border-white/20 rounded-3xl shadow-2xl p-6 w-full max-w-md"
	onclose={close}
	onclick={() => dialog!.close()}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={(e) => e.stopPropagation()} class="flex flex-col space-y-4">
		<!-- Header -->
		<div class="flex items-center justify-between pb-2 border-b border-white/5">
			<h2 class="text-xl font-black text-white tracking-tight">
				{m.playlist_add_movie()}
			</h2>
			<button
				onclick={close}
				class="text-neutral-400 hover:text-white transition-all duration-150 ease-in-out p-1.5 rounded-xl hover:bg-neutral-800 active:scale-95"
				aria-label={m.auth_close()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Error alert -->
		{#if error}
			<div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
				{error}
			</div>
		{/if}

		<!-- Playlists list -->
		<div class="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<svg class="animate-spin h-6 w-6 text-neonPink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				</div>
			{:else}
				{#each playlists as playlist (playlist.id)}
					<label class="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-950/40 hover:bg-slate-900/60 cursor-pointer transition duration-150 select-none group">
						<div class="flex flex-col min-w-0 pr-2">
							<span class="text-sm font-bold text-slate-200 group-hover:text-white truncate">{playlist.name}</span>
							<span class="text-xs text-slate-500 font-medium">
								{playlist.movies?.length ?? 0} {m.reuse_movies().toLowerCase()} • {playlist.public ? m.playlist_public().toLowerCase() : m.playlist_private().toLowerCase()}
							</span>
						</div>
						<input
							type="checkbox"
							checked={isMovieInPlaylist(playlist)}
							onchange={(e) => handleTogglePlaylist(playlist, (e.target as HTMLInputElement).checked)}
							class="w-5 h-5 accent-neonPink-500 rounded-lg border border-white/10 focus:ring-0 focus:ring-offset-0 bg-neutral-850 text-neonPink-500 cursor-pointer"
						/>
					</label>
				{:else}
					<div class="text-center py-6 text-slate-500 text-sm">
						{m.playlist_empty()}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Action bar & Form toggle -->
		{#if !showCreateForm}
			<button
				onclick={() => (showCreateForm = true)}
				class="w-full py-2.5 px-4 bg-neonPink-500/10 hover:bg-neonPink-500/20 border border-neonPink-500/20 hover:border-neonPink-500/40 text-neonPink-400 font-bold rounded-2xl cursor-pointer text-sm transition duration-150 active:scale-98"
			>
				+ {m.playlist_create()}
			</button>
		{:else}
			<form onsubmit={handleCreatePlaylist} class="space-y-3 pt-2 border-t border-white/5">
				<div>
					<label for="p-name" class="block text-xs font-semibold text-slate-300 mb-1">{m.playlist_name()}</label>
					<input
						id="p-name"
						type="text"
						bind:value={newName}
						required
						maxlength={100}
						class="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-neonPink-500/50 transition duration-150"
						placeholder={m.playlist_name()}
					/>
				</div>

				<div>
					<label for="p-desc" class="block text-xs font-semibold text-slate-300 mb-1">{m.playlist_description()}</label>
					<textarea
						id="p-desc"
						bind:value={newDesc}
						maxlength={500}
						rows="2"
						class="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-neonPink-500/50 transition duration-150 resize-none"
						placeholder={m.playlist_description()}
					></textarea>
				</div>

				<div class="flex items-center justify-between py-1">
					<label for="p-public" class="text-xs font-semibold text-slate-300 cursor-pointer select-none">
						{m.playlist_public()}
					</label>
					<input
						id="p-public"
						type="checkbox"
						bind:checked={newPublic}
						class="w-5 h-5 accent-neonPink-500 rounded-lg border border-white/10 focus:ring-0 focus:ring-offset-0 bg-neutral-850 text-neonPink-500 cursor-pointer"
					/>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<button
						type="button"
						onclick={() => (showCreateForm = false)}
						class="w-1/2 py-2 border border-white/10 text-slate-300 font-semibold rounded-2xl cursor-pointer text-xs hover:bg-neutral-800 transition duration-150"
					>
						{m.reuse_close()}
					</button>
					<button
						type="submit"
						disabled={creating || !newName.trim()}
						class="w-1/2 py-2 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-bold rounded-2xl cursor-pointer text-xs disabled:opacity-50 transition duration-150"
					>
						{creating ? m.auth_processing() : m.playlist_create()}
					</button>
				</div>
			</form>
		{/if}
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
	}
	dialog[open] {
		animation: zoom 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
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
	
	/* Custom scrollbar styling */
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 99px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.25);
	}
</style>
