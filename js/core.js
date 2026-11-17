/* ============================================================
   ASAS — Inti aplikasi
   Prinsip kecepatan:
   • Layar tampil dari cache perangkat dulu, server menyusul di latar.
   • Login = 1 panggilan (langsung membawa seluruh data).
   • Pindah menu tidak memanggil server sama sekali.
   • Simpan = langsung tampil, dikirim lewat antrean latar (aman diulang).
   ============================================================ */
'use strict';

// ---------- util dasar ----------
const LS = 'asas:v1:';                                  // naikkan versi bila bentuk data berubah
const DEMO = !(typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\//.test(GAS_URL));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nat = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
/** Urutan kelas: angka Romawi di depan (VII, VIII, IX, X, XI, XII) dibaca sebagai angka. */
const ROMAWI = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
const kunciKelas = k => String(k).replace(/^\s*(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)(?![A-Za-z])/i, (m, r) => String(ROMAWI[r.toUpperCase()]).padStart(2, '0'));
const cmpKelas = (a, b) => nat(kunciKelas(a), kunciKelas(b));
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = v => Math.round(v * 10) / 10;

const Store = {
  get(k, d = null) { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(LS + k); } catch (e) { } }
};

const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function pTgl(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
function fTgl(s, hari) { const d = pTgl(s); return d ? (hari ? HARI[d.getDay()] + ', ' : '') + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : (s || ''); }
function isoHariIni() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

// ---------- ikon (subset, inline — tanpa pustaka ikon) ----------
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  building: '<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h5M14 14h4"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
  up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.73 5.08a10.74 10.74 0 0 1 11.2 6.57 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49M14.08 14.16a3 3 0 0 1-4.24-4.24M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14M2 2l20 20"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'
};
const ic = n => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

// ---------- state ----------
const KEY = { siswa: 'id', ruang: 'id', peserta: 'nisn', sesi: 'id', templat: 'id' };
const S = { token: '', exp: 0, user: '', page: '', q: [], busy: false, rev: 0, lastBoot: 0, resync: false };
const ASET_KOSONG = { logo1: '', logo2: '', ttd: '', stempel: '', kartubg: '' };
const emptyDB = () => ({ siswa: [], ruang: [], peserta: [], sesi: [], templat: [], set: {}, assets: Object.assign({}, ASET_KOSONG) });
let DB = emptyDB();
const normDB = d => { const e = emptyDB(); Object.keys(e).forEach(k => { if (d && d[k]) e[k] = d[k]; }); e.assets = Object.assign({}, ASET_KOSONG, e.assets); return e; };
const saveDBSoon = debounce(() => { if (!Store.set('db', DB)) console.warn('Cache perangkat penuh — data tetap aman di server.'); }, 300);

let _ix = { rev: -1 };
/** Indeks cepat (dibangun ulang hanya bila data berubah). */
function IX() {
  if (_ix.rev !== S.rev) _ix = { rev: S.rev, pes: new Map(DB.peserta.map(p => [p.nisn, p])), ruang: new Map(DB.ruang.map(r => [r.id, r])), rIdx: new Map(DB.ruang.map((r, i) => [r.id, i])), sis: new Map(DB.siswa.map(s => [s.nisn, s])) };
  return _ix;
}
/** Nama sekolah: dari pengaturan; bila kosong, diambil langsung dari baris kop surat. */
const namaSekolah = () => DB.set.namaSekolah || (typeof deteksiSekolah === 'function' ? deteksiSekolah(kopCfg()) : '');
/** Nomor identitas kepala sekolah sesuai pilihan (NIP / NIY / NUPTK / dikosongkan). */
function idKepsek() { const s = DB.set, j = s.jenisId == null ? 'NIP' : s.jenisId; return j && s.nipKepsek ? j + '. ' + s.nipKepsek : ''; }
/** Gambar aset dipakai berulang (ratusan kartu) → jadikan satu Blob URL agar ringan saat cetak. */
const _blob = new Map();
function blobUrl(dataUrl) {
  if (!dataUrl) return '';
  if (_blob.has(dataUrl)) return _blob.get(dataUrl);
  let url = dataUrl;
  try { const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl), bin = atob(m[2]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); url = URL.createObjectURL(new Blob([u8], { type: m[1] })); } catch (e) { }
  if (_blob.size > 12) { const k = _blob.keys().next().value; URL.revokeObjectURL(_blob.get(k)); _blob.delete(k); }
  _blob.set(dataUrl, url); return url;
}
const daftarKelas = () => [...new Set(DB.siswa.map(s => s.kelas).filter(Boolean))].sort(cmpKelas);
/** Urutan ruang = urutan dibuat (dan hasil seret-lepas), bukan urut abjad. */
const ruangUrut = () => DB.ruang.slice();
const idxRuang = id => { const i = IX().rIdx.get(id); return i == null ? 1e9 : i; };

// ---------- pengukur ----------
const Perf = {
  rows: [],
  add(action, total, server) { this.rows.push({ action, total, server: server ?? null, net: server != null ? total - server : null }); if (this.rows.length > 200) this.rows.shift(); },
  table() { console.table(this.rows.slice(-30)); }                 // ketik Perf.table() di Console
};

// ---------- API (timeout, retry, reqId idempoten) ----------
const READ_ACTIONS = /^(boot|fotoGet|login)$/;
async function apiOnce(action, data, timeout, reqId) {
  if (DEMO) return window.Demo.call(action, data, S.token);
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout), t0 = performance.now();
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST', redirect: 'follow', cache: 'no-store', signal: ctrl.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },      // hindari CORS preflight
      body: JSON.stringify({ action, token: S.token || '', reqId, data: data || {} })
    });
    const text = await res.text();
    try { const j = JSON.parse(text); Perf.add(action, Math.round(performance.now() - t0), j.ms); return j; }
    catch (e) { return { success: false, network: true, retryable: res.status >= 500 || res.status === 429, message: 'Server membalas HTTP ' + res.status + ' (bukan JSON). Periksa URL /exec dan pengaturan deploy.' }; }
  } catch (err) {
    return { success: false, network: true, retryable: true, message: err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Koneksi terputus.' };
  } finally { clearTimeout(timer); }
}
async function api(action, data, opt = {}) {
  const isRead = READ_ACTIONS.test(action);
  const reqId = isRead ? '' : (opt.reqId || uid() + uid());
  const tries = opt.tries || (isRead ? 3 : 2);
  let res;
  for (let i = 0; i < tries; i++) {
    if (i) { await new Promise(r => setTimeout(r, 1200 * i)); if (navigator.onLine === false) await waitOnline(15000); }
    res = await apiOnce(action, data, isRead ? (i ? 40000 : 25000) : 90000, reqId);
    if (res.success || !res.retryable) break;
  }
  if (!res.success && res.code === 'AUTH') onAuthLost();
  return res;
}
async function apiGet(action) {
  if (DEMO) return window.Demo.call(action, {}, '');
  try { const r = await fetch(GAS_URL + '?action=' + action, { redirect: 'follow', cache: 'no-store' }); return await r.json(); }
  catch (e) { return { success: false, network: true }; }
}
function waitOnline(ms) { return new Promise(r => { if (navigator.onLine !== false) return r(); const t = setTimeout(done, ms); function done() { clearTimeout(t); removeEventListener('online', done); r(); } addEventListener('online', done); }); }
function warmUp() { if (!DEMO) fetch(GAS_URL + '?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(() => { }); }

// ---------- antrean simpan (optimistic UI) ----------
function enqueue(action, data) {
  const last = S.q[S.q.length - 1], bolehGabung = last && (S.q.length > 1 || !S.busy);
  if (bolehGabung && action === 'replace' && last.action === 'replace' && last.data.t === data.t) { last.data = data; last.reqId = uid() + uid(); }
  else if (bolehGabung && action === 'setSave' && last.action === 'setSave') { Object.assign(last.data.kv, data.kv); last.reqId = uid() + uid(); }
  else S.q.push({ action, data, reqId: uid() + uid() });
  Store.set('q', S.q);
  pump();
}
async function pump() {
  if (S.busy || !S.q.length || !S.token) return;
  S.busy = true; paintSync();
  while (S.q.length && S.token) {
    const j = S.q[0];
    const res = await api(j.action, j.data, { reqId: j.reqId });
    if (res.success) { S.q.shift(); Store.set('q', S.q); continue; }
    if (res.code === 'AUTH') break;
    if (res.network) { S.busy = false; paintSync('off'); setTimeout(pump, 6000); return; }
    S.q.shift(); Store.set('q', S.q); S.resync = true;              // ditolak server → buang & samakan lagi dengan server
    toast(res.message || 'Server menolak perubahan.', 'er', 'Gagal menyimpan');
  }
  S.busy = false; paintSync();
  if (S.resync && !S.q.length && S.token) { S.resync = false; refreshBoot(true); }
}
function paintSync(state) {
  const el = $('#sync'); if (!el) return;
  const st = state || (S.q.length ? 'run' : 'ok');
  el.className = 'chip ' + (st === 'ok' ? 'chip-ok' : st === 'off' ? 'chip-er' : 'chip-wa');
  el.textContent = st === 'ok' ? 'Tersimpan' : st === 'off' ? 'Menunggu koneksi…' : 'Menyimpan…';
  el.title = st === 'off' ? 'Perubahan aman di perangkat dan akan dikirim otomatis saat koneksi kembali.' : '';
}
addEventListener('online', pump);
addEventListener('beforeunload', e => { if (S.q.length) { e.preventDefault(); e.returnValue = ''; } });

/** Kolom foto siswa hanya diatur server (unggah foto) — jangan ikut dikirim agar tidak menimpa. */
const wire = (t, row) => { if (t !== 'siswa') return row; const c = Object.assign({}, row); delete c.foto; delete c.fotoId; return c; };
/** Semua perubahan data lewat sini: ubah lokal → tampil seketika → kirim di latar. */
const Data = {
  touch() { S.rev++; saveDBSoon(); },
  save(t, row) {
    const k = KEY[t], a = DB[t], i = a.findIndex(r => r[k] === row[k]);
    if (i > -1) a[i] = Object.assign({}, a[i], row); else a.push(row);
    this.touch(); enqueue('save', { t, row: wire(t, row) });
  },
  bulk(t, rows) {
    const k = KEY[t], idx = new Map(DB[t].map((r, i) => [r[k], i]));
    rows.forEach(row => { const i = idx.get(row[k]); if (i != null) DB[t][i] = Object.assign({}, DB[t][i], row); else { idx.set(row[k], DB[t].length); DB[t].push(row); } });
    this.touch();
    for (let i = 0; i < rows.length; i += 250) enqueue('bulk', { t, rows: rows.slice(i, i + 250).map(r => wire(t, r)) });   // kirim bertahap
  },
  remove(t, ids) {
    ids = [].concat(ids); const set = new Set(ids), k = KEY[t];
    const gone = DB[t].filter(r => set.has(r[k]));
    DB[t] = DB[t].filter(r => !set.has(r[k]));
    if (t === 'siswa') { const n = new Set(gone.map(r => r.nisn)); DB.peserta = DB.peserta.filter(p => !n.has(p.nisn)); }
    if (t === 'ruang') { DB.peserta = DB.peserta.filter(p => !set.has(p.idRuang)); DB.sesi = DB.sesi.filter(x => !set.has(x.idRuang)); }
    this.touch(); enqueue('remove', { t, id: ids });
  },
  replace(t, rows) { DB[t] = rows; this.touch(); enqueue('replace', { t, rows }); },
  set(kv) { Object.assign(DB.set, kv); this.touch(); enqueue('setSave', { kv: Object.assign({}, kv) }); syncPub(); paintShell(); }
};

// ---------- bootstrap & segarkan di latar (SWR) ----------
async function refreshBoot(force) {
  if (!S.token || S.q.length || S.busy) return;
  if (!force && Date.now() - S.lastBoot < 60000) return;            // masih segar → tidak ke server
  S.lastBoot = Date.now();
  const res = await api('boot');
  if (!res.success || S.q.length || S.busy) return;
  applyBoot(res.data);
}
function applyBoot(boot) {
  const next = normDB(boot);
  if (hashStr(JSON.stringify(next)) === hashStr(JSON.stringify(DB))) return;   // sama → tidak render ulang
  DB = next; S.rev++; Store.set('db', DB); syncPub(); paintShell(); rerender();
}

// ---------- tema, data publik login ----------
const _tema = { a: '#4F46E5', b: '#0EA5A4' };
function applyTheme(w1, w2) {
  const r = document.documentElement;
  _tema.a = /^#[0-9a-f]{6}$/i.test(w1 || '') ? w1 : '#4F46E5'; _tema.b = /^#[0-9a-f]{6}$/i.test(w2 || '') ? w2 : '#0EA5A4';
  r.style.setProperty('--p', _tema.a); r.style.setProperty('--s', _tema.b);
  window.asasTone(_tema.a);
  const m = $('meta[name=theme-color]'); if (m) m.content = getComputedStyle(r).getPropertyValue('--side-bg').trim() || _tema.a;
}
/* ---------- mode gelap / terang (per perangkat) ---------- */
const Mode = {
  pref: () => Store.get('mode', 'light'),
  apply() {
    document.documentElement.setAttribute('data-theme', window.asasMode());
    applyTheme(_tema.a, _tema.b);
    const b = $('#mode-btn'), gelap = window.asasMode() === 'dark';
    if (b) { b.innerHTML = ic(gelap ? 'sun' : 'moon'); b.title = b.ariaLabel = gelap ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'; }
  },
  set(m) { Store.set('mode', m); this.apply(); }
};
function syncPub() {
  const pub = Object.assign(Store.get('pub', {}), { namaSekolah: namaSekolah(), warna1: DB.set.warna1 || '', warna2: DB.set.warna2 || '', logo1: DB.assets.logo1 || '', bgVer: DB.set.bgVer || '' });
  // latar login yang baru diunggah dari perangkat ini: samakan versinya dengan versi server
  const bg = Store.get('bg', null);
  if (bg && /^L/.test(bg.ver) && pub.bgVer && !/^L/.test(pub.bgVer)) { bg.ver = pub.bgVer; Store.set('bg', bg); }
  Store.set('pub', pub); applyTheme(pub.warna1, pub.warna2); setFavicon(pub.logo1);
}
function setFavicon(src) { if (src) $('#favicon').href = src; }
function paintLogin() {
  const pub = Store.get('pub', {}), bg = Store.get('bg', null);
  applyTheme(pub.warna1, pub.warna2); setFavicon(pub.logo1);
  $('#lg-logo').innerHTML = pub.logo1 ? '<img alt="Logo sekolah" src="' + pub.logo1 + '">' : '';
  $('#lg-sekolah').textContent = pub.namaSekolah || '';
  const el = $('#login'), ada = bg && bg.data && bg.ver === (pub.bgVer || '');
  el.classList.toggle('has-bg', !!ada);
  el.style.setProperty('--lg-bg', ada ? 'url("' + bg.data + '")' : 'none');
}
async function refreshPublic() {
  const res = await apiGet('public');
  if (!res.success) return;
  Store.set('pub', res.data); paintLogin();
  const bg = Store.get('bg', null);
  if (!res.data.bgVer) { Store.del('bg'); paintLogin(); return; }
  if (bg && bg.ver === res.data.bgVer) return;
  const r2 = await apiGet('publicBg');
  if (r2.success && r2.data.bg) { Store.set('bg', { ver: r2.data.bgVer, data: r2.data.bg }); paintLogin(); }
}

// ---------- login / keluar ----------
function showLogin() { document.documentElement.className = 'is-login'; paintLogin(); }
function onAuthLost() {
  if (!S.token) return;
  S.token = ''; Store.del('ses'); showLogin();
  $('#lg-err').textContent = 'Sesi berakhir. Silakan masuk kembali' + (S.q.length ? ' — perubahan yang belum terkirim akan dilanjutkan.' : '.');
}
async function submitLogin(e) {
  e.preventDefault();
  const btn = $('#lg-btn'), err = $('#lg-err');
  err.textContent = ''; btn.disabled = true; btn.textContent = 'Memeriksa…';
  const res = await api('login', { u: $('#lg-u').value, p: $('#lg-p').value }, { tries: 2 });
  btn.disabled = false; btn.textContent = 'Masuk';
  if (!res.success) { err.textContent = res.message || 'Gagal masuk. Coba lagi.'; return; }
  const d = res.data;
  S.token = d.token; S.exp = d.exp; S.user = d.user;
  Store.set('ses', { token: d.token, exp: d.exp, user: d.user });
  $('#lg-p').value = ''; $('#lg-p').type = 'password'; $('#lg-eye').innerHTML = ic('eye');
  S.lastBoot = Date.now();
  if (S.q.length) { enterApp(); pump(); }                           // lanjutkan kiriman yang tertunda
  else { DB = normDB(d.boot); S.rev++; Store.set('db', DB); syncPub(); enterApp(); }
}
function logout() {
  const go = () => { S.token = ''; S.q = []; DB = emptyDB(); S.rev++; ['ses', 'db', 'q'].forEach(k => Store.del(k)); showLogin(); refreshPublic(); };
  if (S.q.length) confirmBox('Masih ada perubahan yang belum terkirim ke server. Keluar sekarang akan membuangnya.', go, 'Tetap keluar', true); else go();
}

// ---------- kerangka & router ----------
const NAV = [['dashboard', 'Dashboard', 'grid'], ['siswa', 'Data Siswa', 'users'], ['ruang', 'Ruang & No Ujian', 'building'], ['sesi', 'Jadwal Sesi', 'calendar'],
  ['kop', 'Kop Surat', 'file'], ['kartu', 'Desain Kartu', 'card'], ['cetak', 'Cetak Dokumen', 'printer'], ['laporan', 'Laporan Tabel', 'table'], ['tampilan', 'Pengaturan Tampilan', 'sliders']];
const Pages = {}, Act = {}, On = {};

function paintShell() {
  if (!$('#nav').children.length) {
    $('#nav').innerHTML = NAV.map(n => `<a href="#/${n[0]}" data-nav="${n[0]}">${ic(n[2])}<span>${n[1]}</span></a>`).join('');
    $('.sd-out').innerHTML = ic('logout') + '<span>Keluar Portal</span>';
    $('#top .ib').innerHTML = ic('menu');
    $('.ava-u').innerHTML = ic('user');
  }
  const s = DB.set, logo = DB.assets.logo1;
  $('#sd-logo').className = 'sd-logo' + (logo ? ' has-img' : '');
  $('#sd-logo').innerHTML = logo ? '<img alt="" src="' + logo + '">' : ic('book');
  $('#sd-nama').textContent = namaSekolah() || 'ASAS';
  $('#ta').textContent = 'T.A. ' + (s.tahunAjaran || '—') + ' ' + (s.semester || '');
  $('#top-user').textContent = S.user || 'Admin';
  $('#demo-bar').hidden = !DEMO;
  Mode.apply();
  paintSync();
}
function enterApp() {
  document.documentElement.className = 'is-app';
  if (!DB.set.namaSekolah && namaSekolah() && !S.q.length) Data.set({ namaSekolah: namaSekolah() });   // isi otomatis dari kop
  paintShell(); if (!location.hash) location.hash = '#/dashboard'; route();
}
function route() {
  if (!S.token) return;
  let name = location.hash.replace(/^#\/?/, '').split('/')[0];
  if (!Pages[name]) name = 'dashboard';
  S.page = name;
  let el = $('.page[data-page="' + name + '"]');
  if (!el) { el = document.createElement('section'); el.className = 'page'; el.dataset.page = name; $('#pages').appendChild(el); }
  $$('.page').forEach(p => p.hidden = p !== el);
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === name));
  const def = Pages[name];
  $('#crumb').innerHTML = esc(def.crumb || 'Administrasi Sumatif') + ' <span class="mu">/</span> <b>' + esc(def.title) + '</b>';
  document.documentElement.classList.remove('menu-open');
  def.render(el);
  scrollTo(0, 0);
}
function rerender() { const el = $('.page[data-page="' + S.page + '"]'); if (el && Pages[S.page] && S.token) Pages[S.page].render(el); }
addEventListener('hashchange', route);
Act.bukaMenu = () => document.documentElement.classList.add('menu-open');
Act.tutupMenu = () => document.documentElement.classList.remove('menu-open');
Act.keluar = logout;
Act.mode = () => { Mode.set(window.asasMode() === 'dark' ? 'light' : 'dark'); if (S.page === 'tampilan') rerender(); };
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (Mode.pref() === 'auto') { Mode.apply(); if (S.page === 'tampilan') rerender(); } });

document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && Act[t.dataset.act]) Act[t.dataset.act](t, e); });
document.addEventListener('input', e => { const t = e.target.closest('[data-on]'); if (t && On[t.dataset.on]) On[t.dataset.on](t, e); });
document.addEventListener('change', e => { const t = e.target.closest('[data-ch]'); if (t && On[t.dataset.ch]) On[t.dataset.ch](t, e); });

// ---------- komponen UI ----------
function toast(msg, type = '', title = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type;
  t.innerHTML = (title ? '<b>' + esc(title) + '</b>' : '') + esc(msg);
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), type === 'er' ? 6000 : 3200);
  return t;
}
function modal(o) {
  const m = document.createElement('div'); m.className = 'modal-bg';
  m.innerHTML = `<form class="modal ${o.wide ? 'wide' : ''}"><div class="modal-h"><h3>${esc(o.title)}</h3><button type="button" class="ib" data-x aria-label="Tutup">${ic('x')}</button></div>
    <div class="modal-b">${o.body}</div>
    <div class="modal-f"><button type="button" class="btn" data-x>${o.cancel || 'Batal'}</button>${o.ok === false ? '' : `<button class="btn ${o.danger ? 'dan' : 'pri'}">${esc(o.ok || 'Simpan')}</button>`}</div></form>`;
  const close = () => m.remove();
  m.addEventListener('mousedown', e => { if (e.target === m) close(); });
  m.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
  $('form', m).addEventListener('submit', e => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); if (o.onOk && o.onOk(v, close, m) === false) return; close(); });
  document.body.appendChild(m);
  const f = $('.modal-b input:not([type=hidden]), .modal-b select, .modal-b textarea', m); if (f) f.focus();
  return { el: m, close };
}
function confirmBox(msg, onYes, okText = 'Ya, lanjutkan', danger = false) {
  modal({ title: 'Konfirmasi', body: '<p>' + esc(msg) + '</p>', ok: okText, danger, onOk: () => { onYes(); } });
}
const fld = (label, name, value = '', attr = '', type = 'text', hint = '') =>
  `<label class="fld"><span>${label}</span><input class="in" type="${type}" name="${name}" value="${esc(value)}" ${attr}>${hint ? '<small>' + hint + '</small>' : ''}</label>`;
const sel = (label, name, opts, value = '', attr = '') =>
  `<label class="fld"><span>${label}</span><select class="in" name="${name}" ${attr}>${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></label>`;
const opts = (list, value, first) => (first ? `<option value="">${first}</option>` : '') + list.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`; }).join('');

function pager(total, page, per, act) {
  const n = Math.max(1, Math.ceil(total / per)); page = clamp(page, 1, n);
  const from = total ? (page - 1) * per + 1 : 0, to = Math.min(total, page * per);
  const show = [...new Set([1, page - 1, page, page + 1, n])].filter(p => p >= 1 && p <= n).sort((a, b) => a - b);
  let h = '', prev = 0;
  show.forEach(p => { if (p - prev > 1) h += '<span class="mu">…</span>'; h += `<button class="${p === page ? 'on' : ''}" data-act="${act}" data-p="${p}">${p}</button>`; prev = p; });
  return `<div class="pgr"><span class="grow">Menampilkan <b>${from}–${to}</b> dari <b>${total}</b> data</span>
    <button data-act="${act}" data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${ic('left')}</button>${h}<button data-act="${act}" data-p="${page + 1}" ${page >= n ? 'disabled' : ''} aria-label="Berikutnya">${ic('right')}</button></div>`;
}
const emptyBox = (judul, teks) => `<div class="empty"><b>${judul}</b>${teks || ''}</div>`;

// ---------- berkas & gambar ----------
function pickFiles(accept, multiple) {
  return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.onchange = () => res([...i.files]); i.click(); });
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src)); document.head.appendChild(s); }); }
let _xlsx;
function loadXLSX() { return _xlsx || (_xlsx = loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js').catch(e => { _xlsx = null; throw new Error('Pustaka Excel gagal dimuat. Periksa koneksi internet.'); })); }
/** Perkecil gambar di peramban sebelum diunggah. o.cover=[w,h] → potong tengah pas ukuran; o.max → sisi terpanjang. */
function resizeImage(file, o) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas'), x = c.getContext('2d');
      if (o.cover) { const [w, h] = o.cover, k = Math.max(w / W, h / H); c.width = w; c.height = h; x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, (w - W * k) / 2, (h - H * k) / 2, W * k, H * k); }
      else { const k = Math.min(1, o.max / Math.max(W, H)); c.width = Math.round(W * k); c.height = Math.round(H * k); if (o.type !== 'image/png') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(img, 0, 0, c.width, c.height); }
      URL.revokeObjectURL(url); res(c.toDataURL(o.type || 'image/jpeg', o.q || .85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Berkas "' + file.name + '" bukan gambar yang valid.')); };
    img.src = url;
  });
}

// ---------- foto siswa: cache IndexedDB di perangkat ----------
const Foto = {
  mem: new Map(),
  open() { return this._p || (this._p = new Promise(res => { try { const r = indexedDB.open('asas-foto', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } })); },
  async idb(mode, fn) { const db = await this.open(); if (!db) return null; return new Promise(res => { try { const rq = fn(db.transaction('f', mode).objectStore('f')); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); } catch (e) { res(null); } }); },
  src(s) { const m = s && this.mem.get(s.nisn); return m && m.id === s.fotoId ? m.d : ''; },
  put(nisn, id, d) { this.mem.set(nisn, { id, d }); this.idb('readwrite', st => st.put({ id, d }, nisn)); },
  del(nisn) { this.mem.delete(nisn); this.idb('readwrite', st => st.delete(nisn)); },
  /** Pastikan foto semua siswa di daftar tersedia (memori → IndexedDB → server per 20). */
  async ensure(list, onProg) {
    const need = [];
    for (const s of list) {
      if (!s.fotoId || this.src(s)) continue;
      const v = await this.idb('readonly', st => st.get(s.nisn));
      if (v && v.id === s.fotoId) this.mem.set(s.nisn, v); else need.push(s.nisn);
    }
    for (let i = 0; i < need.length; i += 20) {
      if (onProg) onProg(i, need.length);
      const res = await api('fotoGet', { nisns: need.slice(i, i + 20) });
      if (!res.success) break;
      Object.keys(res.data).forEach(n => this.put(n, res.data[n].id, res.data[n].d));
    }
  },
  /** Isi semua elemen [data-foto="NISN"] di dalam root setelah render. */
  hydrate(root) {
    const els = $$('[data-foto]', root); if (!els.length) return;
    const ix = IX(), list = els.map(e => ix.sis.get(e.dataset.foto)).filter(Boolean);
    const isi = () => els.forEach(e => { const src = this.src(ix.sis.get(e.dataset.foto)); if (src && e.isConnected) e.innerHTML = '<img alt="" src="' + src + '">'; });
    isi(); this.ensure(list).then(isi);
  }
};

// ---------- cetak ----------
const PAPER = { A4: [210, 297], F4: [215, 330] };
function printDoc(pages, paper, margin, landscape) {
  let [w, h] = PAPER[paper] || PAPER.A4; if (landscape) [w, h] = [h, w];
  $('#print-root').innerHTML = pages.map(p => '<div class="pg">' + p + '</div>').join('');
  let st = $('#pg-style'); if (!st) { st = document.createElement('style'); st.id = 'pg-style'; document.head.appendChild(st); }
  st.textContent = `@page{size:${w}mm ${h}mm;margin:${margin}}`;
  Promise.all($$('#print-root img').map(i => i.decode ? i.decode().catch(() => { }) : 0)).then(() => setTimeout(() => window.print(), 50));
}
addEventListener('afterprint', () => { $('#print-root').innerHTML = ''; });

// ---------- mulai ----------
async function init() {
  $('#lg-form').addEventListener('submit', submitLogin);
  const mata = $('#lg-eye'); mata.innerHTML = ic('eye');
  mata.title = 'Tampilkan kata sandi';
  mata.addEventListener('click', () => { const p = $('#lg-p'), buka = p.type === 'password'; p.type = buka ? 'text' : 'password'; mata.innerHTML = ic(buka ? 'eyeOff' : 'eye'); mata.title = buka ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'; mata.setAttribute('aria-label', mata.title); mata.setAttribute('aria-pressed', buka); });
  if (DEMO) await loadScript('js/demo.js');
  const ses = Store.get('ses'), db = Store.get('db');
  S.q = Store.get('q', []);
  if (ses && ses.exp > Date.now() && db) {                          // buka ulang → langsung tampil dari cache perangkat
    S.token = ses.token; S.exp = ses.exp; S.user = ses.user; DB = normDB(db); S.rev++;
    syncPub(); enterApp(); pump(); refreshBoot(true);
  } else { if (S.q.length && db) DB = normDB(db); showLogin(); warmUp(); refreshPublic(); }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (Date.now() - hiddenAt > 120000) { if (S.token) refreshBoot(); else warmUp(); }
    pump();
  });
}
document.addEventListener('DOMContentLoaded', init);   // skrip defer selesai dimuat semua sebelum ini
