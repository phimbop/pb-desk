import { isTauri, api } from '$lib/ipc';
import { getSupabase } from '$lib/services/supabase';
import { SUPABASE_ANON_KEY } from '$lib';
import { m } from '$lib/paraglide/messages';

export interface UpdateInfo {
	version: string;
	currentVersion: string;
	releaseNotes: string;
	pubDate?: string;
	isCritical: boolean;
	minSupportedVersion?: string;
}

export type UpdateStatus =
	| 'idle'
	| 'checking'
	| 'available'
	| 'downloading'
	| 'downloaded'
	| 'up-to-date'
	| 'error';

const INSTALLATION_KEY = 'pb_desk_installation_id';
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Lấy hoặc khởi tạo ID cài đặt cố định cho từng thiết bị (UUIDv4)
 * Ưu tiên lưu và truy xuất bền vững từ SQLite pb_storage qua Tauri IPC.
 */
export async function getOrCreateInstallationId(): Promise<string> {
	if (isTauri()) {
		try {
			const id = await api.getInstallationId();
			if (id && UUID_REGEX.test(id)) {
				return id;
			}
			throw new Error(`Invalid installation_id format from native storage: ${id}`);
		} catch (e) {
			console.error('[Updater] Failed to get persistent installation_id from SQLite storage:', e);
			throw new Error(`Cannot retrieve persistent installation_id from native SQLite storage: ${e}`);
		}
	}

	// Môi trường Web browser / Dev mode (không phải Tauri desktop)
	if (typeof window !== 'undefined' && window.localStorage) {
		let id = localStorage.getItem(INSTALLATION_KEY);
		if (!id || !UUID_REGEX.test(id)) {
			id = crypto.randomUUID();
			localStorage.setItem(INSTALLATION_KEY, id);
		}
		return id;
	}

	return '00000000-0000-0000-0000-000000000000';
}

class UpdaterService {
	status = $state<UpdateStatus>('idle');
	currentVersion = $state<string>('0.1.11');
	updateInfo = $state<UpdateInfo | null>(null);
	progress = $state<number>(0);
	downloadedBytes = $state<number>(0);
	totalBytes = $state<number>(0);
	error = $state<string | null>(null);
	modalOpen = $state<boolean>(false);

	// Lưu instance Tauri/Electron Update đang hoạt động
	private activeUpdate: any = null;

	constructor() {
		if (typeof window !== 'undefined' && (window as any).electronAPI?.getAppVersion) {
			(window as any).electronAPI
				.getAppVersion()
				.then((v: string) => {
					if (v) this.currentVersion = v;
				})
				.catch(() => {});
		}
	}

	/**
	 * Kiểm tra xem phiên bản hiện tại có thấp hơn phiên bản yêu cầu không
	 */
	private isVersionLower(current: string, target: string): boolean {
		const clean = (v: string) => v.replace(/^v/, '').split('-')[0];
		const cParts = clean(current).split('.').map((n) => parseInt(n, 10) || 0);
		const tParts = clean(target).split('.').map((n) => parseInt(n, 10) || 0);
		for (let i = 0; i < Math.max(cParts.length, tParts.length); i++) {
			const c = cParts[i] || 0;
			const t = tParts[i] || 0;
			if (c < t) return true;
			if (c > t) return false;
		}
		return false;
	}

	/**
	 * Kiểm tra bản cập nhật mới từ Supabase & Tauri v2 Updater
	 * @param manual Nếu là true (người dùng bấm nút kiểm tra), sẽ luôn mở thông báo kết quả
	 */
	async checkForUpdates(manual: boolean = false): Promise<boolean> {
		if (this.status === 'checking' || this.status === 'downloading') {
			return false;
		}

		this.status = 'checking';
		this.error = null;
		this.progress = 0;

		try {
			if (!isTauri()) {
				// Môi trường Web browser / Dev mode: Kiểm tra trực tiếp qua Supabase Client
				return await this.checkViaSupabaseWeb(manual);
			}

			// Môi trường Desktop (Electron)
			const installationId = await getOrCreateInstallationId();
			const headers: Record<string, string> = {
				'x-installation-id': installationId,
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`
			};

			let update: any = null;
			if (typeof window !== 'undefined' && (window as any).electronAPI?.updater) {
				const checkRes = await (window as any).electronAPI.updater.check();
				if (checkRes && checkRes.updateAvailable) {
					if (checkRes.currentVersion) {
						this.currentVersion = checkRes.currentVersion;
					}
					update = {
						available: true,
						version: checkRes.version,
						currentVersion: checkRes.currentVersion || this.currentVersion,
						body: checkRes.notes,
						url: checkRes.url
					};
				}
			}

			if (!update) {
				// Fallback to Supabase web check if electron check returned no update
				return await this.checkViaSupabaseWeb(manual);
			}

			if (update && update.available) {
				this.activeUpdate = update;

				// Kiểm tra thêm thông tin phụ từ Supabase (is_critical, min_supported_version)
				let isCritical = false;
				let minSupportedVersion: string | undefined;

				try {
					const supabase = getSupabase();
					if (supabase) {
						const { data } = await supabase
							.from('app_versions')
							.select('is_critical, min_supported_version')
							.eq('version', update.version)
							.eq('is_active', true)
							.limit(1)
							.single();

						if (data) {
							isCritical = data.is_critical || false;
							minSupportedVersion = data.min_supported_version;
							if (minSupportedVersion && this.isVersionLower(update.currentVersion, minSupportedVersion)) {
								isCritical = true;
							}
						}
					}
				} catch (e) {
					console.warn('[Updater] Failed to query extra metadata from Supabase:', e);
				}

				this.updateInfo = {
					version: update.version,
					currentVersion: update.currentVersion,
					releaseNotes: update.body || '',
					pubDate: update.date,
					isCritical,
					minSupportedVersion
				};

				this.status = 'available';
				this.modalOpen = true;
				return true;
			} else {
				this.status = 'up-to-date';
				this.activeUpdate = null;
				this.updateInfo = null;
				if (manual) {
					this.modalOpen = true;
				}
				return false;
			}
		} catch (err: any) {
			console.error('[Updater] Check for updates error:', err);
			this.status = 'error';
			const errorMsg = typeof err === 'string' ? err : err?.message || String(err || '');
			this.error = errorMsg || m.updater_error_check();
			if (manual) {
				this.modalOpen = true;
			}
			return false;
		}
	}

	/**
	 * Kiểm tra trực tiếp qua Supabase khi chạy trên Web hoặc Dev
	 */
	private async checkViaSupabaseWeb(manual: boolean): Promise<boolean> {
		try {
			const supabase = getSupabase();
			if (!supabase) {
				this.status = 'up-to-date';
				if (manual) this.modalOpen = true;
				return false;
			}

			const currentVersion = '0.1.11';
			const activeVer = this.currentVersion || currentVersion;
			const { data: latest } = await supabase
				.from('app_versions')
				.select('*')
				.eq('channel', 'stable')
				.eq('is_active', true)
				.order('published_at', { ascending: false })
				.limit(1)
				.single();

			if (latest && this.isVersionLower(activeVer, latest.version)) {
				const isCritical =
					latest.is_critical ||
					(latest.min_supported_version
						? this.isVersionLower(activeVer, latest.min_supported_version)
						: false);

				this.updateInfo = {
					version: latest.version,
					currentVersion: activeVer,
					releaseNotes: latest.release_notes || '',
					pubDate: latest.published_at,
					isCritical,
					minSupportedVersion: latest.min_supported_version
				};
				this.status = 'available';
				this.modalOpen = true;
				return true;
			} else {
				this.status = 'up-to-date';
				if (manual) this.modalOpen = true;
				return false;
			}
		} catch (e: any) {
			this.status = 'error';
			this.error = e?.message || m.updater_error_connection();
			if (manual) this.modalOpen = true;
			return false;
		}
	}

	/**
	 * Tải xuống và cài đặt bản cập nhật qua Electron IPC streaming
	 */
	async downloadAndInstall(): Promise<void> {
		if (!this.activeUpdate) {
			return;
		}

		this.status = 'downloading';
		this.progress = 0;
		this.downloadedBytes = 0;
		this.totalBytes = 0;
		this.error = null;

		let cleanupProgress: (() => void) | null = null;
		if (typeof window !== 'undefined' && (window as any).electronAPI?.onEvent) {
			cleanupProgress = (window as any).electronAPI.onEvent(
				'updater-progress',
				(data: { percent?: number; transferred?: number; total?: number }) => {
					if (typeof data?.percent === 'number') {
						this.progress = Math.min(100, Math.max(0, Math.round(data.percent)));
					}
					if (typeof data?.transferred === 'number') {
						this.downloadedBytes = data.transferred;
					}
					if (typeof data?.total === 'number') {
						this.totalBytes = data.total;
					}
				}
			);
		}

		try {
			if (typeof window !== 'undefined' && (window as any).electronAPI?.updater?.downloadAndInstall) {
				await (window as any).electronAPI.updater.downloadAndInstall(this.activeUpdate.url);
			} else if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal && this.activeUpdate.url) {
				await (window as any).electronAPI.openExternal(this.activeUpdate.url);
			}
			this.progress = 100;
			this.status = 'downloaded';
		} catch (err: any) {
			console.error('[Updater] Download & Install failed:', err);
			this.status = 'error';
			this.error = err?.message || m.updater_error_download();
		} finally {
			cleanupProgress?.();
		}
	}

	/**
	 * Khởi động lại ứng dụng để áp dụng bản cập nhật
	 */
	async relaunch(): Promise<void> {
		if (isTauri() && typeof window !== 'undefined' && (window as any).electronAPI?.updater?.relaunch) {
			await (window as any).electronAPI.updater.relaunch();
		} else {
			window.location.reload();
		}
	}

	/**
	 * Đóng modal (chỉ cho phép khi không phải bản cập nhật khẩn cấp isCritical)
	 */
	closeModal(): void {
		if (this.updateInfo?.isCritical && this.status === 'available') {
			return; // Khóa màn hình không cho đóng khi là bản bắt buộc
		}
		this.modalOpen = false;
	}
}

export const updater = new UpdaterService();
