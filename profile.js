/* ============================================================
   HỒ SƠ BỆNH ÁN — dùng chung mọi màn hình (v3, Đợt D)
   3 phần: 1) Thông tin bệnh nhân  2) Các lần khám (dịch vụ + giờ +
   người thực hiện + KẾT QUẢ + thanh toán + toa)  3) Toa thuốc
   Cách dùng: PKProfile.open('BN0001')
   Trang nào có thao tác riêng thì khai báo:
   window.PKHooks = { reception:fn(maBN), addSvc:fn(maBN), editHS:fn(maBN), datHen:fn(maBN) }
   ============================================================ */
(function(){
if (window.PKProfile) return;

var TBLS = ['BENH_NHAN','SO_KHAM','THANH_TOAN','LICH_HEN','THAI_KY','HANG_CHO','TOA_THUOC','TOA_CT'];
var MILESTONES = [[8,'Khám thai lần đầu'],[12,'Siêu âm độ mờ da gáy + Double test'],[22,'Siêu âm hình thái'],[26,'Test tiểu đường (GTT)'],[32,'Siêu âm tăng trưởng'],[36,'Khám hàng tuần + GBS']];

var css = document.createElement('style');
css.textContent =
'#pkpOvl{position:fixed;inset:0;background:rgba(20,30,25,.5);display:none;align-items:center;justify-content:center;z-index:300;padding:16px;}' +
'#pkpOvl.on{display:flex;}' +
'@media (prefers-reduced-motion: no-preference){#pkpOvl.on{animation:pkpIn .16s ease;}#pkpOvl.on .pkpM{animation:pkpPop .2s cubic-bezier(.2,.8,.3,1);}}' +
'@keyframes pkpIn{from{opacity:0}to{opacity:1}}' +
'@keyframes pkpPop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}' +
'.pkpM{background:#fff;border-radius:16px;width:min(820px,100%);max-height:92vh;overflow:auto;box-shadow:0 14px 44px rgba(0,0,0,.28);font-size:13.5px;}' +
'.pkpH{padding:14px 20px;border-bottom:1px solid var(--hair,#e1e0d9);display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#fff;z-index:2;}' +
'.pkpH h3{font-size:16px;color:var(--brand,#0a5240);flex:1;}' +
'.pkpH .x{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink3,#8a9187);}' +
'.pkpB{padding:16px 20px;}' +
'.pkpSec{font-size:11.5px;font-weight:800;letter-spacing:.6px;color:var(--ink3,#8a9187);text-transform:uppercase;margin:18px 0 8px;border-bottom:1.5px solid var(--brand-soft,#e3f2ed);padding-bottom:4px;}' +
'.pkpSec:first-child{margin-top:0;}' +
'.pkpKV{display:flex;flex-wrap:wrap;gap:5px 22px;font-size:13px;color:var(--ink2,#5c635a);}' +
'.pkpKV b{color:var(--ink,#20241f);}' +
'.pkpWarn{background:var(--warn-soft,#fdf3dc);border:1px solid #efd9a2;border-radius:11px;padding:10px 13px;margin-top:10px;font-size:13px;color:#7a5804;line-height:1.55;}' +
'.pkpPreg{background:#fdf1f6;border:1px solid #f3c6da;border-radius:11px;padding:10px 13px;margin-top:8px;font-size:12.5px;}' +
'.pkpChip{display:inline-block;background:#fff;border:1px solid #f3c6da;color:#a2385f;border-radius:99px;padding:2px 10px;font-size:12px;font-weight:700;margin:2px 4px 2px 0;}' +
'details.pkpV{border:1px solid var(--hair,#e1e0d9);border-radius:12px;margin-bottom:9px;overflow:hidden;background:#fff;}' +
'details.pkpV summary{cursor:pointer;padding:10px 14px;background:var(--brand-bg,#f0f8f5);font-size:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;list-style:none;}' +
'details.pkpV summary::-webkit-details-marker{display:none;}' +
'details.pkpV summary .vd{font-weight:800;color:var(--brand,#0a5240);}' +
'details.pkpV summary .vmut{color:var(--ink3,#8a9187);font-size:11.5px;}' +
'details.pkpV summary .vst{margin-left:auto;font-size:11px;font-weight:700;border-radius:99px;padding:2px 9px;}' +
'.vst.paid{background:#e8f7e8;color:#0a7a0a;}.vst.wait{background:#fdf3dc;color:#8a6205;}.vst.cancel{background:#fbe9e9;color:#d03b3b;}' +
'.pkpVB{padding:10px 14px;}' +
'.pkpLine{padding:8px 0;border-top:1px dashed #eeeee9;font-size:12.5px;}' +
'.pkpLine:first-child{border-top:none;}' +
'.pkpLine .lh{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;}' +
'.pkpLine .ldv{font-weight:700;}' +
'.pkpLine .lmut{color:var(--ink3,#8a9187);font-size:11px;}' +
'.pkpLine .lok{color:var(--good,#0ca30c);font-size:11px;font-weight:700;}' +
'.pkpLine .lpend{color:#8a6205;font-size:11px;font-weight:700;}' +
'.pkpLine .lcancel{color:var(--crit,#d03b3b);font-size:11px;font-weight:700;}' +
'.pkpKq{margin-top:5px;background:#eef4fd;border-left:3px solid #2456a8;border-radius:0 8px 8px 0;padding:6px 10px;font-size:12.5px;color:#1c3f7a;}' +
'.pkpKq.empty{background:#f6f6f2;border-left-color:#c9c9c0;color:var(--ink3,#8a9187);font-style:italic;}' +
'.pkpToa{margin-top:8px;background:#f4f0fb;border:1px solid #ddd0f2;border-radius:10px;padding:9px 12px;font-size:12.5px;}' +
'.pkpToa .th{font-weight:800;color:#5b2fa0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}' +
'.pkpToa .tst{font-size:10.5px;font-weight:700;border-radius:99px;padding:1px 8px;background:#fff;border:1px solid #ddd0f2;color:#5b2fa0;}' +
'.pkpToa ul{margin:5px 0 0;padding-left:18px;}' +
'.pkpToa li{margin-bottom:3px;}' +
'.pkpPay{margin-top:8px;font-size:12.5px;background:#f2f8f4;border-radius:9px;padding:7px 11px;color:var(--ink2,#5c635a);}' +
'.pkpNote{margin-top:7px;font-size:12.5px;color:var(--ink2,#5c635a);font-style:italic;}' +
'.pkpRow{border-bottom:1px solid #eeeee9;padding:7px 2px;font-size:12.5px;display:flex;justify-content:space-between;gap:8px;align-items:center;}' +
'.pkpMut{color:var(--ink3,#8a9187);}' +
'.pkpNum{font-variant-numeric:tabular-nums;}' +
'.pkpBtn{border:none;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;background:var(--brand-soft,#e3f2ed);color:var(--brand,#0a5240);}' +
'.pkpF{padding:12px 20px;border-top:1px solid var(--hair,#e1e0d9);display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:0;background:#fff;}' +
'.pkpFBtn{border:none;border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--brand-soft,#e3f2ed);color:var(--brand,#0a5240);}' +
'.pkpFBtn.pri{background:var(--brand2,#0f6e56);color:#fff;}' +
'.pkpEmpty{color:var(--ink3,#8a9187);font-size:12.5px;padding:3px 0;}' +
'.pkpLoad{padding:40px;text-align:center;color:var(--brand,#0a5240);font-weight:700;}';
document.head.appendChild(css);

var ovl = document.createElement('div');
ovl.id = 'pkpOvl';
ovl.innerHTML = '<div class="pkpM"><div class="pkpH"><h3 id="pkpTitle">Hồ sơ bệnh án</h3><button class="x" onclick="PKProfile.close()">✕</button></div><div class="pkpB" id="pkpBody"></div><div class="pkpF" id="pkpFoot"></div></div>';
document.body.appendChild(ovl);
ovl.addEventListener('click', function(e){ if (e.target === ovl) PKProfile.close(); });

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtD(n){ return (Number(n)||0).toLocaleString('vi-VN') + ' đ'; }
function dstr(v){ return String(v==null?'':v).slice(0,10); }
function dvn(v){ var d=dstr(v); return d.length===10 ? d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4) : d; }
function hhmm(v){
  if (v==null || v==='') return '';
  var m = String(v).match(/^(\d{1,2}):(\d{2})/);
  if (m) return m[1].padStart(2,'0')+':'+m[2];
  var d = new Date(String(v));
  if (!isNaN(d)) return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  return '';
}
function tdy(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function obj(D,t){
  var d = D && D[t]; if(!d) return [];
  return d.rows.map(function(r){ var o={}; d.header.forEach(function(h,i){ o[String(h).trim()]=r[i]; }); return o; });
}
function tuoi(ns){
  var m = String(ns||'').match(/(19|20)\d\d/); if(!m) return '';
  var t = new Date().getFullYear() - Number(m[0]);
  return (t>0 && t<120) ? (t + ' tuổi') : '';
}
function tkCalc(lmp){
  var d = new Date(dstr(lmp)); if (isNaN(d)) return null;
  var diff = Math.floor((new Date()-d)/86400000);
  var weeks = Math.floor(diff/7), days = diff%7;
  var edd = new Date(d.getTime()+280*86400000);
  var next = MILESTONES.find(function(x){ return x[0]>=weeks; });
  return {weeks:weeks, days:days, edd:edd, next:next};
}
var lastData = null;

function toaHtml(t, ctList){
  var lines = ctList.filter(function(c){ return c.MA_TOA===t.MA_TOA; });
  return '<div class="pkpToa"><div class="th">💊 Toa ' + esc(t.MA_TOA) +
    ' <span class="pkpMut" style="font-weight:400;">BS ' + esc(t.BS_KE||'') + (t.GIO_KE?(' · '+hhmm(t.GIO_KE)):'') + '</span>' +
    ' <span class="tst">' + esc(t.TRANG_THAI||'') + '</span>' +
    ' <button class="pkpBtn" onclick="PKProfile._inToa(\'' + esc(t.MA_TOA) + '\')" style="margin-left:auto;">🖨 In</button></div>' +
    '<ul>' + lines.map(function(l){
      return '<li><b>' + esc(l.TEN_THUOC) + '</b> — ' + esc(l.LIEU_LAN) + '/lần × ' + esc(l.LAN_NGAY) + ' lần/ngày × ' + esc(l.SO_NGAY) + ' ngày' +
        (l.THOI_DIEM?(' (' + esc(l.THOI_DIEM) + ')'):'') + ' · SL: ' + esc(l.SO_LUONG) + '</li>';
    }).join('') + '</ul>' +
    (t.GHI_CHU?('<div class="pkpMut" style="margin-top:4px;">Lời dặn: ' + esc(t.GHI_CHU) + '</div>'):'') + '</div>';
}

function render(maBN, D){
  lastData = D;
  var b = obj(D,'BENH_NHAN').find(function(x){ return x.MA_BN===maBN; });
  if (!b){ document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tìm thấy hồ sơ ' + esc(maBN) + '.</div>'; return; }
  document.getElementById('pkpTitle').textContent = '📁 Bệnh án — ' + b.HO_TEN + ' (' + b.MA_BN + ')';

  var html = '';
  /* ===== PHẦN 1 — THÔNG TIN BỆNH NHÂN ===== */
  html += '<div class="pkpSec">1 · Thông tin bệnh nhân</div><div class="pkpKV">' +
    '<span>Năm sinh: <b>' + esc(b.NGAY_SINH||'—') + '</b> ' + tuoi(b.NGAY_SINH) + '</span>' +
    '<span>Giới: <b>' + esc(b.GIOI_TINH||'—') + '</b></span>' +
    '<span>Điện thoại: <b class="pkpNum">' + esc(b.SDT||'—') + '</b></span>' +
    '<span>Địa chỉ: <b>' + esc(b.DIA_CHI||'—') + '</b></span>' +
    (b.NGAY_LAP ? '<span>Lập hồ sơ: <b class="pkpNum">' + dvn(b.NGAY_LAP) + '</b></span>' : '') +
    '</div>';
  if (String(b.TIEN_SU||'').trim() || String(b.GHI_CHU||'').trim()){
    html += '<div class="pkpWarn">⚠️ <b>Tiền sử / dị ứng:</b> ' + esc(b.TIEN_SU||'—') +
      (String(b.GHI_CHU||'').trim() ? ('<br>📝 Ghi chú: ' + esc(b.GHI_CHU)) : '') + '</div>';
  }
  var tk = obj(D,'THAI_KY').find(function(t){ return t.MA_BN===maBN && String(t.TRANG_THAI||'')!=='Kết thúc'; });
  if (tk){
    var c = tkCalc(tk.KINH_CUOI);
    html += '<div class="pkpPreg"><b style="color:#a2385f;">🤰 Thai kỳ đang theo dõi</b><br>' +
      (c ? ('<span class="pkpChip">Tuổi thai: ' + c.weeks + ' tuần ' + c.days + ' ngày</span>' +
            '<span class="pkpChip">Dự sinh: ' + c.edd.toLocaleDateString('vi-VN') + '</span>' +
            (c.next ? ('<span class="pkpChip">▶ Mốc ' + c.next[0] + ' tuần: ' + c.next[1] + '</span>') : ''))
         : '<span style="color:#d03b3b;">Ngày kinh cuối chưa hợp lệ</span>') + '</div>';
  }
  /* lịch hẹn sắp tới — thuộc phần thông tin */
  var hens = obj(D,'LICH_HEN').filter(function(h){ return h.MA_BN===maBN; });
  var up = hens.filter(function(h){ return dstr(h.NGAY_HEN)>=tdy() && String(h.TRANG_THAI||'')==='Đã hẹn'; })
               .sort(function(a,c2){ return dstr(a.NGAY_HEN).localeCompare(dstr(c2.NGAY_HEN)); });
  if (up.length){
    html += up.map(function(h){ return '<div class="pkpRow"><span class="pkpNum" style="color:var(--brand,#0a5240);font-weight:700;">🗓 Hẹn ' + dvn(h.NGAY_HEN) + ' ' + hhmm(h.GIO_HEN) + '</span><span style="flex:1;padding:0 8px;">' + esc(h.LY_DO||'') + (h.BS_PHU_TRACH?(' · '+esc(h.BS_PHU_TRACH)):'') + '</span></div>'; }).join('');
  }

  /* ===== PHẦN 2 — CÁC LẦN KHÁM ===== */
  var orders = obj(D,'HANG_CHO').filter(function(r){ return r.MA_BN===maBN; });
  var lines = obj(D,'SO_KHAM').filter(function(x){ return x.MA_BN===maBN; });
  var toas = obj(D,'TOA_THUOC').filter(function(t){ return t.MA_BN===maBN && t.TRANG_THAI!=='Hủy'; });
  var cts = obj(D,'TOA_CT');
  var pays = obj(D,'THANH_TOAN').filter(function(p){ return p.MA_BN===maBN; });

  var visits = {}; // key -> {ngay, order, lines[], toas[]}
  orders.forEach(function(o){ visits[o.MA_CHO] = { ngay:dstr(o.NGAY), order:o, lines:[], toas:[] }; });
  lines.forEach(function(l){
    var k = String(l.MA_CHO||'').trim();
    if (k && visits[k]) visits[k].lines.push(l);
    else { k = 'd:'+dstr(l.NGAY); if (!visits[k]) visits[k] = { ngay:dstr(l.NGAY), order:null, lines:[], toas:[] }; visits[k].lines.push(l); }
  });
  toas.forEach(function(t){
    var k = String(t.MA_CHO||'').trim();
    if (k && visits[k]) visits[k].toas.push(t);
    else { k = 'd:'+dstr(t.NGAY); if (!visits[k]) visits[k] = { ngay:dstr(t.NGAY), order:null, lines:[], toas:[] }; visits[k].toas.push(t); }
  });
  var vlist = Object.values(visits).filter(function(v){ return v.lines.length || v.toas.length || (v.order && v.order.TRANG_THAI!=='Hủy'); })
    .sort(function(a,c3){ return c3.ngay.localeCompare(a.ngay); });

  html += '<div class="pkpSec">2 · Các lần khám (' + vlist.length + ')</div>';
  html += vlist.length ? vlist.map(function(v, idx){
    var o = v.order || {};
    var stTxt = o.TRANG_THAI==='Đã thu' ? '<span class="vst paid">Đã thanh toán</span>'
      : o.TRANG_THAI==='Hủy' ? '<span class="vst cancel">Hủy</span>'
      : o.MA_CHO ? '<span class="vst wait">' + esc(o.TRANG_THAI==='Xong khám'?'Chờ thanh toán':(o.TRANG_THAI||'')) + '</span>' : '';
    var gio = [o.GIO_TIEP_NHAN?('tiếp nhận '+hhmm(o.GIO_TIEP_NHAN)):'', o.GIO_GOI?('khám '+hhmm(o.GIO_GOI)):'', o.GIO_THU?('thu '+hhmm(o.GIO_THU)):''].filter(Boolean).join(' → ');
    var bsList = {}; v.lines.forEach(function(l){ if (l.BS_THUC_HIEN) bsList[l.BS_THUC_HIEN]=1; }); if (o.BS_KHAM) bsList[o.BS_KHAM]=1;
    var tot = v.lines.reduce(function(s,l){ var st=String(l.TRANG_THAI_DV||'').trim(); return s + ((st===''||st==='Hoàn thành') ? (Number(l.THANH_TIEN)||0) : 0); }, 0);
    var body = '';
    /* dịch vụ + kết quả */
    body += v.lines.map(function(l){
      var st = String(l.TRANG_THAI_DV||'').trim();
      var stH = st==='Hủy' ? '<span class="lcancel">✕ hủy</span>'
        : st==='Chỉ định' ? '<span class="lpend">⏳ chưa thực hiện</span>'
        : '<span class="lok">✓' + (l.GIO_XAC_NHAN?(' '+hhmm(l.GIO_XAC_NHAN)):'') + (l.NGUOI_XAC_NHAN?(' · '+esc(String(l.NGUOI_XAC_NHAN).split('@')[0])):'') + '</span>';
      var kq = String(l.KET_QUA||'').trim();
      return '<div class="pkpLine"><div class="lh"><span class="ldv">' + esc(l.TEN_DV) + (Number(l.SO_LUONG)>1?(' ×'+l.SO_LUONG):'') + '</span>' +
        (l.BS_THUC_HIEN?('<span class="lmut">' + esc(l.BS_THUC_HIEN) + '</span>'):'') + stH +
        '<span class="pkpNum" style="margin-left:auto;">' + fmtD(l.THANH_TIEN) + '</span></div>' +
        (st!=='Hủy' ? (kq ? ('<div class="pkpKq">🧾 Kết quả: ' + esc(kq) + '</div>') : '<div class="pkpKq empty">— chưa nhập kết quả —</div>') : '') +
        (l.GHI_CHU?('<div class="pkpNote">📝 ' + esc(l.GHI_CHU) + '</div>'):'') + '</div>';
    }).join('');
    if (!v.lines.length) body += '<div class="pkpEmpty">Không có dịch vụ ghi nhận.</div>';
    if (o.GHI_CHU) body += '<div class="pkpNote">📝 Ghi chú lần khám: ' + esc(o.GHI_CHU) + '</div>';
    /* toa của lần khám */
    body += v.toas.map(function(t){ return toaHtml(t, cts); }).join('');
    /* thanh toán cùng ngày */
    var payDay = pays.filter(function(p){ return dstr(p.NGAY)===v.ngay; });
    body += payDay.map(function(p){
      return '<div class="pkpPay">💳 <b class="pkpNum">' + esc(p.MA_TT) + '</b> · đã thu <b class="pkpNum">' + fmtD(p.DA_THU) + '</b> (' + esc(p.HINH_THUC||'') + ')' +
        ((Number(p.CON_LAI)||0)>0?(' · <span style="color:#d03b3b;font-weight:700;">còn thiếu ' + fmtD(p.CON_LAI) + '</span>'):'') + '</div>';
    }).join('');
    return '<details class="pkpV"' + (idx===0?' open':'') + '><summary><span class="vd">📅 ' + dvn(v.ngay) + '</span>' +
      (Object.keys(bsList).length?('<span class="vmut">' + esc(Object.keys(bsList).join(', ')) + '</span>'):'') +
      (gio?('<span class="vmut pkpNum">' + gio + '</span>'):'') +
      (tot?('<span class="vmut pkpNum">' + fmtD(tot) + '</span>'):'') + stTxt + '</summary>' +
      '<div class="pkpVB">' + body + '</div></details>';
  }).join('') : '<div class="pkpEmpty">Chưa có lần khám nào.</div>';

  /* ===== PHẦN 3 — TOA THUỐC ===== */
  var toaSorted = toas.slice().sort(function(a,c4){ return dstr(c4.NGAY).localeCompare(dstr(a.NGAY)); });
  html += '<div class="pkpSec">3 · Toa thuốc (' + toaSorted.length + ')</div>';
  html += toaSorted.length ? toaSorted.map(function(t){
    return '<div style="margin-bottom:4px;"><span class="pkpMut pkpNum">' + dvn(t.NGAY) + '</span></div>' + toaHtml(t, cts);
  }).join('') : '<div class="pkpEmpty">Chưa có toa thuốc.</div>';

  document.getElementById('pkpBody').innerHTML = html;

  var hk = window.PKHooks || {};
  var f = '';
  if (typeof hk.editHS === 'function') f += '<button class="pkpFBtn" onclick="PKProfile._act(\'editHS\',\'' + maBN + '\')">✏️ Sửa hồ sơ</button>';
  if (typeof hk.datHen === 'function') f += '<button class="pkpFBtn" onclick="PKProfile._act(\'datHen\',\'' + maBN + '\')">📅 Đặt hẹn</button>';
  if (typeof hk.addSvc === 'function') f += '<button class="pkpFBtn" onclick="PKProfile._act(\'addSvc\',\'' + maBN + '\')">➕ Thêm dịch vụ</button>';
  if (typeof hk.reception === 'function') f += '<button class="pkpFBtn pri" onclick="PKProfile._act(\'reception\',\'' + maBN + '\')">🏥 Tiếp nhận vào hàng chờ</button>';
  document.getElementById('pkpFoot').innerHTML = f;
  document.getElementById('pkpFoot').style.display = f ? 'flex' : 'none';
}

var curMa = null;
window.PKProfile = {
  open: async function(maBN){
    if (!maBN) return;
    curMa = maBN;
    ovl.classList.add('on');
    /* 1) MỞ TỨC THÌ từ dữ liệu trang đang có trong máy (nếu đủ) */
    var instant = false;
    try{
      var pageDB = (typeof DB !== 'undefined' && DB) ? DB : window.DB;
      if (pageDB && pageDB.BENH_NHAN){
        var Dd = {};
        TBLS.forEach(function(t){ if (pageDB[t]) Dd[t] = pageDB[t]; });
        if (obj(Dd,'BENH_NHAN').some(function(x){ return x.MA_BN===maBN; })){
          render(maBN, Dd);
          instant = true;
        }
      }
    }catch(e){}
    if (!instant){
      document.getElementById('pkpTitle').textContent = 'Hồ sơ bệnh án';
      document.getElementById('pkpBody').innerHTML = '<div class="pkpLoad">⏳ Đang mở bệnh án…</div>';
      document.getElementById('pkpFoot').innerHTML = '';
    }
    /* 2) Làm tươi ngầm từ máy chủ (bổ sung bảng trang này không tải) */
    try{
      var j = await window.api('readAll', {tables: TBLS});
      if (j && j.ok){
        if (curMa===maBN && ovl.classList.contains('on')) render(maBN, j.tables);
      } else if (!instant){
        document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tải được bệnh án — ' + esc((j&&j.error)||'kiểm tra kết nối mạng') + '.</div>';
      }
    }catch(e){
      if (!instant) document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tải được bệnh án — kiểm tra kết nối mạng.</div>';
    }
  },
  close: function(){ ovl.classList.remove('on'); },
  _act: function(name, maBN){
    var hk = window.PKHooks || {};
    this.close();
    if (typeof hk[name] === 'function') hk[name](maBN);
  },
  _inToa: function(maToa){
    if (window.PKToa && lastData){
      var toa = obj(lastData,'TOA_THUOC').find(function(t){ return t.MA_TOA===maToa; });
      var ct = obj(lastData,'TOA_CT').filter(function(c){ return c.MA_TOA===maToa; });
      var bn = obj(lastData,'BENH_NHAN').find(function(x){ return x.MA_BN===(toa&&toa.MA_BN); }) || {};
      if (toa){ PKToa.printData(toa, ct, bn); return; }
    }
    if (window.PKToa) PKToa.printToa(maToa);
  }
};
})();
