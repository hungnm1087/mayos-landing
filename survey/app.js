import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SECTIONS, ALL_QUESTIONS, CORE_QUESTIONS } from './questions.js?v=20261127';
import { analyze, fmt, LEVEL } from './analysis.js?v=20261127';

const SUPABASE_URL = 'https://rthztiisojyonulnvgwo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ld4ewNi9GZIIlq3CBMSrag_jphrnrD0';
const DOMAIN = 'partner.mayos.app';
import { demoClient, resetDemo } from './demo.js?v=20261127';
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
function fieldHtml(q, a, ro) {
  const v = a[q.id]; const dis = ro ? 'disabled' : '';
  const lab = `<label class="q">${esc(q.label)}${q.required ? ' <span class="req">*</span>' : ''}${q.hint ? `<span class="hint">${esc(q.hint)}</span>` : ''}</label>`;
  switch (q.type) {
    case 'textarea': return lab + `<textarea data-q="${q.id}" ${dis}>${esc(v)}</textarea>`;
    case 'url': return lab + `<input type="url" inputmode="url" placeholder="https://…" data-q="${q.id}" value="${esc(v)}" ${dis}>`;
    case 'number': return lab + `<input type="number" min="0" step="any" data-q="${q.id}" value="${esc(v)}" ${dis}>`;
    case 'percent': return lab + `<div class="row"><input type="number" min="0" max="100" step="any" data-q="${q.id}" value="${esc(v)}" ${dis} style="max-width:140px"> %</div>`;
    case 'money': return lab + `<div class="row"><input type="number" min="0" step="1000" data-q="${q.id}" value="${esc(v)}" ${dis} style="max-width:240px"> VNĐ <span class="muted small" data-fmt="${q.id}">${v ? fmt(+v) : ''}</span></div>`;
    case 'select': return lab + `<select data-q="${q.id}" ${dis}><option value="">— Chọn —</option>${q.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    case 'multi': return lab + `<div class="checks">${q.options.map(o => `<label><input type="checkbox" data-multi="${q.id}" value="${esc(o)}" ${(v || []).includes(o) ? 'checked' : ''} ${dis}>${esc(o)}</label>`).join('')}</div>`;
    case 'mix': { const m = v || {}; const tot = Object.values(m).reduce((s, x) => s + (+x || 0), 0);
      return lab + `<div class="mix">${q.options.map(o => `<span>${esc(o)}</span><div class="row"><input type="number" min="0" max="100" data-mix="${q.id}" data-k="${esc(o)}" value="${esc(m[o])}" ${dis}>%</div>`).join('')}<span class="tot" data-tot="${q.id}">Tổng: ${tot}% ${tot === 100 ? '✓' : '(cần bằng 100%)'}</span></div>`; }
    case 'months': { const m = v || []; return lab + `<p class="hint">Ghi theo VNĐ. T1 = tháng 1 của 12 tháng gần nhất.</p><div class="months">${MONTHS.map((t, i) => `<div><span>${t}</span><input type="number" min="0" step="1000" data-months="${q.id}" data-i="${i}" value="${esc(m[i])}" ${dis}></div>`).join('')}</div>`; }
    default: return lab + `<input type="text" data-q="${q.id}" value="${esc(v)}" ${dis}>`;
  }
}
function bindForm(root, a, onChange) {
  root.querySelectorAll('[data-q]').forEach(el => el.addEventListener('input', () => {
    a[el.dataset.q] = el.value; const f = root.querySelector(`[data-fmt="${el.dataset.q}"]`); if (f) f.textContent = el.value ? fmt(+el.value) : ''; onChange(el.dataset.q);
  }));
  root.querySelectorAll('[data-multi]').forEach(el => el.addEventListener('change', () => {
    const id = el.dataset.multi; const q = ALL_QUESTIONS.find(x => x.id === id);
    if (q && q.max && el.checked && root.querySelectorAll(`[data-multi="${id}"]:checked`).length > q.max) { el.checked = false; alert(`Chọn tối đa ${q.max} mục.`); return; }
    a[id] = [...root.querySelectorAll(`[data-multi="${id}"]:checked`)].map(x => x.value); onChange(id);
  }));
  root.querySelectorAll('[data-mix]').forEach(el => el.addEventListener('input', () => {
    const id = el.dataset.mix; a[id] = { ...(a[id] || {}), [el.dataset.k]: el.value };
    const tot = Object.values(a[id]).reduce((s, x) => s + (+x || 0), 0);
    root.querySelector(`[data-tot="${id}"]`).textContent = `Tổng: ${tot}% ${tot === 100 ? '✓' : '(cần bằng 100%)'}`; onChange(id);
  }));
  root.querySelectorAll('[data-months]').forEach(el => el.addEventListener('input', () => {
    const id = el.dataset.months; const arr = [...(a[id] || Array(12).fill(''))]; arr[+el.dataset.i] = el.value; a[id] = arr; onChange(id);
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
  let cur = 0, timer = null, saving = false;
  const showDetail = {};

  const save = async () => {
    saving = true; status('Đang lưu…');
    const { error } = await sb.from('survey_responses').update({ answers: a }).eq('user_id', me.user_id);
    saving = false; status(error ? 'Lỗi lưu — kiểm tra kết nối' : 'Đã lưu ' + new Date().toLocaleTimeString('vi-VN'), !!error);
  };
  const status = (t, bad) => { const s = document.getElementById('st'); if (s) { s.textContent = t; s.className = 'small ' + (bad ? 'err' : 'muted'); } };

  const draw = () => {
    const s = SECTIONS[cur];
    app.innerHTML = `
      <div class="card"><h1>Khảo sát cơ sở pilot</h1>
        <p class="muted small">${ro ? `Đã gửi lúc ${new Date(resp.submitted_at).toLocaleString('vi-VN')}. Anh/chị có thể xem lại nội dung; nếu cần sửa, vui lòng liên hệ MayOS để mở lại.` : 'Bản nhanh khoảng 10 phút — số ước tính cũng được. Câu trả lời tự động lưu, anh/chị có thể quay lại hoàn thành sau. Chỉ MayOS và anh/chị xem được.'}</p>
        ${ro ? '' : '<p class="small note">4 tuần đầu MayOS chỉ ghi nhận số liệu — không thay đổi cách vận hành và không thu phí. Phần cơ sở đang làm ra, anh/chị giữ trọn; MayOS chỉ được chia trên phần làm ra thêm. Các con số trong khảo sát chỉ để chuẩn bị phương án, được đối chiếu chéo tự động.</p>'}</div>
      <div class="nav">${SECTIONS.map((x, i) => `<button data-s="${i}" class="${i === cur ? 'on' : ''} ${x.questions.filter(q => q.core && visible(q, a)).every(q => answered(q, a)) ? 'done' : ''}">${x.id}. ${esc(x.title)}</button>`).join('')}</div>
      <div class="card" id="sec"><h2>${s.id}. ${esc(s.title)}</h2>${s.intro ? `<p class="muted small">${esc(s.intro)}</p>` : ''}
        ${s.questions.filter(q => q.core && visible(q, a)).map(q => fieldHtml(q, a, ro)).join('')}
        ${(() => { const det = s.questions.filter(q => !q.core && visible(q, a)); if (!det.length) return '';
          const open = showDetail[s.id] || (ro && det.some(q => answered(q, a)));
          return `<div class="detail">${open ? det.map(q => fieldHtml(q, a, ro)).join('') : ''}
            ${ro ? '' : `<button class="link" id="tgl">${open ? 'Ẩn câu hỏi chi tiết' : `+ Thêm chi tiết (${det.length} câu, không bắt buộc)`}</button>`}</div>`; })()}
        <div class="row" style="margin-top:18px;justify-content:space-between">
          <button id="prev" ${cur === 0 ? 'disabled' : ''}>← Phần trước</button>
          ${cur < SECTIONS.length - 1 ? '<button id="next" class="primary">Phần tiếp →</button>' : ''}
        </div></div>
      <div class="bar noprint"><div class="in"><div class="progress"><i style="width:${progress(a)}%"></i></div><span class="small">${progress(a)}%</span>
        <span id="st" class="small muted"></span>
        ${ro ? '<button onclick="print()">In / Lưu PDF</button>' : '<button class="primary" id="submit">Gửi khảo sát</button>'}</div></div>`;
    app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => go(+b.dataset.s));
    document.getElementById('prev').onclick = () => go(cur - 1);
    const nx = document.getElementById('next'); if (nx) nx.onclick = () => go(cur + 1);
    const tg = document.getElementById('tgl'); if (tg) tg.onclick = () => { showDetail[SECTIONS[cur].id] = !showDetail[SECTIONS[cur].id]; draw(); };
    if (!ro) {
      bindForm(document.getElementById('sec'), a, (id) => {
        clearTimeout(timer); timer = setTimeout(save, 800); status('Chưa lưu…');
        if (ALL_QUESTIONS.some(q => q.showIf && id in q.showIf)) { save(); draw(); }
      });
      document.getElementById('submit').onclick = submit;
    }
  };
  const go = async (i) => { if (timer) { clearTimeout(timer); timer = null; await save(); } cur = i; draw(); scrollTo(0, 0); };
  const submit = async () => {
    clearTimeout(timer); await save();
    const missing = ALL_QUESTIONS.filter(q => q.required && visible(q, a) && !answered(q, a));
    const mixBad = ALL_QUESTIONS.filter(q => q.type === 'mix' && answered(q, a) && Object.values(a[q.id]).reduce((s, x) => s + (+x || 0), 0) !== 100);
    if (missing.length || mixBad.length) {
      return alert('Vui lòng hoàn thành:\n' + [...missing.map(q => '• ' + q.label), ...mixBad.map(q => '• ' + q.label + ' (tổng phải bằng 100%)')].join('\n'));
    }
    if (!confirm('Gửi khảo sát? Sau khi gửi, nội dung chỉ xem được, không sửa được.')) return;
    const { error } = await sb.from('survey_responses').update({ answers: a, status: 'submitted' }).eq('user_id', me.user_id);
    if (error) return alert('Không gửi được: ' + error.message);
    renderPartner();
  };
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
