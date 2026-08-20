/* ============================================================
   HỒ SƠ BỆNH NHÂN 360° — dùng chung mọi màn hình (Đợt A)
   Cách dùng: PKProfile.open('BN0001')
   Trang nào có thao tác riêng thì khai báo:
   window.PKHooks = { reception:fn(maBN), addSvc:fn(maBN), editHS:fn(maBN), datHen:fn(maBN) }
   Yêu cầu trang chủ quản có sẵn: window.api(action, extra)
   ============================================================ */
(function(){
if (window.PKProfile) return;

var TBLS = ['BENH_NHAN','SO_KHAM','THANH_TOAN','LICH_HEN','THAI_KY','HANG_CHO'];
var MILESTONES = [[8,'Khám thai lần đầu'],[12,'Siêu âm độ mờ da gáy + Double test'],[22,'Siêu âm hình thái'],[26,'Test tiểu đường (GTT)'],[32,'Siêu âm tăng trưởng'],[36,'Khám hàng tuần + GBS']];

var css = document.createElement('style');
css.textContent =
'#pkpOvl{position:fixed;inset:0;background:rgba(20,30,25,.5);display:none;align-items:center;justify-content:center;z-index:300;padding:16px;}' +
'#pkpOvl.on{display:flex;}' +
'@media (prefers-reduced-motion: no-preference){#pkpOvl.on{animation:pkpIn .16s ease;}#pkpOvl.on .pkpM{animation:pkpPop .2s cubic-bezier(.2,.8,.3,1);}}' +
'@keyframes pkpIn{from{opacity:0}to{opacity:1}}' +
'@keyframes pkpPop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}' +
'.pkpM{background:#fff;border-radius:16px;width:min(760px,100%);max-height:90vh;overflow:auto;box-shadow:0 14px 44px rgba(0,0,0,.28);font-size:13.5px;}' +
'.pkpH{padding:14px 20px;border-bottom:1px solid var(--hair,#e1e0d9);display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#fff;z-index:2;}' +
'.pkpH h3{font-size:16px;color:var(--brand,#0a5240);flex:1;}' +
'.pkpH .x{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink3,#8a9187);}' +
'.pkpB{padding:16px 20px;}' +
'.pkpSec{font-size:11.5px;font-weight:800;letter-spacing:.6px;color:var(--ink3,#8a9187);text-transform:uppercase;margin:16px 0 7px;}' +
'.pkpSec:first-child{margin-top:0;}' +
'.pkpKV{display:flex;flex-wrap:wrap;gap:5px 22px;font-size:13px;color:var(--ink2,#5c635a);}' +
'.pkpKV b{color:var(--ink,#20241f);}' +
'.pkpWarn{background:var(--warn-soft,#fdf3dc);border:1px solid #efd9a2;border-radius:11px;padding:10px 13px;margin-top:10px;font-size:13px;color:#7a5804;line-height:1.55;}' +
'.pkpPreg{background:#fdf1f6;border:1px solid #f3c6da;border-radius:11px;padding:10px 13px;margin-top:4px;font-size:12.5px;}' +
'.pkpChip{display:inline-block;background:#fff;border:1px solid #f3c6da;color:#a2385f;border-radius:99px;padding:2px 10px;font-size:12px;font-weight:700;margin:2px 4px 2px 0;}' +
'.pkpDay{border:1px solid var(--hair,#e1e0d9);border-radius:11px;margin-bottom:8px;overflow:hidden;}' +
'.pkpDay .dh{background:var(--brand-bg,#f0f8f5);padding:7px 12px;font-size:12px;font-weight:700;color:var(--brand,#0a5240);display:flex;justify-content:space-between;}' +
'.pkpLine{display:flex;gap:8px;align-items:center;padding:6px 12px;border-top:1px dashed #eeeee9;font-size:12.5px;}' +
'.pkpLine .st{font-size:11px;white-space:nowrap;}' +
'.pkpLine .st.ok{color:var(--good,#0ca30c);font-weight:700;}' +
'.pkpLine .st.pend{color:#8a6205;font-weight:700;}' +
'.pkpLine .st.cancel{color:var(--crit,#d03b3b);font-weight:700;text-decoration:line-through;}' +
'.pkpRow{border-bottom:1px solid #eeeee9;padding:7px 2px;font-size:12.5px;display:flex;justify-content:space-between;gap:8px;align-items:center;}' +
'.pkpMut{color:var(--ink3,#8a9187);}' +
'.pkpNum{font-variant-numeric:tabular-nums;}' +
'.pkpF{padding:12px 20px;border-top:1px solid var(--hair,#e1e0d9);display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:0;background:#fff;}' +
'.pkpBtn{border:none;border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--brand-soft,#e3f2ed);color:var(--brand,#0a5240);}' +
'.pkpBtn.pri{background:var(--brand2,#0f6e56);color:#fff;}' +
'.pkpEmpty{color:var(--ink3,#8a9187);font-size:12.5px;padding:3px 0;}' +
'.pkpLoad{padding:40px;text-align:center;color:var(--brand,#0a5240);font-weight:700;}';
document.head.appendChild(css);

var ovl = document.createElement('div');
ovl.id = 'pkpOvl';
ovl.innerHTML = '<div class="pkpM"><div class="pkpH"><h3 id="pkpTitle">Hồ sơ bệnh nhân</h3><button class="x" onclick="PKProfile.close()">✕</button></div><div class="pkpB" id="pkpBody"></div><div class="pkpF" id="pkpFoot"></div></div>';
document.body.appendChild(ovl);
ovl.addEventListener('click', function(e){ if (e.target === ovl) PKProfile.close(); });

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtD(n){ return (Number(n)||0).toLocaleString('vi-VN') + ' đ'; }
function dstr(v){ return String(v==null?'':v).slice(0,10); }
function dvn(v){ var d=dstr(v); return d.length===10 ? d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4) : d; }
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

function render(maBN, D){
  var b = obj(D,'BENH_NHAN').find(function(x){ return x.MA_BN===maBN; });
  if (!b){ document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tìm thấy hồ sơ ' + esc(maBN) + '.</div>'; return; }
  document.getElementById('pkpTitle').textContent = '👩 ' + b.HO_TEN + ' — ' + b.MA_BN;

  var html = '';
  /* 1. Hành chính */
  html += '<div class="pkpSec">Thông tin hành chính</div><div class="pkpKV">' +
    '<span>Năm sinh: <b>' + esc(b.NGAY_SINH||'—') + '</b> ' + tuoi(b.NGAY_SINH) + '</span>' +
    '<span>Giới: <b>' + esc(b.GIOI_TINH||'—') + '</b></span>' +
    '<span>Điện thoại: <b class="pkpNum">' + esc(b.SDT||'—') + '</b></span>' +
    '<span>Địa chỉ: <b>' + esc(b.DIA_CHI||'—') + '</b></span>' +
    (b.NGAY_LAP ? '<span>Ngày lập hồ sơ: <b class="pkpNum">' + dvn(b.NGAY_LAP) + '</b></span>' : '') +
    '</div>';

  /* 2. Tiền sử / dị ứng */
  if (String(b.TIEN_SU||'').trim() || String(b.GHI_CHU||'').trim()){
    html += '<div class="pkpWarn">⚠️ <b>Tiền sử / lưu ý:</b> ' + esc(b.TIEN_SU||'') +
      (String(b.GHI_CHU||'').trim() ? ('<br>📝 ' + esc(b.GHI_CHU)) : '') + '</div>';
  }

  /* 3. Thai kỳ hiện tại */
  var tk = obj(D,'THAI_KY').find(function(t){ return t.MA_BN===maBN && String(t.TRANG_THAI||'')!=='Kết thúc'; });
  if (tk){
    var c = tkCalc(tk.KINH_CUOI);
    html += '<div class="pkpSec">Thai kỳ đang theo dõi</div><div class="pkpPreg">' +
      (c ? ('<span class="pkpChip">Tuổi thai: ' + c.weeks + ' tuần ' + c.days + ' ngày</span>' +
            '<span class="pkpChip">Dự sinh: ' + c.edd.toLocaleDateString('vi-VN') + '</span>' +
            (c.next ? ('<span class="pkpChip">▶ Mốc ' + c.next[0] + ' tuần: ' + c.next[1] + '</span>') : ''))
         : '<span style="color:var(--crit,#d03b3b);">Ngày kinh cuối chưa hợp lệ</span>') +
      '</div>';
  }

  /* 4. Lịch sử khám — gộp theo ngày */
  var visits = obj(D,'SO_KHAM').filter(function(x){ return x.MA_BN===maBN; });
  var byDay = {};
  visits.forEach(function(v){ var k=dstr(v.NGAY); (byDay[k]=byDay[k]||[]).push(v); });
  var days = Object.keys(byDay).sort().reverse().slice(0,12);
  html += '<div class="pkpSec">Lịch sử khám (' + visits.length + ' dịch vụ)</div>';
  html += days.length ? days.map(function(k){
    var ls = byDay[k];
    var tot = ls.reduce(function(s,l){ return s + ((String(l.TRANG_THAI_DV||'').trim()==='Hủy') ? 0 : (Number(l.THANH_TIEN)||0)); },0);
    return '<div class="pkpDay"><div class="dh"><span>📅 ' + dvn(k) + '</span><span class="pkpNum">' + fmtD(tot) + '</span></div>' +
      ls.map(function(l){
        var st = String(l.TRANG_THAI_DV||'').trim();
        var stH = st==='Hủy' ? '<span class="st cancel">✕ Hủy</span>'
                : st==='Chỉ định' ? '<span class="st pend">⏳ Chờ thực hiện</span>'
                : '<span class="st ok">✓' + (l.NGUOI_XAC_NHAN?(' '+esc(String(l.NGUOI_XAC_NHAN).split('@')[0])):'') + '</span>';
        return '<div class="pkpLine"><span style="flex:1;">' + esc(l.TEN_DV) + (Number(l.SO_LUONG)>1?(' ×'+l.SO_LUONG):'') +
          (l.BS_THUC_HIEN?(' <span class="pkpMut">· '+esc(l.BS_THUC_HIEN)+'</span>'):'') +
          (l.GHI_CHU?('<br><i class="pkpMut">'+esc(l.GHI_CHU)+'</i>'):'') + '</span>' +
          stH + '<span class="pkpNum" style="min-width:80px;text-align:right;">' + fmtD(l.THANH_TIEN) + '</span></div>';
      }).join('') + '</div>';
  }).join('') : '<div class="pkpEmpty">Chưa có lượt khám nào.</div>';

  /* 5. Thanh toán */
  var pays = obj(D,'THANH_TOAN').filter(function(p){ return p.MA_BN===maBN; }).reverse().slice(0,10);
  html += '<div class="pkpSec">Thanh toán gần đây</div>';
  html += pays.length ? pays.map(function(p){
    var no = Number(p.CON_LAI)||0;
    return '<div class="pkpRow"><span class="pkpNum pkpMut">' + dvn(p.NGAY) + ' · ' + esc(p.MA_TT||'') + '</span>' +
      '<span style="flex:1;padding:0 8px;">' + esc(p.HINH_THUC||'') + (no>0?(' <b style="color:var(--crit,#d03b3b);">· còn thiếu '+fmtD(no)+'</b>'):'') + '</span>' +
      '<span class="pkpNum"><b>' + fmtD(p.DA_THU) + '</b></span></div>';
  }).join('') : '<div class="pkpEmpty">Chưa có thanh toán.</div>';

  /* 6. Lịch hẹn */
  var hens = obj(D,'LICH_HEN').filter(function(h){ return h.MA_BN===maBN; });
  var up = hens.filter(function(h){ return dstr(h.NGAY_HEN)>=tdy() && String(h.TRANG_THAI||'')==='Đã hẹn'; })
               .sort(function(a,c){ return dstr(a.NGAY_HEN).localeCompare(dstr(c.NGAY_HEN)); });
  var past = hens.filter(function(h){ return dstr(h.NGAY_HEN)<tdy() || String(h.TRANG_THAI||'')!=='Đã hẹn'; }).reverse().slice(0,5);
  html += '<div class="pkpSec">Lịch hẹn</div>';
  html += (up.length||past.length) ? (
    up.map(function(h){ return '<div class="pkpRow"><span class="pkpNum" style="color:var(--brand,#0a5240);font-weight:700;">🗓 ' + dvn(h.NGAY_HEN) + ' ' + esc(h.GIO_HEN||'') + '</span><span style="flex:1;padding:0 8px;">' + esc(h.LY_DO||'') + (h.BS_PHU_TRACH?(' · '+esc(h.BS_PHU_TRACH)):'') + '</span><span class="pkpMut">sắp tới</span></div>'; }).join('') +
    past.map(function(h){ return '<div class="pkpRow pkpMut"><span class="pkpNum">' + dvn(h.NGAY_HEN) + '</span><span style="flex:1;padding:0 8px;">' + esc(h.LY_DO||'') + '</span><span>' + esc(h.TRANG_THAI||'') + '</span></div>'; }).join('')
  ) : '<div class="pkpEmpty">Chưa có lịch hẹn.</div>';

  document.getElementById('pkpBody').innerHTML = html;

  /* nút hành động theo trang */
  var hk = window.PKHooks || {};
  var f = '';
  if (typeof hk.editHS === 'function') f += '<button class="pkpBtn" onclick="PKProfile._act(\'editHS\',\'' + maBN + '\')">✏️ Sửa hồ sơ</button>';
  if (typeof hk.datHen === 'function') f += '<button class="pkpBtn" onclick="PKProfile._act(\'datHen\',\'' + maBN + '\')">📅 Đặt hẹn</button>';
  if (typeof hk.addSvc === 'function') f += '<button class="pkpBtn" onclick="PKProfile._act(\'addSvc\',\'' + maBN + '\')">➕ Thêm dịch vụ</button>';
  if (typeof hk.reception === 'function') f += '<button class="pkpBtn pri" onclick="PKProfile._act(\'reception\',\'' + maBN + '\')">🏥 Tiếp nhận vào hàng chờ</button>';
  document.getElementById('pkpFoot').innerHTML = f;
  document.getElementById('pkpFoot').style.display = f ? 'flex' : 'none';
}

window.PKProfile = {
  open: async function(maBN){
    if (!maBN) return;
    ovl.classList.add('on');
    document.getElementById('pkpTitle').textContent = 'Hồ sơ bệnh nhân';
    document.getElementById('pkpBody').innerHTML = '<div class="pkpLoad">⏳ Đang mở hồ sơ…</div>';
    document.getElementById('pkpFoot').innerHTML = '';
    try{
      var j = await window.api('readAll', {tables: TBLS});
      if (!j || !j.ok){ document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tải được hồ sơ — ' + esc((j&&j.error)||'kiểm tra kết nối mạng') + '.</div>'; return; }
      render(maBN, j.tables);
    }catch(e){
      document.getElementById('pkpBody').innerHTML = '<div class="pkpEmpty">Không tải được hồ sơ — kiểm tra kết nối mạng.</div>';
    }
  },
  close: function(){ ovl.classList.remove('on'); },
  _act: function(name, maBN){
    var hk = window.PKHooks || {};
    this.close();
    if (typeof hk[name] === 'function') hk[name](maBN);
  }
};
})();
