import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SECTIONS, ALL_QUESTIONS, CORE_QUESTIONS } from './questions.js?v=20261129';
import { analyze, fmt, LEVEL, tieredIncentive } from './analysis.js?v=20261129';

const SUPABASE_URL = 'https://rthztiisojyonulnvgwo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ld4ewNi9GZIIlq3CBMSrag_jphrnrD0';
const DOMAIN = 'partner.mayos.app';
import { demoClient, resetDemo } from './demo.js?v=20261129';
const DEMO = new URLSearchParams(location.search).has('demo');
const DEMO_ROLE = new URLSearchParams(location.search).get('demo') === 'admin' ? 'admin' : 'partner';
const sb = DEMO ? demoClient(DEMO_ROLE) : createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.getElementById('app');
const who = document.getElementById('who');
const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
const genPw = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; const r = crypto.getRandomValues(new Uint32Array(12)); return Array.from(r, x => c[x % c.length]).join(''); };

let me = null;

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return renderLogin();
  const { data: prof } = await sb.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle();
  if (!prof) { await sb.auth.signOut(); return renderLogin('Tài khoản chưa được cấp quyền.'); }
  me = prof;
  if (DEMO) {
    who.innerHTML = `<span class="badge">Xem thử</span>${DEMO_ROLE === 'admin' ? '<a href="?demo">Điền khảo sát</a>' : '<a href="?demo=admin">Xem phân tích →</a>'}<button class="link" id="rst">Xóa dữ liệu thử</button>`;
    document.getElementById('rst').onclick = () => { if (confirm('Xóa toàn bộ câu trả lời thử?')) { resetDemo(); location.reload(); } };
    return DEMO_ROLE === 'admin' ? renderAdmin() : renderPartner();
  }
  who.innerHTML = `<span>${esc(prof.org_name || prof.username)}</span><button class="link" id="pwbtn">Đổi mật khẩu</button><button class="link" id="out">Đăng xuất</button>`;
  document.getElementById('out').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  document.getElementById('pwbtn').onclick = changePassword;
  if (prof.role === 'admin') renderAdmin(); else renderPartner();
}

function renderLogin(msg = '') {
  who.innerHTML = '';
  app.innerHTML = `<form class="card login" id="lf">
    <h1>Đăng nhập</h1><p class="muted small">Dùng tài khoản MayOS đã cung cấp cho anh/chị.</p>
    <label class="q">Tên đăng nhập</label><input id="u" autocomplete="username" required>
    <label class="q">Mật khẩu</label><input id="p" type="password" autocomplete="current-password" required>
    <p class="err" id="e">${esc(msg)}</p><button class="primary" style="width:100%">Đăng nhập</button></form>`;
  document.getElementById('lf').onsubmit = async (ev) => {
    ev.preventDefault();
    const u = document.getElementById('u').value.trim().toLowerCase();
    const { error } = await sb.auth.signInWithPassword({ email: `${u}@${DOMAIN}`, password: document.getElementById('p').value });
    if (error) document.getElementById('e').textContent = 'Sai tên đăng nhập hoặc mật khẩu.'; else boot();
  };
}

async function changePassword() {
  const pw = prompt('Mật khẩu mới (tối thiểu 10 ký tự):');
  if (!pw) return;
  if (pw.length < 10) return alert('Mật khẩu tối thiểu 10 ký tự.');
  const { error } = await sb.auth.updateUser({ password: pw });
  alert(error ? 'Không đổi được: ' + error.message : 'Đã đổi mật khẩu.');
}

// ---------- Form rendering ----------
function visible(q, a) { return !q.showIf || Object.entries(q.showIf).every(([k, v]) => a[k] === v); }
function answered(q, a) {
  const v = a[q.id];
  if (q.type === 'mix') return v && Object.values(v).some(x => +x > 0);
  if (q.type === 'months') return Array.isArray(v) && v.some(x => +x > 0);
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== '';
}
function progress(a) {
  const qs = CORE_QUESTIONS.filter(q => visible(q, a));
  return Math.round(qs.filter(q => answered(q, a)).length / qs.length * 100);
}
const mixTotal = v => Object.values(v || {}).reduce((s, x) => s + (+x || 0), 0);
// Tiền: người dùng nhập theo triệu (hoặc nghìn) đồng, lưu theo VNĐ
const UNIT = { m: [1e6, 'triệu đồng'], k: [1e3, 'nghìn đồng'] };
const unitOf = q => UNIT[q.unit || 'm'];
const toDisplay = (q, v) => (v === '' || v == null) ? '' : String(+(+v / unitOf(q)[0]).toFixed(3)).replace('.', ',');
const parseMoney = (q, s) => { const t = String(s).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); if (t === '') return ''; const x = +t; return isFinite(x) && x >= 0 ? String(Math.round(x * unitOf(q)[0])) : null; };
const PILLS_MAX = 8; // select có ≤ 8 lựa chọn → hiển thị dạng nút chạm

function fieldHtml(q, a) {
  const v = a[q.id];
  const head = `<div class="qhead"><label class="q" for="f_${q.id}">${esc(q.label)}${q.required ? ' <span class="req" aria-label="bắt buộc">*</span>' : ''}</label>${q.hint ? `<span class="hint">${esc(q.hint)}</span>` : ''}</div>`;
  let body;
  switch (q.type) {
    case 'textarea': body = `<textarea id="f_${q.id}" data-q="${q.id}" rows="3">${esc(v)}</textarea>`; break;
    case 'url': body = `<input id="f_${q.id}" type="url" inputmode="url" autocapitalize="off" placeholder="Dán đường link vào đây" data-q="${q.id}" value="${esc(v)}">`; break;
    case 'number': body = `<div class="stepper"><button type="button" class="stp" data-step="${q.id}" data-d="-1" aria-label="Giảm">−</button><input id="f_${q.id}" inputmode="decimal" data-q="${q.id}" value="${esc(v)}"><button type="button" class="stp" data-step="${q.id}" data-d="1" aria-label="Tăng">+</button></div>`; break;
    case 'percent': body = `<div class="pct"><input type="range" min="0" max="100" step="1" data-range="${q.id}" value="${esc(v || 0)}" aria-label="${esc(q.label)}"><span class="pctbox"><input id="f_${q.id}" inputmode="decimal" data-q="${q.id}" value="${esc(v)}" placeholder="–">%</span></div>`; break;
    case 'money': body = `<div class="money"><input id="f_${q.id}" inputmode="decimal" data-money="${q.id}" value="${esc(toDisplay(q, v))}" placeholder="0"><span class="unit">${unitOf(q)[1]}</span></div><div class="echo" data-echo="${q.id}">${v ? '= ' + esc(fmt(+v)) : ''}</div>`; break;
    case 'select':
      body = q.options.length <= PILLS_MAX
        ? `<div class="pills" role="radiogroup">${q.options.map(o => `<button type="button" role="radio" aria-checked="${v === o}" class="pill ${v === o ? 'on' : ''}" data-pick="${q.id}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
        : `<select id="f_${q.id}" data-q="${q.id}"><option value="">— Chọn —</option>${q.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      break;
    case 'multi': body = `${q.max ? `<span class="hint">Chọn tối đa ${q.max}</span>` : '<span class="hint">Chọn một hoặc nhiều</span>'}<div class="pills">${q.options.map(o => { const on = (v || []).includes(o); return `<button type="button" role="checkbox" aria-checked="${on}" class="pill ${on ? 'on' : ''}" data-multi="${q.id}" data-v="${esc(o)}">${on ? '✓ ' : ''}${esc(o)}</button>`; }).join('')}</div>`; break;
    case 'mix': { const m = v || {}; const tot = mixTotal(m);
      body = `<span class="hint">Kéo thanh hoặc gõ số — ước lượng là được</span>
        <div class="mixbar" data-bar="${q.id}">${q.options.map((o, i) => `<i style="width:${Math.min(100, +m[o] || 0)}%" class="c${i % 8}"></i>`).join('')}</div>
        <div class="mixrows">${q.options.map((o, i) => `<div class="mixrow"><span class="dot c${i % 8}"></span><span class="mixlabel">${esc(o)}</span>
          <input type="range" min="0" max="100" step="5" data-mixr="${q.id}" data-k="${esc(o)}" value="${esc(+m[o] || 0)}" aria-label="${esc(o)}">
          <span class="pctbox"><input inputmode="decimal" data-mix="${q.id}" data-k="${esc(o)}" value="${esc(m[o])}" placeholder="0">%</span></div>`).join('')}</div>
        <div class="mixfoot"><span data-tot="${q.id}" class="${tot === 100 ? 'okc' : ''}">${totText(tot)}</span>${tot > 0 && tot !== 100 ? `<button type="button" class="link" data-norm="${q.id}">Tự cân lại thành 100%</button>` : ''}</div>`; break; }
    case 'months': { const m = v || []; body = `<span class="hint">Theo triệu đồng. T1 = tháng đầu của 12 tháng gần nhất.</span><div class="months">${MONTHS.map((t, i) => `<label><span>${t}</span><input inputmode="decimal" data-months="${q.id}" data-i="${i}" value="${esc(m[i] ? toDisplay({}, m[i]) : '')}"></label>`).join('')}</div>`; break; }
    default: body = `<input id="f_${q.id}" type="text" data-q="${q.id}" value="${esc(v)}">`;
  }
  return `<div class="field" data-field="${q.id}">${head}${body}<div class="ferr" data-err="${q.id}"></div></div>`;
}
function totText(t) { return t === 100 ? 'Tổng 100% ✓' : t > 100 ? `Tổng ${t}% — thừa ${t - 100}%` : `Tổng ${t}% — còn ${100 - t}%`; }

function bindForm(root, a, onChange) {
  const set = (id, val) => { a[id] = val; const e = root.querySelector(`[data-err="${id}"]`); if (e) e.textContent = ''; root.querySelector(`[data-field="${id}"]`)?.classList.remove('bad'); onChange(id); };
  root.querySelectorAll('[data-q]').forEach(el => el.addEventListener('input', () => {
    set(el.dataset.q, el.value);
    const r = root.querySelector(`[data-range="${el.dataset.q}"]`); if (r) r.value = +el.value || 0;
  }));
  root.querySelectorAll('[data-range]').forEach(el => el.addEventListener('input', () => {
    const t = root.querySelector(`[data-q="${el.dataset.range}"]`); t.value = el.value; set(el.dataset.range, el.value);
  }));
  root.querySelectorAll('[data-step]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.step, t = root.querySelector(`[data-q="${id}"]`);
    t.value = Math.max(0, (+t.value || 0) + +el.dataset.d); set(id, t.value);
  }));
  root.querySelectorAll('[data-money]').forEach(el => el.addEventListener('input', () => {
    const q = ALL_QUESTIONS.find(x => x.id === el.dataset.money), val = parseMoney(q, el.value), echo = root.querySelector(`[data-echo="${q.id}"]`);
    if (val === null) { echo.textContent = 'Chỉ nhập số, ví dụ 620 hoặc 1,5'; echo.className = 'echo err'; return; }
    echo.className = 'echo'; echo.textContent = val ? '= ' + fmt(+val) : ''; set(q.id, val);
  }));
  root.querySelectorAll('[data-pick]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.pick, val = a[id] === el.dataset.v ? '' : el.dataset.v;
    root.querySelectorAll(`[data-pick="${id}"]`).forEach(b => { const on = b.dataset.v === val; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    set(id, val);
  }));
  root.querySelectorAll('[data-multi]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.multi, q = ALL_QUESTIONS.find(x => x.id === id), cur = a[id] || [], on = cur.includes(el.dataset.v);
    if (!on && q.max && cur.length >= q.max) { const e = root.querySelector(`[data-err="${id}"]`); e.textContent = `Chỉ chọn tối đa ${q.max} mục — bỏ bớt một mục trước.`; return; }
    const next = on ? cur.filter(x => x !== el.dataset.v) : [...cur, el.dataset.v];
    el.classList.toggle('on', !on); el.setAttribute('aria-checked', !on); el.textContent = (!on ? '✓ ' : '') + el.dataset.v;
    set(id, next);
  }));
  const mixUpdate = (id) => {
    const m = a[id] || {}, q = ALL_QUESTIONS.find(x => x.id === id), tot = mixTotal(m);
    const bar = root.querySelector(`[data-bar="${id}"]`);
    if (bar) [...bar.children].forEach((i, k) => { i.style.width = Math.min(100, +m[q.options[k]] || 0) + '%'; });
    const t = root.querySelector(`[data-tot="${id}"]`); t.textContent = totText(tot); t.className = tot === 100 ? 'okc' : '';
    let n = root.querySelector(`[data-norm="${id}"]`);
    if (tot > 0 && tot !== 100 && !n) { t.insertAdjacentHTML('afterend', `<button type="button" class="link" data-norm="${id}">Tự cân lại thành 100%</button>`); n = root.querySelector(`[data-norm="${id}"]`); n.onclick = () => normalize(id); }
    if ((tot === 100 || tot === 0) && n) n.remove();
  };
  const normalize = (id) => {
    const q = ALL_QUESTIONS.find(x => x.id === id), m = { ...(a[id] || {}) }, tot = mixTotal(m); if (!tot) return;
    let acc = 0; const keys = q.options.filter(o => +m[o] > 0);
    keys.forEach((k, i) => { const v = i === keys.length - 1 ? 100 - acc : Math.round(+m[k] / tot * 100); m[k] = String(v); acc += v; });
    a[id] = m; keys.forEach(k => { root.querySelector(`[data-mix="${id}"][data-k="${CSS.escape(k)}"]`).value = m[k]; root.querySelector(`[data-mixr="${id}"][data-k="${CSS.escape(k)}"]`).value = m[k]; });
    mixUpdate(id); onChange(id);
  };
  root.querySelectorAll('[data-norm]').forEach(b => b.onclick = () => normalize(b.dataset.norm));
  root.querySelectorAll('[data-mix]').forEach(el => el.addEventListener('input', () => {
    const id = el.dataset.mix; a[id] = { ...(a[id] || {}), [el.dataset.k]: el.value };
    root.querySelector(`[data-mixr="${id}"][data-k="${CSS.escape(el.dataset.k)}"]`).value = +el.value || 0; mixUpdate(id); set(id, a[id]);
  }));
  root.querySelectorAll('[data-mixr]').forEach(el => el.addEventListener('input', () => {
    const id = el.dataset.mixr; a[id] = { ...(a[id] || {}), [el.dataset.k]: el.value };
    root.querySelector(`[data-mix="${id}"][data-k="${CSS.escape(el.dataset.k)}"]`).value = el.value; mixUpdate(id); set(id, a[id]);
  }));
  root.querySelectorAll('[data-months]').forEach(el => el.addEventListener('input', () => {
    const id = el.dataset.months, arr = [...(a[id] || Array(12).fill(''))], val = parseMoney({}, el.value);
    if (val === null) return; arr[+el.dataset.i] = val; set(id, arr);
  }));
}

// ---------- Partner ----------
async function renderPartner() {
  let { data: resp } = await sb.from('survey_responses').select('*').eq('user_id', me.user_id).maybeSingle();
  if (!resp) {
    const ins = await sb.from('survey_responses').insert({ user_id: me.user_id }).select().single();
    resp = ins.data || { answers: {}, status: 'draft' };
  }
  const a = resp.answers || {};
  const ro = resp.status === 'submitted';
  const REVIEW = SECTIONS.length; // bước cuối: xem lại & gửi
  let cur = progress(a) > 0 ? firstIncomplete() : -1; // -1 = màn hình chào
  let timer = null, saving = false, warned = -2;
  const showDetail = {};
  function firstIncomplete() { const i = SECTIONS.findIndex(s => s.questions.some(q => q.core && visible(q, a) && !answered(q, a))); return i < 0 ? REVIEW : i; }
  const missingIn = (s) => s.questions.filter(q => q.required && visible(q, a) && !answered(q, a));
  const mixBadIn = (s) => s.questions.filter(q => q.type === 'mix' && visible(q, a) && answered(q, a) && mixTotal(a[q.id]) !== 100);

  const save = async () => {
    saving = true; status('Đang lưu…');
    const { error } = await sb.from('survey_responses').update({ answers: a }).eq('user_id', me.user_id);
    saving = false; status(error ? '⚠ Chưa lưu được — kiểm tra kết nối mạng' : '✓ Đã lưu', !!error);
  };
  const status = (t, bad) => { const s = document.getElementById('st'); if (s) { s.textContent = t; s.className = 'saved ' + (bad ? 'err' : ''); } };
  const queueSave = () => { clearTimeout(timer); timer = setTimeout(() => { timer = null; save(); }, 700); status('Đang lưu…'); };

  if (ro) return renderReadOnly();

  const stepHeader = () => {
    const pct = progress(a);
    return `<div class="stephead"><div class="row between"><span class="stepno">${cur === REVIEW ? 'Bước cuối' : `Bước ${cur + 1}/${SECTIONS.length}`}</span>
      <details class="toc"><summary>Mục lục</summary><ol>${SECTIONS.map((x, i) => { const done = x.questions.filter(q => q.core && visible(q, a)).every(q => answered(q, a));
        return `<li><button type="button" data-s="${i}" class="${i === cur ? 'on' : ''}">${done ? '✓' : '○'} ${esc(x.title)}</button></li>`; }).join('')}
        <li><button type="button" data-s="${REVIEW}">➜ Xem lại & gửi</button></li></ol></details></div>
      <div class="progress" aria-label="Đã hoàn thành ${pct}%"><i style="width:${pct}%"></i></div></div>`;
  };

  const draw = () => {
    if (cur === -1) return drawWelcome();
    if (cur === REVIEW) return drawReview();
    const s = SECTIONS[cur];
    const core = s.questions.filter(q => q.core && visible(q, a)), det = s.questions.filter(q => !q.core && visible(q, a));
    const open = showDetail[s.id];
    app.innerHTML = `${stepHeader()}
      <section class="card step" id="sec"><h1 class="steptitle">${esc(s.title)}</h1>${s.intro ? `<p class="muted small">${esc(s.intro)}</p>` : ''}
        ${core.map(q => fieldHtml(q, a)).join('')}
        ${det.length ? `<div class="detail">${open ? det.map(q => fieldHtml(q, a)).join('') : ''}
          <button type="button" class="more" id="tgl">${open ? 'Ẩn câu hỏi chi tiết' : `+ Thêm chi tiết <span class="muted">(${det.length} câu, không bắt buộc)</span>`}</button></div>` : ''}
        <p class="ferr" id="steperr"></p>
      </section>
      <nav class="bar noprint"><div class="in"><button type="button" id="prev" class="ghost">←</button>
        <span id="st" class="saved"></span><button type="button" class="primary grow" id="next">${cur === SECTIONS.length - 1 ? 'Xem lại & gửi →' : 'Tiếp tục →'}</button></div></nav>`;
    bindNav();
    document.getElementById('prev').onclick = () => go(cur - 1);
    document.getElementById('next').onclick = next;
    const tg = document.getElementById('tgl'); if (tg) tg.onclick = () => { showDetail[s.id] = !open; draw(); };
    bindForm(document.getElementById('sec'), a, (id) => {
      queueSave();
      const se = document.getElementById('steperr'); if (se && se.textContent && !missingIn(s).length && !mixBadIn(s).length) se.textContent = '';
      if (ALL_QUESTIONS.some(q => q.showIf && id in q.showIf)) { clearTimeout(timer); timer = null; save(); draw(); }
    });
  };

  const next = () => {
    const s = SECTIONS[cur], miss = missingIn(s), bad = mixBadIn(s);
    if ((miss.length || bad.length) && warned !== cur) {
      warned = cur;
      miss.forEach(q => { document.querySelector(`[data-field="${q.id}"]`)?.classList.add('bad'); const e = document.querySelector(`[data-err="${q.id}"]`); if (e) e.textContent = 'Câu này cần trả lời — ước tính là được.'; });
      bad.forEach(q => { document.querySelector(`[data-field="${q.id}"]`)?.classList.add('bad'); const e = document.querySelector(`[data-err="${q.id}"]`); if (e) e.textContent = 'Tổng các tỷ lệ cần bằng 100% — bấm "Tự cân lại thành 100%".'; });
      document.getElementById('steperr').textContent = `Còn ${miss.length + bad.length} câu chưa xong. Bấm "Tiếp tục" lần nữa nếu muốn điền sau.`;
      document.querySelector('.field.bad')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    go(cur + 1);
  };

  const drawWelcome = () => {
    app.innerHTML = `<section class="card welcome">
      <h1>Khảo sát cơ sở pilot</h1>
      <p>Giúp MayOS hiểu cơ sở của anh/chị để đề xuất cách hợp tác phù hợp.</p>
      <ul class="facts"><li><b>~10 phút</b> · ${SECTIONS.length} bước ngắn</li><li><b>Ước tính là được</b> — không cần chứng từ</li><li><b>Tự động lưu</b> — có thể dừng và quay lại sau</li><li><b>Bảo mật</b> — chỉ anh/chị và MayOS xem được</li></ul>
      <p class="note small">4 tuần đầu hợp tác, MayOS chỉ ghi nhận số liệu — không thay đổi cách vận hành và không thu phí. Phần cơ sở đang làm ra, anh/chị giữ trọn; MayOS chỉ được chia trên phần làm ra thêm.</p>
      <button type="button" class="primary big" id="start">Bắt đầu →</button></section>`;
    document.getElementById('start').onclick = () => go(0);
  };

  const drawReview = () => {
    const rows = SECTIONS.map((s, i) => { const core = s.questions.filter(q => q.core && visible(q, a)); const done = core.filter(q => answered(q, a)).length; const miss = [...missingIn(s), ...mixBadIn(s)];
      return `<li class="${miss.length ? 'todo' : 'ok'}"><div><b>${esc(s.title)}</b><span class="small muted"> · ${done}/${core.length} câu</span>
        ${miss.length ? `<div class="small err">Cần bổ sung: ${miss.map(q => esc(q.label)).join('; ')}</div>` : ''}</div><button type="button" class="link" data-s="${i}">${miss.length ? 'Điền ngay' : 'Sửa'}</button></li>`; }).join('');
    const blocking = SECTIONS.some(s => missingIn(s).length || mixBadIn(s).length);
    app.innerHTML = `${stepHeader()}<section class="card step"><h1 class="steptitle">Xem lại & gửi</h1>
      <p class="muted small">Kiểm tra nhanh trước khi gửi. Sau khi gửi, nội dung chỉ xem được; cần sửa thì liên hệ MayOS để mở lại.</p>
      <ul class="review">${rows}</ul><p class="ferr" id="steperr"></p></section>
      <nav class="bar noprint"><div class="in"><button type="button" id="prev" class="ghost">←</button><span id="st" class="saved"></span>
        <button type="button" class="primary grow" id="submit" ${blocking ? 'aria-disabled="true"' : ''}>Gửi khảo sát</button></div></nav>`;
    bindNav();
    document.getElementById('prev').onclick = () => go(SECTIONS.length - 1);
    document.getElementById('submit').onclick = submit;
  };

  const bindNav = () => app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => go(+b.dataset.s));
  const go = async (i) => { if (timer) { clearTimeout(timer); timer = null; await save(); } cur = Math.max(-1, Math.min(REVIEW, i)); draw(); scrollTo(0, 0); };
  const submit = async () => {
    if (SECTIONS.some(s => missingIn(s).length || mixBadIn(s).length)) { document.getElementById('steperr').textContent = 'Còn câu bắt buộc chưa xong — bấm "Điền ngay" ở mục tương ứng.'; return; }
    if (!confirm('Gửi khảo sát cho MayOS?')) return;
    clearTimeout(timer); timer = null;
    const { error } = await sb.from('survey_responses').update({ answers: a, status: 'submitted' }).eq('user_id', me.user_id);
    if (error) { document.getElementById('steperr').textContent = 'Không gửi được: ' + error.message; return; }
    resp = { ...resp, status: 'submitted', submitted_at: new Date().toISOString() };
    renderReadOnly(true);
  };
  function renderReadOnly(justSent) {
    app.innerHTML = `<section class="card welcome">${justSent ? '<div class="sent">✓</div>' : ''}<h1>${justSent ? 'Đã gửi — cảm ơn anh/chị!' : 'Khảo sát đã gửi'}</h1>
      <p class="muted">${resp.submitted_at ? 'Gửi lúc ' + new Date(resp.submitted_at).toLocaleString('vi-VN') + '. ' : ''}MayOS sẽ liên hệ để hẹn buổi trao đổi. Cần sửa nội dung, anh/chị liên hệ MayOS để mở lại.</p>
      <button type="button" class="noprint" onclick="print()">In / Lưu PDF</button></section>
      <section class="card">${SECTIONS.map(s => { const qs = s.questions.filter(q => visible(q, a) && answered(q, a)); if (!qs.length) return '';
        return `<h2>${esc(s.title)}</h2><div class="tbl"><table><tbody>${qs.map(q => `<tr><td style="width:45%">${esc(q.label)}</td><td>${answerText(q, a[q.id])}</td></tr>`).join('')}</tbody></table></div>`; }).join('')}</section>`;
  }
  addEventListener('beforeunload', e => { if (timer || saving) { e.preventDefault(); } });
  draw();
}

// ---------- Admin ----------
async function callAdmin(body) {
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/admin-users`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Lỗi');
  return j;
}

async function renderAdmin() {
  if (DEMO) { // xem thử: vào thẳng báo cáo phân tích của bản thử
    const [{ data: profs }, { data: resps }] = await Promise.all([sb.from('profiles').select('*').order(), sb.from('survey_responses').select('*')]);
    return renderReport(profs[0], resps[0]);
  }
  const [{ data: profs }, { data: resps }] = await Promise.all([
    sb.from('profiles').select('*').eq('role', 'partner').order('created_at', { ascending: false }),
    sb.from('survey_responses').select('*'),
  ]);
  const byId = Object.fromEntries((resps || []).map(r => [r.user_id, r]));
  app.innerHTML = `
    <div class="card"><h1>Quản trị khảo sát</h1><p class="muted small">Tạo tài khoản cho từng đối tác, gửi họ link <b>${esc(location.origin + location.pathname)}</b> cùng tên đăng nhập và mật khẩu.</p></div>
    <form class="card" id="cf"><h2>Tạo tài khoản đối tác</h2>
      <div class="row"><div class="grow"><label class="q">Tên cơ sở / đối tác</label><input id="org" required></div><div class="grow"><label class="q">Người liên hệ</label><input id="ct"></div></div>
      <div class="row"><div class="grow"><label class="q">Tên đăng nhập</label><input id="un" pattern="[a-z0-9._\\-]{3,40}" placeholder="vd: hotel-abc" required></div>
        <div class="grow"><label class="q">Mật khẩu</label><input id="pw" required minlength="10"></div></div>
      <p id="cm" class="small"></p><button class="primary">Tạo tài khoản</button></form>
    <div class="card"><h2>Đối tác (${(profs || []).length})</h2><div class="tbl"><table><thead><tr><th>Cơ sở</th><th>Đăng nhập</th><th>Trạng thái</th><th>Tiến độ</th><th>Cập nhật</th><th></th></tr></thead><tbody>
      ${(profs || []).map(p => { const r = byId[p.user_id]; const a = r?.answers || {};
        return `<tr><td><b>${esc(p.org_name)}</b><br><span class="muted small">${esc(p.contact_name)}</span></td><td>${esc(p.username)}</td>
        <td>${r?.status === 'submitted' ? '<span class="badge b-sub">Đã gửi</span>' : r ? '<span class="badge">Đang điền</span>' : '<span class="badge">Chưa mở</span>'}</td>
        <td>${r ? progress(a) + '%' : '—'}</td><td class="small">${r ? new Date(r.updated_at).toLocaleString('vi-VN') : ''}</td>
        <td class="row"><button data-view="${p.user_id}" ${r ? '' : 'disabled'}>Xem & phân tích</button><button class="link" data-reset="${p.user_id}">Đặt lại MK</button><button class="link" data-del="${p.user_id}">Xóa</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted">Chưa có đối tác.</td></tr>'}
    </tbody></table></div></div>`;
  document.getElementById('pw').value = genPw();
  document.getElementById('cf').onsubmit = async (ev) => {
    ev.preventDefault(); const m = document.getElementById('cm');
    const body = { action: 'create', username: document.getElementById('un').value.trim().toLowerCase(), password: document.getElementById('pw').value, org_name: document.getElementById('org').value, contact_name: document.getElementById('ct').value };
    try { await callAdmin(body); m.className = 'small okc';
      m.textContent = `Đã tạo. Gửi đối tác: Link ${location.origin + location.pathname} · Tên đăng nhập: ${body.username} · Mật khẩu: ${body.password}`;
      setTimeout(renderAdmin, 6000);
    } catch (e) { m.className = 'small err'; m.textContent = e.message; }
  };
  app.querySelectorAll('[data-view]').forEach(b => b.onclick = () => renderReport(profs.find(p => p.user_id === b.dataset.view), byId[b.dataset.view]));
  app.querySelectorAll('[data-reset]').forEach(b => b.onclick = async () => {
    const pw = genPw(); if (!confirm(`Đặt mật khẩu mới: ${pw} ?`)) return;
    try { await callAdmin({ action: 'reset_password', user_id: b.dataset.reset, password: pw }); prompt('Đã đặt lại. Sao chép mật khẩu mới:', pw); } catch (e) { alert(e.message); }
  });
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Xóa tài khoản và toàn bộ câu trả lời của đối tác này? Không thể hoàn tác.')) return;
    try { await callAdmin({ action: 'delete', user_id: b.dataset.del }); renderAdmin(); } catch (e) { alert(e.message); }
  });
}

function answerText(q, v) {
  if (v == null || v === '' || (Array.isArray(v) && !v.some(x => x !== '' && x != null))) return '<span class="muted">—</span>';
  if (q.type === 'money') return esc(fmt(+v));
  if (q.type === 'url') return /^https?:\/\//i.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>` : esc(v);
  if (q.type === 'percent') return esc(v) + '%';
  if (q.type === 'multi') return v.map(esc).join(', ');
  if (q.type === 'mix') return Object.entries(v).filter(([, x]) => +x > 0).map(([k, x]) => `${esc(k)}: ${esc(x)}%`).join(' · ');
  if (q.type === 'months') return v.map((x, i) => `${MONTHS[i]}: ${x ? esc(fmt(+x)) : '—'}`).join(' · ');
  return esc(v).replace(/\n/g, '<br>');
}

function renderReport(p, r) {
  const a = r.answers || {};
  const R = analyze({ ...a, x_measured_profit_month: (r.admin_data || {}).measured_profit_month });
  const b = R.baseline, u = R.uplift, eq = R.equity;
  app.innerHTML = `
    <div class="row noprint" style="margin-bottom:12px"><button id="back">← Danh sách</button><button onclick="print()">In / Lưu PDF</button>
      ${r.status === 'submitted' ? '<button id="reopen">Mở lại cho đối tác sửa</button>' : ''}</div>
    <div class="card"><h1>${esc(p.org_name)}</h1><p class="muted small">${esc(p.contact_name)} · ${r.status === 'submitted' ? 'Đã gửi ' + new Date(r.submitted_at).toLocaleString('vi-VN') : 'Đang điền (' + progress(a) + '%) — phân tích dựa trên dữ liệu hiện có'}</p>
      <div class="kpis">
        <div class="kpi"><span class="muted small">Mức sẵn sàng pilot</span><b>${R.readiness.score}/100</b></div>
        <div class="kpi"><span class="muted small">Độ tin cậy số liệu</span><b class="${R.credibility.score >= 80 ? 'okc' : R.credibility.score >= 55 ? '' : 'err'}">${R.credibility.score}/100 · ${R.credibility.level}</b></div>
        <div class="kpi"><span class="muted small">Doanh thu năm</span><b>${fmt(b.revenue)}</b></div>
        <div class="kpi"><span class="muted small">Lợi nhuận HĐ năm (tạm tính)</span><b>${fmt(b.profit)}</b></div>
        <div class="kpi"><span class="muted small">Biên lợi nhuận</span><b>${(b.margin * 100).toFixed(1)}%</b></div>
        <div class="kpi"><span class="muted small">Hoa hồng OTA / năm</span><b>${fmt(b.otaCost)}</b></div>
        <div class="kpi"><span class="muted small">RevPAR</span><b>${fmt(b.revpar)}</b></div>
      </div>
      ${R.readiness.flags.length ? `<h3>Lưu ý</h3><ul>${R.readiness.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}</div>

    <div class="card"><h2>Độ tin cậy số liệu (đối chiếu chéo tự động)</h2>
      <p class="small muted">Doanh thu dùng để tính: ${esc(b.revSource)}. Ngưỡng lợi nhuận ưu tiên sẽ dùng số đo trong 4 tuần ghi nhận trên MayOS, không dùng số tự khai.</p>
      <div class="tbl"><table><tbody>${R.credibility.checks.map(c => `<tr><td>${c.ok ? '<span class="okc">✓</span>' : c.partial ? '<span style="color:var(--warn)">~</span>' : '<span class="err">⚠</span>'}</td><td>${esc(c.name)}</td><td class="small muted">${esc(c.detail)}</td></tr>`).join('')}</tbody></table></div>
      ${['l_booking', 'l_agoda', 'l_gmaps'].some(k => a[k]) ? `<p class="small">Đối chiếu thủ công: ${['l_booking', 'l_agoda', 'l_gmaps'].filter(k => /^https?:\/\//i.test(a[k] || '')).map(k => `<a href="${esc(a[k])}" target="_blank" rel="noopener noreferrer">${k === 'l_booking' ? 'Booking' : k === 'l_agoda' ? 'Agoda' : 'Google Maps'}</a>`).join(' · ')} — xem giá bán, điểm và số đánh giá 12 tháng qua.</p>` : ''}
      ${R.credibility.score < 55 ? '<p class="small err">Độ tin cậy thấp: chỉ nên đề xuất phương án A (theo doanh thu thực tế qua hệ thống) cho tới khi chốt số liệu nền.</p>' : ''}</div>

    <div class="card"><h2>1. Phiếu phạm vi custom (tự động)</h2>
      <p class="small muted">Pilot: ${R.summary.pilot.length} hạng mục, ước tính ${R.summary.pilotWeeks} tuần. Giai đoạn sau: ${R.summary.later.length} hạng mục xây mới, khoảng ${R.summary.laterWeeks} tuần phát triển.</p>
      <div class="tbl"><table><thead><tr><th>Hạng mục</th><th>Mức độ</th><th>Tuần</th><th>Căn cứ</th></tr></thead><tbody>
      ${R.items.map(i => `<tr><td>${esc(i.module)}</td><td><span class="badge b-${i.level}">${LEVEL[i.level]}</span></td><td>${i.weeks || '—'}</td><td class="small">${esc(i.reason)}</td></tr>`).join('')}
      </tbody></table></div></div>

    <div class="card"><h2>2. Giá trị MayOS có thể tạo thêm / năm</h2>
      <div class="tbl"><table><tbody>${u.items.map(i => `<tr><td>${esc(i.k)}</td><td><b>${fmt(i.v)}</b></td><td class="small muted">${esc(i.note)}</td></tr>`).join('')}
      <tr><th>Tổng (kịch bản cơ sở)</th><th>${fmt(u.base)}</th><th class="small">Thận trọng ${fmt(u.low)} · Lạc quan ${fmt(u.high)}</th></tr></tbody></table></div></div>

    <div class="card"><h2>3. Phương án chia sẻ giá trị / cổ phần</h2>
      <p class="small">Ngưỡng lợi nhuận ưu tiên của chủ đầu tư: <b>${fmt(eq.hurdle / 12)}/tháng</b> ${eq.hurdleMeasured ? '<span class="badge b-sub">Đã đo 4 tuần</span>' : '<span class="badge">Tạm tính từ khảo sát — sẽ thay bằng số đo 4 tuần</span>'}</p>
      <div class="row noprint"><label class="small grow">Lợi nhuận hoạt động đo được trong 4 tuần ghi nhận, quy ra 1 tháng (VNĐ)<input type="number" id="mp" min="0" step="1000" value="${esc((r.admin_data || {}).measured_profit_month)}"></label><button id="smp">Cập nhật ngưỡng</button></div>
      ${eq.hurdle > 0 ? (() => { const H = eq.hurdle / 12;
        const rows = [1.1, 1.3, 1.8].map(k => { const P = H * k, ex = P - H, fee = tieredIncentive(ex, H); return { P, ex, fee, keep: P - fee }; });
        return `<details class="small"><summary>Cách tính phí thưởng theo bậc (ví dụ theo tháng)</summary>
          <p>Chủ đầu tư giữ trọn ${fmt(H)}/tháng đầu tiên. Phần lợi nhuận vượt: đến 20% ngưỡng chia 15% · 20–50% chia 25% · trên 50% chia 35%. Phí cơ bản 1,5% doanh thu tính riêng.</p>
          <div class="tbl"><table><thead><tr><th>Lợi nhuận tháng</th><th>Phần vượt ngưỡng</th><th>Phí thưởng MayOS</th><th>Chủ đầu tư giữ</th></tr></thead><tbody>
          ${rows.map(x => `<tr><td>${fmt(x.P)}</td><td>${fmt(x.ex)}</td><td>${fmt(x.fee)}</td><td><b>${fmt(x.keep)}</b></td></tr>`).join('')}</tbody></table></div></details>`; })() : ''}
      <div class="opts">${eq.options.map(o => `<div class="opt ${o.name[0] === eq.recommend ? 'rec' : ''}">
        ${o.name[0] === eq.recommend ? '<span class="badge b-sub">Khuyến nghị</span>' : ''}<h3>${esc(o.name)}</h3><p class="small">${esc(o.desc)}</p>
        <p>MayOS hưởng: <b>${fmt(o.mayos)}/năm</b><br>Chủ đầu tư giữ thêm: <b>${fmt(o.ownerGain)}/năm</b><br>
        <span class="small muted">MayOS nhận ${(o.mayosShareOfUplift * 100).toFixed(0)}% giá trị tạo thêm</span></p>
        <p class="small ${o.winwin ? 'okc' : 'err'}">${o.winwin ? '✓ Cân bằng: chủ đầu tư giữ phần lớn giá trị tăng thêm' : '⚠ Chưa cân bằng: điều chỉnh tỷ lệ'}</p></div>`).join('')}</div>
      ${(a.i_priorities || []).length ? `<h3>Đối tác quan tâm</h3><p class="small">${a.i_priorities.map(esc).join(' · ')}</p>` : ''}
      ${(a.i_concerns || []).length ? `<h3>Đối tác lo ngại</h3><p class="small">${a.i_concerns.map(esc).join(' · ')}</p>` : ''}
      ${R.talking.length ? `<h3>Gợi ý trình bày trong buổi gặp</h3><ul class="small">${R.talking.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <p class="small muted">Phương án khuyến nghị được suy ra từ điều đối tác quan tâm — đối tác không được hỏi trực tiếp về hình thức chia sẻ. Các hệ số là giả định khởi điểm để đàm phán, cần rà soát với kế toán và luật sư.</p></div>

    <div class="card noprint"><h2>Ghi chú nội bộ</h2><textarea id="notes">${esc(r.admin_notes)}</textarea><div class="row" style="margin-top:8px"><button id="sn">Lưu ghi chú</button><span id="nm" class="small muted"></span></div></div>

    <div class="card"><h2>Câu trả lời đầy đủ</h2>${SECTIONS.map(s => `<h3>${s.id}. ${esc(s.title)}</h3><div class="tbl"><table><tbody>
      ${s.questions.filter(q => visible(q, a)).map(q => `<tr><td style="width:40%">${esc(q.label)}</td><td>${answerText(q, a[q.id])}</td></tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
  document.getElementById('smp').onclick = async () => {
    const v = document.getElementById('mp').value;
    const admin_data = { ...(r.admin_data || {}), measured_profit_month: v };
    const { error } = await sb.from('survey_responses').update({ admin_data }).eq('user_id', p.user_id);
    if (error) return alert(error.message);
    renderReport(p, { ...r, admin_data });
  };
  document.getElementById('back').onclick = DEMO ? () => { location.search = '?demo'; } : renderAdmin;
  document.getElementById('sn').onclick = async () => {
    const { error } = await sb.from('survey_responses').update({ admin_notes: document.getElementById('notes').value }).eq('user_id', p.user_id);
    document.getElementById('nm').textContent = error ? error.message : 'Đã lưu';
  };
  const ro = document.getElementById('reopen');
  if (ro) ro.onclick = async () => {
    if (!confirm('Mở lại để đối tác chỉnh sửa?')) return;
    await sb.from('survey_responses').update({ status: 'draft' }).eq('user_id', p.user_id); renderAdmin();
  };
  scrollTo(0, 0);
}

boot();
