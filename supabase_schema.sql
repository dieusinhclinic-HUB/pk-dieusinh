-- ============================================================
-- PK DIỆU SINH — SCHEMA SUPABASE (Đợt DB, 20/8/2026)
-- Dán toàn bộ file này vào Supabase SQL Editor và Run 1 lần.
-- Tên bảng/cột GIỮ NGUYÊN như Google Sheet (quoted identifiers).
-- ============================================================

-- ---------- BẢNG ----------
create table if not exists public."NGUOI_DUNG" (
  "EMAIL"    text primary key,
  "HO_TEN"   text default '',
  "VAI_TRO"  text not null,          -- Quản lý / Thu ngân / Lễ tân / Bác sĩ / Thư ký / Dược sỹ / Kế toán
  "MA_NV"    text default '',        -- mã trên máy chấm công (Đợt B)
  "GHI_CHU"  text default ''
);

create table if not exists public."BENH_NHAN" (
  "MA_BN"     text primary key,
  "HO_TEN"    text not null,
  "NGAY_SINH" text default '',
  "GIOI_TINH" text default '',
  "SDT"       text default '',
  "DIA_CHI"   text default '',
  "TIEN_SU"   text default '',
  "GHI_CHU"   text default '',
  "NGAY_LAP"  text default ''
);

create table if not exists public."BAC_SI" (
  "MA_BS"         text primary key,
  "TEN_BS"        text not null,
  "CHUYEN_KHOA"   text default '',
  "DANG_LAM_VIEC" text default 'Có',
  "GHI_CHU"       text default ''
);

create table if not exists public."DICH_VU" (
  "MA_DV"      text primary key,
  "TEN_DV"     text not null,
  "NHOM"       text default '',
  "DON_GIA"    numeric default 0,
  "CON_AP_DUNG" text default 'Có',
  "GHI_CHU"    text default ''
);

create table if not exists public."HANG_CHO" (
  "MA_CHO"        text primary key,
  "NGAY"          text not null,
  "STT"           numeric default 0,
  "MA_BN"         text not null,
  "TRANG_THAI"    text default 'Chờ khám',
  "BS_KHAM"       text default '',
  "GHI_CHU"       text default '',
  "DV_YEU_CAU"    text default '',
  "BS_YEU_CAU"    text default '',
  "MA_HEN"        text default '',
  "UU_TIEN"       text default '',
  "LY_DO_HUY"     text default '',
  "GIO_TIEP_NHAN" text default '',
  "GIO_GOI"       text default '',
  "GIO_XONG"      text default '',
  "GIO_THU"       text default ''
);

create table if not exists public."SO_KHAM" (
  "MA_LUOT"       text primary key,
  "NGAY"          text not null,
  "MA_BN"         text not null,
  "TEN_DV"        text default '',
  "BS_THUC_HIEN"  text default '',
  "BS_CHI_DINH"   text default '',
  "DON_GIA"       numeric default 0,
  "SO_LUONG"      numeric default 1,
  "THANH_TIEN"    numeric default 0,
  "GHI_CHU"       text default '',
  "ANH_KET_QUA"   text default '',
  "MA_CHO"        text default '',
  "TRANG_THAI_DV" text default '',
  "NGUOI_XAC_NHAN" text default '',
  "GIO_XAC_NHAN"  text default ''
);

create table if not exists public."THANH_TOAN" (
  "MA_TT"     text primary key,
  "NGAY"      text not null,
  "MA_BN"     text not null,
  "TONG_HD"   numeric default 0,
  "DA_THU"    numeric default 0,
  "CON_LAI"   numeric default 0,
  "HINH_THUC" text default '',
  "THU_NGAN"  text default '',
  "GHI_CHU"   text default ''
);

create table if not exists public."LICH_HEN" (
  "MA_HEN"       text primary key,
  "NGAY_HEN"     text not null,
  "GIO_HEN"      text default '',
  "MA_BN"        text not null,
  "LY_DO"        text default '',
  "BS_PHU_TRACH" text default '',
  "TRANG_THAI"   text default 'Đã hẹn',
  "GHI_CHU"      text default '',
  "LOAI"         text default '',
  "TU_DONG"      text default ''
);

create table if not exists public."THAI_KY" (
  "MA_TK"      text primary key,
  "MA_BN"      text not null,
  "KINH_CUOI"  text default '',
  "TRANG_THAI" text default 'Đang theo dõi',
  "GHI_CHU"    text default ''
);

create table if not exists public."THUOC" (
  "MA_THUOC"     text primary key,
  "TEN_THUOC"    text not null,
  "HOAT_CHAT"    text default '',
  "DVT"          text default '',
  "NHOM"         text default '',
  "GIA_VON"      numeric default 0,
  "GIA_BAN"      numeric default 0,
  "TON_TOI_THIEU" numeric default 0,
  "CON_AP_DUNG"  text default 'Có',
  "GHI_CHU"      text default ''
);

create table if not exists public."KHO_GD" (
  "MA_GD"    text primary key,
  "NGAY"     text not null,
  "MA_THUOC" text not null,
  "LOAI"     text not null,          -- Tồn đầu / Nhập / Xuất / Kiểm kê
  "SO_LUONG" numeric default 0,
  "LO"       text default '',
  "HSD"      text default '',
  "GHI_CHU"  text default ''
);

-- Nhật ký hệ thống (trigger tự ghi)
create table if not exists public."NHAT_KY" (
  id bigint generated always as identity primary key,
  ts timestamptz default now(),
  bang text,
  thao_tac text,
  khoa text,
  nguoi text,
  noi_dung jsonb
);

-- Bộ đếm mã nguyên tử (nâng cấp chống trùng mã — dùng dần)
create table if not exists public."COUNTERS" ( prefix text primary key, n bigint not null default 0 );

-- ---------- HÀM VAI TRÒ ----------
create or replace function public.pk_email() returns text
language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email',''))
$$;

create or replace function public.pk_role() returns text
language sql stable security definer set search_path = public as $$
  select "VAI_TRO" from public."NGUOI_DUNG" where lower("EMAIL") = public.pk_email() limit 1
$$;

-- RPC cấp mã nguyên tử: next_id('C', 5) -> 'C00012'
create or replace function public.next_id(p_prefix text, p_pad int)
returns text language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if public.pk_role() is null or public.pk_role() = 'Kế toán' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  insert into public."COUNTERS"(prefix, n) values (p_prefix, 1)
    on conflict (prefix) do update set n = "COUNTERS".n + 1
    returning n into v;
  return p_prefix || lpad(v::text, p_pad, '0');
end $$;

-- ---------- TRIGGER NHẬT KÝ ----------
create or replace function public.pk_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public."NHAT_KY"(bang, thao_tac, khoa, nguoi, noi_dung)
  values (TG_TABLE_NAME, TG_OP,
    coalesce( to_jsonb(coalesce(NEW, OLD)) ->> (
      case TG_TABLE_NAME
        when 'BENH_NHAN' then 'MA_BN'   when 'HANG_CHO' then 'MA_CHO'
        when 'SO_KHAM' then 'MA_LUOT'   when 'THANH_TOAN' then 'MA_TT'
        when 'LICH_HEN' then 'MA_HEN'   when 'THAI_KY' then 'MA_TK'
        when 'THUOC' then 'MA_THUOC'    when 'KHO_GD' then 'MA_GD'
        when 'DICH_VU' then 'MA_DV'     when 'BAC_SI' then 'MA_BS'
        else 'EMAIL' end ), ''),
    public.pk_email(),
    case when TG_OP = 'UPDATE' then jsonb_build_object('moi', to_jsonb(NEW)) else to_jsonb(coalesce(NEW, OLD)) end);
  return coalesce(NEW, OLD);
end $$;

do $$
declare t text;
begin
  foreach t in array array['BENH_NHAN','BAC_SI','DICH_VU','HANG_CHO','SO_KHAM','THANH_TOAN','LICH_HEN','THAI_KY','THUOC','KHO_GD']
  loop
    execute format('drop trigger if exists trg_audit on public.%I', t);
    execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute function public.pk_audit()', t);
  end loop;
end $$;

-- ---------- ROW LEVEL SECURITY ----------
do $$
declare t text;
begin
  foreach t in array array['BENH_NHAN','BAC_SI','DICH_VU','HANG_CHO','SO_KHAM','THANH_TOAN','LICH_HEN','THAI_KY','THUOC','KHO_GD']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists p_read on public.%I', t);
    execute format('create policy p_read on public.%I for select to authenticated using (public.pk_role() is not null)', t);
    execute format('drop policy if exists p_insert on public.%I', t);
    execute format('create policy p_insert on public.%I for insert to authenticated with check (public.pk_role() is not null and public.pk_role() <> ''Kế toán'')', t);
    execute format('drop policy if exists p_update on public.%I', t);
    execute format('create policy p_update on public.%I for update to authenticated using (public.pk_role() is not null and public.pk_role() <> ''Kế toán'') with check (public.pk_role() is not null and public.pk_role() <> ''Kế toán'')', t);
    -- KHÔNG có policy delete → không ai xóa được qua web (chỉ Quản lý trong dashboard)
  end loop;
end $$;

alter table public."NGUOI_DUNG" enable row level security;
drop policy if exists p_nd_read on public."NGUOI_DUNG";
create policy p_nd_read on public."NGUOI_DUNG" for select to authenticated
  using (lower("EMAIL") = public.pk_email() or public.pk_role() = 'Quản lý');
-- NGUOI_DUNG chỉ sửa trong dashboard (service_role) — không policy ghi

alter table public."NHAT_KY" enable row level security;
drop policy if exists p_nk_read on public."NHAT_KY";
create policy p_nk_read on public."NHAT_KY" for select to authenticated using (public.pk_role() = 'Quản lý');

alter table public."COUNTERS" enable row level security; -- chỉ RPC (security definer) đụng vào

-- ---------- REALTIME ----------
do $$
declare t text;
begin
  foreach t in array array['BENH_NHAN','BAC_SI','DICH_VU','HANG_CHO','SO_KHAM','THANH_TOAN','LICH_HEN','THAI_KY','THUOC','KHO_GD']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- TÀI KHOẢN BAN ĐẦU ----------
insert into public."NGUOI_DUNG"("EMAIL","HO_TEN","VAI_TRO") values
  ('dieusinhclinic@gmail.com','Diệu Sinh Clinic','Quản lý'),
  ('minhkhangthienphu@gmail.com','Khang','Quản lý')
on conflict ("EMAIL") do nothing;

select 'SCHEMA OK — ' || count(*) || ' bảng' from information_schema.tables where table_schema='public';
