/* ============================================================
   PK DIỆU SINH — ADAPTER SUPABASE (Đợt DB)
   Mô phỏng đúng hợp đồng API cũ: login/logout/version/readAll/append/update
   → mỗi trang chỉ đổi thân hàm api() thành: return SB_API(action, Object.assign({token}, extra||{}))
   Nạp TRƯỚC file này: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ============================================================ */
(function(){
if (window.SB_API) return;

/* ==== CẤU HÌNH — điền khi có project ==== */
var SB_URL  = 'https://bhixwqpyvspmtumbvbhc.supabase.co';
var SB_ANON = 'sb_publishable_qfwFSZdJ0lrbCibylRUWxw_r-r23-hT'; // publishable key (thiết kế để công khai, RLS bảo vệ dữ liệu)

/* Thứ tự cột = header trả về cho màn hình (khớp schema) */
var COLS = {
  NGUOI_DUNG: ['EMAIL','HO_TEN','VAI_TRO','MA_NV','GHI_CHU'],
  BENH_NHAN:  ['MA_BN','HO_TEN','NGAY_SINH','GIOI_TINH','SDT','DIA_CHI','TIEN_SU','GHI_CHU','NGAY_LAP'],
  BAC_SI:     ['MA_BS','TEN_BS','CHUYEN_KHOA','DANG_LAM_VIEC','GHI_CHU'],
  DICH_VU:    ['MA_DV','TEN_DV','NHOM','DON_GIA','CON_AP_DUNG','GHI_CHU','THOI_LUONG'],
  HANG_CHO:   ['MA_CHO','NGAY','STT','MA_BN','TRANG_THAI','BS_KHAM','GHI_CHU','DV_YEU_CAU','BS_YEU_CAU','MA_HEN','UU_TIEN','LY_DO_HUY','GIO_TIEP_NHAN','GIO_GOI','GIO_XONG','GIO_THU'],
  SO_KHAM:    ['MA_LUOT','NGAY','MA_BN','TEN_DV','BS_THUC_HIEN','BS_CHI_DINH','DON_GIA','SO_LUONG','THANH_TIEN','GHI_CHU','ANH_KET_QUA','MA_CHO','TRANG_THAI_DV','NGUOI_XAC_NHAN','GIO_XAC_NHAN','KET_QUA'],
  TOA_THUOC:  ['MA_TOA','NGAY','MA_CHO','MA_BN','BS_KE','NGUOI_NHAP','TRANG_THAI','MA_TT','GHI_CHU','GIO_KE','GIO_SOAN','GIO_PHAT','NGUOI_SOAN','NGUOI_PHAT'],
  TOA_CT:     ['MA_CT','MA_TOA','MA_THUOC','TEN_THUOC','LIEU_LAN','LAN_NGAY','SO_NGAY','THOI_DIEM','SO_LUONG','SL_PHAT','DA_SOAN','DA_PHAT','GHI_CHU'],
  THANH_TOAN: ['MA_TT','NGAY','MA_BN','TONG_HD','DA_THU','CON_LAI','HINH_THUC','THU_NGAN','GHI_CHU'],
  LICH_HEN:   ['MA_HEN','NGAY_HEN','GIO_HEN','MA_BN','LY_DO','BS_PHU_TRACH','TRANG_THAI','GHI_CHU','LOAI','TU_DONG'],
  THAI_KY:    ['MA_TK','MA_BN','KINH_CUOI','TRANG_THAI','GHI_CHU'],
  THUOC:      ['MA_THUOC','TEN_THUOC','HOAT_CHAT','DVT','NHOM','GIA_VON','GIA_BAN','TON_TOI_THIEU','CON_AP_DUNG','GHI_CHU','MA_VACH'],
  KHO_GD:     ['MA_GD','NGAY','MA_THUOC','LOAI','SO_LUONG','LO','HSD','GHI_CHU'],
  PHAN_CONG:  ['MA_PC','NGAY','EMAIL_TK','DS_BS','GHI_CHU'],
  VAT_TU:     ['MA_VT','TEN_VT','DVT','NHOM','TON_TOI_THIEU','CON_AP_DUNG','GHI_CHU','MA_VACH'],
  VT_GD:      ['MA_GD','NGAY','MA_VT','LOAI','SO_LUONG','LO','HSD','GHI_CHU'],
  THIET_BI:   ['MA_TB','TEN_TB','NGAY_MUA','GIA_MUA','BAO_HANH_DEN','CHU_KY_BT','BAO_TRI_GAN_NHAT','TINH_TRANG','GHI_CHU','MODEL','SERIAL','VI_TRI','PHU_TRACH','HO_SO'],
  TB_LOG:     ['MA_LOG','MA_TB','NGAY','LOAI','NOI_DUNG','CHI_PHI','NGUOI']
};
var PK = { NGUOI_DUNG:'EMAIL', BENH_NHAN:'MA_BN', BAC_SI:'MA_BS', DICH_VU:'MA_DV', HANG_CHO:'MA_CHO',
  SO_KHAM:'MA_LUOT', THANH_TOAN:'MA_TT', LICH_HEN:'MA_HEN', THAI_KY:'MA_TK', THUOC:'MA_THUOC', KHO_GD:'MA_GD',
  TOA_THUOC:'MA_TOA', TOA_CT:'MA_CT', PHAN_CONG:'MA_PC', VAT_TU:'MA_VT', VT_GD:'MA_GD', THIET_BI:'MA_TB', TB_LOG:'MA_LOG' };

var sb = window.supabase.createClient(SB_URL, SB_ANON, { auth: { persistSession: true, autoRefreshToken: true } });
window.sbClient = sb;

/* ==== VERSION cục bộ + realtime ==== */
var SB_VER = 1, rtReady = false, rtStarted = false, fallbackTimer = null;
function startRealtime(){
  if (rtStarted) return; rtStarted = true;
  try{
    sb.channel('pk-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, function(){ SB_VER++; })
      .subscribe(function(status){
        rtReady = (status === 'SUBSCRIBED');
        clearInterval(fallbackTimer);
        if (!rtReady){ // realtime trục trặc → tự làm tươi mỗi 20s
          fallbackTimer = setInterval(function(){ SB_VER++; }, 20000);
        }
      });
  }catch(e){ fallbackTimer = setInterval(function(){ SB_VER++; }, 20000); }
}

async function hasSession(){
  try{ var s = await sb.auth.getSession(); return !!(s && s.data && s.data.session); }catch(e){ return false; }
}
function shape(table, data){
  var header = COLS[table] || Object.keys((data && data[0]) || {});
  var rows = (data || []).map(function(o){ return header.map(function(h){ var v = o[h]; return v == null ? '' : v; }); });
  return { header: header, rows: rows };
}
function pick(table, row){
  var out = {}, cols = COLS[table] || [];
  Object.keys(row || {}).forEach(function(k){ if (cols.indexOf(k) !== -1) out[k] = row[k]; });
  return out;
}

/* ==== API ==== */
/* ==== FILE KẾT QUẢ (bucket riêng tư 'ketqua') ==== */
window.SB_FILES = {
  upload: async function(path, file){
    try{
      var r = await sb.storage.from('ketqua').upload(path, file, { upsert:false });
      if (r.error) return { ok:false, error: r.error.message };
      return { ok:true, path: r.data.path };
    }catch(e){ return { ok:false, error: String(e&&e.message||e) }; }
  },
  url: async function(path){
    try{
      var r = await sb.storage.from('ketqua').createSignedUrl(path, 3600);
      if (r.error) return { ok:false, error: r.error.message };
      return { ok:true, url: r.data.signedUrl };
    }catch(e){ return { ok:false, error: String(e&&e.message||e) }; }
  },
  open: async function(path){
    var r = await window.SB_FILES.url(path);
    if (r.ok) window.open(r.url, '_blank');
    else alert('Không mở được tệp: ' + (r.error||''));
  }
};

window.SB_API = async function(action, extra){
  extra = extra || {};
  try{
    if (action === 'ping')    return { ok:true, app:'PK_DieuSinh_SB', v:'1.0' };
    if (action === 'version'){
      if (!(await hasSession())) return { error:'AUTH_REQUIRED' };
      startRealtime();
      return { ok:true, v: SB_VER };
    }
    if (action === 'login'){
      // extra.token = Google ID token từ nút đăng nhập hiện tại
      var r = await sb.auth.signInWithIdToken({ provider:'google', token: extra.token });
      if (r.error) return { ok:false, error: r.error.message || 'LOGIN_FAILED' };
      var email = (r.data && r.data.user && r.data.user.email) || '';
      var q = await sb.from('NGUOI_DUNG').select('*').ilike('EMAIL', email).limit(1);
      if (q.error || !q.data || !q.data.length){
        try{ await sb.auth.signOut(); }catch(e){}
        return { ok:false, error:'NOT_AUTHORIZED' };
      }
      startRealtime();
      return { ok:true, email: email, role: q.data[0].VAI_TRO, ho_ten: q.data[0].HO_TEN || '',
               sess:'sb-session', exp: Date.now() + 30*86400000 }; // supabase tự gia hạn; 30 ngày cho localStorage của trang
    }
    if (action === 'whoami'){
      if (!(await hasSession())) return { error:'AUTH_REQUIRED' };
      var u = await sb.auth.getUser();
      var em = (u.data && u.data.user && u.data.user.email) || '';
      var q2 = await sb.from('NGUOI_DUNG').select('*').ilike('EMAIL', em).limit(1);
      if (!q2.data || !q2.data.length) return { ok:false, error:'NOT_AUTHORIZED' };
      return { ok:true, email: em, role: q2.data[0].VAI_TRO };
    }
    if (action === 'logout'){
      try{ await sb.auth.signOut(); }catch(e){}
      return { ok:true };
    }

    if (!(await hasSession())) return { error:'AUTH_REQUIRED' };

    if (action === 'readAll'){
      startRealtime();
      var tables = (extra.tables || []).filter(function(t){ return COLS[t]; });
      var res = await Promise.all(tables.map(function(t){
        return sb.from(t).select('*').order(PK[t], { ascending:true }).range(0, 49999);
      }));
      var out = { ok:true, v: SB_VER, tables:{} };
      for (var i=0;i<tables.length;i++){
        if (res[i].error) return { ok:false, error: res[i].error.message };
        out.tables[tables[i]] = shape(tables[i], res[i].data);
      }
      return out;
    }
    if (action === 'append'){
      if (!COLS[extra.table]) return { ok:false, error:'BAD_TABLE' };
      var ins = await sb.from(extra.table).insert(pick(extra.table, extra.row));
      if (ins.error) return { ok:false, error: ins.error.message };
      SB_VER++;
      return { ok:true, v: SB_VER };
    }
    if (action === 'update'){
      if (!COLS[extra.table]) return { ok:false, error:'BAD_TABLE' };
      var upd = await sb.from(extra.table).update(pick(extra.table, extra.row)).eq(extra.keyCol, extra.keyVal);
      if (upd.error) return { ok:false, error: upd.error.message };
      SB_VER++;
      return { ok:true, v: SB_VER };
    }
    if (action === 'nextId'){ // dùng dần: mã nguyên tử phía server
      var rpc = await sb.rpc('next_id', { p_prefix: extra.prefix, p_pad: extra.pad || 5 });
      if (rpc.error) return { ok:false, error: rpc.error.message };
      return { ok:true, id: rpc.data };
    }
    return { ok:false, error:'UNKNOWN_ACTION' };
  }catch(e){
    var m = String((e && e.message) || e);
    if (/JWT|token|session|auth/i.test(m) && !(await hasSession())) return { error:'AUTH_REQUIRED' };
    return { ok:false, error: m };
  }
};

/* ==== Bổ sung TÊN HIỂN THỊ cho phiên đăng nhập cũ (trước khi có tính năng tên) ==== */
(function(){
  var t = setInterval(async function(){
    try{
      var raw = localStorage.getItem('pk_sess'); if (!raw) return;
      var s = JSON.parse(raw);
      if (s.ho_ten){ clearInterval(t); return; }
      if (!(await hasSession())) return;
      clearInterval(t);
      var u = await sb.auth.getUser();
      var em = u.data && u.data.user && u.data.user.email; if (!em) return;
      var q = await sb.from('NGUOI_DUNG').select('HO_TEN').ilike('EMAIL', em).limit(1);
      var ten = q.data && q.data[0] && String(q.data[0].HO_TEN||'').trim();
      if (!ten) return;
      s.ho_ten = ten;
      localStorage.setItem('pk_sess', JSON.stringify(s));
      var chip = document.querySelector('header .userchip');
      if (chip && chip.textContent.indexOf('·') !== -1){
        var role = chip.textContent.split('·').pop().trim();
        chip.textContent = '👤 ' + ten + ' · ' + role;
      }
    }catch(e){}
  }, 1500);
})();

/* ==== CHUYỂN MÀN HÌNH — dropdown theo VAI TRÒ (giao diện duy nhất của hệ thống) ==== */
(function(){
  if (window.top !== window) return;
  var P = [['tong-quan.html','📊 Tổng quan'],['thu-ngan.html','💵 Thu ngân'],['ban-kham.html','🩺 Bàn khám'],['ban-thu-ky.html','📋 Thư ký'],['duoc-sy.html','💊 Dược sỹ']];
  var ROLE_PAGES = {
    'Quản lý':  ['tong-quan.html','thu-ngan.html','ban-kham.html','ban-thu-ky.html','duoc-sy.html'],
    'Kế toán':  ['tong-quan.html'],
    'Thu ngân': ['thu-ngan.html'],
    'Lễ tân':   ['thu-ngan.html'],
    'Bác sĩ':   ['ban-kham.html'],
    'Thư ký':   ['ban-thu-ky.html','ban-kham.html'],
    'Dược sỹ':  ['duoc-sy.html']
  };
  var cur = (location.pathname.split('/').pop()||'').toLowerCase();
  var here = false;
  for (var i=0;i<P.length;i++) if (P[i][0]===cur) here = true;
  if (!here) return;
  try{ localStorage.setItem('pk_last_page', cur); }catch(e){}
  var t = setInterval(function(){
    try{
      var chip = document.querySelector('header .userchip');
      if (!chip) return;
      var txt = chip.textContent || '';
      if (txt.indexOf('·') === -1) return;
      clearInterval(t);
      var role = txt.split('·').pop().trim();
      var pages = ROLE_PAGES[role] || [];
      /* vai trò chỉ dùng đúng màn hình được gán — gõ tay URL khác sẽ bị đưa về màn hình của mình */
      if (pages.length && pages.indexOf(cur) === -1){ location.replace(pages[0]); return; }
      /* dropdown chuyển màn hình — CHỈ Quản lý */
      if (role === 'Quản lý' && !document.getElementById('pnlSwitch')){
        var sel = document.createElement('select');
        sel.id = 'pnlSwitch';
        sel.title = 'Chuyển màn hình';
        sel.style.cssText = 'border:none;border-radius:9px;padding:6px 10px;font-size:12.5px;font-weight:700;color:#0a5240;margin-right:2px;cursor:pointer;background:#fff;';
        var html = '';
        for (var j=0;j<P.length;j++){
          if (pages.indexOf(P[j][0]) === -1) continue;
          html += '<option value="'+P[j][0]+'"'+(P[j][0]===cur?' selected':'')+'>'+P[j][1]+'</option>';
        }
        sel.innerHTML = html;
        sel.onchange = function(){ if (sel.value && sel.value !== cur) location.href = sel.value; };
        chip.parentNode.insertBefore(sel, chip);
      }
      /* Thư ký: nút liên kết giữa Bàn thư ký ↔ Bàn khám (không phải dropdown) */
      if (role === 'Thư ký' && !document.getElementById('tkNavBtn')){
        var other = (cur === 'ban-kham.html') ? ['ban-thu-ky.html','📋 Bàn thư ký'] : ['ban-kham.html','🩺 Bàn khám'];
        var tb = document.createElement('button');
        tb.id = 'tkNavBtn';
        tb.textContent = other[1];
        tb.style.cssText = 'border:none;border-radius:9px;padding:6px 11px;font-size:12.5px;font-weight:700;color:#0a5240;margin-right:2px;cursor:pointer;background:#fff;';
        tb.onclick = function(){ location.href = other[0]; };
        chip.parentNode.insertBefore(tb, chip);
      }
      /* nút Nhân sự — chỉ Quản lý */
      if (role === 'Quản lý' && !document.getElementById('nsGlobalBtn') && !document.getElementById('nsBtn')){
        var nb = document.createElement('button');
        nb.id = 'nsGlobalBtn';
        nb.textContent = '👥 Nhân sự';
        nb.title = 'Quản lý tài khoản nhân viên';
        nb.style.cssText = 'border:none;border-radius:9px;padding:6px 11px;font-size:12.5px;font-weight:700;color:#0a5240;margin-right:2px;cursor:pointer;background:#fff;';
        nb.onclick = function(){
          if (cur === 'tong-quan.html' && typeof window.nsOpen === 'function') window.nsOpen();
          else location.href = 'tong-quan.html#nhansu';
        };
        var ref = document.getElementById('pnlSwitch') || chip;
        ref.parentNode.insertBefore(nb, ref);
      }
    }catch(e){}
  }, 600);
})();
})();
