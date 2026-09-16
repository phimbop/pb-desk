<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
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
		</div>
	</div>
</section>
