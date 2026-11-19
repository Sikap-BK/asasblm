/* ============================================================
   ASAS — Editor Kop Surat, Desain Kartu (seret-dan-lepas), Pengaturan Tampilan
   ============================================================ */
'use strict';
const MM = 96 / 25.4;                                               // piksel layar per milimeter
const FONT_DOK = '"Times New Roman", Times, serif', FONT_KARTU = 'Arial, Helvetica, sans-serif';
const _cv = document.createElement('canvas').getContext('2d');
/** Ukuran huruf (pt) agar teks muat SATU BARIS di lebar maksMm — huruf mengecil, bukan terlipat. */
function ptPas(teks, pt, maksMm, keluarga, tebal) {
  _cv.font = (tebal ? '700 ' : '400 ') + pt + 'pt ' + keluarga;
  const w = _cv.measureText(String(teks || '')).width / MM * 1.05;
  return w <= maksMm ? pt : Math.max(pt * .5, Math.floor(pt * maksMm / w * 10) / 10);
}
/* ukuran dalam em → ikut mengecil bila dokumen dipadatkan */
const baris1 = (teks, pt, maksMm, keluarga, tebal) => { const f = ptPas(teks, pt, maksMm, keluarga, tebal); return `<span class="nw1"${f < pt ? ` style="font-size:${Math.floor(f / pt * 1000) / 1000}em"` : ''}>${esc(teks)}</span>`; };
const r2 = v => Math.round(v * 100) / 100;
const clone = o => JSON.parse(JSON.stringify(o));
/** Sesuaikan skala pratinjau kertas dengan lebar wadahnya. */
function fitPaper(sel, wmm, maks = 1) { const p = $(sel); if (p && p.parentElement.clientWidth) p.style.zoom = r2(clamp((p.parentElement.clientWidth - 40) / (wmm * MM), .2, maks)); }

/* ================= KOP SURAT ================= */
const KOP_DEF = {
  logoCount: 1, logo1Pos: 'L', logo2Pos: 'R', logoH: 22, garis: true,
  lines: [{ t: 'YAYASAN BUDI LUHUR MANDIRI', s: 13, b: 1, i: 0, a: 'center' }, { t: 'SMP BUDI LUHUR MANDIRI', s: 18, b: 1, i: 0, a: 'center' },
    { t: 'Alamat sekolah, nomor telepon, dan email ditulis di baris ini', s: 10, b: 0, i: 1, a: 'center' }]
};
const kopCfg = () => DB.set.kop || KOP_DEF;
/** Nama sekolah = baris kop pertama yang memuat kata kunci jenjang. Tidak ketemu → kosong, tanpa peringatan. */
function deteksiSekolah(cfg) {
  const l = cfg.lines.find(x => /\b(SD|SMP|SMA|SMS|SMK|MTs|MAK)\b/i.test(x.t) || /\b(TK|KB|MI|MA)\b/.test(x.t));
  return l ? l.t.trim() : '';
}
/** HTML kop surat. sc = skala (1 = ukuran asli untuk kertas penuh; kartu memakai skala lebih kecil). */
function kopHTML(sc = 1, cfg = kopCfg()) {
  const A = DB.assets, h = r2(cfg.logoH * sc), logos = [];
  if (A.logo1) logos.push([A.logo1, cfg.logo1Pos]);
  if (+cfg.logoCount === 2 && A.logo2) logos.push([A.logo2, cfg.logo2Pos]);
  const sisi = p => logos.filter(l => l[1] === p).map(l => `<img alt="" src="${blobUrl(l[0])}" style="height:${h}mm">`).join('');
  const n = Math.max(logos.filter(l => l[1] === 'L').length, logos.filter(l => l[1] === 'R').length);
  const sw = n ? `style="min-width:${r2(n * h)}mm"` : '';             // sisi kiri-kanan seimbang → teks tetap di tengah
  return `<div class="kop"><div class="kop-row"><div class="kop-side" ${sw}>${sisi('L')}</div><div class="kop-teks">${cfg.lines.map(l =>
    `<div style="font-size:${r2(l.s * sc)}pt;font-weight:${l.b ? 700 : 400};font-style:${l.i ? 'italic' : 'normal'};text-align:${l.a}">${esc(l.t) || '&nbsp;'}</div>`).join('')}</div><div class="kop-side" ${sw}>${sisi('R')}</div></div>
    ${cfg.garis ? `<div class="kop-garis" style="border-top-width:${r2(.9 * sc)}mm;border-bottom-width:${r2(.3 * sc)}mm;height:${r2(1.9 * sc)}mm"></div>` : ''}</div>`;
}
const KopEd = { cfg: null, dirty: false };
Pages.kop = {
  title: 'Kop Surat',
  render(el) {
    if (!KopEd.cfg || !KopEd.dirty) KopEd.cfg = clone(kopCfg());
    const c = KopEd.cfg, A = DB.assets;
    const logoBox = (k, judul, tag) => `<div style="flex:1 1 220px"><div class="row" style="margin-bottom:8px"><b>${judul}</b><span class="bdg ${k === 'logo1' ? 'pr' : 'se'}">${tag}</span></div>
      <div class="logo-box"><span class="th">${A[k] ? `<img alt="" src="${A[k]}">` : ic('image')}</span><div><button class="btn sm" data-act="kopLogo" data-k="${k}">${ic('upload')} ${A[k] ? 'Ganti' : 'Unggah'}</button>
        ${A[k] ? `<button class="ib dan" data-act="kopLogoHapus" data-k="${k}" aria-label="Hapus logo">${ic('trash')}</button>` : ''}</div></div>
      <div class="row" style="margin-top:10px"><span class="mu" style="font-size:12px">Posisi</span><span class="seg">${[['L', 'Kiri'], ['R', 'Kanan']].map(p => `<button class="${c[k + 'Pos'] === p[0] ? 'on' : ''}" data-act="kopPos" data-k="${k}" data-v="${p[0]}">${p[1]}</button>`).join('')}</span></div></div>`;
    el.innerHTML = `
      <div class="ph"><div><h1>Pengaturan Kop Surat</h1><p>Atur logo dan baris teks kop untuk kartu, daftar hadir, dan berita acara. Nama sekolah diambil otomatis dari baris yang memuat jenjang (SD, SMP, SMA, SMK, MI, MTs, MA, dll).</p></div>
        <div class="acts">${KopEd.dirty ? '<span class="chip chip-wa">Belum disimpan</span>' : ''}<button class="btn" data-act="kopBatal">${ic('refresh')} Batal</button><button class="btn pri" data-act="kopSimpan">${ic('save')} Simpan Kop Surat</button></div></div>
      <div class="kl"><div>
        <div class="card"><div class="ch"><h3>Logo</h3><span class="grow"></span><span class="seg">${[1, 2].map(n => `<button class="${+c.logoCount === n ? 'on' : ''}" data-act="kopLogoN" data-v="${n}">${n} logo</button>`).join('')}</span></div>
          <div class="row" style="align-items:flex-start;gap:16px">${logoBox('logo1', 'Logo 1 (Sekolah)', 'Utama')}${+c.logoCount === 2 ? logoBox('logo2', 'Logo 2 (Dinas / Yayasan)', 'Hanya di kop') : ''}</div>
          <div class="row" style="margin-top:14px"><span class="mu" style="font-size:12px">Tinggi logo</span><span class="stp"><button data-act="kopLogoH" data-d="-1">−</button><b>${c.logoH} mm</b><button data-act="kopLogoH" data-d="1">+</button></span></div>
        </div>
        <div class="card mt"><div class="ch"><h3>Baris Teks Kop</h3><span class="chip plain">${c.lines.length} baris</span></div>
          ${c.lines.map((l, i) => `<div class="kop-line"><div class="row"><span class="mu" style="font-size:12px;font-weight:600">Baris ${i + 1}</span><span class="grow"></span>
              <button class="ib" data-act="kopNaik" data-i="${i}" aria-label="Naikkan" ${i ? '' : 'disabled'}>${ic('up')}</button><button class="ib" data-act="kopTurun" data-i="${i}" aria-label="Turunkan" ${i < c.lines.length - 1 ? '' : 'disabled'}>${ic('down')}</button><button class="ib dan" data-act="kopDel" data-i="${i}" aria-label="Hapus baris">${ic('trash')}</button></div>
            <input class="in" value="${esc(l.t)}" data-on="kopTeks" data-i="${i}" aria-label="Teks baris ${i + 1}" maxlength="140">
            <div class="row"><span class="stp"><button data-act="kopSize" data-i="${i}" data-d="-0.5">−</button><b>${l.s} pt</b><button data-act="kopSize" data-i="${i}" data-d="0.5">+</button></span>
              <button class="tg ${l.b ? 'on' : ''}" data-act="kopB" data-i="${i}" aria-label="Tebal">B</button><button class="tg ${l.i ? 'on' : ''}" data-act="kopI" data-i="${i}" aria-label="Miring" style="font-style:italic">I</button>
              <span class="grow"></span><span class="seg">${[['left', 'Kiri'], ['center', 'Tengah'], ['right', 'Kanan']].map(a => `<button class="${l.a === a[0] ? 'on' : ''}" data-act="kopAlign" data-i="${i}" data-v="${a[0]}">${a[1]}</button>`).join('')}</span></div></div>`).join('')}
          <button class="btn" style="width:100%" data-act="kopAdd">${ic('plus')} Tambah Baris</button>
          <label class="chk" style="margin-top:16px"><input type="checkbox" data-ch="kopGaris" ${c.garis ? 'checked' : ''}> Sertakan garis ganda di bawah kop (tebal–tipis)</label>
        </div></div>
        <div class="stick"><div class="card"><div class="ch"><h3>Pratinjau Langsung</h3><span class="chip chip-ok">Kertas A4</span><span class="grow"></span><span class="mu" style="font-size:12px" id="kop-det"></span></div>
          <div class="pv"><div class="pv-paper" id="kop-pv" style="width:210mm;min-height:120mm;padding:12mm 15mm"></div></div></div></div>
      </div>`;
    kopPreview();
  }
};
function kopPreview() {
  const p = $('#kop-pv'); if (!p) return;
  p.innerHTML = kopHTML(1, KopEd.cfg) + '<div class="doc"><h2>DAFTAR HADIR PESERTA</h2><p>SUMATIF AKHIR SEMESTER</p><div class="dots"></div><div class="dots"></div><div class="dots"></div></div>';
  const n = deteksiSekolah(KopEd.cfg); $('#kop-det').textContent = n ? 'Nama sekolah: ' + n : '';
  fitPaper('#kop-pv', 210);
}
const kopUbah = (fn, penuh = true) => { fn(KopEd.cfg); KopEd.dirty = true; penuh ? rerender() : kopPreview(); };
On.kopTeks = t => kopUbah(c => { c.lines[+t.dataset.i].t = t.value; }, false);
On.kopGaris = t => kopUbah(c => { c.garis = t.checked; });
Act.kopSize = t => kopUbah(c => { const l = c.lines[+t.dataset.i]; l.s = clamp(l.s + +t.dataset.d, 6, 30); });
Act.kopB = t => kopUbah(c => { const l = c.lines[+t.dataset.i]; l.b = l.b ? 0 : 1; });
Act.kopI = t => kopUbah(c => { const l = c.lines[+t.dataset.i]; l.i = l.i ? 0 : 1; });
Act.kopAlign = t => kopUbah(c => { c.lines[+t.dataset.i].a = t.dataset.v; });
Act.kopNaik = t => kopUbah(c => { const i = +t.dataset.i; [c.lines[i - 1], c.lines[i]] = [c.lines[i], c.lines[i - 1]]; });
Act.kopTurun = t => kopUbah(c => { const i = +t.dataset.i; [c.lines[i + 1], c.lines[i]] = [c.lines[i], c.lines[i + 1]]; });
Act.kopDel = t => kopUbah(c => { c.lines.splice(+t.dataset.i, 1); });
Act.kopAdd = () => kopUbah(c => { c.lines.push({ t: '', s: 11, b: 0, i: 0, a: 'center' }); });
Act.kopLogoN = t => kopUbah(c => { c.logoCount = +t.dataset.v; });
Act.kopPos = t => kopUbah(c => { c[t.dataset.k + 'Pos'] = t.dataset.v; });
Act.kopLogoH = t => kopUbah(c => { c.logoH = clamp(c.logoH + +t.dataset.d, 8, 40); });
Act.kopBatal = () => { KopEd.dirty = false; rerender(); };
Act.kopSimpan = () => { KopEd.dirty = false; Data.set({ kop: clone(KopEd.cfg), namaSekolah: deteksiSekolah(KopEd.cfg) }); rerender(); toast('Kop surat disimpan.', 'ok'); };
/** Unggah aset gambar: tampil seketika, kirim di latar. */
function simpanAset(kind, dataUrl) { if (kind !== 'loginbg') DB.assets[kind] = dataUrl || ''; Data.touch(); syncPub(); paintShell(); enqueue('asset', { kind, dataUrl: dataUrl || '' }); }
Act.kopLogo = async t => {
  const [f] = await pickFiles('image/png,image/jpeg,image/webp'); if (!f) return;
  try { simpanAset(t.dataset.k, await resizeImage(f, { max: 480, type: 'image/png' })); rerender(); toast('Logo diperbarui.', 'ok'); } catch (e) { toast(e.message, 'er'); }
};
Act.kopLogoHapus = t => { simpanAset(t.dataset.k, ''); rerender(); };

/* ================= DESAIN KARTU ================= */
const FIELD_DEF = [['noUjian', 'No. Peserta', 1], ['nama', 'Nama', 1], ['nisn', 'NISN', 1], ['nis', 'NIS', 0], ['ttl', 'Tempat, Tgl Lahir', 1], ['kelas', 'Kelas', 1], ['ruang', 'Ruang', 1], ['noUrut', 'No. Urut / Meja', 0]];
const EL_NAMA = { kop: 'Kop Surat', judul: 'Judul Kartu', foto: 'Pasfoto', ttd: 'Tanda Tangan', stempel: 'Stempel Sekolah' };
function tplBaru() {
  const t = { id: uid(), jenis: 'Kartu', kertas: 'A4', cols: 2, rows: 4, L: { nama: 'Kartu Sumatif', margin: 8, gap: 3, showKop: true, showFoto: true, showTtd: true, showStempel: false, stempelOp: .9, showBg: false, bgOp: 1, border: 'dashed',
    judul: 'KARTU PESERTA', sub: 'SUMATIF AKHIR SEMESTER {semester} · T.A. {tahun}', kopScale: .5, labelW: 20, el: {},
    fields: FIELD_DEF.map(f => ({ k: f[0], label: f[1], show: !!f[2], b: f[0] === 'noUjian' || f[0] === 'nama' ? 1 : 0 })) } };
  tataUlang(t); return t;
}
function tplParse(row) {
  try { const [c, r] = String(row.grid).split('x').map(Number), L = JSON.parse(row.layout); if (!L.el || !L.fields) throw 0;
    if (!L.el.stempel) { const a = L.el.ttd || { x: 40, y: 40 }; L.el.stempel = { x: r1(Math.max(0, a.x - 9)), y: r1(a.y + 1), w: 20 }; }   // templat lama: lengkapi elemen baru
    if (L.stempelOp == null) L.stempelOp = .9; if (L.bgOp == null) L.bgOp = 1;
    return { id: row.id, jenis: row.jenis, kertas: PAPER[row.kertas] ? row.kertas : 'A4', cols: c || 2, rows: r || 4, L }; }
  catch (e) { const t = tplBaru(); t.id = row.id; return t; }
}
const tplWire = t => ({ id: t.id, jenis: 'Kartu', kertas: t.kertas, grid: t.cols + 'x' + t.rows, layout: JSON.stringify(t.L) });
const daftarTemplat = () => DB.templat.filter(r => r.jenis === 'Kartu').map(tplParse);
/** Ukuran tiap kartu dihitung otomatis dari kertas, margin, jarak, dan jumlah kolom × baris. */
function dims(t) {
  const [pw, ph] = PAPER[t.kertas], m = +t.L.margin, g = +t.L.gap;
  return { pw, ph, W: Math.floor((pw - 2 * m - (t.cols - 1) * g) / t.cols * 10) / 10, H: Math.floor((ph - 2 * m - (t.rows - 1) * g - .6) / t.rows * 10) / 10 };
}
/** NIS dan NISN sama-sama tampil → digabung jadi satu baris "NIS / NISN : 0000 / 00000000". */
const gabungNis = L => { const a = L.fields.find(f => f.k === 'nis'), b = L.fields.find(f => f.k === 'nisn'); return !!(a && b && a.show && b.show); };
const fieldTampil = L => { const g = gabungNis(L); return L.fields.filter(f => f.show && !(g && f.k === 'nis')).map(f => g && f.k === 'nisn' ? Object.assign({}, f, { label: 'NIS / NISN', gabung: true }) : f); };
/** Susun posisi semua elemen secara otomatis agar muat di ukuran kartu. */
function tataUlang(t) {
  const { W, H } = dims(t), L = t.L, kc = kopCfg(), pad = r1(clamp(W * .035, 2, 4)), pt = .3528, g = gabungNis(L);
  for (let k = clamp(W / 100, .5, 1.3), coba = 0; coba < 14; coba++, k *= .93) {
    let y = pad;
    L.kopScale = r2(clamp((W - 2 * pad) / 175 * Math.min(1, k * 1.15), .25, 1));
    L.el.kop = { x: pad, y: pad, w: r1(W - 2 * pad) };
    if (L.showKop) y += Math.max(kc.lines.reduce((a, l) => a + l.s * pt * 1.18, 0), kc.logoH) * L.kopScale + (kc.garis ? 3.4 * L.kopScale : .5) + 1.2;
    const jfs = r1(clamp(9.5 * k, 5.5, 12));
    L.el.judul = { x: pad, y: r1(y), w: r1(W - 2 * pad), fs: jfs };
    y += jfs * pt * 1.25 * (L.sub ? 1.82 : 1) + 1.6;
    const ffs = r1(clamp(8.2 * k, 5, 10.5)), lh = ffs * pt * 1.5;
    const fw = L.showFoto ? clamp(W * .22, 12, 30) : 0, fh = fw * 4 / 3;
    L.el.foto = { x: r1(W - pad - fw), y: r1(y), w: r1(fw), h: r1(fh) };
    L.labelW = r1(Math.max(...fieldTampil(L).map(f => f.label.length), 4) * ffs * pt * .56 + 1);
    let fy = y;
    L.fields.forEach(f => { f.x = pad; f.w = r1(W - 2 * pad - (L.showFoto ? fw + 1.5 : 0)); f.fs = ffs; f.y = r1(fy); if (f.show && !(g && f.k === 'nis')) fy += lh; });
    const tfs = r1(clamp(7.2 * k, 4.8, 9.5)), tw = r1(clamp(W * .46, 28, 72)), th = tfs * pt * 1.25 * 4 + tfs * pt * 2.6;
    const isi = Math.max(fy, L.showFoto ? y + fh : 0);
    L.el.ttd = { x: r1(W - pad - tw), y: r1(Math.max(H - pad - th, isi + .8)), w: tw, fs: tfs };
    const sw = r1(clamp(W * .2, 14, 30));                 // stempel menindih sisi kiri tanda tangan
    L.el.stempel = { x: r1(Math.max(pad, L.el.ttd.x - sw * .55)), y: r1(Math.min(H - sw - 1, L.el.ttd.y + tfs * pt * 1.2)), w: sw };
    if (!L.showTtd ? isi <= H - pad : L.el.ttd.y + th <= H - pad + .3) break;   // sudah muat
  }
}
const CONTOH = { id: '_', nama: 'AHMAD FAHREZI PUTRA', nis: '2425001', nisn: '0091823412', tempatLahir: 'Sangatta', tglLahir: '2012-05-14', kelas: 'VII-A', _v: { noUjian: '04-2025-001', ruang: 'Ruang 01', noUrut: '1' } };
function cardHTML(t, s, design) {
  const { W, H } = dims(t), L = t.L, ix = IX(), p = ix.pes.get(s.nisn) || {}, set = DB.set, A = DB.assets, pos = o => `left:${o.x}mm;top:${o.y}mm;`;
  const val = Object.assign({ noUjian: p.noUjian || '', nama: s.nama, nisn: s.nisn, nis: s.nis, ttl: [s.tempatLahir, fTgl(s.tglLahir)].filter(Boolean).join(', '), kelas: s.kelas, ruang: (ix.ruang.get(p.idRuang) || {}).nama || '', noUrut: p.noUrut || '' }, s._v);
  const E = (id, style, cls, inner) => `<div class="k-el ${cls}" ${design ? `data-el="${id}"` : ''} style="${style}">${inner}</div>`;
  const sub = String(L.sub || '').replace('{semester}', (set.semester || '').toUpperCase()).replace('{tahun}', set.tahunAjaran || '');
  let h = '';
  if (L.showBg && A.kartubg) h += `<div class="k-bg" style="background-image:url('${blobUrl(A.kartubg)}');opacity:${L.bgOp}"></div>`;   // lapisan paling bawah
  if (L.showStempel) h += E('stempel', pos(L.el.stempel) + `width:${L.el.stempel.w}mm;opacity:${L.stempelOp}`, 'k-stempel' + (A.stempel || !design ? '' : ' kosong'), A.stempel ? `<img alt="" src="${blobUrl(A.stempel)}">` : (design ? 'STEMPEL' : ''));   // di bawah tulisan & tanda tangan
  if (L.showKop) h += E('kop', pos(L.el.kop) + `width:${L.el.kop.w}mm`, '', kopHTML(L.kopScale));
  h += E('judul', pos(L.el.judul) + `width:${L.el.judul.w}mm;font-size:${L.el.judul.fs}pt`, 'k-judul', esc(L.judul) + (sub ? `<small>${esc(sub)}</small>` : ''));
  fieldTampil(L).forEach(f => { h += E('f:' + f.k, pos(f) + `width:${f.w}mm;font-size:${f.fs}pt;${f.b ? 'font-weight:700' : ''}`, 'k-f', `<span style="width:${L.labelW}mm">${esc(f.label)}</span><i>:</i><span>${baris1(f.gabung ? val.nis + ' / ' + val.nisn : val[f.k], f.fs, f.w - L.labelW - f.fs * .3528 * 1.6 - .5, FONT_KARTU, f.b)}</span>`); });
  if (L.showFoto) { const src = Foto.src(s); h += E('foto', pos(L.el.foto) + `width:${L.el.foto.w}mm;height:${L.el.foto.h}mm`, 'k-foto', src ? `<img alt="" src="${src}">` : '<span>FOTO<br>3 × 4</span>'); }
  if (L.showTtd) h += E('ttd', pos(L.el.ttd) + `width:${L.el.ttd.w}mm;font-size:${L.el.ttd.fs}pt`, 'k-ttd', `<div>${baris1(set.titimangsa || (design ? '(tempat, tanggal)' : ''), L.el.ttd.fs, L.el.ttd.w, FONT_KARTU)}&nbsp;</div><div>Kepala Sekolah,</div><div class="sig">${A.ttd ? `<img alt="" src="${blobUrl(A.ttd)}">` : ''}</div><div><u>${baris1(set.kepsek || '..............................', L.el.ttd.fs, L.el.ttd.w, FONT_KARTU, true)}</u></div><div>${baris1(idKepsek(), L.el.ttd.fs, L.el.ttd.w, FONT_KARTU)}</div>`);
  return `<div class="kartu ${L.border || 'dashed'}" style="width:${W}mm;height:${H}mm">${h}</div>`;
}
/** Satu lembar berisi kolom × baris kartu. */
function lembarKartu(t, list) {
  const { W } = dims(t);
  const { H } = dims(t);                                           // null = kotak dilewati (kertas yang sebagian sudah terpakai)
  return `<div class="k-sheet" style="grid-template-columns:repeat(${t.cols},${W}mm);gap:${t.L.gap}mm">${list.map(s => s ? cardHTML(t, s) : `<div class="k-lewat" style="width:${W}mm;height:${H}mm"></div>`).join('')}</div>`;
}

const KD = { t: null, sel: '', zf: 1, z: 1, dirty: false };
const kdObj = id => id.startsWith('f:') ? KD.t.L.fields.find(f => f.k === id.slice(2)) : KD.t.L.el[id];
const kdContoh = () => DB.siswa.find(s => IX().pes.has(s.nisn)) || DB.siswa[0] || CONTOH;
Pages.kartu = {
  title: 'Desain Kartu',
  render(el) {
    const list = daftarTemplat();
    if (!KD.t || (!KD.dirty && list.length && !list.some(x => x.id === KD.t.id))) { KD.t = list[0] || tplBaru(); KD.dirty = !list.length; KD.sel = ''; }
    else if (!KD.dirty) { const x = list.find(y => y.id === KD.t.id); if (x) KD.t = x; }
    const t = KD.t, L = t.L, d = dims(t), A = DB.assets, tersimpan = list.some(x => x.id === t.id);
    const sw = (k, label) => `<label class="row" style="gap:8px;font-weight:500"><span class="sw"><input type="checkbox" data-ch="kdSw" data-k="${k}" ${L[k] ? 'checked' : ''}><i></i></span>${label}</label>`;
    const stp = (k, label) => `<span class="row" style="gap:6px"><span class="mu" style="font-size:12px">${label}</span><span class="stp"><button data-act="kdGrid" data-k="${k}" data-d="-1">−</button><b>${t[k]}</b><button data-act="kdGrid" data-k="${k}" data-d="1">+</button></span></span>`;
    el.innerHTML = `
      <div class="ph"><div><h1>Desain Kartu</h1><p>Pilih kertas dan jumlah kartu per lembar, centang isi kartu, lalu seret elemen pada kanvas untuk mengatur posisinya.</p></div>
        <div class="acts">${KD.dirty ? '<span class="chip chip-wa">Belum disimpan</span>' : ''}<button class="btn" data-act="kdTata">${ic('layout')} Tata Ulang Otomatis</button><button class="btn pri" data-act="kdSimpan">${ic('save')} Simpan Templat</button></div></div>
      <div class="card"><div class="row" style="gap:16px">
          <select class="in" style="width:auto;min-width:170px" data-ch="kdPilih" aria-label="Pilih templat">${opts(list.map(x => [x.id, x.L.nama]).concat(tersimpan ? [] : [[t.id, L.nama + ' (baru)']]), t.id)}</select>
          <input class="in" style="width:190px" value="${esc(L.nama)}" data-on="kdNama" aria-label="Nama templat" maxlength="40" placeholder="Nama templat">
          <button class="btn sm" data-act="kdBaru">${ic('plus')} Templat Baru</button>${tersimpan ? `<button class="ib dan" data-act="kdHapus" aria-label="Hapus templat">${ic('trash')}</button>` : ''}</div>
        <div class="row" style="gap:16px;margin-top:14px"><span class="seg">${[['A4', 'A4 (210 × 297 mm)'], ['F4', 'F4 (215 × 330 mm)']].map(p => `<button class="${t.kertas === p[0] ? 'on' : ''}" data-act="kdKertas" data-v="${p[0]}">${p[1]}</button>`).join('')}</span>
          ${stp('cols', 'Kolom')}${stp('rows', 'Baris')}<span class="chip">${t.cols * t.rows} kartu / lembar</span><span class="chip plain">Ukuran kartu ${d.W} × ${d.H} mm</span></div>
        <div class="row" style="gap:22px;margin-top:14px">${sw('showKop', 'Kop Surat')}${sw('showFoto', 'Pasfoto Siswa')}${sw('showTtd', 'Tanda Tangan Kepala Sekolah')}${sw('showStempel', 'Stempel Sekolah')}${sw('showBg', 'Latar Kartu')}</div>
        <div class="row" style="gap:12px;margin-top:14px;align-items:flex-end">
          <div class="logo-box" style="flex:1 1 230px"><span class="th">${A.stempel ? `<img alt="" src="${A.stempel}">` : ic('image')}</span><div><b>Stempel sekolah</b><div class="mu" style="font-size:12px;margin-bottom:6px">PNG latar transparan. Dicetak di bawah tulisan & tanda tangan.</div>
            <button class="btn sm" data-act="kdAset" data-k="stempel">${ic('upload')} ${A.stempel ? 'Ganti' : 'Unggah'}</button>${A.stempel ? `<button class="ib dan" data-act="kdAsetHapus" data-k="stempel" aria-label="Hapus stempel">${ic('trash')}</button>` : ''}</div></div>
          <div class="logo-box" style="flex:1 1 230px"><span class="th">${A.kartubg ? `<img alt="" src="${A.kartubg}">` : ic('image')}</span><div><b>Gambar latar kartu</b><div class="mu" style="font-size:12px;margin-bottom:6px">JPG/PNG. Direntangkan memenuhi kartu.</div>
            <button class="btn sm" data-act="kdAset" data-k="kartubg">${ic('upload')} ${A.kartubg ? 'Ganti' : 'Unggah'}</button>${A.kartubg ? `<button class="ib dan" data-act="kdAsetHapus" data-k="kartubg" aria-label="Hapus latar">${ic('trash')}</button>` : ''}</div></div>
          <label class="fld" style="flex:1 1 230px;margin:0"><span>Tempat & tanggal tanda tangan</span><input class="in" value="${esc(DB.set.titimangsa || '')}" data-on="kdTiti" data-ch="kdTitiSimpan" maxlength="60" placeholder="mis. Sangatta, 1 Desember 2026"></label>
        </div></div>
      <div class="kd mt">
        <div class="card"><div class="ch"><h3>Isi Kartu</h3><p>Centang data yang dicetak pada kartu.</p></div>
          ${L.fields.map(f => `<label class="kd-fld chk"><input type="checkbox" data-ch="kdField" data-k="${f.k}" ${f.show ? 'checked' : ''}>${esc(FIELD_DEF.find(x => x[0] === f.k)[1])}</label>`).join('')}
          <div style="margin-top:16px">${fld('Judul kartu', 'judul', L.judul, 'data-on="kdTeks" maxlength="60"')}${fld('Sub-judul', 'sub', L.sub, 'data-on="kdTeks" maxlength="90"', 'text', '{semester} dan {tahun} diisi otomatis.')}
          ${sel('Garis tepi kartu', 'border', [['dashed', 'Putus-putus (garis potong)'], ['solid', 'Garis utuh'], ['none', 'Tanpa garis']], L.border, 'data-ch="kdTeks"')}
          <div class="f2">${fld('Margin kertas (mm)', 'margin', L.margin, 'data-ch="kdUkur" min="3" max="25" step="0.5"', 'number')}${fld('Jarak kartu (mm)', 'gap', L.gap, 'data-ch="kdUkur" min="0" max="15" step="0.5"', 'number')}</div></div>
        </div>
        <div><div class="card" style="padding:12px 16px;margin-bottom:12px"><div class="row"><span class="stp"><button data-act="kdZoom" data-d="-0.15">−</button><b id="kd-z" style="min-width:52px">100%</b><button data-act="kdZoom" data-d="0.15">+</button></span>
            <span class="chip chip-ok">Geser per 0,5 mm</span><span class="grow"></span><span class="mu" style="font-size:12px">Klik elemen untuk memilih, seret untuk memindahkan, tarik kotak kecil untuk mengubah ukuran.</span></div></div>
          <div class="kd-canvas" id="kd-cv"></div></div>
        <div class="card" id="kd-props"></div>
      </div>
      <div class="card mt"><div class="ch">${ic('printer')}<h3>Pratinjau 1 Lembar Cetak</h3><span class="mu">Kertas ${t.kertas} · ${t.cols} kolom × ${t.rows} baris = ${t.cols * t.rows} kartu</span></div>
        <div class="pv"><div class="pv-paper" id="kd-sheet" style="width:${d.pw}mm;height:${d.ph}mm;padding:${L.margin}mm"></div></div></div>`;
    kdCanvas(); kdProps(); kdSheet(); kdBind();
    Foto.ensure(DB.siswa.slice(0, t.cols * t.rows)).then(() => { if (S.page === 'kartu') { kdCanvas(); kdSheet(); } });
  }
};
function kdCanvas() {
  const cv = $('#kd-cv'); if (!cv) return;
  const { W } = dims(KD.t);
  KD.z = r2(clamp((cv.clientWidth - 56) / (W * MM), .6, 3) * KD.zf);
  cv.innerHTML = `<div style="zoom:${KD.z}">${cardHTML(KD.t, kdContoh(), true)}</div>`;
  $('#kd-z').textContent = Math.round(KD.z * 100) + '%';
  const n = KD.sel && $('[data-el="' + KD.sel + '"]', cv);
  if (n) { n.classList.add('sel'); n.style.overflow = 'visible'; n.insertAdjacentHTML('beforeend', '<span class="k-h"></span>'); } else KD.sel = '';
}
const kdSheet = debounce(() => {
  const p = $('#kd-sheet'); if (!p) return;
  const n = KD.t.cols * KD.t.rows, list = DB.siswa.length ? DB.siswa.filter(s => IX().pes.has(s.nisn)).concat(DB.siswa).slice(0, n) : Array(n).fill(CONTOH);
  p.innerHTML = lembarKartu(KD.t, list); fitPaper('#kd-sheet', dims(KD.t).pw, .9);
}, 120);
function kdProps() {
  const el = $('#kd-props'); if (!el) return;
  const id = KD.sel, o = id && kdObj(id), L = KD.t.L;
  if (!o) { el.innerHTML = `<div class="ch"><h3>Properti Elemen</h3></div><div class="note">${ic('info')}<span>Klik salah satu elemen pada kartu untuk mengatur posisi, ukuran, dan hurufnya.</span></div>
    <div style="margin-top:16px">${fld('Lebar kolom label (mm)', 'labelW', L.labelW, 'data-on="kdLabelW" min="5" max="60" step="0.5"', 'number', 'Jarak dari label ke tanda titik dua.')}
    ${L.showBg ? fld('Kepekatan latar kartu (%)', 'bgOp', Math.round(L.bgOp * 100), 'data-on="kdPersen" min="5" max="100" step="5"', 'number', 'Turunkan agar tulisan tetap mudah dibaca.') : ''}</div>`; return; }
  const isF = id.startsWith('f:'), num = (k, label, step = .5) => fld(label, k, o[k], `data-on="kdProp" step="${step}" min="0"`, 'number');
  el.innerHTML = `<div class="ch"><h3>Properti Elemen</h3><span class="bdg pr">${esc(isF ? o.label : EL_NAMA[id])}</span></div>
    <div class="f2">${num('x', 'Posisi X (mm)')}${num('y', 'Posisi Y (mm)')}</div>
    <div class="f2">${num('w', 'Lebar (mm)')}${o.h != null ? num('h', 'Tinggi (mm)') : o.fs != null ? num('fs', 'Ukuran huruf (pt)', .1) : ''}</div>
    ${isF ? fld('Teks label', 'label', o.label, 'data-on="kdProp" maxlength="30"') + `<label class="chk" style="margin-bottom:14px"><input type="checkbox" data-ch="kdBold" ${o.b ? 'checked' : ''}> Cetak tebal</label>` : ''}
    ${id === 'kop' ? fld('Skala kop', 'kopScale', L.kopScale, 'data-on="kdKopScale" min="0.2" max="1.2" step="0.01"', 'number', 'Memperbesar/memperkecil huruf dan logo kop di kartu.') : ''}
    ${id === 'stempel' ? fld('Kepekatan stempel (%)', 'stempelOp', Math.round(L.stempelOp * 100), 'data-on="kdPersen" min="10" max="100" step="5"', 'number') + `<div class="note">${ic('info')}<span>Stempel berada di lapisan bawah. Bila tertutup tanda tangan, klik bagian stempel yang tidak tertutup.</span></div>` : ''}
    ${id === 'ttd' ? `<div class="note">${ic('info')}<span>Tempat & tanggal diisi di kotak di atas kanvas. Nama kepala sekolah, jenis nomor (NIP/NIY/NUPTK), dan gambar tanda tangan diatur di menu Pengaturan Tampilan.</span></div>` : ''}`;
}
function kdBind() {
  const cv = $('#kd-cv'), snap = v => Math.round(v * 2) / 2;
  cv.onpointerdown = e => {
    const el = e.target.closest('.k-el'), tarik = !!e.target.closest('.k-h');
    if (!el) { if (KD.sel) { KD.sel = ''; kdCanvas(); kdProps(); } return; }
    e.preventDefault();
    const id = el.dataset.el; if (KD.sel !== id) { KD.sel = id; kdCanvas(); kdProps(); }
    const o = kdObj(id), z = KD.z * MM, sx = e.clientX, sy = e.clientY, a = Object.assign({}, o), { W, H } = dims(KD.t); let gerak = false;
    const mv = ev => {
      const dx = (ev.clientX - sx) / z, dy = (ev.clientY - sy) / z; if (!gerak && Math.abs(dx) + Math.abs(dy) < .4) return; gerak = true;
      if (tarik) { o.w = snap(clamp(a.w + dx, 4, W)); if (a.h != null) o.h = snap(clamp(a.h + dy, 4, H)); } else { o.x = snap(clamp(a.x + dx, -2, W - 3)); o.y = snap(clamp(a.y + dy, -2, H - 3)); }
      const n = $('[data-el="' + id + '"]', cv); if (n) { n.style.left = o.x + 'mm'; n.style.top = o.y + 'mm'; n.style.width = o.w + 'mm'; if (o.h != null) n.style.height = o.h + 'mm'; }
    };
    const up = () => { removeEventListener('pointermove', mv); if (gerak) { KD.dirty = true; kdCanvas(); kdProps(); kdSheet(); } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up, { once: true });
  };
}
const kdUbah = (fn, penuh) => { fn(KD.t, KD.t.L); KD.dirty = true; if (penuh) rerender(); else { kdCanvas(); kdSheet(); } };
On.kdProp = t => kdUbah(() => { const o = kdObj(KD.sel); if (o) o[t.name] = t.type === 'number' ? (+t.value || 0) : t.value; if (t.name === 'label') { } });
On.kdBold = t => kdUbah(() => { kdObj(KD.sel).b = t.checked ? 1 : 0; });
On.kdKopScale = t => kdUbah((x, L) => { L.kopScale = clamp(+t.value || .5, .2, 1.2); });
On.kdLabelW = t => kdUbah((x, L) => { L.labelW = clamp(+t.value || 20, 5, 60); });
On.kdPersen = t => kdUbah((x, L) => { L[t.name] = clamp((+t.value || 100) / 100, .05, 1); });
On.kdTiti = t => { DB.set.titimangsa = t.value; kdCanvas(); kdSheet(); };
On.kdTitiSimpan = t => Data.set({ titimangsa: t.value.trim() });
Act.kdAset = async t => {
  const k = t.dataset.k, [f] = await pickFiles('image/png,image/jpeg,image/webp'); if (!f) return;
  try {
    simpanAset(k, k === 'stempel' ? await resizeImage(f, { max: 500, type: 'image/png' }) : await resizeImage(f, { max: 1400, q: .82 }));
    KD.t.L[k === 'stempel' ? 'showStempel' : 'showBg'] = true; KD.dirty = true; rerender();
    toast((k === 'stempel' ? 'Stempel' : 'Latar kartu') + ' dipasang. Klik Simpan Templat agar tampil saat cetak.', 'ok');
  } catch (e) { toast(e.message, 'er'); }
};
Act.kdAsetHapus = t => { simpanAset(t.dataset.k, ''); rerender(); };
On.kdTeks = t => kdUbah((x, L) => { L[t.name] = t.value; });
On.kdNama = t => { KD.t.L.nama = t.value; KD.dirty = true; };
On.kdUkur = t => kdUbah((x, L) => { L[t.name] = clamp(+t.value || 0, t.name === 'margin' ? 3 : 0, 25); tataUlang(x); }, true);
On.kdSw = t => kdUbah((x, L) => { const k = t.dataset.k; L[k] = t.checked; if (k !== 'showBg' && k !== 'showStempel') tataUlang(x); }, true);
On.kdField = t => kdUbah((x, L) => { L.fields.find(f => f.k === t.dataset.k).show = t.checked; tataUlang(x); }, true);
Act.kdGrid = t => kdUbah(x => { const k = t.dataset.k; x[k] = clamp(x[k] + +t.dataset.d, 1, k === 'cols' ? 4 : 8); tataUlang(x); }, true);
Act.kdKertas = t => kdUbah(x => { x.kertas = t.dataset.v; tataUlang(x); }, true);
Act.kdTata = () => { kdUbah(x => tataUlang(x), true); toast('Posisi elemen ditata ulang otomatis.'); };
Act.kdZoom = t => { KD.zf = clamp(KD.zf + +t.dataset.d, .4, 2.5); kdCanvas(); };
Act.kdBaru = () => { KD.t = tplBaru(); KD.t.L.nama = 'Templat ' + (daftarTemplat().length + 1); KD.dirty = true; KD.sel = ''; rerender(); };
On.kdPilih = t => { const x = daftarTemplat().find(y => y.id === t.value); if (x) { KD.t = x; KD.dirty = false; KD.sel = ''; rerender(); } };
Act.kdSimpan = () => {
  if (!KD.t.L.nama.trim()) { toast('Isi nama templat terlebih dahulu.', 'er'); return; }
  Data.save('templat', tplWire(KD.t)); KD.dirty = false; rerender(); toast('Templat kartu disimpan.', 'ok');
};
Act.kdHapus = () => confirmBox(`Hapus templat "${KD.t.L.nama}"?`, () => { Data.remove('templat', KD.t.id); KD.t = null; KD.dirty = false; rerender(); }, 'Hapus', true);
addEventListener('resize', debounce(() => { if (S.page === 'kartu') { kdCanvas(); kdSheet(); } if (S.page === 'kop') kopPreview(); if (S.page === 'cetak' && window.cetakFit) cetakFit(); }, 150));

/* ================= PENGATURAN TAMPILAN ================= */
const PALET = [['Indigo & Teal', '#4F46E5', '#0EA5A4'], ['Biru Samudra', '#2563EB', '#06B6D4'], ['Zamrud & Amber', '#059669', '#F59E0B'], ['Ungu & Rose', '#7C3AED', '#F43F5E'], ['Slate Korporat', '#334155', '#0284C7'], ['Bordeaux & Oranye', '#9F1239', '#EA580C']];
Pages.tampilan = {
  title: 'Pengaturan Tampilan', crumb: 'Tema & Identitas',
  render(el) {
    const s = DB.set, w1 = (s.warna1 || PALET[0][1]).toUpperCase(), w2 = (s.warna2 || PALET[0][2]).toUpperCase(), bg = Store.get('bg', null), adaBg = !!(s.bgVer && bg && bg.data);
    el.innerHTML = `
      <div class="ph"><div><h1>Pengaturan Tampilan</h1><p>Atur warna aplikasi, latar halaman login, identitas sekolah untuk dokumen, dan akun admin.</p></div></div>
      <div class="g g2">
        <div class="card"><div class="ch"><h3>Warna & Tema Aplikasi</h3><span class="grow"></span><button class="btn sm" data-act="clrReset">${ic('refresh')} Warna Bawaan</button><p>Pilih palet siap pakai atau tentukan warna sendiri. Perubahan langsung terlihat di seluruh aplikasi.</p></div>
          <div class="pal">${PALET.map(p => `<button class="${p[1] === w1 && p[2] === w2 ? 'on' : ''}" data-act="clrPal" data-a="${p[1]}" data-b="${p[2]}"><span><i style="background:${p[1]}"></i><i style="background:${p[2]}"></i></span>${p[0]}<small>${p[1]} · ${p[2]}</small></button>`).join('')}</div>
          <div class="fld" style="margin-top:18px"><span>Mode tampilan <small style="display:inline;margin:0">(berlaku di perangkat ini)</small></span>
            <span class="seg">${[['light', 'sun', 'Terang'], ['dark', 'moon', 'Gelap'], ['auto', 'layout', 'Ikuti sistem']].map(m => `<button class="${Mode.pref() === m[0] ? 'on' : ''}" data-act="modeSet" data-v="${m[0]}" style="display:inline-flex;align-items:center;gap:6px">${ic(m[1]).replace('class="ic"', 'class="ic" style="width:16px;height:16px"')}${m[2]}</button>`).join('')}</span></div>
          <div class="f2"><label class="fld"><span>Warna Utama</span><span class="clr"><input type="color" name="warna1" value="${w1}" data-on="clrLive" data-ch="clrSave" aria-label="Warna utama"><span class="mono" id="clr-1">${w1}</span></span><small>Menu samping, tombol utama, fokus.</small></label>
            <label class="fld"><span>Warna Sekunder</span><span class="clr"><input type="color" name="warna2" value="${w2}" data-on="clrLive" data-ch="clrSave" aria-label="Warna sekunder"><span class="mono" id="clr-2">${w2}</span></span><small>Aksen dan ujung gradien tombol login.</small></label></div>
          <div class="row" style="padding:14px;border-radius:8px;background:var(--bg)"><button class="btn pri">${ic('save')} Tombol Utama</button>
            <button class="btn" style="border:0;color:#fff;border-radius:99px;background:linear-gradient(90deg,var(--p),var(--s))">Masuk</button><span class="chip">Menu aktif</span><span class="bdg se">Aksen</span></div>
        </div>
        <div class="card"><div class="ch"><h3>Latar Halaman Login</h3><span class="grow"></span><span class="chip ${adaBg ? 'chip-ok' : 'plain'}">${adaBg ? 'Gambar terpasang' : 'Latar bawaan'}</span><p>JPG, PNG, atau WebP maksimal 2 MB. Gambar diperkecil dan dikompres otomatis sebelum disimpan.</p></div>
          <div class="mini-login" style="${adaBg ? `background-image:linear-gradient(rgba(10,6,24,.5),rgba(10,6,24,.5)),url('${bg.data}')` : ''}"><div><h4>Selamat<br>Datang!</h4><small>${esc(namaSekolah())}</small></div><div class="mc">Masuk<i></i><i></i><u></u></div></div>
          <div class="drop" id="bg-drop" style="margin-top:14px">${ic('upload')}<div style="margin:6px 0 10px">Seret gambar ke sini atau</div>
            <div class="row" style="justify-content:center"><button class="btn sm pri" data-act="bgPilih">${ic('image')} ${adaBg ? 'Ganti Gambar' : 'Pilih Gambar'}</button>${adaBg ? `<button class="btn sm dan" data-act="bgHapus">${ic('trash')} Hapus</button>` : ''}</div></div>
        </div>
        <form class="card" id="f-ident"><div class="ch"><h3>Identitas untuk Dokumen</h3><p>Dipakai pada kartu, daftar hadir, dan berita acara.</p></div>
          <div class="f2">${fld('Tahun Ajaran', 'tahunAjaran', s.tahunAjaran || '', 'maxlength="12" placeholder="2025/2026"')}${sel('Semester', 'semester', ['Ganjil', 'Genap'], s.semester || 'Ganjil')}</div>
          <div class="f2">${fld('Nama Kepala Sekolah', 'kepsek', s.kepsek || '', 'maxlength="70"')}${fld('Nomor identitas', 'nipKepsek', s.nipKepsek || '', 'maxlength="40"')}</div>
          ${sel('Yang ditampilkan di bawah nama kepala sekolah', 'jenisId', [['NIP', 'NIP'], ['NIY', 'NIY'], ['NUPTK', 'NUPTK'], ['', 'Dikosongkan (tidak ditampilkan)']], s.jenisId == null ? 'NIP' : s.jenisId)}
          ${fld('Tempat & tanggal pada tanda tangan', 'titimangsa', s.titimangsa || '', 'maxlength="60" placeholder="Sangatta, 1 Desember 2025"')}
          <div class="logo-box" style="margin-bottom:16px"><span class="th" style="width:96px">${DB.assets.ttd ? `<img alt="" src="${DB.assets.ttd}">` : ic('edit')}</span><div><b>Tanda tangan kepala sekolah</b><div class="mu" style="font-size:12px;margin-bottom:6px">PNG latar transparan paling baik.</div>
            <button type="button" class="btn sm" data-act="ttdPilih">${ic('upload')} ${DB.assets.ttd ? 'Ganti' : 'Unggah'}</button>${DB.assets.ttd ? `<button type="button" class="ib dan" data-act="ttdHapus" aria-label="Hapus tanda tangan">${ic('trash')}</button>` : ''}</div></div>
          <button class="btn pri">${ic('save')} Simpan Identitas</button></form>
        <form class="card" id="f-akun" autocomplete="off"><div class="ch">${ic('lock')}<h3>Akun Admin</h3><p>Mengganti kata sandi akan mengeluarkan perangkat lain yang sedang masuk.</p></div>
          ${fld('Nama Pengguna', 'u', S.user || 'admin', 'required maxlength="40" autocomplete="username"')}
          <div class="f2">${fld('Kata sandi lama', 'pLama', '', 'required autocomplete="current-password"', 'password')}${fld('Kata sandi baru', 'pBaru', '', 'required minlength="8" autocomplete="new-password"', 'password', 'Minimal 8 karakter.')}</div>
          <button class="btn pri">${ic('save')} Ganti Kata Sandi</button></form>
      </div>`;
    $('#f-ident').onsubmit = e => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); Object.keys(v).forEach(k => v[k] = v[k].trim()); Data.set(v); toast('Identitas disimpan.', 'ok'); };
    $('#f-akun').onsubmit = async e => {
      e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)), b = $('button', e.target); b.disabled = true;
      const res = await api('akun', v); b.disabled = false;
      if (!res.success) { toast(res.message || 'Gagal mengganti kata sandi.', 'er'); return; }
      S.token = res.data.token; S.exp = res.data.exp; S.user = res.data.user; Store.set('ses', { token: S.token, exp: S.exp, user: S.user }); paintShell(); e.target.reset(); rerender(); toast('Kata sandi diganti.', 'ok');
    };
    const dz = $('#bg-drop');
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) pasangBg(e.dataTransfer.files[0]); };
  }
};
const simpanWarna = (a, b) => { applyTheme(a, b); Data.set({ warna1: a, warna2: b }); };
Act.modeSet = t => { Mode.set(t.dataset.v); rerender(); };
Act.clrPal = t => { simpanWarna(t.dataset.a, t.dataset.b); rerender(); };
Act.clrReset = () => { simpanWarna(PALET[0][1], PALET[0][2]); rerender(); toast('Warna dikembalikan ke bawaan.'); };
On.clrLive = t => { const a = $('[name=warna1]').value, b = $('[name=warna2]').value; applyTheme(a, b); $('#clr-1').textContent = a.toUpperCase(); $('#clr-2').textContent = b.toUpperCase(); };
On.clrSave = () => { simpanWarna($('[name=warna1]').value.toUpperCase(), $('[name=warna2]').value.toUpperCase()); rerender(); };
async function pasangBg(f) {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast('Format harus JPG, PNG, atau WebP.', 'er'); return; }
  if (f.size > 2 * 1024 * 1024) { toast('Ukuran gambar melebihi 2 MB.', 'er'); return; }
  try {
    const d = await resizeImage(f, { max: 1920, q: .8 }), v = 'L' + Date.now();
    Store.set('bg', { ver: v, data: d }); DB.set.bgVer = v; simpanAset('loginbg', d); rerender(); toast('Latar halaman login diperbarui.', 'ok');
  } catch (e) { toast(e.message, 'er'); }
}
Act.bgPilih = async () => { const [f] = await pickFiles('image/jpeg,image/png,image/webp'); if (f) pasangBg(f); };
Act.bgHapus = () => { Store.del('bg'); DB.set.bgVer = ''; simpanAset('loginbg', ''); rerender(); toast('Kembali ke latar bawaan.'); };
Act.ttdPilih = async () => { const [f] = await pickFiles('image/png,image/jpeg,image/webp'); if (!f) return; try { simpanAset('ttd', await resizeImage(f, { max: 600, type: 'image/png' })); rerender(); toast('Tanda tangan diperbarui.', 'ok'); } catch (e) { toast(e.message, 'er'); } };
Act.ttdHapus = () => { simpanAset('ttd', ''); rerender(); };
