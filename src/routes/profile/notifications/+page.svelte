<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { fade, slide } from 'svelte/transition';
	import { unreadNotificationsCount } from '$lib/runes/notificationStore.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { appFetch } from '$lib/ipc';

	interface NotificationItem {
		id: string;
		recipient?: string;
		sender?: {
			id: string;
			username: string;
			avatar_url?: string | null;
		} | null;
		type?: 'mention' | 'system' | 'reply' | 'like' | string;
		title?: string | null;
		content?: string | null;
		link?: string | null;
		is_read?: boolean;
		created_at?: string;
		extra_data?: any;
	}

	let { data }: { data: { notifications: NotificationItem[] } } = $props();

	let notifications = $state<NotificationItem[]>([]);

	$effect(() => {
		notifications = data.notifications || [];
	});

	let unreadCount = $derived(notifications.filter((n) => !n.is_read).length);

	$effect(() => {
		unreadNotificationsCount.value = unreadCount;
	});

	async function markAllAsRead() {
		if (unreadCount === 0) return;
		try {
			const res = await appFetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'mark-all-read' })
			});
			if (res.ok) {
				notifications = notifications.map((n) => ({ ...n, is_read: true }));
				unreadNotificationsCount.value = 0;
			}
		} catch (err) {
			console.error('Failed to mark all notifications as read:', err);
		}
	}

	async function handleNotificationClick(notification: NotificationItem) {
		if (!notification.is_read) {
			try {
				const res = await appFetch('/api/notifications', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'mark-read', id: notification.id })
				});
				if (res.ok) {
					notifications = notifications.map((n) =>
						n.id === notification.id ? { ...n, is_read: true } : n
					);
				}
			} catch (err) {
				console.error('Failed to mark notification as read:', err);
			}
		}

		if (notification.link) {
			window.location.href = localizeHref(notification.link);
		}
	}

	async function deleteIndividual(id: string) {
		try {
			const res = await appFetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', id })
			});
			if (res.ok) {
				notifications = notifications.filter((n) => n.id !== id);
			}
		} catch (err) {
			console.error('Failed to delete notification:', err);
		}
	}

	async function deleteAll() {
		if (notifications.length === 0) return;
		try {
			const res = await appFetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete-all' })
			});
			if (res.ok) {
				notifications = [];
				unreadNotificationsCount.value = 0;
			}
		} catch (err) {
			console.error('Failed to delete all notifications:', err);
		}
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		const diffHour = Math.floor(diffMs / 3600000);
		const diffDay = Math.floor(diffMs / 86400000);

		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m`;
		if (diffHour < 24) return `${diffHour}h`;
		if (diffDay < 30) return `${diffDay}d`;
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>{m.notifications_title()} | BOP</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section in:fade={{ duration: 250 }} class="w-full mt-24 mb-16 px-4 md:px-8">
	<div class="max-w-3xl mx-auto space-y-6">
		<!-- Header row -->
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-neonPink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
				{m.notifications_title()}
				{#if unreadCount > 0}
					<span class="ml-2 px-2.5 py-0.5 text-xs font-extrabold bg-neonPink-500 text-white rounded-full animate-pulse shadow-md shadow-neonPink-500/25">
						{unreadCount}
					</span>
				{/if}
			</h2>

			<div class="flex items-center gap-2">
				{#if unreadCount > 0}
					<button
						onclick={markAllAsRead}
						class="px-4 py-1.5 text-xs font-semibold rounded-full border border-neonPink-500/20 bg-neonPink-500/10 text-neonPink-400 hover:bg-neonPink-500/20 hover:border-neonPink-500/30 transition-all duration-200 cursor-pointer shadow-lg shadow-neonPink-500/5 active:scale-95"
					>
						{m.notifications_mark_all_read()}
					</button>
				{/if}
				{#if notifications.length > 0}
					<button
						onclick={deleteAll}
						class="px-4 py-1.5 text-xs font-semibold rounded-full border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 cursor-pointer active:scale-95"
					>
						{m.notifications_delete_all()}
					</button>
				{/if}
			</div>
		</div>

		<!-- Notifications list card wrapper -->
		<div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-4 md:p-6 min-h-[300px]">
			<!-- Decorative Background Gradients -->
			<div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-neonPink-500/5 blur-3xl pointer-events-none"></div>
			<div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-neonPink-600/5 blur-3xl pointer-events-none"></div>

			{#if notifications.length === 0}
				<div class="flex flex-col items-center justify-center text-center py-16 space-y-4" in:fade>
					<div class="w-16 h-16 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 border border-white/5">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
					</div>
					<p class="text-slate-400 text-sm font-medium">{m.notifications_empty()}</p>
				</div>
			{:else}
				<div class="divide-y divide-white/5 space-y-1.5">
					{#each notifications as notification (notification.id)}
						<div
							class="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 relative group border-transparent bg-transparent {!notification.is_read ? 'bg-neonPink-500/5 border-l-4 border-l-neonPink-500' : 'hover:bg-white/5'}"
							out:slide={{ duration: 200 }}
						>
							<!-- Clickable Area -->
							<button
								onclick={() => handleNotificationClick(notification)}
								class="flex-1 text-left flex gap-4 bg-transparent border-none p-0 cursor-pointer focus:outline-hidden"
							>
								<!-- Avatar / Badge indicator -->
								<div class="flex-shrink-0 relative">
									{#if notification.sender?.avatar_url}
										<img
											src={notification.sender.avatar_url}
											alt={notification.sender.username}
											class="w-10 h-10 rounded-full object-cover border border-white/10"
										/>
									{:else if notification.sender}
										<div class="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-extrabold text-sm border border-white/10">
											{notification.sender.username.charAt(0).toUpperCase()}
										</div>
									{:else}
										<div class="w-10 h-10 rounded-full bg-neonPink-950/40 flex items-center justify-center text-neonPink-400 border border-white/10">
											<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/><line x1="15" x2="9" y1="9" y2="15"/></svg>
										</div>
									{/if}
									
									<!-- Unread indicator dot -->
									{#if !notification.is_read}
										<span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neonPink-500 ring-2 ring-slate-950 animate-pulse"></span>
									{/if}
								</div>

								<!-- Content details -->
								<div class="flex-1 min-w-0 space-y-1">
									<div class="flex items-center justify-between gap-2">
										<span class="text-xs font-bold tracking-wider text-neonPink-400 uppercase">
											{#if notification.type === 'mention'}
												{m.notification_type_mention()}
											{:else}
												{m.notification_type_system()}
											{/if}
										</span>
										<span class="text-xs text-slate-500 font-medium">{formatDate(notification.created_at)}</span>
									</div>

									<p class="text-sm font-medium text-slate-200 leading-snug break-words">
										{#if notification.type === 'mention' && notification.extra_data}
											{m.notification_mention_content({
												username: notification.extra_data.sender_username ?? 'Someone',
												text: notification.extra_data.content_snippet ?? ''
											})}
										{:else}
											{notification.content || notification.title || ''}
										{/if}
									</p>
								</div>
							</button>

							<!-- Delete button (visible on hover) -->
							<button
								onclick={(e) => { e.stopPropagation(); deleteIndividual(notification.id); }}
								class="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
								aria-label={m.notifications_delete()}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>
