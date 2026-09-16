<script lang="ts">
	import { lazyLoad } from '$lib/helper/lazyload';
	let loadSection = $state(false);
	interface Props {
		children?: any;
		class?: string;
	}
	let { class: Class = '', children }: Props = $props();
</script>

<section
	use:lazyLoad={async () => {
		if (!loadSection) loadSection = true;
	}}
	class="relative container mx-auto"
>
	{#if loadSection}
		<!-- <a {href} target="_blank" class="object-cover flex justify-center w-full items-center">
			<img src={imgUrl} {alt} class="cursor-pointer-none {Class}" />
		</a> -->
		{@render children()}
	{/if}
</section>
