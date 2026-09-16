import { DOMAIN_KKPHIM } from "$lib";
import { useSurrealDB } from "./createStore.svelte";

export let kkPhimboTapPhimStore = useSurrealDB<kkPhimboTapPhimType[]>("kkPhim", "kkPhimboTapPhim", []);
export let resetPlayedTime = $state({value: false});
// -------------------------------------------------------------------------------------
// Function kkphim
export const KkphimHandler = {
    getKkPhimle:async (page: number) => {
        try {
            const result = await fetch(`${DOMAIN_KKPHIM}/v1/api/danh-sach/phim-le?page=${page}&limit=20`)
            const data = await result.json()
            return data
        } catch (error) {
            console.error(error)
        }
    },
    getKkphimLeM3u8:async (slug:string) => {
        try {
            const result = await fetch(`${DOMAIN_KKPHIM}/phim/${slug}`)
            const responsive : kkPhimboDetailType = await result.json()
            return responsive.episodes[0].server_data[0].link_m3u8
        } catch (error) {
            throw error
        }
    },
    getKkphimLeDetail:async (slug:string) => {
        try {
            const result = await fetch(`${DOMAIN_KKPHIM}/phim/${slug}`)
            return await result.json()
        } catch (error) {
            throw error
        }
    },
    kkGetMovieCategory:async (slug: string, page: number) => {
        try {
            const result = await fetch(`https://phimapi.com/v1/api/the-loai/${slug}?page=${page}&limit=20`)
            return await result.json()
        } catch (error) {
            throw error
        }
    },
    kkSearchMovies:async (query: string, page?: number) => {
        if ( query === '') return
        try {
            const result = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${query}&page=${page ?? 1}&limit=16`)
            return await result.json()
        } catch (error) {
            throw error
        }
    },
    kkGetDanhSachPhim:async (page: number, danhSach:string) => {
        try {
            const result = await fetch(`${DOMAIN_KKPHIM}/v1/api/danh-sach/${danhSach}?page=${page}&limit=20`)
            return await result.json()
        } catch (error) {
            console.error(error)
        }
    },
    kkGetPhimQuocGia:async (page: number, country: string) => {
        try {
            const result = await fetch(`${DOMAIN_KKPHIM}/v1/api/quoc-gia/${country}?page=${page}&limit=3`)
            return await result.json()
        } catch (error) {
            console.error(error)
        }
    }
}