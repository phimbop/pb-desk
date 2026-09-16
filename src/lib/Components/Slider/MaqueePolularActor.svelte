<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	interface Props {
		listActor: 
		| TmdbMovieDetail['credits']['cast'][0]
		| TmdbMovieDetail['credits']['crew'][0]
		| any;
	}

	let { listActor }: Props = $props();
</script>
<div class="relative overflow-hidden m-auto w-full bg-transparent before:absolute before:left-0 before:top-0 before:z-2 before:h-full before:w-[100px] before:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] before:content-[''] after:absolute after:right-0 after:top-0 after:z-2 after:w-[100px] after:h-full after:-scale-x-100 after:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] after:content-['']">
    <!-- Container chính -->
    <div class="marquee-wrapper">
      <!-- Nội dung marquee -->
      <div class="marquee flex items-center gap-4">
        <!-- Các logo mẫu - bạn có thể thay bằng logo của bạn -->
        {#each listActor as cast, index}
        <a
            href="/dien-vien/{CommonHelper.stringToSlug(cast.name)}/{cast.id}"
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
            <p class="mt-1 flex items-center justify-center flex-wrap">{cast.character}</p>
        {:else}
            <p class="mt-1 flex items-center justify-center flex-wrap">{cast.job ?? ''}</p>
        {/if}
    {/each}
      </div>
      <!-- Bản sao để tạo hiệu ứng vô hạn -->
      <div class="marquee flex items-center gap-4" aria-hidden="true">
        {#each listActor as cast, index}
			<a
				href="/dien-vien/{CommonHelper.stringToSlug(cast.name)}/{cast.id}"
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
				<p class="mt-1 flex items-center justify-center flex-wrap">{cast.character}</p>
			{:else}
				<p class="mt-1 flex items-center justify-center flex-wrap">{cast.job ?? ''}</p>
			{/if}
		{/each}
      </div>
</div>
  
    <!-- CSS tùy chỉnh -->
    <style>
      .marquee-wrapper {
        display: flex;
        width: max-content;
        animation: marquee 20s linear infinite;
        will-change: transform;
		gap:16px;
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
  </div>