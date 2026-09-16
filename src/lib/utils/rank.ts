import { m } from '$lib/paraglide/messages';

export interface UserRole {
	id: string;
	name: string;
	colorClass: string;
	bgClass: string;
	badgeClass: string;
}

export function getUserRole(totalHours: number): UserRole {
	if (totalHours >= 10000) {
		return {
			id: 'chua_te',
			name: m.profile_role_chua_te(),
			colorClass: 'from-amber-400 via-rose-500 to-violet-600',
			bgClass: 'bg-amber-500/10 border-amber-500/35 text-amber-400',
			badgeClass: 'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-transparent bg-clip-text font-black animate-pulse'
		};
	}
	if (totalHours >= 5000) {
		return {
			id: 'nha_phe_binh',
			name: m.profile_role_nha_phe_binh(),
			colorClass: 'from-neonPink-500 to-violet-500',
			bgClass: 'bg-neonPink-500/10 border-neonPink-500/35 text-neonPink-400',
			badgeClass: 'bg-gradient-to-r from-neonPink-500 to-violet-500 text-transparent bg-clip-text font-extrabold'
		};
	}
	if (totalHours >= 2000) {
		return {
			id: 'tin_do',
			name: m.profile_role_tin_do(),
			colorClass: 'from-cyan-400 to-blue-500',
			bgClass: 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400',
			badgeClass: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text font-bold'
		};
	}
	if (totalHours >= 500) {
		return {
			id: 'mot_phim_real',
			name: m.profile_role_mot_phim_real(),
			colorClass: 'from-emerald-400 to-teal-500',
			bgClass: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400',
			badgeClass: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-transparent bg-clip-text font-semibold'
		};
	}
	if (totalHours >= 100) {
		return {
			id: 'mot_phim_apprentice',
			name: m.profile_role_mot_phim_apprentice(),
			colorClass: 'from-amber-400 to-orange-500',
			bgClass: 'bg-amber-500/10 border-amber-500/35 text-amber-400',
			badgeClass: 'bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text font-medium'
		};
	}
	return {
		id: 'tan_binh',
		name: m.profile_role_tan_binh(),
		colorClass: 'from-slate-400 to-slate-500',
		bgClass: 'bg-slate-500/10 border-slate-500/35 text-slate-400',
		badgeClass: 'text-slate-400 font-normal'
	};
}
