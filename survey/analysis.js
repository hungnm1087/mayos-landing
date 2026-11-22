// Tự động: (1) phiếu phạm vi custom, (2) số liệu nền, (3) phương án chia sẻ giá trị / cổ phần.
// Mọi hệ số là giả định khởi điểm để đàm phán — hiển thị rõ trên báo cáo.

const n = v => (v === '' || v == null || isNaN(+v)) ? 0 : +v;
const has = (arr, x) => Array.isArray(arr) && arr.includes(x);
const pct = (mix, key) => n(mix && mix[key]) / 100;

export const LEVEL = { ready: 'Có sẵn', adjust: 'Điều chỉnh', build: 'Xây mới' };

export function scope(a) {
  const out = [];
  const add = (module, level, weeks, reason) => out.push({ module, level, weeks, reason });
  const stay = a.b_mix || {};
  const midShare = pct(stay, 'Theo tuần') + pct(stay, 'Theo tháng (trung hạn)') + pct(stay, 'Dài hạn > 6 tháng');
  const hourly = pct(stay, 'Theo giờ');
  const ch = a.d_channels || {};
  const otaMain = pct(ch, 'Booking.com') + pct(ch, 'Agoda');
  const otaOther = pct(ch, 'Airbnb') + pct(ch, 'Traveloka') + pct(ch, 'Expedia/Trip.com');

  add('Timeline đặt phòng, hồ sơ khách, CRM', 'ready', 0, 'Lõi vận hành');
  add('Thiết lập thương hiệu, dữ liệu phòng & giá', 'adjust', 1, `${n(a.c_rooms) || '?'} phòng`);
  if (midShare >= 0.2) add('Module lưu trú trung hạn: hợp đồng, cọc, hóa đơn tháng, điện nước, gia hạn', 'build', 5, `Trung/dài hạn chiếm ${Math.round(midShare * 100)}% doanh thu`);
  else if (midShare > 0) add('Lưu trú trung hạn (xử lý tạm bằng booking dài ngày + ghi chú)', 'adjust', 0.5, `Trung hạn chỉ ${Math.round(midShare * 100)}%`);
  if (hourly > 0) add('Giá & đặt phòng theo giờ', 'build', 2, `Theo giờ ${Math.round(hourly * 100)}%`);
  if (a.b_registration && a.b_registration !== 'Qua phần mềm/app') add('Lưu giấy tờ khách / khai báo lưu trú', 'adjust', 0.5, `Hiện tại: ${a.b_registration}`);
  if (otaMain > 0) add('Channel Manager Booking.com/Agoda', 'ready', 0, `OTA chính ${Math.round(otaMain * 100)}% booking`);
  if (otaOther >= 0.1) add('Kết nối thêm kênh Airbnb/Traveloka/Expedia', 'build', 3, `Kênh phụ ${Math.round(otaOther * 100)}% booking`);
  if (a.d_website !== 'Có, có thanh toán online') add('Website đặt phòng trực tiếp + thanh toán PayOS', 'adjust', 1, `Hiện tại: ${a.d_website || 'chưa rõ'}`);
  if (has(a.d_chat, 'Zalo OA') || has(a.d_chat, 'Messenger') || n(a.d_msgs) > 0) add('Lammy – trợ lý AI chat Zalo/Messenger', 'ready', 1, `${n(a.d_msgs) || '?'} tin/ngày, trực ${a.d_chat_hours || '?'}; cần nạp kiến thức`);
  if (has(a.d_chat, 'Zalo cá nhân') && !has(a.d_chat, 'Zalo OA')) add('Tạo & xác thực Zalo OA', 'adjust', 1, 'Đang dùng Zalo cá nhân');
  if (has(a.d_chat, 'WhatsApp') || has(a.d_chat, 'Instagram')) add('Kênh chat WhatsApp/Instagram cho Lammy', 'build', 2, 'Kênh chưa hỗ trợ');
  add('Buồng phòng & QC', 'ready', 0, `Hiện tại: ${a.e_qc || 'chưa rõ'}`);
  if ((a.e_services || []).length) add('POS, menu, yêu cầu dịch vụ', 'ready', 0.5, a.e_services.join(', '));
  if (a.e_lock === 'Khóa mã/điện tử' || a.e_lock === 'Thẻ từ') add(`Tích hợp khóa ${a.e_lock_brand || ''}`.trim(), 'build', 3, 'Tùy API của hãng — có thể để giai đoạn sau');
  add('Chấm công QR, ca trực, phiếu lương', 'ready', 0.5, `${n(a.f_staff) || '?'} nhân sự`);
  add('Sổ chi, P&L, báo cáo KPI', a.g_books === 'Phần mềm kế toán' ? 'adjust' : 'ready', 0.5, 'Chuẩn hóa danh mục chi phí');
  if (a.i_scope === 'Vận hành toàn phần' || a.i_scope === 'Công nghệ + bán hàng (giá, OTA, marketing)') add('Quy trình revenue management & báo cáo cho chủ đầu tư', 'adjust', 1, a.i_scope);
  return out;
}

export function scopeSummary(items) {
  const pilot = items.filter(i => i.level !== 'build');
  const later = items.filter(i => i.level === 'build');
  const pilotWeeks = Math.max(3, Math.ceil(pilot.reduce((s, i) => s + i.weeks, 0) * 0.6));
  const laterWeeks = later.reduce((s, i) => s + i.weeks, 0);
  return { pilot, later, pilotWeeks, laterWeeks };
}

export function readiness(a) {
  const flags = [];
  const midShare = pct(a.b_mix, 'Theo tuần') + pct(a.b_mix, 'Theo tháng (trung hạn)') + pct(a.b_mix, 'Dài hạn > 6 tháng');
  if (midShare >= 0.5) flags.push('Trung/dài hạn chiếm đa số — pilot 3 tuần chưa đủ, cần module trung hạn trước.');
  if (!(a.g_rev_room || []).some(v => n(v) > 0)) flags.push('Thiếu doanh thu theo tháng — chưa có số liệu nền để đo hiệu quả.');
  if (a.g_bank === 'Không') flags.push('Tài khoản cơ sở chưa tách khỏi cá nhân — khó kiểm chứng doanh thu/lợi nhuận.');
  if (a.g_books === 'Sổ tay' || a.g_books === 'Không ghi chép đầy đủ') flags.push('Sổ sách chưa đầy đủ — nên ưu tiên phương án theo doanh thu.');
  if (a.i_transparency === 'Không') flags.push('Không chia sẻ số liệu — không thể áp dụng chia theo lợi nhuận.');
  if (n(a.h_tech) && n(a.h_tech) <= 2) flags.push('Đội ngũ ít quen công nghệ — tăng thời lượng đào tạo.');
  if (!a.j_extranet) flags.push('Chưa rõ ai giữ quyền extranet OTA.');
  const score = Math.max(0, 100 - flags.length * 15);
  return { score, flags };
}

export function baseline(a) {
  const months = (a.g_rev_room || []).map(n);
  const filled = months.filter(v => v > 0);
  const roomRev = filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length * 12 : 0;
  const others = (a.g_rev_other || []).map(n).filter(v => v > 0);
  const otherRev = others.length ? others.reduce((s, v) => s + v, 0) / others.length * 12 : 0;
  const ch = a.d_channels || {};
  const otaShare = ['Booking.com', 'Agoda', 'Airbnb', 'Traveloka', 'Expedia/Trip.com'].reduce((s, k) => s + pct(ch, k), 0);
  const commission = (n(a.d_commission) || 17) / 100;
  const otaCost = roomRev * otaShare * commission;
  const monthlyFixed = (a.a_premises === 'Đi thuê' ? n(a.a_rent) : 0) + n(a.f_payroll) + n(a.g_cost_utilities) + n(a.g_cost_marketing) + n(a.g_cost_supplies) + n(a.g_cost_software) + n(a.g_cost_other) + n(a.e_maint);
  const cost = monthlyFixed * 12 + otaCost;
  const revenue = roomRev + otherRev;
  const profitGiven = n(a.g_profit) * 12;
  const profit = profitGiven || (revenue - cost);
  const rooms = n(a.c_rooms);
  const occ = n(a.g_occ) / 100;
  return { roomRev, otherRev, revenue, otaShare, commission, otaCost, cost, profit, profitEstimated: !profitGiven,
    margin: revenue ? profit / revenue : 0, rooms, occ, revpar: rooms ? roomRev / (rooms * 365) : 0 };
}

// Giá trị MayOS có thể tạo thêm mỗi năm (kịch bản cơ sở)
export function uplift(a, b) {
  const sales = a.i_scope && a.i_scope !== 'Chỉ công nghệ';
  const full = a.i_scope === 'Vận hành toàn phần';
  const directShift = Math.min(b.otaShare, sales ? 0.12 : 0.06);
  const items = [
    { k: 'Chuyển booking OTA sang trực tiếp', v: b.roomRev * directShift * b.commission, note: `${Math.round(directShift * 100)} điểm % booking × hoa hồng ${Math.round(b.commission * 100)}%` },
    { k: 'Tăng doanh thu phòng (giá & công suất)', v: b.roomRev * (full ? 0.06 : sales ? 0.04 : 0.015), note: full ? '+6% doanh thu phòng' : sales ? '+4%' : '+1,5%' },
    { k: 'Hiệu quả nhân sự', v: n(a.f_payroll) * 12 * (full ? 0.1 : 0.05), note: full ? '10% quỹ lương' : '5% quỹ lương' },
    { k: 'Thay phần mềm cũ', v: n(a.g_cost_software) * 12 * 0.6, note: '60% chi phí phần mềm hiện tại' },
    { k: 'Giảm overbooking/lỗi giá', v: n(a.d_overbook) * 2 * (n(a.c_adr) || (b.rooms ? b.roomRev / (b.rooms * 365 * Math.max(b.occ, 0.3)) : 0)) * 1.5, note: 'Mỗi sự cố ≈ 1,5 đêm bồi hoàn, quy năm' },
  ];
  const base = items.reduce((s, i) => s + i.v, 0);
  return { items, base, low: base * 0.5, high: base * 1.5 };
}

export function equityOptions(a, b, u) {
  const scopeRate = a.i_scope === 'Vận hành toàn phần' ? 0.04 : a.i_scope === 'Chỉ công nghệ' ? 0.02 : 0.03;
  const term = n(a.i_term) || 3;
  const valuation = n(a.k_valuation) || Math.max(b.profit, 0) * 3.5;
  const maxShare = n(a.k_max_share) / 100 || 0.3;
  const minProfit = n(a.k_min_profit) * 12;
  const hurdle = Math.max(b.profit, minProfit);

  const mk = (name, mayos, desc, extra = {}) => {
    const ownerGain = u.base - mayos;
    return { name, desc, mayos, ownerGain, mayosShareOfUplift: u.base ? mayos / u.base : 0,
      winwin: ownerGain >= mayos * 0.8 && ownerGain > 0, ...extra };
  };
  const A = mk('A. % doanh thu phòng', b.roomRev * scopeRate,
    `${(scopeRate * 100).toFixed(1)}% doanh thu phòng, trả hằng tháng. Dễ kiểm chứng, phù hợp khi sổ sách chưa chuẩn.`, { rate: scopeRate });
  const fixed = 0.015, share = 0.3;
  const B = mk('B. Kết hợp: cố định + thưởng lợi nhuận', b.roomRev * fixed + u.base * share,
    `1,5% doanh thu phòng + 30% lợi nhuận tăng thêm vượt ngưỡng ${fmt(hurdle / 12)}/tháng (lợi nhuận nền hoặc mức tối thiểu chủ đầu tư yêu cầu).`);
  const contributed = u.base * term * 0.5;
  let eq = valuation ? contributed / (valuation + contributed) : 0;
  const capped = eq > maxShare;
  eq = Math.min(eq, maxShare);
  const C = mk('C. Cổ phần theo giá trị đóng góp', (b.profit + u.base) * eq,
    `MayOS nhận ${(eq * 100).toFixed(1)}% cổ phần, trao dần trong ${term} năm theo KPI${capped ? ' (đã giới hạn theo mức tối đa chủ đầu tư chấp nhận)' : ''}. Giá trị hưởng là phần lợi nhuận tương ứng sau khi đạt mục tiêu.`,
    { equity: eq, valuation, contributed, term });
  const recommend = (a.g_books === 'Sổ tay' || a.g_books === 'Không ghi chép đầy đủ' || a.i_transparency === 'Không') ? 'A'
    : (a.k_cash === 'Không chi tiền mặt, chỉ cổ phần' || a.i_model === 'Cổ phần pháp nhân') ? 'C' : 'B';
  return { options: [A, B, C], recommend, valuation, hurdle };
}

export function fmt(v) {
  if (!isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(2).replace('.', ',') + ' tỷ';
  if (abs >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' tr';
  return Math.round(v).toLocaleString('vi-VN') + ' đ';
}

export function analyze(a) {
  const items = scope(a);
  const b = baseline(a);
  const u = uplift(a, b);
  return { items, summary: scopeSummary(items), readiness: readiness(a), baseline: b, uplift: u, equity: equityOptions(a, b, u) };
}
