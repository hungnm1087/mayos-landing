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

export function readiness(a, summary) {
  const flags = [];
  const midShare = pct(a.b_mix, 'Theo tuần') + pct(a.b_mix, 'Theo tháng (trung hạn)') + pct(a.b_mix, 'Dài hạn > 6 tháng');
  if (midShare >= 0.5) flags.push('Trung/dài hạn chiếm đa số — pilot 3 tuần chưa đủ, cần module trung hạn trước.');
  if (!n(a.g_rev_avg) && !(a.g_rev_room || []).some(v => n(v) > 0)) flags.push('Thiếu doanh thu — chưa có số liệu nền để đo hiệu quả.');
  if (n(a.g_debt_month) && n(a.g_rev_avg) && n(a.g_cost_month) && n(a.g_debt_month) > n(a.g_rev_avg) + n(a.g_rev_other_avg) - n(a.g_cost_month)) flags.push('Lợi nhuận tạm tính chưa đủ trả nợ vay hằng tháng — đối tác đang chịu áp lực tiền mặt.');
  if (summary && summary.pilotWeeks > 3) flags.push(`Pilot ước tính ${summary.pilotWeeks} tuần (vượt mục tiêu 3 tuần) — thu hẹp phạm vi pilot hoặc làm trước các hạng mục điều chỉnh.`);
  if (summary && summary.later.length) flags.push(`Cần xây mới trước khi dùng đầy đủ: ${summary.later.map(i => i.module.split(':')[0]).join('; ')}.`);
  if (a.g_bank === 'Không') flags.push('Tài khoản cơ sở chưa tách khỏi cá nhân — khó kiểm chứng doanh thu/lợi nhuận.');
  if (a.g_books === 'Sổ tay' || a.g_books === 'Không ghi chép đầy đủ') flags.push('Sổ sách chưa đầy đủ — nên ưu tiên phương án theo doanh thu.');
  if (a.i_transparency === 'Không') flags.push('Không chia sẻ số liệu — không thể áp dụng chia theo lợi nhuận.');
  if (n(a.h_tech) && n(a.h_tech) <= 2) flags.push('Đội ngũ ít quen công nghệ — tăng thời lượng đào tạo.');
  if (!a.j_extranet) flags.push('Chưa rõ ai giữ quyền extranet OTA.');
  const score = Math.max(0, 100 - flags.length * 15);
  return { score, flags };
}

const OTA_KEYS = ['Booking.com', 'Agoda', 'Airbnb', 'Traveloka', 'Expedia/Trip.com'];

// Doanh thu phòng/năm: ưu tiên bảng 12 tháng (≥ 6 tháng có số), sau đó tháng bình thường,
// sau đó trung bình cao/thấp điểm.
function roomRevenue(a) {
  const filled = (a.g_rev_room || []).map(n).filter(v => v > 0);
  if (filled.length >= 6) return { value: filled.reduce((s, v) => s + v, 0) / filled.length * 12, source: 'bảng 12 tháng' };
  if (n(a.g_rev_avg)) return { value: n(a.g_rev_avg) * 12, source: 'tháng bình thường × 12' };
  if (n(a.g_rev_peak) && n(a.g_rev_low)) return { value: (n(a.g_rev_peak) + n(a.g_rev_low)) / 2 * 12, source: 'trung bình cao/thấp điểm' };
  return { value: 0, source: 'chưa có' };
}

// Doanh thu phòng suy ra từ số phòng × công suất × giá (độc lập với con số tự khai)
function impliedRoomRevenue(a) {
  const rooms = n(a.c_rooms), occ = n(a.g_occ) / 100;
  if (!rooms || !occ) return 0;
  const mix = a.b_mix || {};
  const midFrac = pct(mix, 'Theo tuần') + pct(mix, 'Theo tháng (trung hạn)') + pct(mix, 'Dài hạn > 6 tháng');
  const shortFrac = 1 - midFrac;
  const shortRev = n(a.c_adr) ? rooms * occ * 365 * n(a.c_adr) : 0;
  const midRev = n(a.c_monthly_rate) ? rooms * occ * 12 * n(a.c_monthly_rate) : 0;
  if (shortRev && midRev) return shortFrac * shortRev + midFrac * midRev;
  return shortRev || midRev;
}

export function baseline(a) {
  const rr = roomRevenue(a);
  const roomRev = rr.value;
  const otherRev = n(a.g_rev_other_avg) * 12;
  const ch = a.d_channels || {};
  const otaShare = OTA_KEYS.reduce((s, k) => s + pct(ch, k), 0);
  const commission = (n(a.d_commission) || 17) / 100;
  const otaCost = roomRev * otaShare * commission;
  const detailMonthly = (a.a_premises === 'Đi thuê' ? n(a.a_rent) : 0) + n(a.f_payroll) + n(a.g_cost_utilities) + n(a.g_cost_marketing) + n(a.g_cost_supplies) + n(a.g_cost_software) + n(a.g_cost_other) + n(a.e_maint);
  const declaredMonthly = n(a.g_cost_month);
  // Ưu tiên tổng chi phí tự khai; nếu thiếu thì cộng chi tiết + hoa hồng OTA
  const cost = declaredMonthly ? declaredMonthly * 12 : detailMonthly * 12 + otaCost;
  const revenue = roomRev + otherRev;
  const profit = revenue - cost;
  const rooms = n(a.c_rooms);
  const occ = n(a.g_occ) / 100;
  return { roomRev, revSource: rr.source, otherRev, revenue, otaShare, commission, otaCost, cost, profit, profitEstimated: true,
    detailMonthly, declaredMonthly, implied: impliedRoomRevenue(a),
    margin: revenue ? profit / revenue : 0, rooms, occ, revpar: rooms ? roomRev / (rooms * 365) : 0 };
}

// Độ tin cậy số liệu: đối chiếu chéo các câu trả lời với nhau, không cần chứng từ.
export function credibility(a, b) {
  const checks = [];
  // ok: true/false, hoặc số 0..1 (điểm từng phần). Lệch nhỏ đạt đủ, lệch vừa được nửa điểm.
  const add = (name, ok, detail, weight = 15) => {
    const credit = typeof ok === 'number' ? ok : (ok ? 1 : 0);
    checks.push({ name, ok: credit >= 1, partial: credit > 0 && credit < 1, credit, detail, weight });
  };
  const grade = (g, tol) => g <= tol ? 1 : g <= tol * 2 ? 0.5 : 0;
  const gap = (x, y) => (x && y) ? Math.abs(x - y) / Math.max(x, y) : null;

  const g1 = gap(b.roomRev, b.implied);
  if (g1 !== null) add('Doanh thu khai vs phòng × công suất × giá', grade(g1, 0.2),
    `Khai ${fmt(b.roomRev)}/năm, suy ra ${fmt(b.implied)}/năm (lệch ${Math.round(g1 * 100)}%)`, 35);

  const otaLast = n(a.d_ota_last) * 12;
  const g2 = gap(otaLast, b.otaCost);
  if (g2 !== null) add('Hoa hồng OTA thực trả vs doanh thu × tỷ lệ OTA', grade(g2, 0.3),
    `Hoa hồng tháng gần nhất × 12 = ${fmt(otaLast)}, suy ra ${fmt(b.otaCost)} (lệch ${Math.round(g2 * 100)}%)`, 25);

  const peak = n(a.g_rev_peak), low = n(a.g_rev_low), avg = n(a.g_rev_avg);
  if (peak && low && avg) add('Tháng bình thường nằm giữa cao và thấp điểm', avg >= low && avg <= peak && peak >= low,
    `Thấp ${fmt(low)} · bình thường ${fmt(avg)} · cao ${fmt(peak)}`);

  const g3 = gap(b.declaredMonthly, b.detailMonthly + b.otaCost / 12);
  const detailCount = ['g_cost_utilities', 'g_cost_marketing', 'g_cost_supplies', 'g_cost_software', 'g_cost_other', 'e_maint'].filter(k => n(a[k]) > 0).length;
  if (g3 !== null && detailCount >= 3) add('Tổng chi phí khai vs cộng chi phí chi tiết', grade(g3, 0.2),
    `Khai ${fmt(b.declaredMonthly)}/tháng, cộng chi tiết + OTA ${fmt(b.detailMonthly + b.otaCost / 12)}/tháng`);

  if (b.declaredMonthly && n(a.f_payroll)) add('Quỹ lương không vượt tổng chi phí', n(a.f_payroll) < b.declaredMonthly,
    `Lương ${fmt(n(a.f_payroll))}, tổng chi ${fmt(b.declaredMonthly)}`);

  if (b.revenue) {
    const maxMargin = a.a_premises === 'Đi thuê' ? 0.45 : 0.55;
    add('Biên lợi nhuận trong khoảng hợp lý', b.margin <= -0.3 ? 0 : b.margin <= maxMargin ? 1 : b.margin <= maxMargin + 0.1 ? 0.5 : 0,
      `Biên ${(b.margin * 100).toFixed(0)}% (khách sạn nhỏ ${a.a_premises === 'Đi thuê' ? 'đi thuê' : 'sở hữu'} thường dưới ${maxMargin * 100}%)`);
  }
  if (n(a.g_occ)) add('Công suất trong khoảng hợp lý', n(a.g_occ) <= 92, `${n(a.g_occ)}%`, 10);

  const BENCH = { 'Homestay': 150e6, 'Boutique': 400e6, 'Khách sạn 2–3 sao': 350e6, 'Khách sạn 4–5 sao': 1.2e9, 'Căn hộ dịch vụ (CHDV)': 250e6, 'Serviced apartment cao cấp': 600e6, 'Khác': 300e6 };
  const inv = n(a.k_invested), rooms = n(a.c_rooms);
  if (inv && rooms) { const per = inv / rooms, ref = BENCH[a.a_segment] || 300e6, ratio = per / ref;
    add('Vốn đầu tư mỗi phòng so với mức phổ biến', ratio <= 2 && ratio >= 0.3 ? 1 : ratio <= 3 ? 0.5 : 0,
      `${fmt(per)}/phòng; tham chiếu ${a.a_segment || 'chung'} ≈ ${fmt(ref)}/phòng (ước lượng thô)`, 10); }

  const links = ['l_booking', 'l_agoda', 'l_gmaps'].filter(k => /^https?:\/\//i.test(a[k] || '')).length;
  add('Có link công khai để đối chiếu giá & đánh giá', links >= 1, `${links}/3 link`, 10);

  const verify = a.g_verify || [];
  const willVerify = verify.length && !verify.includes('Chưa sẵn sàng');
  add('Đồng ý một cách xác nhận số liệu', !!willVerify, willVerify ? verify.join('; ') : 'Chưa chọn hoặc chưa sẵn sàng', 15);

  const total = checks.reduce((s, c) => s + c.weight, 0) || 1;
  const score = Math.round(checks.reduce((s, c) => s + c.credit * c.weight, 0) / total * 100);
  const level = score >= 80 ? 'Cao' : score >= 55 ? 'Trung bình' : 'Thấp';
  return { checks, score, level };
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

// Suy ra phương án phù hợp từ điều đối tác quan tâm (không hỏi thẳng hình thức chia sẻ)
function preferredOption(a) {
  const p = a.i_priorities || [];
  const has = x => p.includes(x);
  if (a.i_model === 'Cổ phần pháp nhân' || a.k_cash === 'Không chi tiền mặt, chỉ cổ phần') return 'C'; // dữ liệu cũ / trả lời chi tiết
  const keepOwnership = has('Giữ toàn quyền sở hữu cơ sở');
  if (has('Cùng phát triển lâu dài, mở rộng thêm cơ sở') && !keepOwnership) return 'C';
  if (has('Cách tính đơn giản, dễ hiểu') && !has('Chỉ trả khi thấy kết quả')) return 'A';
  if (has('Chỉ trả khi thấy kết quả') || has('Không phát sinh chi phí cố định')) return 'B';
  return keepOwnership ? 'A' : 'B';
}

// Gợi ý cách trình bày phương án trong buổi gặp, dựa trên ưu tiên & lo ngại
export function talkingPoints(a) {
  const p = a.i_priorities || [], c = a.i_concerns || [];
  const t = [];
  if (p.includes('Không phát sinh chi phí cố định') || c.includes('Chi phí vượt lợi ích')) t.push('Nhấn mạnh: không thu phí cố định trước — MayOS chỉ hưởng khi doanh thu/lợi nhuận tăng.');
  if (p.includes('Chỉ trả khi thấy kết quả')) t.push('Giải thích: 4 tuần đầu MayOS chỉ ghi nhận, không thay đổi vận hành, không thu phí. Lợi nhuận đo được là phần chủ đầu tư giữ trọn; MayOS chỉ chia trên phần làm ra thêm.');
  const debt = n(a.g_debt_month);
  if (debt && a._profitMonth !== undefined && debt > a._profitMonth) t.push('Lợi nhuận hiện tại có thể chưa đủ trả nợ vay → đối tác chịu áp lực tiền mặt: đề xuất miễn phí cơ bản 3 tháng đầu, chỉ thu phí thưởng.');
  if (p.includes('Giữ toàn quyền sở hữu cơ sở')) t.push('Tránh mở đầu bằng cổ phần; bắt đầu bằng chia theo kết quả, cổ phần chỉ là lựa chọn về sau.');
  if (p.includes('Giữ quyền quyết định cuối cùng') || c.includes('Mất kiểm soát cơ sở')) t.push('Làm rõ: MayOS đề xuất và vận hành công cụ, chủ đầu tư giữ quyền phê duyệt giá, nhân sự, chi tiêu lớn.');
  if (p.includes('Số liệu minh bạch, xem được bất cứ lúc nào') || c.includes('Lộ thông tin kinh doanh')) t.push('Demo dashboard chủ đầu tư; cam kết bảo mật dữ liệu bằng văn bản, dữ liệu thuộc về cơ sở.');
  if (p.includes('Dễ dừng nếu không hiệu quả') || c.includes('Bị ràng buộc dài hạn')) t.push('Đề xuất giai đoạn thử 3 tháng, được dừng nếu không đạt KPI, bàn giao toàn bộ dữ liệu.');
  if (p.includes('Cùng phát triển lâu dài, mở rộng thêm cơ sở')) t.push('Mở ra lộ trình cổ phần theo KPI và ưu đãi khi đưa thêm cơ sở vào hệ thống.');
  if (c.includes('Nhân viên khó thích nghi')) t.push('Cam kết đào tạo tại chỗ và hỗ trợ trực tiếp 2 tuần đầu sau go-live.');
  if (c.includes('Chưa tin công nghệ/AI')) t.push('Lammy chạy chế độ có người duyệt trước khi gửi trong giai đoạn đầu.');
  if (c.includes('Chất lượng phục vụ khách bị ảnh hưởng')) t.push('Theo dõi điểm đánh giá OTA hằng tuần như một KPI bắt buộc.');
  return t;
}

// Phí thưởng chia theo bậc trên phần lợi nhuận vượt ngưỡng: lệch ngưỡng ít ảnh hưởng tới phần chia.
export function tieredIncentive(excess, hurdle) {
  if (excess <= 0) return 0;
  const h = Math.max(hurdle, 1);
  const tiers = [[0.2 * h, 0.15], [0.3 * h, 0.25], [Infinity, 0.35]];
  let left = excess, fee = 0;
  for (const [width, rate] of tiers) { const part = Math.min(left, width); fee += part * rate; left -= part; if (left <= 0) break; }
  return fee;
}

export function equityOptions(a, b, u) {
  const scopeRate = a.i_scope === 'Vận hành toàn phần' ? 0.04 : a.i_scope === 'Chỉ công nghệ' ? 0.02 : 0.03;
  const term = n(a.i_term) || 3;
  // Ngưỡng lợi nhuận ưu tiên: ưu tiên số ĐO được trong 4 tuần ghi nhận (MayOS nhập), nếu chưa có thì tạm tính từ khảo sát.
  // Không hỏi chủ đầu tư "muốn giữ bao nhiêu" — chỉ dùng số liệu thực tế.
  const measured = n(a.x_measured_profit_month) * 12;
  const hurdle = measured || Math.max(b.profit, 0);
  const hurdleMeasured = !!measured;
  const valuation = Math.max(hurdle, 0) * 3.5; // tham chiếu nội bộ; định giá bàn trực tiếp
  const maxShare = 0.3;

  const mk = (name, mayos, desc, extra = {}) => {
    const ownerGain = u.base - mayos;
    return { name, desc, mayos, ownerGain, mayosShareOfUplift: u.base ? mayos / u.base : 0,
      winwin: ownerGain >= mayos * 0.8 && ownerGain > 0, ...extra };
  };
  const A = mk('A. % doanh thu phòng', b.roomRev * scopeRate,
    `${(scopeRate * 100).toFixed(1)}% doanh thu phòng, trả hằng tháng. Dễ kiểm chứng, phù hợp khi sổ sách chưa chuẩn.`, { rate: scopeRate });
  const fixed = 0.015;
  const B = mk('B. Phí cơ bản + phí thưởng theo bậc', b.roomRev * fixed + tieredIncentive(u.base, hurdle),
    `1,5% doanh thu phòng + phí thưởng trên lợi nhuận vượt ngưỡng ưu tiên ${fmt(hurdle / 12)}/tháng: phần vượt đến 20% ngưỡng chia 15%, 20–50% chia 25%, trên 50% chia 35%. Chủ đầu tư giữ trọn phần đang làm ra.`);
  // C: cổ phần. Giới hạn bởi 3 trần: giá trị đóng góp, mức tối đa chủ đầu tư chấp nhận,
  // và trần bảo vệ — chủ đầu tư luôn giữ ≥ 60% giá trị tăng thêm:
  //   (1 − eq)(P + U) − P ≥ 0,6U  ⇔  eq ≤ 0,4U / (P + U)
  const contributed = u.base * term * 0.5;
  const P = Math.max(b.profit, 0);
  const eqContribution = valuation ? contributed / (valuation + contributed) : 0;
  const eqProtect = (P + u.base) > 0 ? 0.4 * u.base / (P + u.base) : 0;
  const eq = Math.max(0, Math.min(eqContribution, maxShare, eqProtect));
  const binding = eq === eqProtect ? 'trần bảo vệ chủ đầu tư (giữ ≥ 60% giá trị tăng thêm)' : eq === maxShare ? 'mức tối đa chủ đầu tư chấp nhận' : 'giá trị đóng góp';
  const C = mk('C. Cổ phần theo giá trị đóng góp', (P + u.base) * eq,
    `MayOS nhận ${(eq * 100).toFixed(1)}% cổ phần (giới hạn bởi ${binding}), trao dần trong ${term} năm theo KPI. Trong thời gian trao dần, MayOS chỉ hưởng trên phần lợi nhuận tăng thêm.`,
    { equity: eq, valuation, contributed, term });
  const recommend = (a.g_books === 'Sổ tay' || a.g_books === 'Không ghi chép đầy đủ' || a.i_transparency === 'Không') ? 'A'
    : preferredOption(a);
  return { options: [A, B, C], recommend, valuation, hurdle, hurdleMeasured };
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
  const summary = scopeSummary(items);
  const b = baseline(a);
  const u = uplift(a, b);
  const cred = credibility(a, b);
  a = { ...a, _profitMonth: b.profit / 12 };
  const equity = equityOptions(a, b, u);
  const revCheck = cred.checks.find(c => c.name.startsWith('Doanh thu khai'));
  if (cred.score < 55 || (revCheck && revCheck.credit === 0)) equity.recommend = 'A'; // số liệu chưa đáng tin → chỉ chia theo doanh thu thực tế
  return { items, summary, readiness: readiness(a, summary), baseline: b, credibility: cred, uplift: u, equity, talking: talkingPoints(a) };
}
