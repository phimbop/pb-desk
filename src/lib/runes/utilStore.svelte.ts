import { browser } from "$app/environment";
import { writable } from "svelte/store";
import { useLocalStorage } from "./createStore.svelte";

// const tgvalue: boolean  = JSON.parse((browser ? window.localStorage.getItem("tgvalue") : 'true') ?? 'true');
// export const tourGuideStore = writable(tgvalue);
// tourGuideStore.subscribe((value) => {
//     if (browser) {
//         localStorage.setItem("tgvalue", JSON.stringify(value));
//     }
// })

export let tourGuideStore = useLocalStorage<boolean>("tgvalue", true);