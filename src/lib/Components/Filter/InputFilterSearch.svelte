<script lang="ts">
	let { inputValue = $bindable(''), placeholder = '', ...props } = $props();
	const removeInputValue = () => {
		inputValue = '';
	};
</script>

<div class="w-full relative {props.class?.includes('h-') ? '' : 'h-full'} {props.class ?? ''}">
	<input
		class="w-full h-full min-w-0 pr-8 pl-4 py-1 text-slate-200 outline-hidden border-none focus:outline-hidden focus:border-none bg-transparent focus:ring-0"
		type="text"
		{placeholder}
		autocomplete="off"
		id="searchInput"
		bind:value={inputValue}
		oninput={props.oninput}
		onkeydown={props.onkeydown}
    onchange={props.onchange}
	/>
	{#if inputValue}
		<button
			onclick={props.removeInputValue}
			aria-label="Close search"
			class="align-middle duration-150 transition-all group hover:bg-slate-700/80 p-1 absolute top-1/2 -translate-y-1/2 right-1 rounded-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-x w-6 h-6 text-slate-500 cursor-pointer group-hover:text-neonPink-500"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M18 6l-12 12"></path>
				<path d="M6 6l12 12"></path>
			</svg>
		</button>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-search w-6 h-6 text-slate-500 absolute top-1/2 -translate-y-1/2 right-4"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
			<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
			<path d="M21 21l-6 -6"></path>
		</svg>
	{/if}
</div>
