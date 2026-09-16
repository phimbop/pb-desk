type TopMovieList = {
    id: string;
    watching?: number;
    movie?: PlayerMovieInfo;
    is_18?: boolean;
    views?: number;
    updatedAt?: string
}
type ViewHistory = {
    id: string;
    movie?: PlayerMovieInfo;
    movie_id?: string;
    time?: string;
    count?: number
}

type DailyView = {
    movie?: PlayerMovieInfo;
    movie_id?: string;
    daily_views?: number
}
type WeeklyView = {
    movie?: PlayerMovieInfo;
    movie_id?: string;
    weekly_views?: number
}
type MonthlyView = {
    movie?: PlayerMovieInfo;
    movie_id?: string;
    monthly_views?: number
}