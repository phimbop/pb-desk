<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	interface Props extends HTMLButtonAttributes {
		children?: import('svelte').Snippet;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		disabled?: boolean;
	}
	let { children, class: className='', onclick, disabled = false, ...restProps }: Props = $props();
</script>

<button
	{...restProps}
	{disabled}
	class="inline-flex px-4 py-2 ease-in-out bg-white/20 backdrop-blur-sm hover:bg-slate-950/40 hover:text-slate-50 border-[0.5px] border-white/20 rounded-full cursor-pointer font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-150 {className}"
	{onclick}
>
	{@render children?.()}
</button>
