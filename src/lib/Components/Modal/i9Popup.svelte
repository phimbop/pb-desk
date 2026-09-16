<script lang="ts">
	interface Props {
		showModal: boolean; // boolean
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { showModal = $bindable(), header, children }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state(); // HTMLDialogElement

	$effect(() => {
		if (dialog && showModal) dialog.showModal();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	class="bg-white/10 backdrop-blur-3xl rounded-md"
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(() => dialog!.close())}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={((e) => e.stopPropagation())}>
		<button
			aria-label="Close"
			class="absolute top-1 right-1 p-2 hover:bg-slate-800 hover:text-slate-100 rounded-full"
			onclick={() => dialog!.close()}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-x w-5 h-5"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path
					d="M6 6l12 12"
				/></svg
			>
		</button>
		{@render header?.()}
		{@render children?.()}
		<!-- svelte-ignore a11y_autofocus -->
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		/* border-radius: 0.2em; */
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>
