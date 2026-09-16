<script lang="ts">
    import CardTopMovieItem from '$lib/Components/Card/CardTopMovieItem.svelte';
	import { page } from "$app/state";
    interface Props {
        transitionClass: string;
    }

    let { transitionClass }: Props = $props();
    let changedClass = $derived(transitionClass)
    
    </script>
    {#each (page.data.topMoviesList?.[2] || []) as movies, i }
    {#if i + 1 == 1}
    <div class="w-full h-full flex items-center mb-4 transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] isolate {changedClass}">
        <p class="text-slate-50 font-bold text-3xl mr-2">{i + 1}</p>
        <div>
            <CardTopMovieItem showDate={false} style='' watching={0} movie={movies.movie} class="{(i + 1) < 10 ? 'pl-8' : 'pl-2'} pr-2" /> 
        </div>
    </div>
    {:else}
    <div class="w-full h-full flex items-center mb-4 border-t border-slate-50/20 pt-2 transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] isolate {changedClass}" style="transition-delay: {(i + 1) * 75}ms;">
        <p class="text-slate-50 font-bold text-3xl mr-2">{i + 1}</p>
        <div class="cursor-pointer">
            <CardTopMovieItem showDate={false} style='' watching={0} movie={movies.movie} class="{(i + 1) < 10 ? 'pl-8' : 'pl-2'} pr-2" /> 
        </div>
    </div>
    {/if}
    {/each}