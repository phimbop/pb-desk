self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	const title = data.title || 'Phimbop';
	const options = {
		body: data.body || 'New episode available!',
		icon: '/favicon.png',
		badge: '/favicon.png',
		data: { url: data.url || '/' }
	};
	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/';
	event.waitUntil(clients.openWindow(url));
});
