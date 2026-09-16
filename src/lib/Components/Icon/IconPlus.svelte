<script lang="ts">

	import { fade } from "svelte/transition";
	interface Props {
		[key: string]: any
	}

	let { ...props }: Props = $props();

</script>
<svg in:fade={{ duration: 300 }} xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plus {props.class}" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>