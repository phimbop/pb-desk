interface SeoOnPage {
    og_type: string;
    titleHead: string;
    descriptionHead: string;
    og_image: string[];
    og_url: string;
  }
  
  interface BreadCrumb {
    name: string;
    slug?: string;
    isCurrent: boolean;
    position: number;
  }
  
  interface ItemCategory {
    id: string;
    name: string;
    slug: string;
  }
  
  interface ItemCountry {
    id: string;
    name: string;
    slug: string;
  }
  
  interface Item {
    modified: {
      time: string;
    };
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    type: string;
    poster_url: string;
    thumb_url: string;
    sub_docquyen: boolean;
    chieurap: boolean;
    time: string;
    episode_current: string;
    quality: string;
    lang: string;
    year: number;
    category: ItemCategory[];
    country: ItemCountry[];
  }
  
  interface Params {
    type_slug: string;
    filterCategory: string[];
    filterCountry: string[];
    filterYear: string;
    filterType: string;
    sortField: string;
    sortType: string;
    pagination: {
      totalItems: number;
      totalItemsPerPage: number;
      currentPage: number;
      totalPages: number;
    };
  }
  
  interface kkPhimboType {
    status?: string;
    msg?: string;
    data?: {
      seoOnPage: SeoOnPage;
      breadCrumb: BreadCrumb[];
      titlePage: string;
      items: Item[];
      params: Params;
      type_list: string;
      APP_DOMAIN_FRONTEND: string;
      APP_DOMAIN_CDN_IMAGE: string;
    };
  }
  
//   // Sử dụng kkPhimbo để parse JSON
//   const jsonData: string = '...'; // Thay thế bằng dữ liệu JSON thực tế
//   const parsedData: kkPhimbo = JSON.parse(jsonData);

// kkPhimboDetail type  
interface Episode {
  server_name: string;
  server_data: EpisodeDetail[];
}

interface EpisodeDetail {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Country {
  id: string;
  name: string;
  slug: string;
}

interface kkMovie {
  created: {
    time: string;
  };
  modified: {
    time: string;
  };
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  poster_url: string;
  thumb_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: Category[];
  country: Country[];
}

interface kkPhimboDetailType {
  status: boolean;
  msg: string;
  movie: kkMovie;
  episodes: Episode[];
}

// store
interface kkPhimboTapPhimType {
  movie: string;
  episodes: string;
}
