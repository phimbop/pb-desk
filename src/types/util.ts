type movieResource = 'tmdb' | 'kk' | 'tmdbTv' | 'kkPhimBo' | 'kkPhimLe' | 'animation' | undefined
type movieTopic = 'cung-dau' | 'chua-lanh' | 'thanh-xuan' | 'tltp' | 'gia-dinh' | 'vn-war'
interface myListMovies {
    source: movieResource;
    id: string | number | undefined;
    _id: string | undefined;
    name: string;
    slug: string | undefined;
    origin_name: string;
    content: string | undefined;
    type: string | undefined;
    status: string | undefined;
    poster_url: string | undefined | null;
    thumb_url: string | undefined | null;
    time: string | undefined;
    year: number | string | undefined;
    vote_average: number | undefined;
  }
  interface PlayerMovieInfo extends myListMovies {
    playedTime: number | undefined;
    title?: string | undefined;
    poster_path?: string | undefined | null;
    duration?: number | undefined;
    updatedAt?: string | undefined | null;
  }
  interface srdbTopMovieList {
    id: string;
    is_18: boolean | undefined;
    movie: PlayerMovieInfo;
    views: number;
    watching: number;
  } 

  type Sitemap = {
    id: string;
    sitemap: string;
    type: string;
  }