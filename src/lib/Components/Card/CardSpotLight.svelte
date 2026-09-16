<!-- hiện tại chưa dùng, hiệu ứng spotlight khi rê chuột  -->
<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let div: HTMLDivElement | undefined = $state();
	let focused = false;
	let position = $state({ x: 0, y: 0 });
	let opacity = $state(0);

	const handleMouseMove = (e: MouseEvent) => {
		if (!div || focused) return;

		const rect = div.getBoundingClientRect();

		position = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	};

	const handleFocus = () => {
		focused = true;
		opacity = 1;
	};

	const handleBlur = () => {
		focused = false;
		opacity = 0;
	};

	const handleMouseEnter = () => {
		opacity = 1;
	};

	const handleMouseLeave = () => {
		opacity = 0;
	};
</script>

<div
	bind:this={div}
	onmousemove={handleMouseMove}
	onfocus={handleFocus}
	onblur={handleBlur}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	class="relative flex w-full h-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-linear-to-r from-black to-slate-950 px-8 py-16"
>
	<div
		class="pointer-events-none absolute -inset-px opacity-0 transition duration-200 "
		style={`
			opacity: ${opacity};
			background: radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,182,255,.1), transparent 40%);
		`}
	></div>
	{@render children?.()}
</div>
