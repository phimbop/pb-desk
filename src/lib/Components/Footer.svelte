<script>
	import { debounce } from '$lib/helper/debounce';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { useLocalStorage } from '$lib/runes/createStore.svelte';
	import ButtonPrimary from './Button/ButtonPrimary.svelte';
	import LanguageSwitcher from '$lib/Components/Header/LanguageSwitcher.svelte';
	// const links = [
	// 	{
	// 		group: 'Danh sách',
	// 		items: [
	// 			{
	// 				title: 'Phim bộ',
	// 				href: '/phim-bo'
	// 			},
	// 			{
	// 				title: 'Phim lẻ',
	// 				href: '/phim-le'
	// 			},
	// 			{
	// 				title: 'Phim hoạt hình',
	// 				href: '/phim-hoat-hinh'
	// 			},
	// 			{
	// 				title: 'Phim mới cập nhật',
	// 				href: '/phim-moi'
	// 			},
	// 			{
	// 				title: 'Phim lãng mạn',
	// 				href: '/phim-tinh-cam'
	// 			},
	// 			{
	// 				title: 'Diễn viên nổi tiếng',
	// 				href: '/tim-kiem/dien-vien'
	// 			}
	// 		]
	// 	},
	// 	{
	// 		group: 'Thể loại',
	// 		items: [
	// 			{
	// 				title: 'Kinh dị',
	// 				href: '/kinh-di'
	// 			},
	// 			{
	// 				title: 'Hành động',
	// 				href: 'hanh-dong'
	// 			},
	// 			{
	// 				title: 'Hài hước',
	// 				href: '/hai-huoc'
	// 			},
	// 			{
	// 				title: 'Võ thuật',
	// 				href: '/vo-thuat'
	// 			},
	// 			{
	// 				title: 'Hình sự',
	// 				href: '/hinh-su'
	// 			},
	// 			{
	// 				title: 'Võ thuật',
	// 				href: '/vo-thuat'
	// 			},
	// 			{
	// 				title: '18+',
	// 				href: '/phim-18-cong'
	// 			}
	// 		]
	// 	},
	// 	{
	// 		group: 'Phimbop',
	// 		items: [
	// 			{
	// 				title: 'Giới thiệu',
	// 				href: '/gioi-thieu'
	// 			},
	// 			{
	// 				title: 'Hướng dẫn',
	// 				href: 'gioi-thieu/huong-dan-su-dung-phimbop'
	// 			},
	// 			{
	// 				title: 'Cập nhật tên miền',
	// 				href: 'https://linktr.ee/phimbop'
	// 			},
	// 			{
	// 				title: 'Telegram',
	// 				href: 'https://t.me/phimbop_group.'
	// 			},
	// 			{
	// 				title: 'Liên hệ quảng cáo',
	// 				href: 'mailto:phimbop@duck.com'
	// 			},
	// 			{
	// 				title: 'Donate',
	// 				href: 'https://portal.vietcombank.com.vn/content/personal/KhoAnh/Ngan%20hang%20dien%20tu/EBANK%202020/File%20dinh%20kem/Danh%20sach%20Quy%20To%20chuc%20tu%20thien%20Vietcombank_final.pdf'
	// 			}
	// 		]
	// 	},
	// 	{
	// 		group: 'Pháp lý',
	// 		items: [
	// 			{
	// 				title: 'Disclaimer',
	// 				href: '/disclaimer'
	// 			},
	// 			{
	// 				title: 'Privacy',
	// 				href: '/privacy-policy'
	// 			},
	// 			{
	// 				title: 'Term of Service',
	// 				href: '/term-of-service'
	// 			}
	// 		]
	// 	}
	// ];
	const links = [
		{
			group: m.reuse_list(),
			items: [
				{ title: m.footer_tv_series(), href: '/phim-bo' },
				{ title: m.footer_movies(), href: '/phim-le' },
				{ title: m.footer_animation(), href: '/phim-hoat-hinh' },
				{ title: m.footer_recently_updated(), href: '/phim-moi' },
				{ title: m.footer_romance(), href: '/phim-tinh-cam' },
				{ title: m.footer_popular_actors(), href: '/tim-kiem/dien-vien' }
			]
		},
		{
			group: m.reuse_genres(),
			items: [
				{ title: m.footer_horror(), href: '/kinh-di' },
				{ title: m.footer_action(), href: '/hanh-dong' },
				{ title: m.footer_comedy(), href: '/hai-huoc' },
				{ title: m.footer_martial_arts(), href: '/vo-thuat' },
				{ title: m.footer_crime(), href: '/hinh-su' },
				{ title: m.footer_martial_arts(), href: '/vo-thuat' },
				{ title: m.footer_18(), href: '/phim-18-cong' }
			]
		},
		{
			group: 'Phimbop',
			items: [
				{ title: m.footer_about_us(), href: '/gioi-thieu' },
				{ title: m.footer_user_guide(), href: '/gioi-thieu/huong-dan-su-dung-phimbop' },
				{ title: m.footer_domain_updates(), href: 'https://linktr.ee/phimbop ' },
				{ title: m.footer_telegram(), href: 'https://t.me/phimbop_group ' },
				{ title: m.footer_advertise(), href: 'mailto:phimbop@duck.com' },
				{
					title: m.footer_donate(),
					href: 'https://portal.vietcombank.com.vn/content/personal/KhoAnh/Ngan%20hang%20dien%20tu/EBANK%202020/File%20dinh%20kem/Danh%20sach%20Quy%20To%20chuc%20tu%20thien%20Vietcombank_final.pdf '
				}
			]
		},
		{
			group: m.reuse_legal(),
			items: [
				{ title: m.footer_disclaimer(), href: '/disclaimer' },
				{ title: m.footer_privacy_policy(), href: '/privacy-policy' },
				{ title: m.footer_terms_of_service(), href: '/term-of-service' }
			]
		}
	];
	let email = $state('');
	const subscribed = useLocalStorage('subscribed', false);
	const subscribeHandler = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		// Kiểm tra input email
		if (!email || email.trim() === '') {
			alert(m.alert_enter_email());
			return;
		}

		if (!emailRegex.test(email)) {
			alert(m.alert_enter_valid_email());
			return;
		}

		try {
			const response = await fetch('/api/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});
			if (!response.ok) {
				alert(m.alert_server_error({ status: response.status.toString() }));
				throw new Error(m.alert_server_error({ status: response.status.toString() }));
			}
			subscribed.value = true;
		} catch (error) {
			throw error;
		}
	};
</script>

<footer class="pt-20 bg-transparent text-slate-200 container mx-auto">
	<div class="mb-8 border-b border-slate-50/20 md:mb-12">
		<div class="mx-auto flex max-w-full flex-wrap items-end justify-between gap-6 px-6 pb-6">
			<a href="/" class="block size-fit font-bold text-4xl">
				<p class="text-slate-200">Phim<span class="text-neonPink-500">bop</span></p>
			</a>
			<div class="flex flex-wrap justify-center items-center gap-6 text-sm">
				<div class="hidden sm:block">
					<LanguageSwitcher />
				</div>
				<a
					href="https://t.me/phimbop_group"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Telegram"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-8"
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="#000000"
						stroke-width="1"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
					</svg>
				</a>
				<a
					href="https://x.com/phimbop_xyz"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="X/Twitter"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
						></path>
					</svg>
				</a>
				<a
					href="#"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="aedIn"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
						></path>
					</svg>
				</a>
				<a
					href="#"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Facebook"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"
						></path>
					</svg>
				</a>
				<a
					href="#"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Threads"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M19.25 8.505c-1.577-5.867-7-5.5-7-5.5s-7.5-.5-7.5 8.995s7.5 8.996 7.5 8.996s4.458.296 6.5-3.918c.667-1.858.5-5.573-6-5.573c0 0-3 0-3 2.5c0 .976 1 2 2.5 2s3.171-1.027 3.5-3c1-6-4.5-6.5-6-4"
							color="currentColor"
						></path>
					</svg>
				</a>
				<a
					href="#"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Instagram"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
						></path>
					</svg>
				</a>
				<a
					href="https://www.tiktok.com/@phimbop"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="TikTok"
					class="text-muted-foreground hover:text-primary block"
				>
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						width="1em"
						height="1em"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48"
						></path>
					</svg>
				</a>
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-full px-6">
		<div class="grid gap-12 md:grid-cols-5 md:gap-0 lg:grid-cols-4">
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-4 md:col-span-5 md:row-start-1 lg:col-span-3">
				{#each links as link}
					<div class="space-y-4 text-sm">
						<span class="block font-bold">{link.group}</span>
						{#each link.items as item}
							<a href={item.href.startsWith('/') ? localizeHref(item.href) : item.href} class="text-slate-100/60 hover:text-slate-100 block duration-150">
								<span>{item.title}</span>
							</a>
						{/each}
					</div>
				{/each}
			</div>
			<form class="row-start-1 border-b pb-8 text-sm md:col-span-2 md:border-none lg:col-span-1">
				<div class="space-y-4">
					<label for="mail" class="block font-medium">{m.footer_email_form()}</label>
					{#if !subscribed.value}
						<div class="w-fit relative border-[0.5px] border-slate-50/40 rounded-full p-0.5">
							<input
								class="w-full h-full min-w-xs md:h-10 pr-8 pl-4 py-1 text-slate-200 outline-hidden border-none focus:border-none focus:outline-hidden bg-transparent focus:ring-0"
								type="email"
								placeholder="Email"
								autocomplete="off"
								id="subscribe"
								required
								bind:value={email}
							/>
							<ButtonPrimary
								onclick={debounce(() => subscribeHandler(), 300)}
								class="absolute right-0.5 md:right-2 top-1/2 -translate-y-1/2 cursor-pointer"
							>
								{m.footer_email_btn_subscribe()}
							</ButtonPrimary>
						</div>
						<span class="text-muted-foreground block text-sm">{m.footer_email_describe()}</span>
					{:else}
						<span class="text-muted-foreground block text-sm"
							>{m.footer_email_success_message()}</span
						>
					{/if}
				</div>
			</form>
		</div>
		<div
			class="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-slate-50/20 py-6"
		>
			<small class="text-muted-foreground order-last block text-center text-sm md:order-first"
				>© {new Date().getFullYear()} Phimbop, All rights reserved</small
			>
		</div>
	</div>
</footer>
