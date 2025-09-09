'use strict';
let playlist = [];
let idx = 0; let timer = null;
let names = Array.from({length:9}, (_,i)=>`Huyệt ${i+1}`);

const listEl = document.getElementById('nameList');
const imgEl = document.getElementById('img');
const thumbsEl = document.getElementById('thumbs');
const progressEl = document.getElementById('progress');
const errEl = document.getElementById('err');

const ctrl = {
  prev: document.getElementById('btnPrev'),
  play: document.getElementById('btnPlay'),
  pause: document.getElementById('btnPause'),
  next: document.getElementById('btnNext'),
  save: document.getElementById('btnSaveLocal'),
  export: document.getElementById('btnExportHtml'),
  guide: document.getElementById('btnGuide'),
  loadRepo: document.getElementById('btnLoadRepo'),
  fileInput: document.getElementById('fileInput')
};

function setEnabled(ready){
  [ctrl.prev, ctrl.play, ctrl.pause, ctrl.next, ctrl.save, ctrl.export, ctrl.guide].forEach(b=> b.disabled=!ready);
}

function showError(msg){
  errEl.textContent = msg;
  errEl.style.display = 'block';
  setTimeout(()=>{errEl.style.display='none';}, 3000);
}

function render(i){
  if(!playlist[i]){ imgEl.removeAttribute('src'); return; }
  imgEl.src = playlist[i].dataURL;
  highlightThumb(i);
  progressEl.style.width = '0%';
}
function renderThumbs(){
  thumbsEl.innerHTML = '';
  playlist.forEach((p,i)=>{
    const wrap = document.createElement('div'); wrap.className='thumb';
    const im = new Image(); im.src = p.dataURL; im.title = names[i] || p.name; im.onclick=()=>{ idx=i; render(idx); };
    wrap.appendChild(im);
    thumbsEl.appendChild(wrap);
  });
  highlightThumb(idx);
}
function highlightThumb(i){
  [...thumbsEl.children].forEach((el,k)=> el.classList.toggle('active',k===i));
}
function renderNameList(){
  listEl.innerHTML = '';
  for(let i=0;i<names.length;i++){
    const row = document.createElement('div'); row.className='row'; row.dataset.i=i; row.draggable=true;
    const num = document.createElement('div'); num.className='num'; num.textContent=i+1; row.appendChild(num);
    const textarea=document.createElement('textarea'); textarea.value=names[i]; row.appendChild(textarea);
    textarea.addEventListener('input',()=>{ names[i]=textarea.value; });
    row.addEventListener('click',(e)=>{ if(e.target===textarea) return; idx=i; render(idx); });
    listEl.appendChild(row);
  }
}

// Try to load 1..9 from /assets, extensions: jpg/jpeg/png/webp
async function tryLoadFromRepo(){
  const base = 'assets/';
  const exts = ['jpg','jpeg','png','webp'];
  const list = [];
  for(let i=1;i<=9;i++){
    let found=null;
    for(const ext of exts){
      const url = `${base}${i}.${ext}`;
      try{
        const res = await fetch(url,{cache:'no-store'});
        if(res.ok){
          const blob = await res.blob();
          const reader = new FileReader();
          const dataURL = await new Promise((resolve)=>{ reader.onload=e=>resolve(e.target.result); reader.readAsDataURL(blob); });
          found = {name:`${i}.${ext}`, dataURL};
          break;
        }
      }catch(_){}
    }
    if(!found){
      showError(`Không tìm thấy ảnh ${i} (chấp nhận .jpg/.jpeg/.png/.webp).`);
      return false;
    }
    list.push(found);
  }
  playlist = list;
  idx=0;
  setEnabled(true);
  renderNameList();
  renderThumbs();
  render(idx);
  return true;
}

// ==== Upload local ====
function filesToPlaylist(files){
  const arr = Array.from(files || []);
  document.getElementById('countHint').textContent = `${arr.length}/9`;
  if(arr.length !== 9){
    playlist=[]; idx=0; render(idx); thumbsEl.innerHTML='';
    setEnabled(false);
    showError('Vui lòng chọn đúng 9 ảnh.');
    return;
  }
  playlist=[]; idx=0;
  const readers=arr.map(file=>new Promise(resolve=>{
    const fr=new FileReader();
    fr.onload=e=>resolve({name:file.name,dataURL:e.target.result});
    fr.onerror=()=>resolve(null);
    fr.readAsDataURL(file);
  }));
  Promise.all(readers).then(list=>{
    playlist=list.filter(Boolean);
    setEnabled(true);
    renderNameList();
    renderThumbs();
    render(idx);
  });
}

// ==== Playback controls ====
function play(){
  clearTimeout(timer);
  if(!playlist.length) return;
  render(idx);
  const seconds=Math.max(1,Number(document.getElementById('dur').value)||5);
  const startAt=performance.now();
  function tick(now){
    const t=Math.min(1,(now-startAt)/(seconds*1000));
    progressEl.style.width=(t*100)+'%';
    if(t<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  timer=setTimeout(()=>{ if(document.getElementById('autoChk').checked) next(); },seconds*1000);
}
function pause(){ clearTimeout(timer); }
function next(){ idx=(idx+1)%playlist.length; play(); }
function prev(){ idx=(idx-1+playlist.length)%playlist.length; play(); }

// ==== Save/Export ====
const LS_KEY='huyet_playlist_v1';
const LS_NAMES='huyet_names_v1';
document.getElementById('btnSaveLocal')?.addEventListener('click', ()=>{
  localStorage.setItem(LS_KEY,JSON.stringify(playlist));
  localStorage.setItem(LS_NAMES,JSON.stringify(names));
  alert('Đã lưu vào trình duyệt.');
});
function exportHtml(){
  const payload={playlist,names};
  const tpl=`<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>30 ngày bye bye mỡ bụng (bản lưu)</title>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;padding:20px}img{max-width:100%%;border-radius:12px} .wrap{max-width:960px;margin:0 auto}</style>
  </head><body><div class='wrap'><h2>Bản lưu vĩnh viễn</h2><p>Mở file này bằng trình duyệt để xem lại danh sách ảnh và tên huyệt.</p><div id='viewer'></div><script>const BOOTSTRAP=${JSON.stringify(payload)};<\\/script><script>(function(){const v=document.getElementById('viewer');if(!BOOTSTRAP||!BOOTSTRAP.playlist||!BOOTSTRAP.playlist.length){v.innerHTML='<p>Không có dữ liệu.</p>';return;}for(let i=0;i<BOOTSTRAP.playlist.length;i++){const h=document.createElement('h3');h.textContent=(BOOTSTRAP.names&&BOOTSTRAP.names[i])||BOOTSTRAP.playlist[i].name||('Ảnh '+(i+1));const img=new Image();img.src=BOOTSTRAP.playlist[i].dataURL;v.appendChild(h);v.appendChild(img);}})();<\\/script></div></body></html>`;
  const blob=new Blob([tpl],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.getElementById('exportLink');
  a.href=url; a.download='30ngay-huyet.html'; a.style.display='inline-block';
}
document.getElementById('btnExportHtml')?.addEventListener('click', exportHtml);

// ==== Fullscreen Guide ====
const guide = document.getElementById('guide');
const guideImg = document.getElementById('guideImg');
const guideClose = document.getElementById('guideClose');
const guideCounter = document.getElementById('guideCounter');
let guideTimer=null, guideIdx=0, guideList=[];

function openGuide(){
  if(playlist.length !== 9){
    showError('Cần đủ 9 ảnh.');
    return;
  }
  guideList = playlist.slice(0,9);
  guideIdx = 0;
  guideShow(guideIdx);
  guide.classList.remove('hidden');
  guide.setAttribute('aria-hidden','false');
  startGuideAuto();
}
function closeGuide(){
  stopGuideAuto();
  guide.classList.add('hidden');
  guide.setAttribute('aria-hidden','true');
}
function guideShow(i){
  const it = guideList[i];
  guideImg.src = it.dataURL;
  guideCounter.textContent = (i+1) + '/9';
}
function startGuideAuto(){
  stopGuideAuto();
  const seconds=Math.max(1,Number(document.getElementById('dur').value)||5);
  if(document.getElementById('autoChk').checked){
    guideTimer=setTimeout(()=>{ guideIdx=(guideIdx+1)%guideList.length; guideShow(guideIdx); startGuideAuto(); }, seconds*1000);
  }
}
function stopGuideAuto(){ if(guideTimer){ clearTimeout(guideTimer); guideTimer=null; } }

// Events
ctrl.fileInput.addEventListener('change',e=>filesToPlaylist(e.target.files));
document.getElementById('btnPlay').onclick=play;
document.getElementById('btnPause').onclick=pause;
document.getElementById('btnNext').onclick=()=>{pause();next();};
document.getElementById('btnPrev').onclick=()=>{pause();prev();};
document.getElementById('durMinus').onclick=()=>{
  let v=Math.max(1,Number(document.getElementById('dur').value)||1);
  document.getElementById('dur').value=Math.max(1,v-1);
};
document.getElementById('durPlus').onclick=()=>{
  let v=Math.max(1,Number(document.getElementById('dur').value)||1);
  document.getElementById('dur').value=v+1;
};
document.getElementById('btnGuide').addEventListener('click', openGuide);
guideClose.addEventListener('click', closeGuide);
document.addEventListener('keydown', (e)=>{
  if(guide.classList.contains('hidden')) return;
  if(e.key==='Escape'){ closeGuide(); }
  else if(e.key==='ArrowRight'){ stopGuideAuto(); guideIdx=(guideIdx+1)%guideList.length; guideShow(guideIdx); }
  else if(e.key==='ArrowLeft'){ stopGuideAuto(); guideIdx=(guideIdx-1+guideList.length)%guideList.length; guideShow(guideIdx); }
});

// Load from repo button
ctrl.loadRepo.addEventListener('click', async ()=>{
  const ok = await tryLoadFromRepo();
  if(ok){ alert('Đã nạp 9 ảnh từ repo thành công.'); }
});

// init
renderNameList();
setEnabled(false);
