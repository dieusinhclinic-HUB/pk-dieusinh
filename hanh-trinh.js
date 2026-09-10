/* ============================================================
   HÀNH TRÌNH BỆNH NHÂN — module dùng chung (Tổng quan + Quầy lễ tân)
   Cần trang chủ quản có: rowsToObj(table). Suy cột THẲNG từ hàng chờ,
   không thêm trạng thái mới. PKJourney.render(boardId, detailId).
   ============================================================ */
(function(){
if (window.PKJourney) return;
var css = document.createElement('style');
css.textContent = '\n.jnboard{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;align-items:start;}\n@media(max-width:1100px){.jnboard{grid-template-columns:repeat(3,1fr);}}@media(max-width:1400px) and (min-width:1101px){.jnboard{grid-template-columns:repeat(4,1fr);}}\n.jncol{background:#efeee8;border-radius:11px;padding:8px;min-height:60px;}\n.jncol h4{margin:0 0 7px;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink2);display:flex;justify-content:space-between;align-items:center;}\n.jncol h4 .n{background:var(--brand);color:#fff;border-radius:99px;padding:0 7px;font-size:10.5px;}\n.jncard{background:#fff;border:1px solid var(--hair);border-radius:9px;padding:7px 9px;margin-bottom:6px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04);}\n.jncard:hover{border-color:var(--brand3,#9dbfb3);}\n.jncard.sel{border:1.5px solid var(--brand);}\n.jncard b{font-size:12.5px;}\n.jncard .m{font-size:10.5px;color:var(--ink3);margin-top:1px;}\n.jnstt{display:inline-block;background:var(--brand);color:#fff;border-radius:6px;padding:0 6px;font-weight:800;margin-right:4px;font-size:11.5px;}\n.jnw{font-weight:800;font-size:10.5px;border-radius:99px;padding:1px 7px;display:inline-block;margin-top:4px;background:#e4efe9;color:var(--brand);}\n.jnw.w2{background:#fdf3dc;color:#8a6205;}\n.jnw.w3{background:#fdecec;color:#d03b3b;}\n.jnempty{font-size:11px;color:var(--ink3);text-align:center;padding:8px 0;}\n#jnDetail .steps{display:flex;align-items:center;flex-wrap:wrap;gap:4px;font-size:12px;background:#fff;border:1px solid var(--hair);border-radius:11px;padding:11px 14px;margin-top:10px;}\n#jnDetail .st{display:flex;align-items:center;gap:4px;}\n#jnDetail .dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;}\n#jnDetail .done .dot{background:var(--brand);}\n#jnDetail .cur .dot{background:#b98a00;}\n#jnDetail .todo .dot{background:#cfd4cf;}\n#jnDetail .todo .lb{color:var(--ink3);font-weight:500;}\n#jnDetail .lb{font-weight:700;}\n#jnDetail .t{color:var(--ink3);font-size:10px;}\n#jnDetail .arr{color:#c6ccc6;margin:0 2px;}\n';
document.head.appendChild(css);
var PKJ = { sel:null, boardId:'jnBoard', detailId:'jnDetail' };
function jnToday(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function jnD(v){ return String(v||'').slice(0,10); }
function jnParseSec(v){
  if (v==null || v==='') return null;
  var m = String(v).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return Number(m[1])*3600 + Number(m[2])*60 + Number(m[3]||0);
  var d = new Date(String(v));
  if (!isNaN(d)) return d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds();
  return null;
}
function jnFmtD(n){ return (Number(n)||0).toLocaleString('vi-VN') + ' đ'; }
/* ==== HÀNH TRÌNH BỆNH NHÂN — suy trực tiếp từ hàng chờ/sổ khám/toa/thanh toán, không thêm trạng thái mới ==== */

function jnStrip(x){ return String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d').toLowerCase(); }
function jnIsSaTen(ten, nhom){ const t = jnStrip((nhom||'')+' '+(ten||'')); return t.indexOf('sieu am')!==-1 || t.indexOf('shg')!==-1; }
function jnIsSaBS(ten){ const b = rowsToObj('BAC_SI').find(x=>String(x.TEN_BS).trim()===String(ten||'').trim()); return !!(b && jnStrip(b.CHUYEN_KHOA).indexOf('sieu am')!==-1); }
function jnMin(fromV){ const a = jnParseSec(fromV); if (a==null) return null; const d=new Date(); const b=d.getHours()*3600+d.getMinutes()*60+d.getSeconds(); return Math.max(0, Math.round((b-a)/60)); }
function jnWait(min, label){ if (min==null) return ''; const c = min>30?'w3':(min>=15?'w2':''); return `<span class="jnw ${c}">${label||'chờ'} ${min}′</span>`; }
function jnData(){
const dvs = rowsToObj('DICH_VU');
const nhomOfDV = ten => { const d = dvs.find(x=>String(x.TEN_DV).trim()===String(ten).trim()); return d?String(d.NHOM||'').trim():''; };
const toas = rowsToObj('TOA_THUOC');
const sk = rowsToObj('SO_KHAM');
const bnAll = rowsToObj('BENH_NHAN');
const cols = { cho:[], kham:[], sa:[], xn:[], pay:[], thuoc:[], ve:[] };
rowsToObj('HANG_CHO').filter(r=>jnD(r.NGAY)===jnToday() && String(r.TRANG_THAI).trim()!=='Hủy').forEach(r=>{
  const st = String(r.TRANG_THAI).trim();
  const bnr = bnAll.find(b=>b.MA_BN===r.MA_BN);
  const legs = sk.filter(l=>l.MA_CHO===r.MA_CHO && String(l.TRANG_THAI_DV||'').trim()!=='Hủy');
  const pend = legs.filter(l=>String(l.TRANG_THAI_DV||'').trim()==='Chỉ định');
  const doneLegs = legs.filter(l=>String(l.TRANG_THAI_DV||'').trim()==='Hoàn thành' || String(l.TRANG_THAI_DV||'').trim()==='');
  const grpOf = l => { const g = nhomOfDV(l.TEN_DV); if (g) return g; return jnIsSaTen(l.TEN_DV,'') ? 'Siêu âm' : 'Khám'; };
  const pendSa = pend.filter(l=>grpOf(l)==='Siêu âm' || jnIsSaTen(l.TEN_DV, nhomOfDV(l.TEN_DV)));
  const pendXnTt = pend.filter(l=>{ const g=grpOf(l); return g==='Xét nghiệm' || g==='Thủ thuật'; });
  const pendXn = pend.filter(l=>grpOf(l)==='Xét nghiệm');
  const rToas = toas.filter(t=>String(t.MA_CHO||'')===r.MA_CHO && t.TRANG_THAI!=='Hủy');
  const toaPend = rToas.filter(t=>t.TRANG_THAI==='Chờ soạn' || t.TRANG_THAI==='Đã soạn');
  const it = { r, bn: bnr?bnr.HO_TEN:r.MA_BN, legs, pend, doneLegs, pendSa, pendXn, pendXnTt, rToas, toaPend };
  if (st==='Chờ khám'){
    /* chờ từ lúc tiếp nhận, hoặc từ lúc xong dịch vụ gần nhất (đã khám xong 1 phòng, chờ phòng kia) */
    let from = r.GIO_TIEP_NHAN;
    doneLegs.forEach(l=>{ if (jnParseSec(l.GIO_XAC_NHAN)!=null && (jnParseSec(from)==null || jnParseSec(l.GIO_XAC_NHAN)>jnParseSec(from))) from = l.GIO_XAC_NHAN; });
    it.from = from;
    /* xếp cột theo VIỆC CÒN LẠI thật sự: chỉ còn siêu âm → cột Siêu âm; chỉ còn XN/thủ thuật → cột Xét nghiệm; còn khám → cột chờ khám */
    if (pend.length && pend.length===pendSa.length) cols.sa.push(it);
    else if (pend.length && pend.length===pendXnTt.length && pendXn.length) cols.xn.push(it);
    else cols.cho.push(it);
  } else if (st==='Đang khám'){
    it.from = r.GIO_GOI;
    if (jnIsSaBS(r.BS_KHAM)) cols.sa.push(it); else cols.kham.push(it);
  } else if (st==='Xong khám'){
    it.from = r.GIO_XONG;
    cols.pay.push(it);
  } else if (st==='Đã thu'){
    if (it.toaPend.length){ it.from = r.GIO_THU; cols.thuoc.push(it); }
    else cols.ve.push(it);
  }
});
return cols;
}
function jnCard(it, kind){
const r = it.r;
let m = '', w = '';
if (kind==='cho'){ m = 'tiếp nhận '+(String(r.GIO_TIEP_NHAN||'').slice(0,5))+(r.BS_YEU_CAU?(' · YC: '+r.BS_YEU_CAU):'')+(it.pend.length?(' · còn: '+it.pend.map(l=>l.TEN_DV).join(', ').slice(0,48)):''); w = jnWait(jnMin(it.from),'chờ khám'); }
if (kind==='xn'){ m = 'chờ làm — '+it.pend.map(l=>l.TEN_DV).join(', ').slice(0,52); w = jnWait(jnMin(it.from),'chờ XN'); }
if (kind==='kham'){ m = (r.BS_KHAM||'')+' · vào '+(String(r.GIO_GOI||'').slice(0,5)); w = jnWait(jnMin(it.from),'trong phòng'); }
if (kind==='sa'){
  const dang = String(r.TRANG_THAI).trim()==='Đang khám';
  m = dang ? ((r.BS_KHAM||'')+' · vào '+String(r.GIO_GOI||'').slice(0,5)) : ('chờ siêu âm — '+it.pendSa.map(l=>l.TEN_DV).join(', ').slice(0,40));
  w = jnWait(jnMin(it.from), dang?'trong phòng':'chờ SA');
}
if (kind==='pay'){ const tong = it.doneLegs.reduce((s,l)=>s+(Number(l.THANH_TIEN)||0),0); m = 'xong khám '+String(r.GIO_XONG||'').slice(0,5)+' · '+it.doneLegs.length+' DV · '+jnFmtD(tong); w = jnWait(jnMin(it.from),'chờ'); }
if (kind==='thuoc'){ m = 'đã thu '+String(r.GIO_THU||'').slice(0,5)+' · toa '+it.toaPend.map(t=>t.MA_TOA+' '+t.TRANG_THAI.toLowerCase()).join(', '); w = jnWait(jnMin(it.from),'chờ thuốc'); }
if (kind==='ve'){
  const a = jnParseSec(r.GIO_TIEP_NHAN), b = jnParseSec(r.GIO_THU);
  const tt = (a!=null&&b!=null&&b>=a) ? Math.round((b-a)/60) : null;
  m = (r.GIO_THU?('thu '+String(r.GIO_THU).slice(0,5)):'')+(tt!=null?(' · tổng tại PK: '+(tt>=60?(Math.floor(tt/60)+'g'+String(tt%60).padStart(2,'0')+'′'):(tt+'′'))):'');
}
return `<div class="jncard${PKJ.sel===r.MA_CHO?' sel':''}" onclick="PKJourney.toggle('${r.MA_CHO}')">
<span class="jnstt">${r.STT||'–'}</span><b>${it.bn}</b><div class="m">${m}</div>${w}</div>`;
}
function jnRender(){
const box = document.getElementById(PKJ.boardId); if (!box) return;
const c = jnData();
const col = (title, arr, kind, capVe) => {
  let list = arr;
  if (capVe && arr.length>4 && !PKJ.sel) list = arr.slice(-4);
  return `<div class="jncol"><h4>${title} <span class="n">${arr.length}</span></h4>` +
    (list.length ? list.map(it=>jnCard(it,kind)).join('') : '<div class="jnempty">— trống —</div>') +
    (capVe && arr.length>list.length ? `<div class="jnempty">… +${arr.length-list.length} người trước đó</div>` : '') + '</div>';
};
box.innerHTML =
  col('Tiếp nhận — chờ khám', c.cho, 'cho') +
  col('Đang khám', c.kham, 'kham') +
  col('Siêu âm', c.sa, 'sa') +
  col('Xét nghiệm / thủ thuật', c.xn, 'xn') +
  col('Chờ thanh toán', c.pay, 'pay') +
  col('Nhà thuốc', c.thuoc, 'thuoc') +
  col('Ra về hôm nay', c.ve, 've', true);
/* chi tiết hành trình 1 người */
const det = document.getElementById(PKJ.detailId); if (!det) return;
const all = [].concat(c.cho,c.kham,c.sa,c.xn,c.pay,c.thuoc,c.ve);
const it = PKJ.sel ? all.find(x=>x.r.MA_CHO===PKJ.sel) : null;
if (!it){ det.innerHTML=''; PKJ.sel=null; return; }
const r = it.r;
const t5 = v => String(v||'').slice(0,5);
const steps = [];
steps.push({lb:'Tiếp nhận', t:t5(r.GIO_TIEP_NHAN), s:'done'});
const st = String(r.TRANG_THAI).trim();
/* các dịch vụ đã hoàn thành — theo giờ */
it.doneLegs.slice().sort((a,b)=>(jnParseSec(a.GIO_XAC_NHAN)||0)-(jnParseSec(b.GIO_XAC_NHAN)||0)).forEach(l=>{
  steps.push({lb:l.TEN_DV, t:(l.BS_THUC_HIEN?l.BS_THUC_HIEN+' · ':'')+t5(l.GIO_XAC_NHAN), s:'done'});
});
if (st==='Chờ khám'){
  let lb = 'Chờ khám';
  if (it.pend.length && it.pend.length===it.pendSa.length) lb = 'Chờ siêu âm';
  else if (it.pend.length && it.pendXnTt && it.pend.length===it.pendXnTt.length) lb = 'Chờ xét nghiệm / thủ thuật';
  steps.push({lb, t: jnMin(it.from)!=null?(jnMin(it.from)+'′'):'', s:'cur'});
}
if (st==='Đang khám') steps.push({lb:(jnIsSaBS(r.BS_KHAM)?'Đang siêu âm':'Đang khám'), t:(r.BS_KHAM||'')+' · từ '+t5(r.GIO_GOI), s:'cur'});
it.pend.filter(l=>st!=='Chờ khám' || true).forEach(l=>{ if (st!=='Chờ khám') steps.push({lb:l.TEN_DV, t:'chưa làm', s:'todo'}); });
if (st==='Chờ khám' && it.pend.length) it.pend.forEach(l=>steps.push({lb:l.TEN_DV, t:'chưa làm', s:'todo'}));
if (st==='Xong khám') steps.push({lb:'Chờ thanh toán', t:jnMin(it.from)!=null?(jnMin(it.from)+'′'):'', s:'cur'});
else if (st!=='Đã thu') steps.push({lb:'Thanh toán', t:'', s:'todo'});
if (st==='Đã thu'){
  steps.push({lb:'Thanh toán', t:t5(r.GIO_THU), s:'done'});
  if (it.toaPend.length) steps.push({lb:'Chờ thuốc ('+it.toaPend.map(t=>t.TRANG_THAI.toLowerCase()).join(', ')+')', t:jnMin(r.GIO_THU)!=null?(jnMin(r.GIO_THU)+'′'):'', s:'cur'});
  else if (it.rToas.length) steps.push({lb:'Đã phát thuốc', t:t5((it.rToas.find(t=>t.TRANG_THAI==='Đã phát')||{}).GIO_PHAT), s:'done'});
  if (!it.toaPend.length) steps.push({lb:'Ra về', t:'', s:'done'});
} else {
  if (it.rToas.length) steps.push({lb:'Nhận thuốc', t:'', s:'todo'});
  steps.push({lb:'Ra về', t:'', s:'todo'});
}
det.innerHTML = `<div class="steps"><div style="width:100%;font-size:12.5px;margin-bottom:5px;"><b>${it.bn}</b> <span style="color:var(--ink3);">${r.MA_BN} · số ${r.STT||'–'}</span></div>` +
  steps.map((x,i)=>`<div class="st ${x.s}"><span class="dot">${x.s==='done'?'✓':(x.s==='cur'?'●':'○')}</span><span class="lb">${x.lb}</span>${x.t?`<span class="t">${x.t}</span>`:''}</div>${i<steps.length-1?'<span class="arr">→</span>':''}`).join('') + '</div>';
}

window.PKJourney = {
  render: function(boardId, detailId){ if (boardId) PKJ.boardId = boardId; if (detailId) PKJ.detailId = detailId; jnRender(); },
  rerender: function(){ jnRender(); },
  toggle: function(ma){ PKJ.sel = (PKJ.sel===ma) ? null : ma; jnRender(); }
};
setInterval(function(){ try{ if (document.getElementById(PKJ.boardId)) jnRender(); }catch(e){} }, 60000);
})();
