export const sortPlayedList = (list: PlayerMovieInfo[] | any) => {
	if (!Array.isArray(list)) return [];
	return [...list].sort((a, b) => {
		const timeA = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0; // Chuyển thành số
		const timeB = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0; // Chuyển thành số
		return timeB - timeA; // Giảm dần
	});
};

export const sortPlayedListByViews = (list: PlayerMovieInfo[] | any) => {
	if (!Array.isArray(list)) return [];
	return [...list].sort((a, b) => {
		return (b?.views ?? 0) - (a?.views ?? 0); // Giảm dần
	});
};