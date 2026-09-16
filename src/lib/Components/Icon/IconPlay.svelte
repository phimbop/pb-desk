<script lang="ts">
	interface Props {
		[key: string]: any
	}

	let { ...props }: Props = $props();
</script>

<div
	class="relative flex items-center justify-center bg-neonPink-500/80 shadow-2xl rounded-full z-40 cursor-pointer group p-2 {props.class}"
>
	<span
		class="group-hover:animate-ping absolute inline-flex h-full w-full rounded-full group-hover:bg-neonPink-500/80 opacity-75"
	></span>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="icon icon-tabler icon-tabler-player-play-filled text-white h-10 w-10"
		viewBox="0 0 24 24"
		stroke-width="2"
		stroke="currentColor"
		fill="none"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		<path
			d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z"
			stroke-width="0"
			fill="currentColor"
		/>
	</svg>
</div>
