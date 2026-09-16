<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<Seo title={m.docs_seo_title()} metadescription={m.docs_seo_description()} slug={`${page.url}`} />

<section class="w-full h-full flex items-center">
	<div class="relative z-0 mx-auto max-w-3xl">
		<div class="absolute -top-4 -z-10 flex w-full justify-center">
			<div
				class="h-[310px] w-[310px] max-w-full animate-pulse-slow rounded-full bg-[#8678F9] opacity-20 blur-[100px]"
			></div>
		</div>

		<div class="space-y-4 text-slate-200 w-full h-full">
			<h2 class="text-xl font-semibold mt-4 text-neonPink-500">
				{m.docs_heading_shortcuts()}
			</h2>

			<div class="grid grid-cols-2 gap-10">
				<div>
					<h3 class="text-lg font-medium mt-2">
						{m.docs_heading_player_controls()}
					</h3>
					<ul class="list-disc pl-6">
						<li><strong>{m.docs_key_space()}</strong>: {m.docs_shortcut_pause_play()}</li>
						<li><strong>{m.docs_key_up_arrow()}</strong>: {m.docs_shortcut_volume_up()}</li>
						<li><strong>{m.docs_key_down_arrow()}</strong>: {m.docs_shortcut_volume_down()}</li>
						<li><strong>{m.docs_key_right_arrow()}</strong>: {m.docs_shortcut_seek_forward()}</li>
						<li><strong>{m.docs_key_left_arrow()}</strong>: {m.docs_shortcut_seek_backward()}</li>
						<li><strong>{m.docs_key_f()}</strong>: {m.docs_shortcut_fullscreen()}</li>
						<li><strong>{m.docs_key_m()}</strong>: {m.docs_shortcut_mute()}</li>
						<li><strong>{m.docs_key_c()}</strong>: {m.docs_shortcut_subtitles()}</li>
						<li><strong>{m.docs_key_l()}</strong>: {m.docs_shortcut_loop()}</li>
						<li><strong>{m.docs_key_1_to_9()}</strong>: {m.docs_shortcut_jump_percent()}</li>
					</ul>
				</div>

				<div>
					<h3 class="text-lg font-medium mt-2">
						{m.docs_heading_navigation()}
					</h3>
					<ul class="list-disc pl-6">
						<li><strong>{m.docs_key_right_arrow()}</strong>: {m.docs_shortcut_next_page()}</li>
						<li><strong>{m.docs_key_left_arrow()}</strong>: {m.docs_shortcut_prev_page()}</li>
					</ul>
				</div>
			</div>

			<h2 class="text-xl font-semibold mt-4 text-neonPink-500">
				{m.docs_heading_search()}
			</h2>
			<p>{m.docs_search_bar()}</p>
			<p>{m.docs_search_filter()}</p>
			<p>{m.docs_home_suggestions()}</p>

			<h2 class="text-xl font-semibold mt-4 text-neonPink-500">
				{m.docs_heading_favorites()}
			</h2>
			<p>
				<strong>{m.docs_shortcut_plus_heart()}</strong>: {m.docs_add_favorite()}
			</p>
			<p>{m.docs_view_favorites()}</p>

			<h2 class="text-xl font-semibold mt-4 text-neonPink-500">
				{m.docs_heading_feedback()}
			</h2>
			<p>
				{m.docs_contact_link().replace('"Liên hệ"', `<strong>${m.docs_contact_menu()}</strong>`)}
			</p>
			<p>{m.docs_community_support()}</p>

			<p class="mt-6 text-center font-medium">
				{m.docs_footer_hope()} phim<span class="font-bold text-neonPink-500">bop</span> !
			</p>
		</div>
	</div>
</section>
