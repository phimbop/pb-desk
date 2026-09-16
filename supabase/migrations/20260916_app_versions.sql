-- ==============================================================================
-- Migration: 20260916_app_versions.sql
-- Description: Quản lý phiên bản ứng dụng desktop PHIMBOP và cấu hình Auto-Update
-- ==============================================================================

-- 1. Bảng app_versions lưu trữ thông tin phát hành theo nền tảng
create table if not exists public.app_versions (
    id uuid primary key default gen_random_uuid(),
    version text not null,                       -- Ví dụ: '0.2.0' (Semantic Versioning)
    channel text not null default 'stable',      -- 'stable' | 'beta' | 'dev'
    target text not null,                        -- 'windows-x86_64' | 'darwin-aarch64' | 'darwin-x86_64' | 'linux-x86_64'
    download_url text not null,                  -- Link tải file cài đặt (có thể chỉnh sửa trên Supabase Dashboard)
    signature text not null,                     -- Minisign signature (.sig sinh ra từ Tauri CLI / GitHub Actions)
    min_supported_version text default null,     -- Phiên bản tối thiểu được hỗ trợ; nếu app < min thì buộc update
    is_critical boolean not null default false,  -- Đánh dấu bản cập nhật khẩn cấp (khóa màn hình app bắt buộc update)
    release_notes text default '',               -- Nội dung thay đổi (Changelog) hiển thị cho người dùng
    rollout_percentage int not null default 100, -- Phân phối theo tỷ lệ % (0 - 100)
    is_active boolean not null default true,     -- Bật / tắt bản phát hành
    published_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Đánh Index phục vụ truy vấn nhanh từ client và Edge Function
create index if not exists idx_app_versions_lookup 
    on public.app_versions(target, channel, is_active, published_at desc);

create unique index if not exists idx_app_versions_unique_release
    on public.app_versions(version, channel, target);

-- 3. Bật Row Level Security (RLS)
alter table public.app_versions enable row level security;

-- Cho phép người dùng vô danh (anon) và xác thực đọc các bản phát hành đang hoạt động (is_active = true)
create policy "Allow public read active app_versions"
    on public.app_versions
    for select
    to anon, authenticated
    using (is_active = true);

-- Chỉ service_role (Admin / CI/CD) mới được quyền INSERT / UPDATE / DELETE
create policy "Allow service_role full access app_versions"
    on public.app_versions
    for all
    to service_role
    using (true)
    with check (true);

-- 4. Trigger tự động cập nhật updated_at
create or replace function public.handle_app_versions_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create or replace trigger tr_app_versions_updated_at
    before update on public.app_versions
    for each row
    execute function public.handle_app_versions_updated_at();

-- 5. Seed dữ liệu mẫu (bản khởi đầu v0.1.0)
insert into public.app_versions (version, channel, target, download_url, signature, is_critical, release_notes)
values 
('0.1.0', 'stable', 'windows-x86_64', 'https://github.com/phimbop/pb-desk/releases/download/v0.1.0/PHIMBOP_0.1.0_x64-setup.exe', 'dW50cnVzdGVkIGNvbW1lbnQ6IHNhbXBsZQ==', false, 'Bản phát hành đầu tiên cho Windows.'),
('0.1.0', 'stable', 'darwin-aarch64', 'https://github.com/phimbop/pb-desk/releases/download/v0.1.0/PHIMBOP_0.1.0_aarch64.dmg', 'dW50cnVzdGVkIGNvbW1lbnQ6IHNhbXBsZQ==', false, 'Bản phát hành đầu tiên cho macOS Apple Silicon.'),
('0.1.0', 'stable', 'darwin-x86_64', 'https://github.com/phimbop/pb-desk/releases/download/v0.1.0/PHIMBOP_0.1.0_x64.dmg', 'dW50cnVzdGVkIGNvbW1lbnQ6IHNhbXBsZQ==', false, 'Bản phát hành đầu tiên cho macOS Intel.'),
('0.1.0', 'stable', 'linux-x86_64', 'https://github.com/phimbop/pb-desk/releases/download/v0.1.0/PHIMBOP_0.1.0_amd64.AppImage', 'dW50cnVzdGVkIGNvbW1lbnQ6IHNhbXBsZQ==', false, 'Bản phát hành đầu tiên cho Linux.')
on conflict (version, channel, target) do nothing;
