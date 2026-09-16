<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { updater } from '$lib/services/updater.svelte';
</script>

<Seo
	title={m.pageAboutUs_seo_title()}
	metadescription={m.pageAboutUs_seo_metadescription()}
	slug={`${page.url}`}
/>
<section class="w-full h-full flex items-center">
	<div class="relative z-0 mx-auto max-w-3xl pb-24 pt-12 text-center">
		<div class="absolute -top-4 -z-10 flex w-full justify-center">
			<div
				class="h-[310px] w-[310px] max-w-full animate-pulse-slow rounded-full bg-[#8678F9] opacity-20 blur-[100px]"
			></div>
		</div>
		<div class="space-y-4">
			<p
				class="my-8 bg-linear-to-t from-[#6d6d6d] to-[#f4f4f4] bg-clip-text text-4xl text-transparent md:text-4xl"
			>
				{m.pageAboutUs_updateInfo()}
			</p>
			<p class="text-xl text-slate-500">
				{m.pageAboutUs_updateDomain()}:{' '}
				<span class="text-white"
					><a
						href="https://linktr.ee/phimbop"
						target="_blank"
						class="my-8 bg-linear-to-t from-[#6d6d6d] to-[#f4f4f4] bg-clip-text text-xl text-transparent"
					>
						https://linktr.ee/phimbop
					</a></span
				>.
			</p>
			<p class="text-xl text-slate-500">
				Telegram:{' '}
				<span class="text-white"
					><a
						href="https://t.me/phimbop_group"
						class="my-8 bg-linear-to-t from-[#6d6d6d] to-[#f4f4f4] bg-clip-text text-xl text-transparent"
					>
						https://t.me/phimbop_group
					</a></span
				>.
			</p>
			<p class="text-xl text-slate-500">
				Email:{' '}
				<span class="text-white">phimbop@duck.com</span>.
			</p>
			<p class="text-xl text-slate-500">
				{m.pageAboutUs_policy()}:{' '}
				<a href={localizeHref("/privacy-policy")} class="text-white">Privacy policy</a>.
			</p>
			<em class="text-sm block text-slate-600 mt-6 font-medium max-w-lg mx-auto">
				<a
					href="https://portal.vietcombank.com.vn/content/personal/KhoAnh/Ngan%20hang%20dien%20tu/EBANK%202020/File%20dinh%20kem/Danh%20sach%20Quy%20To%20chuc%20tu%20thien%20Vietcombank_final.pdf"
					target="_blank"
					>{m.aboutUs_donateInfo()}</a
				>
			</em>

			<!-- App Version & Update Check Card -->
			<div class="mt-8 mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4 text-left">
				<div>
					<p class="text-xs text-slate-400 font-medium">Phiên bản ứng dụng</p>
					<div class="flex items-center gap-2 mt-0.5">
						<span class="text-base font-bold text-white">v0.1.0</span>
						<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neonPink-500/15 text-neonPink-400 border border-neonPink-500/30">
							Desktop
						</span>
					</div>
				</div>
				<button
					type="button"
					onclick={() => updater.checkForUpdates(true)}
					disabled={updater.status === 'checking' || updater.status === 'downloading'}
					class="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-neonPink-600 hover:bg-neonPink-500 text-white shadow-lg shadow-neonPink-600/25 transition-all active:scale-95 disabled:opacity-50"
				>
					{#if updater.status === 'checking'}
						<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span>Đang kiểm tra...</span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
							<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
							<path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
						</svg>
						<span>Kiểm tra cập nhật</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
</section>
