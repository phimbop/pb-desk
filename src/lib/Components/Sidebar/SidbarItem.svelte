<script lang="ts">
	import tooltip from "$lib/helper/tooltip";
	interface Props {
		svgIcon?: string;
		title?: string;
		active?: boolean | null | undefined;
		href?: string;
		tooltipText?: string;
	}

	let {
		svgIcon = '',
		title = '',
		active = false,
		href = '',
		tooltipText = ''
	}: Props = $props();
</script>

<a
	{href}
	class="group relative flex flex-col items-center space-y-2 hover:cursor-pointer rounded-md p-2 transition-all duration-200 {active
		? 'text-neonPink-500/80'
		: 'text-slate-300'}"
        use:tooltip={{ text: tooltipText, position: 'right' }}
>
	{@html svgIcon}
	<p>{title}</p>
</a>