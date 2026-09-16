// Định nghĩa kiểu cho một bản ghi phim
interface MovieRecord {
    imdb_id: string;
    tmdb_id: string;
    title: string;
    embed_url: string;
    embed_url_tmdb: string;
  }
  
  // Định nghĩa kiểu cho kết quả chứa danh sách các bản ghi phim
  interface MovieResult {
    result: MovieRecord[];
    pages: number;
  }

  