/* ===========================================================
   Companion site interactivity — Dementia crash severity triage
=========================================================== */
(function(){
  "use strict";

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  function applyTheme(t){
    root.setAttribute('data-theme', t);
    try{ localStorage.setItem('dementia-crash-theme', t); }catch(e){}
  }
  (function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('dementia-crash-theme'); }catch(e){}
    if(saved){ applyTheme(saved); }
    else{
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  })();
  themeBtn && themeBtn.addEventListener('click', function(){
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur);
    renderCharts();
  });

  /* ---------- scroll progress ---------- */
  const progressBar = document.getElementById('scroll-progress');
  function updateProgress(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled/height)*100 : 0;
    if(progressBar) progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  /* ---------- back to top ---------- */
  const backBtn = document.getElementById('back-to-top');
  function toggleBack(){
    if(!backBtn) return;
    if(window.scrollY > 600) backBtn.classList.add('show');
    else backBtn.classList.remove('show');
  }
  document.addEventListener('scroll', toggleBack, {passive:true});
  backBtn && backBtn.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));

  /* ---------- nav active link (scroll-spy) ---------- */
  const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function spy(){
    let idx = -1;
    const y = window.scrollY + 120;
    sections.forEach((sec,i)=>{ if(sec && sec.offsetTop <= y) idx = i; });
    navLinks.forEach(a=>a.classList.remove('active'));
    if(idx >= 0) navLinks[idx].classList.add('active');
  }
  document.addEventListener('scroll', spy, {passive:true});
  spy();

  /* ---------- animated stat counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.4});
  counters.forEach(c=>counterObserver.observe(c));
  function animateCounter(el){
    const target = parseFloat(el.getAttribute('data-count'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const dur = 1100;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now-start)/dur);
      const eased = 1 - Math.pow(1-p, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
      if(p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- dataset bar fills ---------- */
  const bars = document.querySelectorAll('.bar-fill');
  const barObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const w = entry.target.getAttribute('data-w');
        entry.target.style.width = w + '%';
        barObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.3});
  bars.forEach(b=>barObserver.observe(b));

  /* ---------- six-layer architecture diagram ---------- */
  const pipeDetails = [
    "<b>1 · Data Ingestion —</b> Texas CRIS crash records (2017–2025, ~5M records) are searched with predefined dementia-related terms, then manually reviewed for sufficient narrative evidence. The final analytical dataset retains 4,781 crashes with 25 structured predictors plus narratives.",
    "<b>2 · Leakage Control —</b> Terms and phrases directly revealing dementia status or serving as outcome proxies are excluded. Narrative masking combines 22 seed expressions with up to 75 corpus-derived unigrams/bigrams/trigrams using [MASK_SEVERITY].",
    "<b>3 · Representation Learning —</b> Structured fields are one-hot or category-native (CatBoost); narratives use TF-IDF or transformer/LLM encodings. Early fusion concatenates features; late fusion averages validation-tuned modality probabilities.",
    "<b>4 · Probability Prediction —</b> Structured, narrative, fusion, calibrated-fusion, BERT-family, and local LLM (Gemma, Qwen) baselines each output class probabilities for O / BC / KA.",
    "<b>5 · Severity-Aware Decision Rules —</b> A standard argmax rule and a cost-sensitive rule (KA→O costs 5×, KA→BC costs 3×) are compared, plus a confidence-ranked selective-deferral rule for routing uncertain cases toward human review.",
    "<b>6 · Audit Logging —</b> Every split index, trained model, logit, LLM prompt/response, prediction, calibration output, and deferral table is preserved so each reported result is traceable."
  ];
  const pipeNodes = document.querySelectorAll('.pipe-node');
  const pipeDetailEl = document.getElementById('pipe-detail-text');
  pipeNodes.forEach(node=>{
    node.addEventListener('click', ()=>{
      pipeNodes.forEach(n=>n.classList.remove('active'));
      node.classList.add('active');
      const i = parseInt(node.getAttribute('data-i'), 10);
      pipeDetailEl.style.opacity = 0;
      setTimeout(()=>{
        pipeDetailEl.innerHTML = pipeDetails[i];
        pipeDetailEl.style.opacity = 1;
      }, 120);
    });
  });

  /* ---------- accordion ---------- */
  document.querySelectorAll('.acc-item').forEach(item=>{
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    function setState(open){
      if(open){ item.classList.add('open'); body.style.maxHeight = body.scrollHeight + 'px'; }
      else{ item.classList.remove('open'); body.style.maxHeight = '0px'; }
    }
    setState(item.classList.contains('open'));
    head.addEventListener('click', ()=> setState(!item.classList.contains('open')));
    window.addEventListener('resize', ()=>{ if(item.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px'; });
  });

  /* ---------- sortable tables ---------- */
  document.querySelectorAll('table.sortable').forEach(table=>{
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, colIdx)=>{
      th.addEventListener('click', ()=>{
        const type = th.getAttribute('data-type') || 'text';
        const curDir = th.getAttribute('data-sort') === 'asc' ? 'asc' : (th.getAttribute('data-sort')==='desc' ? 'desc' : null);
        const nextDir = curDir === 'desc' ? 'asc' : 'desc';
        ths.forEach(t=>t.removeAttribute('data-sort'));
        th.setAttribute('data-sort', nextDir);
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a,b)=>{
          let av = a.children[colIdx].textContent.trim();
          let bv = b.children[colIdx].textContent.trim();
          if(type === 'num'){
            av = parseFloat(av.replace(/[^0-9.\-]/g,'')) || 0;
            bv = parseFloat(bv.replace(/[^0-9.\-]/g,'')) || 0;
          }else{
            av = av.toLowerCase(); bv = bv.toLowerCase();
          }
          if(av < bv) return nextDir === 'asc' ? -1 : 1;
          if(av > bv) return nextDir === 'asc' ? 1 : -1;
          return 0;
        });
        rows.forEach(r=>tbody.appendChild(r));
      });
    });
  });

  /* ---------- BibTeX copy ---------- */
  const copyBtn = document.getElementById('copy-bibtex');
  if(copyBtn){
    copyBtn.addEventListener('click', ()=>{
      const text = document.getElementById('bibtex-text').textContent;
      navigator.clipboard.writeText(text).then(()=>{
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('copied');
        setTimeout(()=>{ copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1800);
      }).catch(()=>{
        copyBtn.textContent = 'Press ⌘/Ctrl+C';
      });
    });
  }

  /* ---------- deferral simulator ---------- */
  const deferralData = [
    { coverage:'100%', macroF1:0.522, kaRec:0.384, cost:0.675, deferred:0, deferredKA:0,
      note:"Fully automated classification; no review burden, but all uncertainty remains in the automatic labels." },
    { coverage:'90%', macroF1:0.544, kaRec:0.379, cost:0.635, deferred:72, deferredKA:7,
      note:"Light review queue; removes the lowest-confidence decile and lowers expected severity cost." },
    { coverage:'80%', macroF1:0.560, kaRec:0.368, cost:0.601, deferred:144, deferredKA:16,
      note:"Moderate review queue; best balance when an agency can inspect roughly one in five cases." },
    { coverage:'70%', macroF1:0.573, kaRec:0.396, cost:0.577, deferred:215, deferredKA:25,
      note:"Conservative automation; strongest cost reduction, but requires review of nearly one-third of cases." }
  ];
  const slider = document.getElementById('coverage-slider');
  const readout = document.getElementById('coverage-readout');
  const gaugeNeedle = document.getElementById('gauge-needle');
  const gaugeArc = document.getElementById('gauge-arc');
  const elMacroF1 = document.getElementById('dm-macrof1');
  const elKaRec = document.getElementById('dm-karec');
  const elCost = document.getElementById('dm-cost');
  const elDeferred = document.getElementById('dm-deferred');
  const ddMacroF1 = document.getElementById('dd-macrof1');
  const ddKaRec = document.getElementById('dd-karec');
  const ddCost = document.getElementById('dd-cost');
  const ddDeferred = document.getElementById('dd-deferred');
  const interpEl = document.getElementById('deferral-interp');

  function fmtDelta(cur, base, higherIsBetter, isInt){
    const diff = cur - base;
    if(Math.abs(diff) < 1e-9) return {text:'—', cls:''};
    const good = higherIsBetter ? diff > 0 : diff < 0;
    const sign = diff > 0 ? '+' : '';
    const text = isInt ? `${sign}${diff}` : `${sign}${diff.toFixed(3)}`;
    return {text, cls: good ? 'up' : 'down'};
  }

  function renderDeferral(idx){
    // slider: 0 -> 100%, 3 -> 70% (reverse index so dragging right = higher coverage)
    const dataIdx = 3 - idx;
    const d = deferralData[dataIdx];
    const base = deferralData[0];
    readout.textContent = d.coverage;

    if(gaugeNeedle){
      const angle = -90 + idx * 60; // idx 0(70%)=-90deg .. idx 3(100%)=+90deg
      gaugeNeedle.style.transform = `rotate(${angle}deg)`;
    }
    if(gaugeArc){
      const proportion = 0.7 + (idx/3) * 0.3;
      const len = 302; // ≈ π × 96 (semicircle circumference)
      gaugeArc.style.strokeDashoffset = String(len * (1 - proportion));
    }
    elMacroF1.textContent = d.macroF1.toFixed(3);
    elKaRec.textContent = d.kaRec.toFixed(3);
    elCost.textContent = d.cost.toFixed(3);
    elDeferred.textContent = d.deferred + (d.deferredKA ? ` (${d.deferredKA})` : '');
    interpEl.textContent = d.note;

    const f1d = fmtDelta(d.macroF1, base.macroF1, true, false);
    const kad = fmtDelta(d.kaRec, base.kaRec, true, false);
    const cod = fmtDelta(d.cost, base.cost, false, false);
    ddMacroF1.textContent = f1d.text; ddMacroF1.className = 'dd ' + f1d.cls;
    ddKaRec.textContent = kad.text; ddKaRec.className = 'dd ' + kad.cls;
    ddCost.textContent = cod.text; ddCost.className = 'dd ' + cod.cls;
    ddDeferred.textContent = d.deferred > 0 ? `${d.deferred} withheld` : 'none withheld';
    ddDeferred.className = 'dd ' + (d.deferred > 0 ? 'down' : '');
  }
  if(slider){
    slider.addEventListener('input', ()=> renderDeferral(parseInt(slider.value,10)));
    renderDeferral(parseInt(slider.value,10));
  }

  /* ---------- Chart.js charts ---------- */
  let chartInstances = {};
  function themeColors(){
    const dark = root.getAttribute('data-theme') === 'dark';
    return {
      text: dark ? '#a9b3b3' : '#4a5559',
      grid: dark ? '#2c3539' : '#ccd1d0',
      accent: dark ? '#7fa3d6' : '#2d4a73',
      o: dark ? '#55c191' : '#2f7d5a',
      bc: dark ? '#e5a44d' : '#b9791f',
      ka: dark ? '#e2726e' : '#a33a3a'
    };
  }

  const resultModels = ["Late fusion","Calib. late fusion","Early fusion LR","Narrative LR","Gemma","Struct. CatBoost","Qwen","DistilBERT"];
  const resultF1 = [0.539,0.522,0.522,0.502,0.545,0.452,0.390,0.380];
  const resultKARec = [0.425,0.384,0.438,0.274,0.630,0.562,0.671,0.233];
  const resultCost = [0.652,0.675,0.678,0.692,0.659,0.852,0.864,0.937];

  const leakModels = ["Late fusion","Narrative LR","Early fusion LR","Struct. CatBoost"];
  const leakDrop = [0.018,0.014,0.010,0.000];

  function renderCharts(){
    const c = themeColors();
    if(window.Chart){
      Chart.defaults.color = c.text;
      Chart.defaults.font.family = "'IBM Plex Mono', monospace";
      Chart.defaults.font.size = 10.5;
    }

    mkChart('chart-results', 'bar', {
      labels: resultModels,
      datasets: [
        {label:'Macro-F1', data: resultF1, backgroundColor: c.accent + 'cc', borderRadius:1, maxBarThickness:14},
        {label:'KA Recall', data: resultKARec, backgroundColor: c.ka + 'cc', borderRadius:1, maxBarThickness:14},
        {label:'Severity Cost (lower=better)', data: resultCost, backgroundColor: c.bc + 'cc', borderRadius:1, maxBarThickness:14}
      ]
    }, {
      indexAxis:'y',
      scales:{ x:{ min:0, max:1.0, grid:{color:c.grid}, ticks:{color:c.text} }, y:{ grid:{display:false}, ticks:{color:c.text} } },
      plugins:{ legend:{ position:'top', labels:{boxWidth:10, usePointStyle:true} } }
    });

    mkChart('chart-leakage', 'bar', {
      labels: leakModels,
      datasets: [{ label:'Macro-F1 drop after masking', data: leakDrop, backgroundColor: c.ka + 'cc', borderRadius:1, maxBarThickness:22 }]
    }, {
      indexAxis:'y',
      scales:{ x:{ min:0, max:0.03, grid:{color:c.grid}, ticks:{color:c.text} }, y:{ grid:{display:false}, ticks:{color:c.text} } },
      plugins:{ legend:{ display:false } }
    });
  }

  function mkChart(id, type, data, extraOptions){
    const canvas = document.getElementById(id);
    if(!canvas) return;
    if(chartInstances[id]){ chartInstances[id].destroy(); }
    const baseOptions = {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ labels:{ color: themeColors().text } } }
    };
    chartInstances[id] = new Chart(canvas.getContext('2d'), {
      type, data,
      options: Object.assign({}, baseOptions, extraOptions)
    });
  }

  if(window.Chart){ renderCharts(); }
  else{ window.addEventListener('load', renderCharts); }

})();
