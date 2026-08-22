/* ============================================================
   TOA THUỐC — module dùng chung (Đợt D)
   PKToa.openCompose({maBN, tenBN, maCho, bsKe, nguoiNhap, onDone})
   PKToa.printToa(maToa)  — in toa A5 (tự tải dữ liệu)
   An toàn kê toa: KHÔNG tự điền liều — người kê tự chọn từng dòng.
   Yêu cầu trang chủ quản có: window.api(action, extra)
   ============================================================ */
(function(){
if (window.PKToa) return;

var css = document.createElement('style');
css.textContent =
'#tkOvl{position:fixed;inset:0;background:rgba(20,30,25,.5);display:none;align-items:center;justify-content:center;z-index:320;padding:16px;}' +
'#tkOvl.on{display:flex;}' +
'@media (prefers-reduced-motion: no-preference){#tkOvl.on{animation:tkIn .16s ease;}}' +
'@keyframes tkIn{from{opacity:0}to{opacity:1}}' +
'.tkM{background:#fff;border-radius:16px;width:min(860px,100%);max-height:92vh;overflow:auto;box-shadow:0 14px 44px rgba(0,0,0,.28);font-size:13.5px;}' +
'.tkH{padding:13px 18px;border-bottom:1px solid var(--hair,#e1e0d9);display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#fff;z-index:2;}' +
'.tkH h3{font-size:15px;color:var(--brand,#0a5240);flex:1;}' +
'.tkH .x{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink3,#8a9187);}' +
'.tkB{padding:14px 18px;}' +
'.tkF{padding:12px 18px;border-top:1px solid var(--hair,#e1e0d9);display:flex;gap:10px;justify-content:space-between;align-items:center;position:sticky;bottom:0;background:#fff;}' +
'.tkRow{border:1px solid var(--hair,#e1e0d9);border-radius:12px;padding:11px;margin-bottom:9px;position:relative;background:#fcfcfb;}' +
'.tkGrid{display:grid;grid-template-columns:2.2fr .8fr .8fr .8fr 1.2fr .8fr;gap:8px;}' +
'.tkGrid label{font-size:10px;color:var(--ink3,#8a9187);font-weight:800;text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:3px;}' +
'.tkGrid input,.tkGrid select{width:100%;font-size:13px;border:1.5px solid var(--hair,#e1e0d9);border-radius:8px;padding:6px 8px;background:#fff;}' +
'.tkTon{font-size:11px;margin-top:3px;color:var(--ink3,#8a9187);}' +
'.tkTon.thieu{color:var(--crit,#d03b3b);font-weight:700;}' +
'.tkDel{position:absolute;top:7px;right:7px;background:var(--crit-soft,#fbe9e9);color:var(--crit,#d03b3b);border:none;border-radius:8px;padding:3px 8px;font-size:12px;font-weight:700;cursor:pointer;}' +
'.tkBtn{border:none;border-radius:10px;padding:9px 15px;font-size:13px;font-weight:700;cursor:pointer;background:var(--brand-soft,#e3f2ed);color:var(--brand,#0a5240);}' +
'.tkBtn.pri{background:var(--brand2,#0f6e56);color:#fff;}' +
'.tkBtn:disabled{opacity:.45;cursor:not-allowed;}' +
'.tkNote{font-size:11.5px;color:#8a6205;background:var(--warn-soft,#fdf3dc);border-radius:9px;padding:8px 11px;margin-bottom:11px;line-height:1.5;}' +
'.tkLoad{padding:36px;text-align:center;color:var(--brand,#0a5240);font-weight:700;}';
document.head.appendChild(css);

var ovl = document.createElement('div');
ovl.id = 'tkOvl';
ovl.innerHTML = '<div class="tkM"><div class="tkH"><h3 id="tkTitle"> Kê toa thuốc</h3><button class="x" onclick="PKToa.close()">✕</button></div><div class="tkB" id="tkBody"></div><div class="tkF" id="tkFoot"></div></div>';
document.body.appendChild(ovl);

var ctx = null, THUOCS = [], TON = {}, DANG_SOAN = {};

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function obj(D,t){ var d=D&&D[t]; if(!d) return []; return d.rows.map(function(r){ var o={}; d.header.forEach(function(h,i){ o[String(h).trim()]=r[i]; }); return o; }); }
function nowT(){ var d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'); }
function tdy(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function numLieu(s){ // "1" / "0.5" / "1/2" / "1 viên" -> số
  s = String(s||'').trim();
  var m = s.match(/^(\d+)\s*\/\s*(\d+)/); if (m) return Number(m[1])/Number(m[2]);
  var f = parseFloat(s.replace(',','.')); return isNaN(f) ? 0 : f;
}
function tinhTon(khoRows){
  var t = {};
  khoRows.forEach(function(g){
    var q = Number(g.SO_LUONG)||0, k = String(g.MA_THUOC);
    if (g.LOAI==='Tồn đầu' || g.LOAI==='Nhập') t[k]=(t[k]||0)+q;
    else if (g.LOAI==='Xuất') t[k]=(t[k]||0)-q;
    else if (g.LOAI==='Kiểm kê') t[k]=(t[k]||0)+q; // kho ghi delta có dấu
  });
  return t;
}

/* ---------- KÊ TOA ---------- */
async function loadComposeData(){
  var j = await window.api('readAll', {tables:['THUOC','KHO_GD','TOA_THUOC','TOA_CT','BAC_SI']});
  if (!j || !j.ok) throw new Error((j&&j.error)||'Không tải được dữ liệu thuốc');
  THUOCS = obj(j.tables,'THUOC').filter(function(t){ return String(t.CON_AP_DUNG||'').trim()!=='Không'; });
  TON = tinhTon(obj(j.tables,'KHO_GD'));
  // thuốc đang nằm trong toa Chờ soạn/Đã soạn (chưa phát) → giữ chỗ
  DANG_SOAN = {};
  var toaMo = {}; obj(j.tables,'TOA_THUOC').forEach(function(t){ if (t.TRANG_THAI==='Chờ soạn'||t.TRANG_THAI==='Đã soạn') toaMo[t.MA_TOA]=1; });
  obj(j.tables,'TOA_CT').forEach(function(c){ if (toaMo[c.MA_TOA]) DANG_SOAN[c.MA_THUOC]=(DANG_SOAN[c.MA_THUOC]||0)+(Number(c.SO_LUONG)||0); });
  return { bacsi: obj(j.tables,'BAC_SI').filter(function(b){ return String(b.DANG_LAM_VIEC||'').trim()==='Có'; }),
           toaAll: obj(j.tables,'TOA_THUOC') };
}
function thuocOpts(){
  return '<option value="">— chọn thuốc —</option>' + THUOCS.map(function(t){
    return '<option value="'+esc(t.MA_THUOC)+'">'+esc(t.TEN_THUOC)+(t.DVT?(' ('+esc(t.DVT)+')'):'')+'</option>';
  }).join('');
}
function addRow(){
  var div = document.createElement('div');
  div.className = 'tkRow';
  div.innerHTML = '<button class="tkDel" title="Xóa dòng"></button>' +
    '<div class="tkGrid">' +
    '<div><label>Thuốc *</label><select class="tThuoc"></select><div class="tkTon"></div></div>' +
    '<div><label>Liều / lần *</label><input class="tLieu" placeholder="vd 1"></div>' +
    '<div><label>Lần / ngày *</label><input class="tLan" type="number" min="1" placeholder="vd 2"></div>' +
    '<div><label>Số ngày *</label><input class="tNgay" type="number" min="1" placeholder="vd 5"></div>' +
    '<div><label>Thời điểm dùng</label><input class="tTd" placeholder="sáng/tối, sau ăn…"></div>' +
    '<div><label>SL (tự nhân)</label><input class="tSl" type="number" min="0"></div>' +
    '</div>';
  div.querySelector('.tThuoc').innerHTML = thuocOpts();
  function upd(){
    var ma = div.querySelector('.tThuoc').value;
    var ton = TON[ma]||0, giu = DANG_SOAN[ma]||0, khaDung = ton-giu;
    var tonEl = div.querySelector('.tkTon');
    if (ma){ tonEl.textContent = 'Tồn: '+ton+(giu?(' · đang soạn: '+giu):'')+' · khả dụng: '+khaDung; }
    else tonEl.textContent = '';
    var sl = Math.ceil(numLieu(div.querySelector('.tLieu').value) * (Number(div.querySelector('.tLan').value)||0) * (Number(div.querySelector('.tNgay').value)||0));
    if (document.activeElement !== div.querySelector('.tSl')) div.querySelector('.tSl').value = sl||'';
    var need = Number(div.querySelector('.tSl').value)||0;
    tonEl.className = 'tkTon' + (ma && need>khaDung ? ' thieu' : '');
    if (ma && need>khaDung) tonEl.textContent += ' — ⚠ VƯỢT tồn khả dụng';
  }
  ['change','input'].forEach(function(ev){ div.addEventListener(ev, upd); });
  div.querySelector('.tkDel').addEventListener('click', function(){
    var rows = document.querySelectorAll('#tkRows .tkRow');
    if (rows.length<=1){ div.querySelectorAll('input').forEach(function(i){i.value='';}); div.querySelector('.tThuoc').value=''; upd(); }
    else div.remove();
  });
  document.getElementById('tkRows').appendChild(div);
}
function readRows(){
  var out = [], err = null;
  document.querySelectorAll('#tkRows .tkRow').forEach(function(div, idx){
    var ma = div.querySelector('.tThuoc').value;
    if (!ma) return;
    var t = THUOCS.find(function(x){ return String(x.MA_THUOC)===ma; });
    var lieu = String(div.querySelector('.tLieu').value).trim();
    var lan = Number(div.querySelector('.tLan').value)||0;
    var ngay = Number(div.querySelector('.tNgay').value)||0;
    var sl = Number(div.querySelector('.tSl').value)||0;
    if (!lieu || !lan || !ngay){ err = 'Dòng '+(idx+1)+' ('+t.TEN_THUOC+'): phải nhập đủ liều/lần, lần/ngày và số ngày — hệ thống không tự điền liều.'; }
    if (!sl){ err = err || ('Dòng '+(idx+1)+': số lượng chưa có.'); }
    out.push({ ma:ma, ten:t.TEN_THUOC, lieu:lieu, lan:lan, ngay:ngay, td:String(div.querySelector('.tTd').value).trim(), sl:sl });
  });
  return {rows:out, err:err};
}
async function nextToaId(toaAll){
  var mx = 0;
  toaAll.forEach(function(t){ var m = String(t.MA_TOA||'').match(/^TT(\d+)$/); if (m) mx = Math.max(mx, Number(m[1])); });
  return 'TT' + String(mx+1).padStart(5,'0');
}
async function save(){
  var btn = document.getElementById('tkSave');
  var r = readRows();
  if (!r.rows.length){ alert('Chưa chọn thuốc nào.'); return; }
  if (r.err){ alert(r.err); return; }
  var bsSel = document.getElementById('tkBs');
  var bsKe = bsSel ? bsSel.value : (ctx.bsKe||'');
  if (!bsKe){ alert('Chọn bác sĩ kê toa.'); return; }
  btn.disabled = true; btn.textContent = 'Đang lưu toa…';
  try{
    var maToa = await nextToaId(ctx.toaAll);
    var toa = { MA_TOA:maToa, NGAY:tdy(), MA_CHO:ctx.maCho||'', MA_BN:ctx.maBN, BS_KE:bsKe,
      NGUOI_NHAP:ctx.nguoiNhap||'', TRANG_THAI:'Chờ soạn', MA_TT:'', GHI_CHU:String(document.getElementById('tkGc').value).trim(),
      GIO_KE:nowT(), GIO_SOAN:'', GIO_PHAT:'', NGUOI_SOAN:'', NGUOI_PHAT:'' };
    var j = await window.api('append', {table:'TOA_THUOC', row:toa});
    if (!j || !j.ok) throw new Error((j&&j.error)||'lỗi');
    var calls = r.rows.map(function(x,i){
      return window.api('append', {table:'TOA_CT', row:{ MA_CT:maToa+'-'+(i+1), MA_TOA:maToa, MA_THUOC:x.ma, TEN_THUOC:x.ten,
        LIEU_LAN:x.lieu, LAN_NGAY:x.lan, SO_NGAY:x.ngay, THOI_DIEM:x.td, SO_LUONG:x.sl, SL_PHAT:0, DA_SOAN:'', DA_PHAT:'', GHI_CHU:'' }})
        .catch(function(e){ return {ok:false}; });
    });
    var rs = await Promise.all(calls);
    var fail = rs.filter(function(x){ return !(x&&x.ok); }).length;
    if (ctx.editToa){ // sửa toa = hủy toa cũ, thay bằng toa mới
      try{ await window.api('update', {table:'TOA_THUOC', keyCol:'MA_TOA', keyVal:ctx.editToa, row:{TRANG_THAI:'Hủy', GHI_CHU:'Sửa lại — thay bằng '+maToa}}); }catch(e){}
    }
    var cb = ctx ? ctx.onDone : null;
    PKToa.close();
    if (typeof cb === 'function') cb(maToa, fail);
  }catch(e){
    alert('Không lưu được toa: ' + String(e&&e.message||e));
  } finally { btn.disabled=false; btn.textContent=' Lưu toa — gửi Dược sỹ'; }
}

window.PKToa = {
  openCompose: async function(o){
    ctx = o || {};
    ovl.classList.add('on');
    document.getElementById('tkTitle').textContent = (o.editToa ? ('✎ Sửa toa '+o.editToa+' — ') : ' Kê toa thuốc — ') + (o.tenBN||o.maBN||'');
    document.getElementById('tkBody').innerHTML = '<div class="tkLoad"> Đang tải danh mục thuốc & tồn kho…</div>';
    document.getElementById('tkFoot').innerHTML = '';
    try{
      var d = await loadComposeData();
      ctx.toaAll = d.toaAll;
      var bsChon = '';
      if (!o.bsKe){
        bsChon = '<div style="margin-bottom:11px;"><label style="font-size:10px;color:var(--ink3,#8a9187);font-weight:800;text-transform:uppercase;">Bác sĩ kê toa *</label><br><select id="tkBs" style="min-width:220px;font-size:13px;border:1.5px solid var(--hair,#e1e0d9);border-radius:8px;padding:7px 9px;"><option value="">— chọn bác sĩ —</option>' +
          d.bacsi.map(function(b){ return '<option>'+esc(b.TEN_BS)+'</option>'; }).join('') + '</select></div>';
      }
      document.getElementById('tkBody').innerHTML =
        '<div class="tkNote">⚠ An toàn kê toa: nhập <b>liều/lần · lần/ngày · số ngày</b> cho TỪNG thuốc — hệ thống không tự điền liều. Số lượng tự nhân, sửa tay được.</div>' +
        bsChon +
        (o.bsKe ? ('<div style="margin-bottom:11px;font-size:13px;">Bác sĩ kê: <b>'+esc(o.bsKe)+'</b>'+(o.nguoiNhap&&o.nguoiNhap!==o.bsKe?(' · người nhập: '+esc(String(o.nguoiNhap).split('@')[0])):'')+'</div>') : '') +
        '<div id="tkRows"></div>' +
        '<button class="tkBtn" id="tkAdd"> Thêm thuốc</button>' +
        '<div style="margin-top:11px;"><label style="font-size:10px;color:var(--ink3,#8a9187);font-weight:800;text-transform:uppercase;">Lời dặn chung</label><br><input id="tkGc" style="width:100%;font-size:13px;border:1.5px solid var(--hair,#e1e0d9);border-radius:8px;padding:7px 9px;" placeholder="vd: uống đủ nước, tái khám nếu sốt…"></div>';
      document.getElementById('tkFoot').innerHTML =
        '<span style="font-size:11.5px;color:var(--ink3,#8a9187);">Toa gửi Dược sỹ soạn trước · thu tiền chung phiếu · phát sau khi thanh toán.</span>' +
        '<button class="tkBtn pri" id="tkSave"> Lưu toa — gửi Dược sỹ</button>';
      document.getElementById('tkAdd').addEventListener('click', addRow);
      document.getElementById('tkSave').addEventListener('click', save);
      if (o.prefill && o.prefill.length){
        o.prefill.forEach(function(l){
          addRow();
          var rows = document.querySelectorAll('#tkRows .tkRow');
          var div = rows[rows.length-1];
          div.querySelector('.tThuoc').value = String(l.MA_THUOC||'');
          div.querySelector('.tLieu').value = l.LIEU_LAN||'';
          div.querySelector('.tLan').value = l.LAN_NGAY||'';
          div.querySelector('.tNgay').value = l.SO_NGAY||'';
          div.querySelector('.tTd').value = l.THOI_DIEM||'';
          div.dispatchEvent(new Event('change'));
          if (l.SO_LUONG) div.querySelector('.tSl').value = l.SO_LUONG;
        });
        if (o.ghiChuCu) document.getElementById('tkGc').value = o.ghiChuCu;
      } else {
        addRow();
      }
    }catch(e){
      document.getElementById('tkBody').innerHTML = '<div class="tkLoad" style="color:var(--crit,#d03b3b);">Không tải được: '+esc(String(e&&e.message||e))+'</div>';
    }
  },
  close: function(){ ovl.classList.remove('on'); ctx = null; },

  /* ---------- IN TOA (A5 — theo Phụ lục I TT 26/2025) ---------- */
  printToa: async function(maToa){
    var j = await window.api('readAll', {tables:['TOA_THUOC','TOA_CT','BENH_NHAN']});
    if (!j || !j.ok){ alert('Không tải được toa.'); return; }
    var toa = obj(j.tables,'TOA_THUOC').find(function(t){ return t.MA_TOA===maToa; });
    if (!toa){ alert('Không tìm thấy toa '+maToa); return; }
    var lines = obj(j.tables,'TOA_CT').filter(function(c){ return c.MA_TOA===maToa; });
    var bn = obj(j.tables,'BENH_NHAN').find(function(b){ return b.MA_BN===toa.MA_BN; }) || {};
    PKToa.printData(toa, lines, bn);
  },
  printData: function(toa, lines, bn){
    var d = String(toa.NGAY||'').slice(0,10);
    var dvn = d.length===10 ? (d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4)) : d;
    var w = window.open('', '_blank', 'width=640,height=860');
    w.document.write('<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Đơn thuốc '+esc(toa.MA_TOA)+'</title><style>' +
      'body{font-family:"Times New Roman",Times,serif;margin:0;color:#222;}' +
      '.sheet{width:148mm;min-height:200mm;margin:0 auto;padding:8mm 10mm;box-sizing:border-box;font-size:12.5px;position:relative;}' +
      '@page{size:A5 portrait;margin:0;}' +
      '.top{display:flex;justify-content:space-between;}' +
      '.cs{font-size:11px;line-height:1.55;}' +
      '.cs .nm{font-weight:bold;text-transform:uppercase;color:#0a5240;font-size:11.5px;}' +
      '.ma{font-family:Arial;font-weight:bold;letter-spacing:1px;border:1px solid #222;padding:2px 7px;font-size:10.5px;}' +
      '.title{text-align:center;margin:9px 0 7px;}.title b{font-size:19px;letter-spacing:4px;}' +
      '.bn{line-height:1.9;}' +
      'ol{margin:4px 0 0;padding-left:22px;font-size:13px;min-height:52mm;}' +
      'ol li{margin-bottom:9px;}' +
      '.ten{font-weight:bold;}.sl{float:right;font-weight:bold;}.cach{font-size:12px;font-style:italic;}' +
      '.loidan{font-size:12px;margin-top:8px;line-height:1.6;}' +
      '.bot{display:flex;justify-content:space-between;margin-top:14px;font-size:11.5px;}' +
      '.sig{text-align:center;width:46%;}.sig .date{font-style:italic;color:#666;font-size:11px;}' +
      '.sig .role{font-weight:bold;margin-top:2px;}.sig .name{margin-top:32px;font-weight:bold;font-size:13px;}' +
      '</style></head><body><div class="sheet">' +
      '<div class="top"><div class="cs"><div class="nm">Phòng khám chuyên khoa Diệu Sinh</div>28 Tăng Bạt Hổ, TP. Quy Nhơn, Gia Lai<br>Chuyên khoa Sản — Phụ khoa</div>' +
      '<div style="text-align:right;font-size:10.5px;">Mã toa: <span class="ma">'+esc(toa.MA_TOA)+'</span></div></div>' +
      '<div class="title"><b>ĐƠN THUỐC</b></div>' +
      '<div class="bn">Họ tên: <b>'+esc(String(bn.HO_TEN||toa.MA_BN).toUpperCase())+'</b>' +
      (bn.NGAY_SINH?(' &nbsp;·&nbsp; Năm sinh: '+esc(bn.NGAY_SINH)):'') +
      (bn.GIOI_TINH?(' &nbsp;·&nbsp; Giới: '+esc(bn.GIOI_TINH)):'') + '<br>' +
      (bn.DIA_CHI?('Nơi cư trú: '+esc(bn.DIA_CHI)):'') + (bn.SDT?(' &nbsp;·&nbsp; SĐT: '+esc(bn.SDT)):'') + '</div>' +
      '<ol>' + lines.map(function(l){
        var sl = Number(l.SO_LUONG)||0;
        var slTxt = (sl<10?('0'+sl):String(sl));
        return '<li><span class="ten">'+esc(l.TEN_THUOC)+'</span> <span class="sl">SL: '+slTxt+'</span><br>' +
          '<span class="cach">Dùng '+esc(l.LIEU_LAN)+'/lần × '+esc(l.LAN_NGAY)+' lần/ngày, trong '+esc(l.SO_NGAY)+' ngày' +
          (l.THOI_DIEM?(' — '+esc(l.THOI_DIEM)):'') + '.</span></li>';
      }).join('') + '</ol>' +
      (toa.GHI_CHU?('<div class="loidan"><b><u>Lời dặn:</u></b> '+esc(toa.GHI_CHU)+' <i>Đơn có giá trị lấy thuốc trong 05 ngày kể từ ngày kê.</i></div>'):'<div class="loidan"><i>Đơn có giá trị lấy thuốc trong 05 ngày kể từ ngày kê.</i></div>') +
      '<div class="bot"><div style="font-size:11px;color:#333;">Khám lại xin mang theo đơn này.<br>Người nhập: '+esc(String(toa.NGUOI_NHAP||'').split('@')[0])+'</div>' +
      '<div class="sig"><div class="date">Ngày '+esc(dvn)+'</div><div class="role">Bác sĩ kê đơn</div><div class="name">'+esc(toa.BS_KE||'')+'</div></div></div>' +
      '</div><scr'+'ipt>window.print();</scr'+'ipt></body></html>');
    w.document.close();
  }
};
})();
