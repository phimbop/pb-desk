import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { api } from '$lib/ipc';
import type { AuthUser } from '$lib/types';

class AuthStore {
	user = $state<AuthUser | null>(null);
	token = $state<string | null>(null);
	loading = $state<boolean>(true);
	private initialized = false;

	async init() {
		if (!browser || this.initialized) return;
		this.initialized = true;
		this.loading = true;

		try {
			const savedToken = localStorage.getItem('session_token');
			if (savedToken) {
				this.token = savedToken;
				const user = await api.getMe(savedToken);
				if (user && user.id) {
					this.user = user;
				} else {
					this.clearSession();
				}
			}
		} catch (error) {
			console.error('Failed to restore user session:', error);
			this.clearSession();
		} finally {
			this.loading = false;
		}
	}

	async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
		this.loading = true;
		try {
			const res = await api.login({ email, password });
			if (res.success && res.token) {
				this.token = res.token;
				this.user = res.user ?? null;
				if (browser) {
					localStorage.setItem('session_token', res.token);
					try {
						await invalidateAll();
					} catch (e) {
						console.warn('Failed to invalidateAll after login:', e);
					}
				}
				return { success: true };
			}
			return { success: false, error: res.error || 'Login failed' };
		} catch (err: any) {
			return { success: false, error: err?.message || 'Connection error' };
		} finally {
			this.loading = false;
		}
	}

	async signup(email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
		this.loading = true;
		try {
			const res = await api.signup({ email, username, password });
			if (res.success && res.token) {
				this.token = res.token;
				this.user = res.user ?? null;
				if (browser) {
					localStorage.setItem('session_token', res.token);
					try {
						await invalidateAll();
					} catch (e) {
						console.warn('Failed to invalidateAll after signup:', e);
					}
				}
				return { success: true };
			}
			return { success: false, error: res.error || 'Signup failed' };
		} catch (err: any) {
			return { success: false, error: err?.message || 'Connection error' };
		} finally {
			this.loading = false;
		}
	}

	async logout() {
		this.loading = true;
		try {
			if (this.token) {
				await api.logout(this.token);
			}
		} catch (_) {
			// Silently fail
		} finally {
			this.clearSession();
			if (browser) {
				try {
					await invalidateAll();
				} catch (e) {
					console.warn('Failed to invalidateAll after logout:', e);
				}
			}
			this.loading = false;
		}
	}

	private clearSession() {
		this.user = null;
		this.token = null;
		if (browser) {
			localStorage.removeItem('session_token');
		}
	}
}

export const authStore = new AuthStore();
