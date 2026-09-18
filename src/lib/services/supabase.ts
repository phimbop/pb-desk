import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
	if (!supabaseClient) {
		const url =
			(typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
			SUPABASE_URL;
		const key =
			(typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
			SUPABASE_ANON_KEY;
		if (url && key) {
			supabaseClient = createClient(url, key);
		}
	}
	return supabaseClient;
}

export async function getNewAddedMovies(): Promise<any[]> {
	try {
		const client = getSupabase();
		if (client) {
			const res = await client.from('new_added').select();
			if (!res.error && res.data && res.data.length > 0 && res.data[0]?.json) {
				return res.data[0].json;
			}
			if (res.error) {
				console.warn('[Supabase client select failed, falling back to REST fetch]:', res.error);
			}
		}

		// Fallback: direct REST API fetch
		const url = `${SUPABASE_URL}/rest/v1/new_added?select=*`;
		const res = await fetch(url, {
			headers: {
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`
			}
		});
		if (!res.ok) {
			console.error(`[Supabase REST Error] status: ${res.status}`);
			return [];
		}
		const data = await res.json();
		return data && data.length > 0 && data[0]?.json ? data[0].json : [];
	} catch (err) {
		console.error('[Supabase getNewAddedMovies Error]:', err);
		return [];
	}
}

export async function getRemoteApiDomain(): Promise<string | null> {
	try {
		const client = getSupabase();
		if (client) {
			const { data, error } = await client
				.from('app_configs')
				.select('value')
				.eq('key', 'api_domain')
				.maybeSingle();

			if (!error && data?.value && typeof data.value === 'string') {
				const trimmed = data.value.trim().replace(/\/+$/, '');
				if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
					return trimmed;
				}
			}
		}

		// Fallback: direct REST API fetch
		const url = `${SUPABASE_URL}/rest/v1/app_configs?key=eq.api_domain&select=value`;
		const res = await fetch(url, {
			headers: {
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`
			}
		});
		if (res.ok) {
			const data = await res.json();
			if (Array.isArray(data) && data[0]?.value && typeof data[0].value === 'string') {
				const trimmed = data[0].value.trim().replace(/\/+$/, '');
				if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
					return trimmed;
				}
			}
		}
	} catch (err) {
		console.warn('[Supabase getRemoteApiDomain Error]:', err);
	}
	return null;
}

