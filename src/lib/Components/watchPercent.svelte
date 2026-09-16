<script>
	import tooltip from '$lib/helper/tooltip';
	let { watchPercent } = $props();
</script>

<div
	class="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-white/20 backdrop-blur-xs z-10"
	use:tooltip={{
		text: `Đã xem ${isNaN(watchPercent) ? 0 : watchPercent}%`,
		position: 'top-left'
	}}
>
	<svg class="w-full h-full transform -rotate-90">
		<circle
			class="text-white/20"
			stroke-width="8"
			stroke="currentColor"
			fill="transparent"
			r="20"
			cx="20"
			cy="20"
		/>
		<circle
			class={watchPercent >= 100 ? 'text-neonPink-500' : 'text-white'}
			stroke-width="8"
			stroke-dasharray={20 * 2 * Math.PI}
			stroke-dashoffset={20 * 2 * Math.PI -
				((isNaN(watchPercent) ? 0 : watchPercent) / 100) * (20 * 2 * Math.PI)}
			stroke="currentColor"
			fill="transparent"
			r="20"
			cx="20"
			cy="20"
		/>
	</svg>
	<span class="text-xs text-slate-200 absolute">{isNaN(watchPercent) ? 0 : watchPercent}%</span>
</div>
