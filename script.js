(function(){
  const imgs = window.APP_IMAGES || [];
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.getElementById('viewer');
  const idxEl = document.getElementById('idx');
  const bar = document.getElementById('bar');

  const openBtn = document.getElementById('openGuide');
  const closeBtn = document.getElementById('closeBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fsBtn   = document.getElementById('fsBtn');
  const startAuto = document.getElementById('startAuto');
  const stopAuto  = document.getElementById('stopAuto');
  const secondsIn = document.getElementById('seconds');

  let i = 0, timer = null, t0 = 0, dur = Number(secondsIn.value)||3;

  function show(k){
    i = (k+imgs.length)%imgs.length;
    imgEl.src = imgs[i];
    imgEl.alt = `Hướng dẫn tập ảnh ${i+1}`;
    idxEl.textContent = i+1;
    bar.style.width = '0%';
    t0 = performance.now();
  }

  function open(){
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden','false');
    show(i);
  }
  function close(){
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden','true');
    stop();
  }
  function next(){ show(i+1); }
  function prev(){ show(i-1); }

  function start(){
    stop();
    dur = Math.max(1, Number(secondsIn.value)||3);
    const step = () => {
      const elapsed = (performance.now()-t0)/1000;
      const p = Math.min(1, elapsed/dur);
      bar.style.width = (p*100).toFixed(1)+'%';
      if (p>=1){ next(); }
      timer = requestAnimationFrame(step);
    };
    timer = requestAnimationFrame(step);
  }
  function stop(){ if (timer){ cancelAnimationFrame(timer); timer=null; } }

  // Events
  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  nextBtn.addEventListener('click', ()=>{ next(); });
  prevBtn.addEventListener('click', ()=>{ prev(); });
  startAuto.addEventListener('click', start);
  stopAuto.addEventListener('click', stop);

  // Keyboard
  document.addEventListener('keydown', (e)=>{
    if (lightbox.classList.contains('active')){
      if (e.key==='Escape') close();
      if (e.key==='ArrowRight') next();
      if (e.key==='ArrowLeft') prev();
      if (e.key===' ') { e.preventDefault(); timer?stop():start(); }
    }
  });

  // Fullscreen
  fsBtn.addEventListener('click', ()=>{
    if (!document.fullscreenElement) lightbox.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  // Mặc định: mở modal khi bấm nút
  // Bạn có thể gọi show(0) ở đây nếu muốn auto mở.
})();
