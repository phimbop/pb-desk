<script lang="ts">
	import { page } from '$app/state';
</script>

<section class="w-full h-full flex items-center justify-center">
	<div class="relative z-0 mx-auto max-w-3xl pb-24 pt-12 text-center">
		<div class="absolute -top-4 -z-10 flex w-full justify-center">
			<div
				class="h-[310px] w-[310px] max-w-full animate-pulse-slow rounded-full bg-[#8678F9] opacity-20 blur-[100px]"
			></div>
		</div>
		<div>
			<h1
				class="mb-8 bg-linear-to-t from-[#6d6d6d] to-[#f4f4f4] bg-clip-text text-4xl text-transparent md:text-5xl"
			>
				{page.status}
			</h1>
			<p class="text-xl text-slate-500">
				<span class="text-white">{page.error?.message || 'Something went wrong.'}</span>.
			</p>
			<a
				href="/"
				class="mt-8 inline-block rounded-md bg-neonPink-500 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-neonPink-600 transition duration-200"
			>
				Back to Home
			</a>
			<em class="text-sm block text-slate-600 mt-6 font-medium">
				{new Date().toLocaleString('en-GB')}
			</em>
		</div>
	</div>
</section>
