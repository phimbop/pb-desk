-- ==============================================================================
-- Migration: 20260918_app_configs.sql
-- Description: Dynamic remote configuration store for PB-Desk (Key-Value)
-- ==============================================================================

create table if not exists public.app_configs (
    key text primary key,
    value text not null,
    description text default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Bật Row Level Security (RLS)
alter table public.app_configs enable row level security;

-- Cho phép đọc công khai (anon & authenticated)
create policy "Allow public read app_configs"
    on public.app_configs
    for select
    to anon, authenticated
    using (true);

-- Chỉ service_role (Admin / Dashboard) mới có quyền chỉnh sửa / thêm / xóa
create policy "Allow service_role full access app_configs"
    on public.app_configs
    for all
    to service_role
    using (true)
    with check (true);

-- Khởi tạo giá trị mặc định cho api_domain
insert into public.app_configs (key, value, description)
values ('api_domain', 'https://v3.phimbop.cfd', 'Central Backend API domain for pb-desk clients')
on conflict (key) do nothing;
