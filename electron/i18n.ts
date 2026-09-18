export interface NotificationStrings {
	defaultMovie: string;
	newMovieTitle: string;
	newEpisodeTitle: (movieName: string) => string;
	movieBodyEpisode: (movieName: string, episode: string) => string;
	movieBodyNew: (movieName: string) => string;
}

export interface TrayStrings {
	open: string;
	checkUpdates: string;
	quit: string;
}

export const SUPPORTED_LOCALES = [
	'vi', 'en', 'ja', 'ko', 'zh', 'de', 'fr', 'es',
	'it', 'pt', 'ru', 'tr', 'id', 'nl', 'pl', 'hi', 'be'
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const NOTIFICATION_TRANSLATIONS: Record<string, NotificationStrings> = {
	vi: {
		defaultMovie: 'Phim',
		newMovieTitle: '🎬 PHIMBOP - Phim mới cập nhật!',
		newEpisodeTitle: (m) => `🔥 Tập mới: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} vừa cập nhật ${ep}!`,
		movieBodyNew: (m) => `${m} đã có mặt trên PHIMBOP!`
	},
	en: {
		defaultMovie: 'Movie',
		newMovieTitle: '🎬 PHIMBOP - New Movie Added!',
		newEpisodeTitle: (m) => `🔥 New Episode: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} just updated ${ep}!`,
		movieBodyNew: (m) => `${m} is now available on PHIMBOP!`
	},
	ja: {
		defaultMovie: '映画',
		newMovieTitle: '🎬 PHIMBOP - 新着映画が追加されました！',
		newEpisodeTitle: (m) => `🔥 新着エピソード: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} の ${ep} が配信されました！`,
		movieBodyNew: (m) => `${m} がPHIMBOPで配信開始！`
	},
	ko: {
		defaultMovie: '영화',
		newMovieTitle: '🎬 PHIMBOP - 새 영화가 업데이트되었습니다!',
		newEpisodeTitle: (m) => `🔥 새 에피소드: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} ${ep} 업데이트되었습니다!`,
		movieBodyNew: (m) => `${m} 이제 PHIMBOP에서 시청 가능합니다!`
	},
	zh: {
		defaultMovie: '电影',
		newMovieTitle: '🎬 PHIMBOP - 新电影已上线！',
		newEpisodeTitle: (m) => `🔥 新剧集: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} 已更新 ${ep}！`,
		movieBodyNew: (m) => `${m} 现已上线 PHIMBOP！`
	},
	de: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Neuer Film hinzugefügt!',
		newEpisodeTitle: (m) => `🔥 Neue Folge: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} hat ${ep} aktualisiert!`,
		movieBodyNew: (m) => `${m} ist jetzt auf PHIMBOP verfügbar!`
	},
	fr: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Nouveau film ajouté !',
		newEpisodeTitle: (m) => `🔥 Nouvel épisode : ${m}`,
		movieBodyEpisode: (m, ep) => `${m} vient de sortir ${ep} !`,
		movieBodyNew: (m) => `${m} est maintenant disponible sur PHIMBOP !`
	},
	es: {
		defaultMovie: 'Película',
		newMovieTitle: '🎬 PHIMBOP - ¡Nueva película añadida!',
		newEpisodeTitle: (m) => `🔥 Nuevo episodio: ${m}`,
		movieBodyEpisode: (m, ep) => `¡${m} acaba de actualizar ${ep}!`,
		movieBodyNew: (m) => `¡${m} ya está disponible en PHIMBOP!`
	},
	it: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Nuovo film aggiunto!',
		newEpisodeTitle: (m) => `🔥 Nuovo episodio: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} ha appena aggiornato ${ep}!`,
		movieBodyNew: (m) => `${m} è ora disponibile su PHIMBOP!`
	},
	pt: {
		defaultMovie: 'Filme',
		newMovieTitle: '🎬 PHIMBOP - Novo filme adicionado!',
		newEpisodeTitle: (m) => `🔥 Novo episódio: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} acabou de atualizar ${ep}!`,
		movieBodyNew: (m) => `${m} já está disponível no PHIMBOP!`
	},
	ru: {
		defaultMovie: 'Фильм',
		newMovieTitle: '🎬 PHIMBOP - Добавлен новый фильм!',
		newEpisodeTitle: (m) => `🔥 Новая серия: ${m}`,
		movieBodyEpisode: (m, ep) => `${m}: обновлена ${ep}!`,
		movieBodyNew: (m) => `${m} теперь доступен на PHIMBOP!`
	},
	tr: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Yeni Film Eklendi!',
		newEpisodeTitle: (m) => `🔥 Yeni Bölüm: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} ${ep} güncellendi!`,
		movieBodyNew: (m) => `${m} artık PHIMBOP'ta yayında!`
	},
	id: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Film Baru Ditambahkan!',
		newEpisodeTitle: (m) => `🔥 Episode Baru: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} baru saja memperbarui ${ep}!`,
		movieBodyNew: (m) => `${m} sekarang tersedia di PHIMBOP!`
	},
	nl: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Nieuwe film toegevoegd!',
		newEpisodeTitle: (m) => `🔥 Nieuwe aflevering: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} heeft zojuist ${ep} bijgewerkt!`,
		movieBodyNew: (m) => `${m} is nu beschikbaar op PHIMBOP!`
	},
	pl: {
		defaultMovie: 'Film',
		newMovieTitle: '🎬 PHIMBOP - Dodano nowy film!',
		newEpisodeTitle: (m) => `🔥 Nowy odcinek: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} właśnie zaktualizował ${ep}!`,
		movieBodyNew: (m) => `${m} jest już dostępny w PHIMBOP!`
	},
	hi: {
		defaultMovie: 'फ़िल्म',
		newMovieTitle: '🎬 PHIMBOP - नई फ़िल्म जोड़ी गई!',
		newEpisodeTitle: (m) => `🔥 नया एपिसोड: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} ने अभी ${ep} अपडेट किया!`,
		movieBodyNew: (m) => `${m} अब PHIMBOP पर उपलब्ध है!`
	},
	be: {
		defaultMovie: 'Фільм',
		newMovieTitle: '🎬 PHIMBOP - Дададзены новы фільм!',
		newEpisodeTitle: (m) => `🔥 Новая серыя: ${m}`,
		movieBodyEpisode: (m, ep) => `${m} толькі што абнавіў ${ep}!`,
		movieBodyNew: (m) => `${m} цяпер даступны на PHIMBOP!`
	}
};

export const TRAY_TRANSLATIONS: Record<string, TrayStrings> = {
	vi: {
		open: 'Mở PHIMBOP',
		checkUpdates: 'Kiểm tra cập nhật',
		quit: 'Thoát'
	},
	en: {
		open: 'Open PHIMBOP',
		checkUpdates: 'Check for updates',
		quit: 'Quit'
	},
	ja: {
		open: 'PHIMBOPを開く',
		checkUpdates: 'アップデートを確認',
		quit: '終了'
	},
	ko: {
		open: 'PHIMBOP 열기',
		checkUpdates: '업데이트 확인',
		quit: '종료'
	},
	zh: {
		open: '打开 PHIMBOP',
		checkUpdates: '检查更新',
		quit: '退出'
	},
	de: {
		open: 'PHIMBOP öffnen',
		checkUpdates: 'Nach Updates suchen',
		quit: 'Beenden'
	},
	fr: {
		open: 'Ouvrir PHIMBOP',
		checkUpdates: 'Vérifier les mises à jour',
		quit: 'Quitter'
	},
	es: {
		open: 'Abrir PHIMBOP',
		checkUpdates: 'Buscar actualizaciones',
		quit: 'Salir'
	},
	it: {
		open: 'Apri PHIMBOP',
		checkUpdates: 'Verifica aggiornamenti',
		quit: 'Esci'
	},
	pt: {
		open: 'Abrir PHIMBOP',
		checkUpdates: 'Verificar atualizações',
		quit: 'Sair'
	},
	ru: {
		open: 'Открыть PHIMBOP',
		checkUpdates: 'Проверить обновления',
		quit: 'Выход'
	},
	tr: {
		open: 'PHIMBOP Aç',
		checkUpdates: 'Güncellemeleri denetle',
		quit: 'Çıkış'
	},
	id: {
		open: 'Buka PHIMBOP',
		checkUpdates: 'Periksa pembaruan',
		quit: 'Keluar'
	},
	nl: {
		open: 'PHIMBOP openen',
		checkUpdates: 'Controleren op updates',
		quit: 'Afsluiten'
	},
	pl: {
		open: 'Otwórz PHIMBOP',
		checkUpdates: 'Sprawdź aktualizacje',
		quit: 'Zakończ'
	},
	hi: {
		open: 'PHIMBOP खोलें',
		checkUpdates: 'अपडेट जांचें',
		quit: 'बंद करें'
	},
	be: {
		open: 'Адкрыць PHIMBOP',
		checkUpdates: 'Праверыць абнаўленні',
		quit: 'Выйсці'
	}
};

export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function normalizeLocale(locale?: string | null): string {
	if (!locale || typeof locale !== 'string') return 'vi';
	const base = locale.toLowerCase().split(/[-_]/)[0];
	return isSupportedLocale(base) ? base : 'vi';
}

export function formatMovieNotification(
	ev: {
		movieName?: string;
		movie_name?: string;
		episode?: string;
		isNewMovie?: boolean;
	},
	locale: string = 'vi'
): { title: string; body: string } {
	const loc = normalizeLocale(locale);
	const dict = NOTIFICATION_TRANSLATIONS[loc] || NOTIFICATION_TRANSLATIONS['vi'];
	const movieName = ev.movieName || ev.movie_name || dict.defaultMovie;

	const title = ev.isNewMovie
		? dict.newMovieTitle
		: dict.newEpisodeTitle(movieName);

	const body = ev.episode
		? dict.movieBodyEpisode(movieName, ev.episode)
		: dict.movieBodyNew(movieName);

	return { title, body };
}

export function getTrayLabels(locale: string = 'vi'): TrayStrings {
	const loc = normalizeLocale(locale);
	return TRAY_TRANSLATIONS[loc] || TRAY_TRANSLATIONS['vi'];
}
