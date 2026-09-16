<script>
	import { page } from "$app/state";
	import { websiteUrl } from "$lib";
	import Seo from "$lib/Components/SEO/Seo.svelte";
</script>

<Seo title="Điều khoản sử dụng - Term of Service" metadescription="Điều khoản sử dụng - Term of Service" slug={`${page.url}`} >
</Seo>

<div class="container mt-20 mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <header class="mb-8 text-center">
        <h1 class="text-3xl md:text-4xl font-bold primary-text mb-2">ĐIỀU KHOẢN DỊCH VỤ</h1>
        <p class="text-lg text-slate-400">Cập nhật lần cuối: 30/03/2025</p>
        <div class="mt-4">
            <a href="/" class="text-slate-200 hover:text-neonPink-500 font-medium">← Quay về trang chủ PhimBop</a>
        </div>
    </header>

    <!-- Content -->
    <div class="bg-transparent rounded-lg shadow-md p-6 md:p-8 text-slate-100">
        <!-- Introduction -->
        <section class="mb-8">
            <p class="mb-4">Chào mừng bạn đến với <span class="font-semibold">Phim</span><span class="font-semibold text-neonPink-500">Bop</span>! Khi truy cập hoặc sử dụng dịch vụ của chúng tôi tại <a href={websiteUrl} class="text-neonPink-500 hover:underline">{websiteUrl}</a>, bạn đồng ý tuân thủ các điều khoản sau:</p>
        </section>

        <!-- Section 1 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">1. Chấp nhận điều khoản</h2>
            <p class="mb-4">Bằng cách sử dụng PhimBop, bạn xác nhận đã đọc, hiểu và đồng ý ràng buộc bởi các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.</p>
        </section>

        <!-- Section 2 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">2. Tài khoản người dùng</h2>
            <ul class="list-disc pl-6 space-y-2">
                <li>Bạn phải từ đủ 13 tuổi để đăng ký tài khoản.</li>
                <li>Chịu trách nhiệm bảo mật thông tin đăng nhập.</li>
                <li>Không được phép chia sẻ tài khoản hoặc sử dụng để mục đích bất hợp pháp.</li>
            </ul>
        </section>

        <!-- Section 3 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">3. Quy định sử dụng</h2>
            <p class="mb-4">Bạn <span class="font-semibold">không được</span>:</p>
            <ul class="list-disc pl-6 space-y-2 mb-4">
                <li>Tải lên, phát tán nội dung vi phạm bản quyền.</li>
                <li>Reverse engineer, hack hoặc can thiệp vào hệ thống.</li>
                <li>Spam bình luận, đăng nội dung khiêu dâm/bạo lực.</li>
            </ul>
            <p>Vi phạm sẽ dẫn đến <span class="font-semibold text-red-600">khóa tài khoản vĩnh viễn</span> mà không cần báo trước.</p>
        </section>

        <!-- Section 4 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">4. Dịch vụ trả phí</h2>
            <ul class="list-disc pl-6 space-y-2">
                <li>Gói VIP cung cấp quyền lợi xem phim không quảng cáo.</li>
                <li><span class="font-medium">Không hoàn tiền</span> cho gói đã kích hoạt thành công.</li>
                <li>Phí gia hạn tự động (nếu bật tính năng auto-renew).</li>
            </ul>
        </section>

        <!-- Section 5 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">5. Nội dung bên thứ ba</h2>
            <p>Chúng tôi không kiểm soát nội dung từ liên kết ngoài và không chịu trách nhiệm về chúng.</p>
        </section>

        <!-- Section 6 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">6. Thay đổi dịch vụ</h2>
            <p>PhimBop có quyền ngừng cung cấp dịch vụ hoặc thay đổi điều khoản bất kỳ lúc nào. Thay đổi sẽ có hiệu lực ngay khi đăng tải.</p>
        </section>

        <!-- Section 7 -->
        <section class="mb-8">
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">7. Từ chối trách nhiệm</h2>
            <ul class="list-disc pl-6 space-y-2">
                <li>Không đảm bảo 100% thời gian hoạt động (có thể downtime bảo trì).</li>
                <li>Không chịu trách nhiệm nếu bạn vi phạm luật bản quyền.</li>
            </ul>
        </section>

        <!-- Section 8 -->
        <section>
            <h2 class="text-xl font-bold text-slate-100 border-b border-slate-50/20 mb-4 pb-2 section-title">8. Liên hệ</h2>
            <p>Mọi thắc mắc vui lòng gửi đến <a href="mailto:phimbop@duck.com" class="text-neonPink-500 hover:underline">phimbop@duck.com</a>.</p>
        </section>

        <!-- Acceptance -->
        <div class="mt-8 p-4 bg-slate-800 rounded-lg">
            <p class="font-medium text-neonPink-500">Bằng việc sử dụng PhimBop, bạn xác nhận đã hiểu và đồng ý với các điều khoản trên.</p>
        </div>
    </div>
</div>
