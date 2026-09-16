<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	interface Props {
		slug: string;
		user: { id: string; username: string } | null;
		vapidPublicKey: string;
	}

	let { slug, user, vapidPublicKey }: Props = $props();

	let isFollowing = $state(false);
	let isSubscribed = $state(false);
	let loading = $state(false);
	let error = $state('');
	let notSupported = $state(false);

	// Check browser support
	$effect(() => {
		if (typeof window !== 'undefined') {
			notSupported = !('serviceWorker' in navigator) || !('PushManager' in window);
		}
	});

	// Load follow state on mount
	$effect(() => {
		if (user && slug) {
			loadFollowState();
		}
	});

	async function loadFollowState() {
		try {
			const res = await fetch('/api/push/subscriptions');
			if (res.ok) {
				const data = await res.json();
				isSubscribed = data.subscribed;
				isFollowing = data.followed_series?.includes(slug) ?? false;
			}
		} catch {
			// Silently fail on load
		}
	}

	function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray.buffer as ArrayBuffer;
	}

	async function ensureSubscription(): Promise<boolean> {
		if (isSubscribed) return true;

		// Register service worker
		const registration = await navigator.serviceWorker.register('/sw.js');
		await navigator.serviceWorker.ready;

		// Request notification permission
		const permission = await Notification.requestPermission();
		if (permission !== 'granted') {
			error = m.push_permission_denied();
			return false;
		}

		// Subscribe to push
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
		});

		const subJson = subscription.toJSON();

		// Save to server
		const res = await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				endpoint: subJson.endpoint,
				keys: {
					p256dh: subJson.keys?.p256dh,
					auth: subJson.keys?.auth
				}
			})
		});

		if (!res.ok) {
			error = 'Failed to save subscription';
			return false;
		}

		isSubscribed = true;
		return true;
	}

	async function handleFollow() {
		if (!user || loading || notSupported) return;
		loading = true;
		error = '';

		try {
			// Ensure push subscription exists first
			const subscribed = await ensureSubscription();
			if (!subscribed) {
				loading = false;
				return;
			}

			if (isFollowing) {
				// Unfollow
				const res = await fetch(`/api/push/follow/${slug}`, { method: 'DELETE' });
				if (res.ok) {
					isFollowing = false;
				}
			} else {
				// Follow
				const res = await fetch(`/api/push/follow/${slug}`, { method: 'POST' });
				if (res.ok) {
					isFollowing = true;
				} else {
					const data = await res.json();
					if (res.status === 400 && data.error?.includes('Maximum')) {
						error = m.push_max_reached();
					} else {
						error = data.error || 'Failed to follow';
					}
				}
			}
		} catch (e) {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

{#if user}
	<div class="flex flex-col items-start gap-1">
		{#if notSupported}
			<button
				disabled
				class="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
				</svg>
				{m.push_disabled()}
			</button>
		{:else}
			<button
				onclick={handleFollow}
				disabled={loading}
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors {isFollowing
					? 'bg-emerald-600 text-white hover:bg-red-600'
					: 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				{:else if isFollowing}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
				{/if}
				{#if isFollowing}
					<span class="group-hover:hidden">{m.push_following()}</span>
					<span class="hidden group-hover:inline">{m.push_unfollow()}</span>
				{:else}
					{m.push_follow()}
				{/if}
			</button>
		{/if}
		{#if error}
			<p class="text-xs text-red-400">{error}</p>
		{/if}
	</div>
{/if}
