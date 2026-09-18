# PHIMBOP Desktop (pb-desk)

> Ứng dụng Desktop xem phim chất lượng cao được xây dựng dựa trên phiên bản web **PHIMBOP** (`pbv5`), sử dụng **Electron**, **Rust Sidecar** (kiến trúc đa-crate Zed-style), và **Svelte 5** (Runes).

---

## 1. Kiến trúc hệ thống (Electron + Zed-Style Rust Sidecar Architecture)

Dự án áp dụng mô hình phân tách crate độc lập theo chuẩn của **Zed Editor**, tối ưu hóa tốc độ biên dịch (kết hợp linker siêu tốc `mold`), bảo đảm logic nghiệp vụ không phụ thuộc vào GUI:

```text
pb-desk/
├── .cargo/
│   └── config.toml                  # Linker mold và tối ưu hóa cờ biên dịch Linux
├── .codegraph/                      # CodeGraph AST SQLite index
├── crates/                          # Các Rust crate độc lập
│   ├── pb_core/                     # Entity miền, trait kho lưu trữ, mã lỗi PbError
│   ├── pb_storage/                  # SQLite storage (lịch sử xem, phim yêu thích, cache TTL)
│   ├── pb_service/                  # Client kết nối API phim, đồng bộ dữ liệu, cache layer
│   ├── pb_ipc/                      # DTOs, schemas truyền tải dữ liệu giữa Rust và Frontend
│   └── pb_sidecar/                  # Rust sidecar binary (giao tiếp JSON-RPC qua stdio)
├── electron/                        # Electron Main Process & Preload
│   ├── main.ts                      # Window management, Tray, Notifications, Sidecar spawner
│   ├── preload.ts                   # Context-isolated secure IPC bridge
│   └── icons/                       # Biểu tượng ứng dụng đa kích thước (PNG, ICNS, ICO)
├── src/                             # Svelte 5 / SvelteKit Frontend (SPA mode)
│   ├── lib/
│   │   ├── components/              # Sidebar, Nav, CardMovie, Player (HLS), Pagination...
│   │   ├── stores/                  # Reactive State với Svelte 5 Runes ($state, $derived)
│   │   └── ipc.ts                   # Cầu nối gọi lệnh Electron IPC (hỗ trợ fallback trình duyệt)
│   └── routes/                      # Các trang: Trang chủ, Phim bộ, Phim lẻ, Tìm kiếm, Lịch sử...
├── electron-builder.json            # Cấu hình đóng gói Electron (AppImage, deb, dmg, nsis)
├── Cargo.toml                       # Cargo workspace quản lý thống nhất phiên bản
└── package.json                     # Quản lý thư viện frontend (Bun / Vite / Tailwind v4)
```

---

## 2. Tính năng nổi bật & Giao diện chuẩn PBv5

- **Giữ trọn vẹn Theme & Giao diện**: Tông màu `neonPink` đặc trưng (`#ff1493`), nền tối `neutral-950` với hiệu ứng gradient huyền ảo, font chữ Nunito tiếng Việt.
- **Trình chiếu phim HLS thông minh**:
  - Hỗ trợ m3u8 stream trực tiếp với `hls.js`, tự động chọn server và tập tiếp theo.
  - Chế độ rạp chiếu (Cinema Mode): tự động thu gọn thanh điều hướng khi phát phim.
  - Tự động ghi nhớ mốc thời gian đã xem và lưu cục bộ vào SQLite.
- **Lưu trữ cục bộ với SQLite (`pb_storage`)**:
  - Lịch sử xem phim: tiến độ %, mốc giây, tập đang xem.
  - Phim yêu thích: đánh dấu xem sau nhanh chóng.
  - Bộ nhớ đệm (Cache TTL): giảm thiểu gọi API trùng lặp, phản hồi tức thì.
- **Phân loại phim phong phú**:
  - Phim mới cập nhật, Phim bộ tuyển chọn, Phim lẻ bom tấn, Hoạt hình Anime, Phim tình cảm, Phim 18+.
  - Bảng xếp hạng phim xem nhiều.
  - Tìm kiếm thông minh theo từ khóa.

---

## 3. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống:
- Rust & Cargo (1.80+)
- Bun (1.0+)
- Linker `mold` và `clang` (tùy chọn trên Linux để tăng tốc biên dịch)

### Lệnh thực thi:

```bash
# 1. Cài đặt thư viện frontend
bun install

# 2. Khởi chạy ứng dụng Desktop (Electron dev mode)
bun run electron:dev

# 3. Kiểm tra mã nguồn Rust & Clippy
cargo clippy --workspace -- -D warnings
cargo test --workspace

# 4. Kiểm tra mã nguồn Svelte 5
bun run check

# 5. Đóng gói ứng dụng Desktop
bun run pack
```

---

## 4. Cài đặt nhanh (Linux & macOS)

Người dùng có thể cài đặt trực tiếp ứng dụng thông qua script tự động:

```bash
# Cài đặt tự động phiên bản mới nhất
curl -fsSL https://raw.githubusercontent.com/phimbop/pb-desk/main/install.sh | bash

# Hoặc nếu đã clone mã nguồn về máy:
chmod +x install.sh
./install.sh
```

- **Linux**: Tự động tải `AppImage` di động hoặc gói `.deb` (Debian/Ubuntu), tự động tạo shortcut launcher trong Menu ứng dụng và gán biểu tượng.
- **macOS**: Tự động tải DMG tương ứng với kiến trúc máy (Apple Silicon M-series hoặc Intel x86_64), mount và cài đặt vào `/Applications`.

