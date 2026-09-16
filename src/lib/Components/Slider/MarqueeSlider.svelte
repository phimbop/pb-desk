<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	import { cn } from '$lib/utils';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { TmdbMovieDetail } from '../../../types/Tmdb';
	import CardNetworkProvider from '../Card/CardNetworkProvider.svelte';
	interface Props {
		List?: any[];
		listActor?: TmdbMovieDetail['credits']['cast'][0] | TmdbMovieDetail['credits']['crew'][0] | any;
		type: 'movieCategory' | 'actor' | 'networkProvider';
    reverse?: boolean;
	}
	let { reverse = false, List = [], listActor, type }: Props = $props();
</script>

{#snippet movieCategory()}
	<div class="marquee flex items-center gap-4">
		<!-- Các logo mẫu - bạn có thể thay bằng logo của bạn -->
		{#each List as logo, index}
			<a
				class="slide flex w-full items-center justify-center bg-white/10 backdrop-blur-xl hover:bg-slate-900/40 active:bg-neonPink-500 rounded-xl hover:text-neonPink-500"
				href={localizeHref(`/${logo.slug}`)}
			>
				<p
					class="text-slate-200 truncate hover:text-neonPink-500 px-4 py-4 cursor-pointer transition-all duration-200"
				>
					{logo.name}
				</p>
			</a>
		{/each}
	</div>
{/snippet}
<!-- Actor slider -->
{#snippet actor()}
	<div class="marquee flex items-center gap-4">
		<!-- Các logo mẫu - bạn có thể thay bằng logo của bạn -->
		{#each listActor as cast, index}
			<div class="flex flex-col items-center shrink-0 w-24">
				<a
					href={localizeHref(`/dien-vien/${CommonHelper.stringToSlug(cast.name)}/${cast.id}`)}
					class="flex items-center justify-center w-24 h-24 overflow-hidden object-cover rounded-full cursor-pointer border border-neutral-700 relative group"
					use:tooltip={{ text: cast.name, position: 'top' }}
				>
					<div
						class="rounded-sm z-10 opacity-0 group-hover:opacity-100 transition duration-200 ease-in-out cursor-pointer absolute from-neonPink-800 to-transparent bg-linear-to-t inset-x-0 bottom-0 text-white flex w-full h-1/2"
					></div>
					{#if cast.profile_path}
						<img
							src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300{cast.profile_path}"
							alt={cast.name}
							class="relative group-hover:scale-110 transform transition-all duration-200 ease-in-out"
							loading="lazy"
						/>
					{:else}
						<img
							src="https://ui-avatars.com/api/name={cast.name}"
							alt={cast.name}
							loading="lazy"
							class="relative group-hover:scale-110 transform transition-all duration-200 ease-in-out"
						/>
					{/if}
				</a>
				{#if cast.character}
					<p class="mt-2 text-xs text-slate-300 text-center line-clamp-2">{cast.character}</p>
				{:else}
					<p class="mt-2 text-xs text-slate-400 text-center line-clamp-2">{cast.job ?? ''}</p>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}
<!-- Network Provider  -->
{#snippet networkProvider()}
		{#each List as item }
			<CardNetworkProvider {item} />
		{/each}
		{#each List as item }
			<CardNetworkProvider {item} />
		{/each}
{/snippet}
  <div class="relative overflow-hidden m-auto w-full ">
       <div
      class="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-slate-950 z-50"
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-slate-950 z-50"
    ></div>
    <!-- Container chính -->
    <div class="{cn("marquee-wrapper", { 
      "reverse": reverse 
      })}">
      {#if type === 'movieCategory'}
        <!-- Nội dung marquee -->
        {@render movieCategory()}
        <!-- Bản sao để tạo hiệu ứng vô hạn -->
        {@render movieCategory()}
      {/if}
      {#if type === 'actor'}
        <!-- Nội dung marquee -->
        {@render actor()}
        <!-- Bản sao để tạo hiệu ứng vô hạn -->
        {@render actor()}
      {/if}
      {#if type === 'networkProvider'}
        <!-- Nội dung marquee -->
        {@render networkProvider()}
        <!-- Bản sao để tạo hiệu ứng vô hạn -->
        {@render networkProvider()}
      {/if}
    </div>
    </div>
  
    <!-- CSS tùy chỉnh -->
    <style>
      .marquee-wrapper {
        display: flex;
        width: max-content;
        animation: marquee 80s linear infinite;
        will-change: transform;
        gap: 16px;
      }
      .marquee-wrapper.reverse {
        animation-direction: reverse;
      }
      .marquee-wrapper:hover {
        animation-play-state: paused;
      }
  
      @keyframes marquee {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
    </style>
