# Hướng dẫn Quản lý & Cập nhật Phiên bản bằng Supabase (Tauri v2)

Tài liệu hướng dẫn chi tiết quy trình cấu hình, quản trị và phát hành bản cập nhật cho ứng dụng desktop **PHIMBOP** sử dụng **Supabase Control Plane** kết hợp **Tauri v2 Updater**.

---

## 1. Mô hình kiến trúc

```text
[Người dùng mở App]
       │
       ▼
[Tauri Updater Plugin] ──(1) Gửi GET kèm target & current_version──► [Supabase Edge Function: /app-update]
                                                                                │
                                                                   (2) Query DB app_versions
                                                                                │
                                                                                ▼
[App Desktop] ◄──(3) Trả về JSON chuẩn Tauri v2 (version, notes, url, sig) ─────┘
       │
       ├─► So sánh chữ ký số minisign (Bảo mật, chống giả mạo)
       ├─► Tải file cài đặt từ download_url (GitHub Releases / Cloudflare R2 / S3 / Supabase)
       ├─► Kiểm tra is_critical / min_supported_version -> Khóa màn hình hoặc cho phép cập nhật sau
       └─► Tiến hành cài đặt và khởi động lại ứng dụng
```

---

## 2. Thiết lập trên Supabase

### Bước 1: Khởi tạo bảng `app_versions`
Vào **Supabase Dashboard** -> **SQL Editor** -> Dán nội dung file [supabase/migrations/20260916_app_versions.sql](file:///home/arch/Project/test/pb-desk/supabase/migrations/20260916_app_versions.sql) và chạy (**Run**).

### Bước 2: Deploy Edge Function
Cài đặt Supabase CLI (nếu chưa có) và deploy hàm:
```bash
# Đăng nhập và link project
supabase login
supabase link --project-ref <your-project-ref>

# Deploy function
supabase functions deploy app-update --no-verify-jwt
```
> URL của function sẽ có dạng:
> `https://<your-project-ref>.supabase.co/functions/v1/app-update`

---

## 3. Quản trị & Tự chỉnh Link Download trên Supabase Dashboard

Bạn có thể chỉnh sửa trực tiếp mọi thông số trong bảng `app_versions` trên giao diện web của Supabase:

| Cột | Ý nghĩa | Cách chỉnh sửa thủ công |
| :--- | :--- | :--- |
| `download_url` | Đường dẫn trực tiếp đến file cài đặt (`.exe`, `.dmg`, `.AppImage`) | **Tự do thay đổi**. Có thể trỏ về GitHub Releases, Cloudflare R2, BunnyCDN, Google Drive, hoặc host riêng. |
| `signature` | Chữ ký số minisign (`.sig`) của file cài đặt | **Lưu ý**: Nếu đổi sang file build khác, phải dán chuỗi chữ ký tương ứng vào đây. Nếu chỉ chuyển host (file không đổi), giữ nguyên chữ ký. |
| `version` | Số phiên bản mới (ví dụ: `0.2.0`) | Semantic Versioning. Client sẽ tự so sánh với version hiện tại. |
| `is_critical` | Đánh dấu bản cập nhật bắt buộc | Đổi thành `true` để ép người dùng cập nhật ngay (khóa màn hình). |
| `min_supported_version`| Phiên bản cũ nhất còn được phép dùng | Ví dụ đặt `0.2.0`: các máy đang ở `0.1.x` sẽ bị buộc update ngay. |
| `release_notes` | Ghi chú cập nhật | Hỗ trợ hiển thị tiếng Việt, Markdown tóm tắt tính năng mới. |
| `rollout_percentage` | Tỷ lệ % người dùng nhận bản update | Ví dụ `20` = chỉ 20% người dùng nhận update trước (Staged Rollout). |
| `is_active` | Bật/tắt bản phát hành | Đổi thành `false` nếu phát hiện bug nghiêm trọng muốn dừng update tức thì. |

---

## 4. Cấu hình Khóa Ký số (Minisign Keypair)

Tauri bắt buộc chữ ký số để đảm bảo file cập nhật không bị can thiệp.

1. **Sinh cặp khóa:**
   ```bash
   bunx @tauri-apps/cli signer generate -w ~/.tauri/phimbop.key
   ```
   Lệnh sẽ xuất ra:
   - **Public Key**: Chuỗi text lưu vào `tauri.conf.json` (`plugins.updater.pubkey`).
   - **Private Key**: Khóa bí mật lưu vào file `~/.tauri/phimbop.key` (dùng để ký khi build CI/CD).

2. **Lưu bí mật vào GitHub Secrets (cho CI/CD):**
   - `TAURI_SIGNING_PRIVATE_KEY`: Nội dung file `phimbop.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Mật khẩu bảo vệ key
