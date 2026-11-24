/* ============================================================
   ASAS — Kartu Ketuntasan
   • Kartu per siswa: NO | MAPEL | PARAF GURU, ditandatangani wali kelas
   • A4 / F4, 4 atau 6 kartu per lembar — ukuran huruf & baris menyesuaikan otomatis
   • Identitas (nama, kelas) otomatis dari data siswa, atau dikosongkan untuk tulis tangan
   • Cetak semua / per kelas / pilih siswa
   • Daftar Terima & Kembali kartu per kelas
   • Mata pelajaran bisa ditambah, diubah, dihapus, diurutkan
   Semua pengaturan disimpan di sheet Pengaturan (tanpa perubahan backend).
   ============================================================ */
'use strict';
const MAPEL_BAWAAN = ['Bahasa Indonesia', 'Bahasa Inggris', 'Matematika', 'Agama Islam', 'PPKn', 'Informatika', 'IPA', 'IPS', 'PJOK', 'Prakarya', 'Mulok'];
const Kt = { tab: 'kartu', scope: 'kelas', kelas: '', pilih: new Set(), cari: '', mulai: 1, lembarKosong: 1, tkKelas: '' };
/** Pengaturan kartu ketuntasan (tersimpan). */
const ktSet = () => Object.assign({ judul: 'KARTU KETUNTASAN', sub: 'SEMESTER {semester} {tahun}', isi: 'auto', per: 6, kertas: 'A4', namaWali: true, ttd: 'Wali Kelas', kolom: 'PARAF GURU' }, DB.set.ketuntasan || {});
const ktSimpan = kv => { Data.set({ ketuntasan: Object.assign(ktSet(), kv) }); };
/** Daftar mata pelajaran: [{id, nama}] (urutan = urutan cetak). */
const ktMapel = () => Array.isArray(DB.set.mapelTuntas) ? DB.set.mapelTuntas : MAPEL_BAWAAN.map((n, i) => ({ id: 'm' + (i + 1), nama: n }));
const ktMapelSimpan = list => Data.set({ mapelTuntas: list.map(m => ({ id: m.id, nama: m.nama })) });

/* ---------- ukuran kartu ---------- */
const KT_MARGIN = 8, KT_GAP = 4;
function ktUkuran(kertas, per) {
  const [pw, ph] = PAPER[kertas] || PAPER.A4, rows = per === 4 ? 2 : 3;
  return { pw, ph, cols: 2, rows, W: Math.floor((pw - 2 * KT_MARGIN - KT_GAP) / 2 * 10) / 10, H: Math.floor((ph - 2 * KT_MARGIN - (rows - 1) * KT_GAP - .6) / rows * 10) / 10 };
}
const ktSub = c => String(c.sub || '').replace('{semester}', (DB.set.semester || '').toUpperCase()).replace('{tahun}', String(DB.set.tahunAjaran || '').replace('/', '-'));

/** HTML satu kartu. s = siswa (atau null = kosong). u = skala ukuran (dihitung agar pas). */
function ktKartu(s, u, uk, c, mapel) {
  const w = s ? (waliData()[s.kelas] || {}) : {}, auto = c.isi === 'auto' && s;
  const lebarIsi = uk.W - 7 * u - 14 * u * .3528 * 3.6;            // perkiraan lebar kolom isian nama (mm)
  return `<div class="kt" style="width:${uk.W}mm;height:${uk.H}mm;--u:${u}"><div class="kt-in">
    <div class="kt-j">${esc(c.judul)}${ktSub(c) ? '<br>' + esc(ktSub(c)) : ''}</div>
    <div class="kt-id"><div><span class="kt-l">Nama</span><span>:</span><span class="kt-v">${auto ? baris1(s.nama, 10 * u, lebarIsi, FONT_KT) : ''}</span></div>
      <div><span class="kt-l">Kelas</span><span>:</span><span class="kt-v">${auto ? esc(s.kelas) : ''}</span></div></div>
    <table class="kt-t"><thead><tr><th style="width:13%">NO</th><th>MAPEL</th><th style="width:27%">${esc(c.kolom)}</th></tr></thead><tbody>
      ${mapel.map((m, i) => `<tr><td class="c">${i + 1}</td><td>${baris1(m.nama, 10 * u, uk.W * .55 - 2 * u, FONT_KT)}</td><td></td></tr>`).join('')}</tbody></table>
    <div class="kt-ttd"><div>Mengetahui,<br>${esc(c.ttd)}</div><div class="kt-sp"></div><div class="kt-nm">${auto && c.namaWali && w.nama ? baris1(w.nama, 10 * u, uk.W * .48, FONT_KT) : '&nbsp;'}</div></div>
  </div></div>`;
}
const FONT_KT = 'Calibri, Carlito, Arial, sans-serif';
/** Skala terbesar (0,55–1,6) agar seluruh isi kartu muat tanpa terpotong — diukur sungguhan. */
let _ktUkur, _ktCache = '';
function ktSkala(uk, c, mapel) {
  const kunci = [uk.W, uk.H, c.judul, ktSub(c), c.kolom, c.ttd, mapel.length].join('|');
  if (_ktCache.startsWith(kunci + '#')) return +_ktCache.split('#')[1];
  if (!_ktUkur) { _ktUkur = document.createElement('div'); _ktUkur.setAttribute('aria-hidden', 'true'); _ktUkur.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(_ktUkur); }
  const contoh = { nama: 'Contoh Nama Siswa', kelas: 'IX-A' };
  const muat = u => { _ktUkur.innerHTML = ktKartu(contoh, u, uk, Object.assign({}, c, { isi: 'auto' }), mapel); const k = _ktUkur.firstElementChild, i = k.firstElementChild; i.style.flex = 'none'; $('.kt-ttd', i).style.marginTop = '0'; const cs = getComputedStyle(k); return i.getBoundingClientRect().height <= k.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 1; };
  let lo = .55, hi = 1.6;
  if (muat(hi)) lo = hi; else for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (muat(m)) lo = m; else hi = m; }
  const u = Math.floor(lo * 100) / 100;
  _ktCache = kunci + '#' + u; _ktUkur.innerHTML = '';
  return u;
}
function ktLembar(slot, uk, u, c, mapel) {
  return `<div class="kt-sheet" style="grid-template-columns:repeat(2,${uk.W}mm);gap:${KT_GAP}mm">${slot.map(s => s === null ? `<div class="k-lewat" style="width:${uk.W}mm;height:${uk.H}mm"></div>` : ktKartu(s === 0 ? null : s, u, uk, c, mapel)).join('')}</div>`;
}
/** Daftar isi kotak: siswa, 0 = kartu kosong, null = kotak dilewati. */
function ktSlot() {
  const c = ktSet(), per = c.per;
  if (Kt.scope === 'kosong') return Array(per * clamp(+Kt.lembarKosong || 1, 1, 50)).fill(0);
  const list = DB.siswa.filter(s => Kt.scope === 'pilih' ? Kt.pilih.has(s.nisn) : Kt.scope === 'kelas' ? s.kelas === Kt.kelas : true)
    .sort((a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama));
  const lewat = Kt.scope === 'pilih' ? clamp((+Kt.mulai || 1) - 1, 0, per - 1) : 0;
  return Array(lewat).fill(null).concat(list);
}

/* ---------- daftar terima & kembali (per kelas) ---------- */
function ktTerimaHTML(kelas) {
  const s = DB.set, c = ktSet(), w = waliData()[kelas] || {}, ph = PAPER[c.kertas][1];
  const list = DB.siswa.filter(x => x.kelas === kelas).sort((a, b) => nat(a.nama, b.nama));
  const tinggi = r1(clamp((ph - 182) / Math.max(list.length, 1), 6.2, 10));
  return `<div class="doc" style="--rh:${tinggi}mm">${kopHTML(1)}<h2>DAFTAR TERIMA DAN KEMBALI KARTU KETUNTASAN</h2><p>SEMESTER ${esc((s.semester || '').toUpperCase())} TAHUN AJARAN ${esc(s.tahunAjaran || '')}</p>
    <table class="inf"><tr><td>Kelas</td><td>:</td><td>${esc(kelas)}</td></tr><tr><td>${esc(c.ttd)}</td><td>:</td><td>${esc(w.nama) || titik(50)}</td></tr><tr><td>Jumlah siswa</td><td>:</td><td>${list.length} orang</td></tr></table>
    <table class="grid" style="margin-top:4mm"><thead><tr><th style="width:10mm">No</th><th>Nama</th><th style="width:38mm">Terima</th><th style="width:38mm">Kembali</th></tr></thead><tbody>
    ${list.map((y, i) => `<tr style="height:var(--rh)"><td style="text-align:center">${i + 1}</td><td>${baris1(y.nama, 11, 86, FONT_DOK)}</td><td style="padding-left:${i % 2 ? 16 : 2}mm">${i + 1}.</td><td style="padding-left:${i % 2 ? 16 : 2}mm">${i + 1}.</td></tr>`).join('')}
    </tbody></table>
    <div class="sgn"><div></div><div>${esc(s.titimangsa || titik(40))}<br>${esc(c.ttd)} ${esc(kelas)},<div class="sp"></div>${namaTtd(w.nama)}${idOrang(w) ? '<br>' + esc(idOrang(w)) : ''}</div></div></div>`;
}
const ktTerimaKelas = () => { const k = daftarKelas(); return Kt.tkKelas && k.includes(Kt.tkKelas) ? [Kt.tkKelas] : k; };

/* ================= HALAMAN ================= */
Pages.tuntas = {
  title: 'Kartu Ketuntasan', crumb: 'Cetak',
  render(el) {
    const c = ktSet(), mapel = ktMapel(), kelas = daftarKelas();
    if (!Kt.kelas || !kelas.includes(Kt.kelas)) Kt.kelas = kelas[0] || '';
    const seg = (act, list, nilai) => `<span class="seg">${list.map(k => `<button class="${String(nilai) === String(k[0]) ? 'on' : ''}" data-act="${act}" data-v="${k[0]}">${k[1]}</button>`).join('')}</span>`;
    let kiri = '', info = '', n = 0;
    if (Kt.tab === 'kartu') {
      const slot = ktSlot(), isi = slot.filter(x => x !== null); n = isi.length;
      kiri = `<div class="fld"><span>Ukuran kertas</span>${seg('ktKertas', [['A4', 'A4'], ['F4', 'F4']], c.kertas)}</div>
        <div class="fld"><span>Kartu per lembar</span>${seg('ktPer', [[4, '4 kartu'], [6, '6 kartu']], c.per)}</div>
        <div class="fld"><span>Nama & kelas</span>${seg('ktIsi', [['auto', 'Terisi otomatis'], ['kosong', 'Dikosongkan']], c.isi)}</div>
        <div class="fld"><span>Cetak untuk</span>${seg('ktScope', c.isi === 'kosong' ? [['kosong', 'Kartu kosong']] : [['semua', 'Semua siswa'], ['kelas', 'Per kelas'], ['pilih', 'Pilih siswa']], c.isi === 'kosong' ? 'kosong' : Kt.scope)}</div>
        ${c.isi === 'kosong' ? fld('Jumlah lembar', 'lembar', Kt.lembarKosong, 'data-on="ktLembar" min="1" max="50"', 'number', `${c.per} kartu kosong per lembar.`) : ''}
        ${c.isi !== 'kosong' && Kt.scope === 'kelas' ? `<label class="fld"><span>Kelas</span><select class="in" data-ch="ktKelas">${opts(kelas, Kt.kelas)}</select></label>` : ''}
        ${c.isi !== 'kosong' && Kt.scope === 'pilih' ? ktPilihHTML(c.per) : ''}
        ${c.isi === 'auto' ? `<label class="chk" style="margin-bottom:14px"><input type="checkbox" data-ch="ktNamaWali" ${c.namaWali ? 'checked' : ''}><span>Cetak nama wali kelas di bawah tanda tangan</span></label>` : ''}
        <details class="kt-det"><summary>Teks kartu</summary>
          ${fld('Judul', 'judul', c.judul, 'data-on="ktTeks" maxlength="50"')}${fld('Baris kedua', 'sub', c.sub, 'data-on="ktTeks" maxlength="60"', 'text', '{semester} dan {tahun} terisi otomatis dari Pengaturan.')}
          <div class="f2">${fld('Kolom kanan tabel', 'kolom', c.kolom, 'data-on="ktTeks" maxlength="20"')}${fld('Penanda tangan', 'ttd', c.ttd, 'data-on="ktTeks" maxlength="25"')}</div></details>`;
      info = `<b>${n}</b> kartu · <b>${n ? Math.ceil(slot.length / c.per) : 0}</b> lembar ${c.kertas} · ${mapel.length} mapel`;
    } else if (Kt.tab === 'terima') {
      n = ktTerimaKelas().length;
      kiri = `<div class="fld"><span>Ukuran kertas</span>${seg('ktKertas', [['A4', 'A4'], ['F4', 'F4']], c.kertas)}</div>
        <label class="fld"><span>Kelas</span><select class="in" data-ch="ktTkKelas">${opts(kelas, Kt.tkKelas, 'Semua kelas (satu halaman per kelas)')}</select></label>
        <button class="btn" style="width:100%;margin-bottom:14px" data-act="waliAtur">${ic('users')} Atur Data Wali / Guru Kelas</button>`;
      info = `<b>${n}</b> daftar terima & kembali (satu per kelas)`;
    }
    el.innerHTML = `
      <div class="ph"><div><h1>Kartu Ketuntasan</h1><p>Kartu paraf guru per mata pelajaran untuk tiap siswa, beserta daftar terima & kembali kartu per kelas.</p></div></div>
      <div class="tabs">${[['kartu', 'Cetak Kartu'], ['terima', 'Terima & Kembali'], ['mapel', 'Mata Pelajaran (' + mapel.length + ')']].map(t => `<button class="${Kt.tab === t[0] ? 'on' : ''}" data-act="ktTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
      ${Kt.tab === 'mapel' ? ktMapelHTML(mapel) : `<div class="g g-12" style="align-items:start"><div class="card">${kiri}
          <div style="padding:12px 0;border-top:1px solid var(--bd);margin-top:4px">${info}</div>
          <button class="btn pri" style="width:100%" data-act="ktCetak" ${n ? '' : 'disabled'}>${ic('printer')} Cetak / Simpan PDF</button></div>
        <div class="card"><div class="ch"><h3>Pratinjau</h3><span class="mu">halaman pertama</span></div><div class="pv"><div class="pv-paper" id="kt-pv"></div></div></div></div>`}`;
    if (Kt.tab !== 'mapel') ktPreview();
    ktDaftarPilih(); ktMapelDnD(el);
  }
};
function ktPreview() {
  const p = $('#kt-pv'); if (!p) return;
  const c = ktSet();
  if (Kt.tab === 'terima') {
    const [pw, ph] = PAPER[c.kertas], k = ktTerimaKelas()[0];
    p.style.cssText = `width:${pw}mm;min-height:${ph}mm;padding:12mm 15mm`;
    p.innerHTML = k ? pasHalaman(ktTerimaHTML(k), c.kertas) : emptyBox('Belum ada data siswa');
    fitPaper('#kt-pv', pw, .85); return;
  }
  const uk = ktUkuran(c.kertas, c.per), mapel = ktMapel(), slot = ktSlot().slice(0, c.per);
  p.style.cssText = `width:${uk.pw}mm;height:${uk.ph}mm;padding:${KT_MARGIN}mm`;
  p.innerHTML = slot.some(x => x !== null) ? ktLembar(slot, uk, ktSkala(uk, c, mapel), c, mapel)
    : emptyBox(Kt.scope === 'pilih' ? 'Belum ada siswa dipilih' : 'Tidak ada siswa', Kt.scope === 'pilih' ? 'Cari lalu centang siswa yang kartunya akan dicetak.' : '');
  fitPaper('#kt-pv', uk.pw, .85);
}
Act.ktTab = t => { Kt.tab = t.dataset.v; rerender(); };
Act.ktKertas = t => { ktSimpan({ kertas: t.dataset.v }); rerender(); };
Act.ktPer = t => { ktSimpan({ per: +t.dataset.v }); Kt.mulai = 1; rerender(); };
Act.ktIsi = t => { ktSimpan({ isi: t.dataset.v }); if (t.dataset.v === 'auto' && Kt.scope === 'kosong') Kt.scope = 'kelas'; if (t.dataset.v === 'kosong') Kt.scope = 'kosong'; rerender(); };
Act.ktScope = t => { Kt.scope = t.dataset.v; rerender(); };
On.ktKelas = t => { Kt.kelas = t.value; rerender(); };
On.ktTkKelas = t => { Kt.tkKelas = t.value; rerender(); };
On.ktNamaWali = t => { ktSimpan({ namaWali: t.checked }); ktPreview(); };
On.ktLembar = debounce(t => { Kt.lembarKosong = clamp(+t.value || 1, 1, 50); rerender(); }, 300);
On.ktTeks = debounce(t => { ktSimpan({ [t.name]: t.value }); ktPreview(); }, 300);
Act.ktCetak = async t => {
  const c = ktSet();
  if (Kt.tab === 'terima') { printDoc(ktTerimaKelas().map(k => pasHalaman(ktTerimaHTML(k), c.kertas)), c.kertas, '12mm 15mm'); return; }
  const uk = ktUkuran(c.kertas, c.per), mapel = ktMapel(), u = ktSkala(uk, c, mapel), slot = ktSlot(), pages = [];
  for (let i = 0; i < slot.length; i += c.per) pages.push(ktLembar(slot.slice(i, i + c.per), uk, u, c, mapel));
  printDoc(pages, c.kertas, KT_MARGIN + 'mm');
};

/* ---------- pilih siswa ---------- */
function ktPilihHTML(per) {
  const dipilih = DB.siswa.filter(s => Kt.pilih.has(s.nisn)).sort((a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama));
  return `<div class="fld"><span>Siswa yang dicetak (${dipilih.length})</span>
      ${dipilih.length ? `<div class="row" style="gap:6px;margin-bottom:8px">${dipilih.length > 1 ? `<button class="btn sm dan" data-act="ktKosongkan">${ic('trash')} Kosongkan</button>` : ''}${dipilih.map(s => `<span class="bdg pr" style="padding:3px 4px 3px 9px">${esc(s.nama)} <span class="mu">${esc(s.kelas)}</span><button class="ib" style="width:22px;height:22px" data-act="ktLepas" data-n="${esc(s.nisn)}" aria-label="Lepas ${esc(s.nama)}">${ic('x')}</button></span>`).join('')}</div>` : ''}
      <div class="srch" style="max-width:none;margin-bottom:6px">${ic('search')}<input class="in" placeholder="Cari nama, NISN, atau kelas…" value="${esc(Kt.cari)}" data-on="ktCari" aria-label="Cari siswa"></div>
      <div id="kt-pilih-list" class="ck-pilih"></div></div>
    <label class="fld"><span>Mulai cetak dari kotak ke-</span><select class="in" data-ch="ktMulai">${opts(Array.from({ length: per }, (_, i) => [i + 1, i + 1 === 1 ? '1 (kertas baru)' : String(i + 1)]), Kt.mulai)}</select><small>Untuk kertas yang sebagian sudah terpakai. Urutan kotak dari kiri ke kanan, lalu ke bawah.</small></label>`;
}
function ktDaftarPilih() {
  const el = $('#kt-pilih-list'); if (!el) return;
  const q = Kt.cari.trim().toLowerCase();
  const cocok = DB.siswa.filter(s => !q || (s.nama + ' ' + s.nisn + ' ' + s.nis + ' ' + s.kelas).toLowerCase().includes(q)).sort((a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama));
  const tampil = cocok.slice(0, 60);
  el.innerHTML = tampil.length ? tampil.map(s => `<label class="chk ck-opsi"><input type="checkbox" data-ch="ktPilih" data-n="${esc(s.nisn)}" ${Kt.pilih.has(s.nisn) ? 'checked' : ''}><span><b>${esc(s.nama)}</b><small>${esc(s.kelas)} · NISN ${esc(s.nisn)}</small></span></label>`).join('')
    + (cocok.length > tampil.length ? `<p class="mu" style="font-size:12px;padding:6px 4px">${cocok.length - tampil.length} siswa lain — ketik nama untuk mempersempit.</p>` : '')
    : `<p class="mu" style="padding:10px 4px">Tidak ada siswa yang cocok.</p>`;
}
const ktSegar = () => { const g = ($('#kt-pilih-list') || {}).scrollTop || 0; rerender(); const el = $('#kt-pilih-list'); if (el) el.scrollTop = g; };
On.ktCari = debounce(t => { Kt.cari = t.value; ktDaftarPilih(); }, 150);
On.ktPilih = t => { t.checked ? Kt.pilih.add(t.dataset.n) : Kt.pilih.delete(t.dataset.n); ktSegar(); };
Act.ktLepas = t => { Kt.pilih.delete(t.dataset.n); ktSegar(); };
Act.ktKosongkan = () => { Kt.pilih.clear(); ktSegar(); };
On.ktMulai = t => { Kt.mulai = +t.value || 1; rerender(); };

/* ---------- mata pelajaran: tambah / ubah / hapus / urutkan ---------- */
function ktMapelHTML(mapel) {
  return `<div class="card flush" style="max-width:720px"><div class="tools"><h3 style="font-size:16px">Mata Pelajaran pada Kartu</h3><span class="grow"></span>
      <button class="btn sm" data-act="ktMapelBawaan">${ic('refresh')} Kembalikan Bawaan</button><button class="btn sm pri" data-act="ktMapelTambah">${ic('plus')} Tambah</button></div>
    ${mapel.length > 1 ? `<p class="mu" style="font-size:12px;padding:0 20px 10px;margin-top:-6px">Seret ikon titik-titik untuk mengubah urutan. Urutan ini menjadi nomor pada kartu.</p>` : ''}
    ${mapel.length ? `<div class="tw" id="kt-mp-box"><table class="tbl"><thead><tr><th style="width:60px">No</th><th>Mata Pelajaran</th><th class="r">Aksi</th></tr></thead><tbody>
      ${mapel.map((m, i) => `<tr data-id="${esc(m.id)}"><td class="nw" style="padding-right:0"><button class="drag-h" data-i="${i}" aria-label="Urutan ${i + 1}: ${esc(m.nama)}. Seret, atau tekan panah atas/bawah." title="Seret untuk memindah urutan">${ic('grip')}</button><span class="mu" style="font-size:12px">${i + 1}</span></td>
        <td><b>${esc(m.nama)}</b></td><td class="r nw"><button class="ib" data-act="ktMapelUbah" data-id="${esc(m.id)}" aria-label="Ubah">${ic('edit')}</button><button class="ib dan" data-act="ktMapelHapus" data-id="${esc(m.id)}" aria-label="Hapus">${ic('trash')}</button></td></tr>`).join('')}
      </tbody></table></div>` : emptyBox('Belum ada mata pelajaran', 'Klik Tambah, atau Kembalikan Bawaan.')}</div>`;
}
function ktMapelForm(m) {
  const baru = !m;
  modal({
    title: baru ? 'Tambah Mata Pelajaran' : 'Ubah Mata Pelajaran',
    body: fld('Nama mata pelajaran', 'nama', m ? m.nama : '', 'required maxlength="40" placeholder="mis. Seni Budaya"') + (baru ? '<p class="mu" style="font-size:12px;margin-top:-6px">Tambah beberapa sekaligus: pisahkan dengan koma.</p>' : ''),
    onOk(v) {
      const list = ktMapel().slice(), nama = v.nama.trim();
      if (!nama) { toast('Nama mata pelajaran wajib diisi.', 'er'); return false; }
      if (baru) nama.split(',').map(x => x.trim()).filter(Boolean).forEach(x => list.push({ id: uid(), nama: x }));
      else { const i = list.findIndex(x => x.id === m.id); if (i > -1) list[i] = { id: m.id, nama }; }
      ktMapelSimpan(list); rerender(); toast(baru ? 'Mata pelajaran ditambahkan.' : 'Perubahan disimpan.', 'ok');
    }
  });
}
Act.ktMapelTambah = () => ktMapelForm(null);
Act.ktMapelUbah = t => ktMapelForm(ktMapel().find(m => m.id === t.dataset.id));
Act.ktMapelHapus = t => { const m = ktMapel().find(x => x.id === t.dataset.id); if (m) confirmBox(`Hapus "${m.nama}" dari kartu ketuntasan?`, () => { ktMapelSimpan(ktMapel().filter(x => x.id !== m.id)); rerender(); }, 'Hapus', true); };
Act.ktMapelBawaan = () => confirmBox('Daftar mata pelajaran dikembalikan ke 11 mapel bawaan. Perubahan Anda akan hilang.', () => { ktMapelSimpan(MAPEL_BAWAAN.map((n, i) => ({ id: 'm' + (i + 1), nama: n }))); rerender(); }, 'Kembalikan');
function ktMapelUrut(ids, fokus) {
  const by = new Map(ktMapel().map(m => [m.id, m]));
  if (ids.join() === ktMapel().map(m => m.id).join()) return false;
  ktMapelSimpan(ids.map(i => by.get(i)).filter(Boolean)); rerender();
  if (fokus) { const h = $(`#kt-mp-box tr[data-id="${fokus}"] .drag-h`); if (h) h.focus(); }
  return true;
}
function ktMapelDnD(el) {
  const box = $('#kt-mp-box', el); if (!box) return;
  const tb = $('tbody', box);
  tb.onpointerdown = e => {
    const h = e.target.closest('.drag-h'); if (!h || e.button > 0) return;
    e.preventDefault();
    const row = h.closest('tr'); let selesai = false;
    row.classList.add('dragging'); document.body.classList.add('is-dragging');
    const mv = ev => { let sebelum = null; for (const r of tb.children) { if (r === row) continue; const b = r.getBoundingClientRect(); if (ev.clientY < b.top + b.height / 2) { sebelum = r; break; } } if (sebelum !== row.nextSibling) tb.insertBefore(row, sebelum); };
    const up = () => {
      if (selesai) return; selesai = true;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      row.classList.remove('dragging'); document.body.classList.remove('is-dragging');
      if (ktMapelUrut([...tb.children].map(r => r.dataset.id))) toast('Urutan mata pelajaran disimpan.', 'ok');
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };
  tb.onkeydown = e => {
    const h = e.target.closest('.drag-h'); if (!h || !/^Arrow(Up|Down)$/.test(e.key)) return;
    e.preventDefault();
    const ids = ktMapel().map(m => m.id), i = +h.dataset.i, j = i + (e.key === 'ArrowUp' ? -1 : 1);
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]]; ktMapelUrut(ids, ids[j]);
  };
}
addEventListener('resize', debounce(() => { if (S.page === 'tuntas') ktPreview(); }, 150));
