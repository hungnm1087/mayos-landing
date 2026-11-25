// Chế độ xem thử: ?demo (điền khảo sát) và ?demo=admin (xem phân tích).
// Không gọi backend; câu trả lời chỉ lưu trên trình duyệt (localStorage).
const KEY = 'mayos-survey-demo';
const blank = () => ({ user_id: 'demo', answers: {}, status: 'draft', admin_notes: '', updated_at: new Date().toISOString(), submitted_at: null });
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || blank(); } catch { return blank(); } };
const save = (r) => { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* bộ nhớ trình duyệt bị chặn: vẫn chạy trong phiên */ } };

export function demoClient(role) {
  let resp = load();
  const prof = { user_id: 'demo', role, username: 'demo', org_name: 'Bản xem thử', contact_name: 'Dữ liệu chỉ lưu trên trình duyệt này', created_at: new Date().toISOString() };
  const from = (table) => {
    let patch = null;
    const result = () => {
      if (patch) {
        resp = { ...resp, ...patch, updated_at: new Date().toISOString() };
        if (patch.status === 'submitted') resp.submitted_at = new Date().toISOString();
        save(resp); patch = null;
      }
      if (table === 'profiles') return { data: role === 'admin' ? [{ ...prof, role: 'partner' }] : prof, error: null };
      return { data: resp, error: null };
    };
    const c = {
      select() { return c; }, eq() { return c; }, insert() { return c; },
      update(v) { patch = v; return c; },
      order() { return Promise.resolve({ data: [{ ...prof, role: 'partner' }], error: null }); },
      maybeSingle() { const r = result(); return Promise.resolve({ data: table === 'profiles' ? prof : resp, error: r.error }); },
      single() { return Promise.resolve(result()); },
      then(ok, bad) { const r = result(); const data = table === 'survey_responses' ? [resp] : r.data; return Promise.resolve({ data, error: null }).then(ok, bad); },
    };
    return c;
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'demo' }, access_token: 'demo' } } }),
      signOut: async () => {}, signInWithPassword: async () => ({ error: null }),
      updateUser: async () => ({ error: { message: 'Không áp dụng ở chế độ xem thử' } }),
    },
    from,
  };
}

export function resetDemo() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
