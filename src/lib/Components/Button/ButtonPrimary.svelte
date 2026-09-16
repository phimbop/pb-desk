<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	interface Props extends HTMLButtonAttributes {
		children?: import('svelte').Snippet;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}
	let { children, class: className = '', onclick, ...restProps }: Props = $props();
</script>

<button
	{...restProps}
	class="inline-flex py-1 !animate-background-shine items-center justify-center rounded-full border border-slate-700 bg-red bg-[linear-gradient(110deg,#AD005C,45%,#cc006d,55%,#AD005C)] bg-[length:200%_100%] px-5 font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-200 {className}"
	{onclick}
>
	{@render children?.()}
</button>
