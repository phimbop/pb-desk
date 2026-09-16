<script lang="ts">
	import { page } from "$app/state";
	import { websiteUrl } from "$lib";
	import Seo from "$lib/Components/SEO/Seo.svelte";
</script>

<Seo title="Chính sách bảo mật - Privacy Policy" metadescription="Chính sách bảo mật - Privacy Policy" slug={`${page.url}`} >
</Seo>

<div class="container mt-20 mx-auto px-4 py-8 max-w-5xl">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="text-3xl md:text-4xl font-bold primary-text mb-2">CHÍNH SÁCH BẢO MẬT</h1>
		<p class="text-lg text-slate-400">Cập nhật lần cuối: 30/03/2025</p>
		<div class="mt-4">
			<a href="/" class="text-slate-200 hover:text-neonPink-500 font-medium">← Quay về trang chủ PhimBop</a>
		</div>
	</header>

	<!-- Content -->
	<div class="bg-transparent rounded-lg shadow-md p-6 md:p-8 text-slate-100">
		<!-- Introduction -->
		<section class="mb-8">
			<p class="mb-4">Chào mừng bạn đến với <span class="font-semibold">Phim</span><span class="font-semibold text-neonPink-500">Bop</span>! Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và chia sẻ thông tin khi bạn truy cập website <a href={websiteUrl} class="text-neonPink-500 hover:underline">{websiteUrl}</a>.</p>
		</section>

		<!-- Section 1 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-b border-slate-50/20 pb-2">1. Thông Tin Thu Thập</h2>
			<p class="mb-4">Chúng tôi có thể thu thập các loại thông tin sau:</p>
			<ul class="list-disc pl-6 space-y-2">
				<li><span class="font-medium">Thông tin cá nhân:</span> Email, tên đăng nhập, mật khẩu (nếu bạn đăng ký tài khoản).</li>
				<li><span class="font-medium">Dữ liệu truy cập:</span> Địa chỉ IP, trình duyệt, thiết bị, thời gian truy cập, trang bạn xem.</li>
				<li><span class="font-medium">Cookie & Công nghệ theo dõi:</span> Để cải thiện trải nghiệm và phân tích lưu lượng truy cập.</li>
			</ul>
		</section>

		<!-- Section 2 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">2. Mục Đích Sử Dụng</h2>
			<ul class="list-disc pl-6 space-y-2">
				<li>Cung cấp dịch vụ xem phim và tính năng cá nhân hóa.</li>
				<li>Phân tích để cải thiện chất lượng website.</li>
				<li>Ngăn chặn hành vi lạm dụng hoặc vi phạm bản quyền.</li>
				<li>Gửi thông báo (nếu bạn đăng ký nhận tin).</li>
			</ul>
		</section>

		<!-- Section 3 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">3. Chia Sẻ Thông Tin</h2>
			<p class="mb-4">Chúng tôi <span class="font-semibold">không bán</span> thông tin cá nhân của bạn. Dữ liệu có thể được chia sẻ với:</p>
			<ul class="list-disc pl-6 space-y-2">
				<li>Đối tác dịch vụ (ví dụ: nhà cung cấp hosting, Google Analytics).</li>
				<li>Cơ quan pháp luật nếu có yêu cầu hợp pháp.</li>
			</ul>
		</section>

		<!-- Section 4 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">4. Bảo Mật Dữ Liệu</h2>
			<ul class="list-disc pl-6 space-y-2">
				<li>Sử dụng SSL để mã hóa dữ liệu truyền tải.</li>
				<li>Các biện pháp kỹ thuật để ngăn chặn truy cập trái phép.</li>
			</ul>
		</section>

		<!-- Section 5 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">5. Liên Kết Ngoài</h2>
			<p>Website có thể chứa liên kết đến trang khác. Chúng tôi không chịu trách nhiệm về nội dung hoặc chính sách bảo mật của họ.</p>
		</section>

		<!-- Section 6 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">6. Quyền Của Người Dùng</h2>
			<p class="mb-4">Bạn có quyền:</p>
			<ul class="list-disc pl-6 space-y-2">
				<li>Truy cập, chỉnh sửa hoặc xóa thông tin cá nhân.</li>
				<li>Từ chối cookie (tùy chỉnh trong trình duyệt).</li>
				<li>Liên hệ với chúng tôi qua email <a href="mailto:phimbop@duck.com" class="text-neonPink-500 hover:underline">phimbop@duck.com</a> để yêu cầu hỗ trợ.</li>
			</ul>
		</section>

		<!-- Section 7 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">7. Thay Đổi Chính Sách</h2>
			<p>Chúng tôi có thể cập nhật chính sách này. Phiên bản mới sẽ được đăng trên trang này.</p>
		</section>

		<!-- Section 8 -->
		<section>
			<h2 class="text-xl font-bold text-slate-100 mb-4  border-slate-50/20 border-b pb-2">8. Liên Hệ</h2>
			<p>Nếu có câu hỏi, vui lòng gửi email đến: <a href="mailto:phimbop@duck.com" class="text-neonPink-500 hover:underline">phimbop@duck.com</a>.</p>
		</section>
	</div>
</div>
