<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { fade, slide } from 'svelte/transition';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { appFetch } from '$lib/ipc';

	let { data } = $props<{
		data: {
			playlists: any[];
			user: any;
		};
	}>();

	let playlists: any[] = $state([]);
	$effect(() => {
		playlists = data.playlists;
	});

	// Create Playlist State
	let showCreateForm = $state(false);
	let newName = $state('');
	let newDesc = $state('');
	let newPublic = $state(false);
	let creating = $state(false);

	// Edit Playlist State
	let editingPlaylistId = $state<string | null>(null);
	let editName = $state('');
	let editDesc = $state('');
	let editPublic = $state(false);
	let updating = $state(false);

	// Share State
	let copiedId = $state<string | null>(null);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName.trim()) return;

		creating = true;
		try {
			const res = await appFetch('/api/playlists', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newName.trim(),
					description: newDesc.trim(),
					public: newPublic
				})
			});
			if (res.ok) {
				const newPlaylist = await res.json();
				playlists = [newPlaylist, ...playlists];
				newName = '';
				newDesc = '';
				newPublic = false;
				showCreateForm = false;
			} else {
				const errorData = await res.json();
				alert(errorData.error || m.alert_error_occurred());
			}
		} catch (err) {
			console.error(err);
			alert(m.alert_error_occurred());
		} finally {
			creating = false;
		}
	}

	function startEdit(playlist: any) {
		editingPlaylistId = playlist.id;
		editName = playlist.name;
		editDesc = playlist.description || '';
		editPublic = playlist.public;
	}

	function cancelEdit() {
		editingPlaylistId = null;
		editName = '';
		editDesc = '';
		editPublic = false;
	}

	async function handleUpdate(id: string, e: Event) {
		e.preventDefault();
		if (!editName.trim()) return;

		updating = true;
		try {
			const res = await appFetch(`/api/playlists/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editName.trim(),
					description: editDesc.trim(),
					public: editPublic
				})
			});
			if (res.ok) {
				const updated = await res.json();
				playlists = playlists.map((p) => (p.id === id ? updated : p));
				cancelEdit();
			} else {
				const errorData = await res.json();
				alert(errorData.error || m.alert_error_occurred());
			}
		} catch (err) {
			console.error(err);
			alert(m.alert_error_occurred());
		} finally {
			updating = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm(m.playlist_delete_confirm())) return;

		try {
			const res = await appFetch(`/api/playlists/${id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				playlists = playlists.filter((p) => p.id !== id);
			} else {
				alert(m.alert_error_occurred());
			}
		} catch (err) {
			console.error(err);
			alert(m.alert_error_occurred());
		}
	}

	function copyShareLink(id: string, isPublic: boolean) {
		if (!isPublic) {
			alert(m.playlist_private() + ' - ' + m.alert_error_occurred());
			return;
		}
		const link = `https://phimbop.top/playlist/${id}`;
		navigator.clipboard.writeText(link).then(() => {
			copiedId = id;
			setTimeout(() => {
				copiedId = null;
			}, 2000);
		});
	}
</script>

<svelte:head>
	<title>{m.playlist_title()} | BOP</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section in:fade={{ duration: 250 }} class="w-full mt-24 mb-16 px-4 md:px-8">
	<div class="max-w-4xl mx-auto space-y-8">
		
		<!-- Header and Create Trigger -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
			<div class="space-y-1">
				<h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">
					{m.playlist_title()}
				</h1>
				<p class="text-xs text-slate-300 font-medium">
					{m.playlist_max_reached().replace('50', '')} (Max 50 playlists/user)
				</p>
			</div>
			
			{#if !showCreateForm}
				<button
					onclick={() => (showCreateForm = true)}
					class="px-6 py-2.5 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-bold rounded-full shadow-lg shadow-neonPink-500/25 transition duration-200 text-sm cursor-pointer active:scale-95"
				>
					+ {m.playlist_create()}
				</button>
			{/if}
		</div>

		<!-- Create Playlist Form -->
		{#if showCreateForm}
			<div transition:slide={{ duration: 250 }} class="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
				<div class="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 rounded-full bg-neonPink-500/5 blur-3xl pointer-events-none"></div>
				
				<h2 class="text-lg font-extrabold text-white mb-4 tracking-tight">{m.playlist_create()}</h2>
				
				<form onsubmit={handleCreate} class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-1">
							<label for="create-name" class="block text-xs font-semibold text-slate-350">{m.playlist_name()}</label>
							<input
								id="create-name"
								type="text"
								bind:value={newName}
								required
								maxlength={100}
								class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white text-sm placeholder-slate-650 focus:outline-none focus:border-neonPink-500/50 transition duration-150"
								placeholder={m.playlist_name()}
							/>
						</div>
						<div class="flex items-center justify-between sm:justify-start sm:gap-6 pt-5">
							<label for="create-public" class="text-xs font-semibold text-slate-350 cursor-pointer select-none">
								{m.playlist_public()}
							</label>
							<input
								id="create-public"
								type="checkbox"
								bind:checked={newPublic}
								class="w-5 h-5 accent-neonPink-500 rounded-lg border border-white/10 focus:ring-0 focus:ring-offset-0 bg-neutral-850 text-neonPink-500 cursor-pointer"
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label for="create-desc" class="block text-xs font-semibold text-slate-350">{m.playlist_description()}</label>
						<textarea
							id="create-desc"
							bind:value={newDesc}
							maxlength={500}
							rows="3"
							class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white text-sm placeholder-slate-650 focus:outline-none focus:border-neonPink-500/50 transition duration-150 resize-none"
							placeholder={m.playlist_description()}
						></textarea>
					</div>

					<div class="flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onclick={() => (showCreateForm = false)}
							class="px-5 py-2.5 border border-white/10 text-slate-350 font-bold rounded-full cursor-pointer text-xs hover:bg-neutral-800 transition duration-150"
						>
							{m.reuse_close()}
						</button>
						<button
							type="submit"
							disabled={creating || !newName.trim()}
							class="px-6 py-2.5 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-bold rounded-full cursor-pointer text-xs shadow-md shadow-neonPink-500/10 disabled:opacity-50 transition duration-150"
						>
							{creating ? m.auth_processing() : m.playlist_create()}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Playlists Dashboard Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each playlists as playlist (playlist.id)}
				<div class="relative rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-md p-6 hover:border-neonPink-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg">
					
					{#if editingPlaylistId === playlist.id}
						<!-- Inline Edit View -->
						<form onsubmit={(e) => handleUpdate(playlist.id, e)} class="space-y-4">
							<div class="space-y-3">
								<div>
									<label for="edit-name" class="block text-xs font-semibold text-slate-300 mb-1">{m.playlist_name()}</label>
									<input
										id="edit-name"
										type="text"
										bind:value={editName}
										required
										maxlength={100}
										class="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neonPink-500/50"
									/>
								</div>
								<div>
									<label for="edit-desc" class="block text-xs font-semibold text-slate-300 mb-1">{m.playlist_description()}</label>
									<textarea
										id="edit-desc"
										bind:value={editDesc}
										maxlength={500}
										rows="2"
										class="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-neonPink-500/50 resize-none"
									></textarea>
								</div>
								<div class="flex items-center justify-between py-1">
									<label for="edit-public" class="text-xs font-semibold text-slate-300 cursor-pointer select-none">
										{m.playlist_public()}
									</label>
									<input
										id="edit-public"
										type="checkbox"
										bind:checked={editPublic}
										class="w-5 h-5 accent-neonPink-500 rounded-lg border border-white/10 bg-neutral-850 text-neonPink-500 cursor-pointer"
									/>
								</div>
							</div>
							<div class="flex items-center justify-end gap-2 pt-1">
								<button
									type="button"
									onclick={cancelEdit}
									class="px-4 py-2 border border-white/10 text-slate-300 font-semibold rounded-full cursor-pointer text-xs hover:bg-neutral-800 transition duration-150"
								>
									{m.reuse_close()}
								</button>
								<button
									type="submit"
									disabled={updating || !editName.trim()}
									class="px-5 py-2 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-bold rounded-full cursor-pointer text-xs disabled:opacity-50 transition duration-150"
								>
									{updating ? m.auth_processing() : m.playlist_update()}
								</button>
							</div>
						</form>
					{:else}
						<!-- Normal Card View -->
						<div class="space-y-4">
							<div class="flex items-start justify-between gap-2">
								<div class="space-y-1 min-w-0">
									<h2 class="text-xl font-bold text-white tracking-tight truncate group-hover:text-neonPink-400">
										{playlist.name}
									</h2>
									<p class="text-xs text-slate-500 font-medium">
										{playlist.movies?.length ?? 0} {playlist.movies?.length === 1 ? m.reuse_movies().toLowerCase().replace('phim', 'phim') : m.reuse_movies().toLowerCase()}
									</p>
								</div>
								<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold {playlist.public ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
									{playlist.public ? m.playlist_public() : m.playlist_private()}
								</span>
							</div>

							{#if playlist.description}
								<p class="text-sm text-slate-400 line-clamp-2 leading-relaxed">
									{playlist.description}
								</p>
							{:else}
								<p class="text-sm text-slate-600 italic">
									{m.playlist_empty()}
								</p>
							{/if}
						</div>

						<div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
							<a
								href={localizeHref(`/playlist/${playlist.id}`)}
								class="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold rounded-full transition duration-150 cursor-pointer"
							>
								{m.reuse_watch()}
							</a>
							
							<div class="flex items-center gap-2">
								{#if playlist.public}
									<button
										onclick={() => copyShareLink(playlist.id, playlist.public)}
										class="p-2 text-slate-400 hover:text-neonPink-500 rounded-full hover:bg-slate-850 active:scale-95 transition-all duration-150 cursor-pointer relative"
										title={m.playlist_share()}
									>
										{#if copiedId === playlist.id}
											<span transition:fade class="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-neutral-900 border border-white/10 text-white rounded text-[10px] whitespace-nowrap shadow-md">
												{m.playlist_copied()}
											</span>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M8.684 10.742l5.428-2.714m0 5.944l-5.429-2.714m6.586-4.32a3 3 0 11-6 0 3 3 0 016 0zm-6.586 8.64a3 3 0 11-6 0 3 3 0 016 0zm6.586 2.24a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										{/if}
									</button>
								{/if}
								
								<button
									onclick={() => startEdit(playlist)}
									class="p-2 text-slate-400 hover:text-neonPink-500 rounded-full hover:bg-slate-850 active:scale-95 transition-all duration-150 cursor-pointer"
									title={m.playlist_create()}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
									</svg>
								</button>
								<button
									onclick={() => handleDelete(playlist.id)}
									class="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-850 active:scale-95 transition-all duration-150 cursor-pointer"
									title={m.playlist_delete()}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="col-span-1 md:col-span-2 rounded-3xl border border-white/5 bg-slate-900/10 py-16 text-center space-y-4">
					<div class="w-16 h-16 mx-auto rounded-full bg-slate-900/40 flex items-center justify-center text-slate-500">
						<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
					<p class="text-slate-400 text-sm font-medium">{m.playlist_empty()}</p>
					{#if !showCreateForm}
						<button
							onclick={() => (showCreateForm = true)}
							class="inline-flex px-6 py-2 bg-gradient-to-r from-neonPink-600 to-neonPink-700 hover:from-neonPink-500 hover:to-neonPink-600 text-white font-bold rounded-full shadow-lg shadow-neonPink-500/20 transition duration-200 text-xs cursor-pointer"
						>
							{m.playlist_create()}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
