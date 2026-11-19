/* ============================================================
   ASAS — Cetak Dokumen (Kartu, Daftar Hadir, Berita Acara) & Laporan Tabel
   Cetak memakai dialog cetak peramban: satuan milimeter + @page A4/F4.
   "Simpan sebagai PDF" tersedia di dialog yang sama.
   ============================================================ */
'use strict';
const Ck = { tab: 'kartu', tpl: '', scope: 'semua', kelas: '', ruang: '', urut: 'no', kertas: 'A4', tgl: '', mapel: '', fr: '', nPengawas: 1, baKepsek: true, sebutan: 'Wali Kelas', tkKelas: '', _muat: false };
/** Pilihan cetak (kertas, jumlah pengawas, tanda tangan kepsek) diingat di pengaturan. */
function ckMuat() { if (Ck._muat) return; Ck._muat = true; const c = DB.set.cetak || {}; if (PAPER[c.kertas]) Ck.kertas = c.kertas; if (c.nPengawas) Ck.nPengawas = +c.nPengawas === 2 ? 2 : 1; if (c.baKepsek != null) Ck.baKepsek = !!c.baKepsek; if (c.sebutan === 'Guru Kelas') Ck.sebutan = c.sebutan; }
const ckSimpan = () => Data.set({ cetak: { kertas: Ck.kertas, nPengawas: Ck.nPengawas, baKepsek: Ck.baKepsek, sebutan: Ck.sebutan } });
/** Kotak tanda tangan pengawas. Dua pengawas bila dipilih 2 atau Pengawas 2 pada jadwal terisi. */
const duaPengawas = x => Ck.nPengawas === 2 || !!x.pengawas2;
const kotakTtd = (atas, nama) => `<div>${atas}<div class="sp"></div>${nama ? '<u><b>' + esc(nama) + '</b></u>' : '(' + titik(40) + ')'}</div>`;
const DOC_MARGIN = '12mm 15mm';

/* ---------- sumber data ---------- */
function ckTemplat() { const list = daftarTemplat(); return list.find(t => t.id === Ck.tpl) || list[0] || (KD.t && KD.t.jenis === 'Kartu' ? KD.t : tplBaru()); }
function ckSiswa() {
  const ix = IX();
  const list = DB.siswa.filter(s => Ck.scope === 'kelas' ? s.kelas === Ck.kelas : Ck.scope === 'ruang' ? (ix.pes.get(s.nisn) || {}).idRuang === Ck.ruang : true);
  const no = s => (ix.pes.get(s.nisn) || {}).noUjian || '￿';
  return list.sort(Ck.urut === 'kelas' ? (a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama) : (a, b) => nat(no(a), no(b)) || nat(a.nama, b.nama));
}
/** Baris sesi yang dicetak. Bila belum ada jadwal → satu lembar kosong per ruang. */
function ckSesi() {
  if (!DB.sesi.length) return ruangUrut().filter(r => !Ck.fr || r.id === Ck.fr).map(r => ({ idRuang: r.id, tanggal: '', mapel: '', jam: '', pengawas: '', pengawas2: '', hadir: '', tidakHadir: '', catatan: '' }));
  return sesiUrut(DB.sesi.filter(x => (!Ck.tgl || x.tanggal === Ck.tgl) && (!Ck.mapel || x.mapel === Ck.mapel) && (!Ck.fr || x.idRuang === Ck.fr)));
}
function pesertaRuang(idRuang) {
  const ix = IX();
  return DB.peserta.filter(p => p.idRuang === idRuang && ix.sis.has(p.nisn)).sort((a, b) => (+a.noUrut || 0) - (+b.noUrut || 0)).map(p => ({ p, s: ix.sis.get(p.nisn) }));
}

/* ---------- pembuat dokumen ---------- */
const titik = n => '.'.repeat(n);
function dokKepala(judul) {
  const s = DB.set;
  return kopHTML(1) + `<h2>${judul}</h2><p>SUMATIF AKHIR SEMESTER ${esc((s.semester || '').toUpperCase())} TAHUN AJARAN ${esc(s.tahunAjaran || '')}</p>`;
}
function dokInfo(x) {
  const r = IX().ruang.get(x.idRuang) || {};
  const baris = [['Mata Pelajaran', x.mapel || titik(50)], ['Hari / Tanggal', x.tanggal ? fTgl(x.tanggal, true) : titik(50)], ['Waktu', x.jam ? 'Pukul ' + x.jam : titik(50)], ['Ruang', r.nama || '']];
  return `<table class="inf">${baris.map(b => `<tr><td>${b[0]}</td><td>:</td><td>${esc(b[1])}</td></tr>`).join('')}</table>`;
}
function daftarHadirHTML(x) {
  const list = pesertaRuang(x.idRuang), ph = PAPER[Ck.kertas][1], dua = duaPengawas(x);
  const tinggi = r1(clamp((ph - (dua ? 196 : 172)) / Math.max(list.length, 1), 5.6, 9.5));         // tinggi baris menyesuaikan jumlah peserta
  return `<div class="doc">${dokKepala('DAFTAR HADIR PESERTA')}${dokInfo(x)}
    <table class="grid" style="margin-top:4mm"><thead><tr><th style="width:10mm">No</th><th style="width:34mm">No Ujian</th><th>Nama</th><th style="width:20mm">Kelas</th><th style="width:48mm">Tanda Tangan</th></tr></thead><tbody>
    ${list.map((y, i) => `<tr style="height:${tinggi}mm"><td style="text-align:center">${i + 1}</td><td style="text-align:center">${esc(y.p.noUjian)}</td><td>${esc(y.s.nama)}</td><td style="text-align:center">${esc(y.s.kelas)}</td><td style="padding-left:${i % 2 ? 24 : 2}mm">${i + 1}.</td></tr>`).join('')
      || '<tr><td colspan="5" style="text-align:center;height:20mm">Belum ada peserta di ruang ini.</td></tr>'}
    </tbody></table>
    <div class="sgn"><div><table class="inf"><tr><td>Jumlah peserta</td><td>:</td><td>${list.length} orang</td></tr><tr><td>Hadir</td><td>:</td><td>${esc(x.hadir) || titik(8)} orang</td></tr><tr><td>Tidak hadir</td><td>:</td><td>${esc(x.tidakHadir) || titik(8)} orang</td></tr></table></div>
      ${dua ? '' : kotakTtd('Pengawas,', x.pengawas)}</div>
    ${dua ? `<div class="sgn" style="margin-top:3mm">${kotakTtd('Pengawas 1,', x.pengawas)}${kotakTtd('Pengawas 2,', x.pengawas2)}</div>` : ''}</div>`;
}
function beritaAcaraHTML(x) {
  const s = DB.set, r = IX().ruang.get(x.idRuang) || {}, n = pesertaRuang(x.idRuang).length, d = pTgl(x.tanggal);
  const [m1, m2] = (x.jam || '').split(/\s*-\s*/);
  const dua = duaPengawas(x), titi = esc(s.titimangsa || titik(40));
  // Tanda tangan kepala sekolah di berita acara selalu dikosongkan (ditandatangani basah), hanya nama & nomor.
  const kepsek = `<div>Mengetahui,<br>Kepala Sekolah,<div class="sp"></div>${s.kepsek ? '<u><b>' + esc(s.kepsek) + '</b></u>' : '(' + titik(40) + ')'}${idKepsek() ? '<br>' + esc(idKepsek()) : ''}</div>`;
  const baris = [['Sekolah', esc(namaSekolah()) || titik(50)], ['Ruang', r.nama || ''], ['Jumlah peserta seharusnya', n + ' orang'], ['Jumlah hadir', (esc(x.hadir) || titik(10)) + ' orang'], ['Jumlah tidak hadir', (esc(x.tidakHadir) || titik(10)) + ' orang'], ['Nomor peserta tidak hadir', titik(60)]];
  return `<div class="doc">${dokKepala('BERITA ACARA PELAKSANAAN')}
    <p style="text-align:justify;margin-top:5mm;line-height:1.7">Pada hari ini ${d ? '<b>' + HARI[d.getDay()] + '</b> tanggal <b>' + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() + '</b>' : titik(20) + ' tanggal ' + titik(30)},
      telah dilaksanakan Sumatif Akhir Semester ${esc(s.semester || '')} Tahun Ajaran ${esc(s.tahunAjaran || '')} untuk mata pelajaran <b>${esc(x.mapel) || titik(40)}</b>,
      dari pukul <b>${esc(m1 || titik(10))}</b> sampai dengan pukul <b>${esc(m2 || titik(10))}</b>, dengan keterangan sebagai berikut:</p>
    <table class="inf" style="margin:4mm 0 4mm 8mm;width:auto">${baris.map(b => `<tr><td style="width:58mm">${b[0]}</td><td>:</td><td>${b[1]}</td></tr>`).join('')}</table>
    <p>Catatan selama pelaksanaan:</p>
    <div style="border:.3mm solid #000;min-height:34mm;padding:2mm 3mm;margin-top:2mm">${esc(x.catatan) || '<div class="dots"></div><div class="dots"></div><div class="dots"></div>'}</div>
    <p style="margin-top:5mm;text-align:justify">Demikian berita acara ini dibuat dengan sesungguhnya untuk dipergunakan sebagaimana mestinya.</p>
    ${dua ? `<div class="sgn">${kotakTtd('<br>Pengawas 1,', x.pengawas)}${kotakTtd(titi + '<br>Pengawas 2,', x.pengawas2)}</div>${Ck.baKepsek ? `<div class="sgn tengah">${kepsek}</div>` : ''}`
      : `<div class="sgn">${Ck.baKepsek ? kepsek : '<div></div>'}${kotakTtd(titi + '<br>Pengawas,', x.pengawas)}</div>`}</div>`;
}

/* ================= DAFTAR TERIMA KARTU (per kelas) ================= */
const waliData = () => DB.set.wali || {};
const idOrang = w => w && w.jenis && w.no ? w.jenis + '. ' + w.no : '';
function ckTerima() { const k = daftarKelas(); return Ck.tkKelas && k.includes(Ck.tkKelas) ? [Ck.tkKelas] : k; }
function terimaHTML(kelas) {
  const s = DB.set, ix = IX(), w = waliData()[kelas] || {}, sebut = Ck.sebutan, ph = PAPER[Ck.kertas][1];
  const list = DB.siswa.filter(x => x.kelas === kelas).map(x => ({ s: x, p: ix.pes.get(x.nisn) || {} }))
    .sort((a, b) => nat(a.p.noUjian || '￿', b.p.noUjian || '￿') || nat(a.s.nama, b.s.nama));
  const tinggi = r1(clamp((ph - 182) / Math.max(list.length, 1), 6.2, 10));   // tinggi baris menyesuaikan jumlah siswa
  return `<div class="doc">${dokKepala('DAFTAR TERIMA KARTU PESERTA')}
    <table class="inf"><tr><td>Kelas</td><td>:</td><td>${esc(kelas)}</td></tr><tr><td>${sebut}</td><td>:</td><td>${esc(w.nama) || titik(50)}</td></tr><tr><td>Jumlah siswa</td><td>:</td><td>${list.length} orang</td></tr></table>
    <table class="grid" style="margin-top:4mm"><thead><tr><th style="width:10mm">No</th><th>Nama</th><th style="width:32mm">No. Peserta</th><th style="width:28mm">Tgl Ambil</th><th style="width:44mm">Tanda Tangan</th></tr></thead><tbody>
    ${list.map((y, i) => `<tr style="height:${tinggi}mm"><td style="text-align:center">${i + 1}</td><td>${esc(y.s.nama)}</td><td style="text-align:center">${esc(y.p.noUjian || '')}</td><td></td><td style="padding-left:${i % 2 ? 22 : 2}mm">${i + 1}.</td></tr>`).join('')}
    </tbody></table>
    <div class="sgn"><div></div><div>${esc(s.titimangsa || titik(40))}<br>${sebut} ${esc(kelas)},<div class="sp"></div>${w.nama ? '<u><b>' + esc(w.nama) + '</b></u>' : '(' + titik(40) + ')'}${idOrang(w) ? '<br>' + esc(idOrang(w)) : ''}</div></div></div>`;
}
/** Isian data wali / guru kelas — satu baris per kelas, disimpan di Pengaturan. */
Act.waliAtur = () => {
  const kelas = daftarKelas(), W = waliData();
  if (!kelas.length) { toast('Belum ada data siswa / kelas.', 'er'); return; }
  modal({
    title: 'Data Wali / Guru Kelas', wide: true,
    body: `<p class="mu" style="margin-bottom:14px">Nama dan nomor identitas ini dicetak pada kolom tanda tangan Daftar Terima Kartu tiap kelas. Kosongkan nomor bila tidak ingin ditampilkan.</p>
      <div class="tw"><table class="tbl"><thead><tr><th style="width:90px">Kelas</th><th>Nama Wali / Guru Kelas</th><th style="width:130px">Jenis Nomor</th><th style="width:220px">Nomor</th></tr></thead><tbody>
      ${kelas.map((k, i) => { const w = W[k] || {}; return `<tr><td><span class="bdg pr">${esc(k)}</span></td>
        <td><input class="in sm" name="nama_${i}" value="${esc(w.nama || '')}" maxlength="70" aria-label="Nama wali kelas ${esc(k)}" placeholder="Nama lengkap & gelar"></td>
        <td><select class="in sm" name="jenis_${i}" aria-label="Jenis nomor ${esc(k)}">${opts([['NIP', 'NIP'], ['NIY', 'NIY'], ['NUPTK', 'NUPTK'], ['', 'Tidak ditampilkan']], w.jenis == null ? 'NIP' : w.jenis)}</select></td>
        <td><input class="in sm" name="no_${i}" value="${esc(w.no || '')}" maxlength="40" aria-label="Nomor ${esc(k)}"></td></tr>`; }).join('')}
      </tbody></table></div>`,
    onOk(v) {
      const baru = Object.assign({}, W);                            // data kelas yang sudah tidak ada tetap disimpan
      kelas.forEach((k, i) => { const w = { nama: (v['nama_' + i] || '').trim(), jenis: v['jenis_' + i] || '', no: (v['no_' + i] || '').trim() }; if (w.nama || w.no) baru[k] = w; else delete baru[k]; });
      Data.set({ wali: baru }); rerender(); toast('Data wali / guru kelas disimpan.', 'ok');
    }
  });
};

/* ================= HALAMAN CETAK ================= */
Pages.cetak = {
  title: 'Cetak Dokumen',
  render(el) {
    ckMuat();
    const tab = Ck.tab, rooms = ruangUrut(), kelas = daftarKelas(), tpls = daftarTemplat();
    if (Ck.scope === 'kelas' && !kelas.includes(Ck.kelas)) Ck.kelas = kelas[0] || '';
    if (Ck.scope === 'ruang' && !rooms.some(r => r.id === Ck.ruang)) Ck.ruang = (rooms[0] || {}).id || '';
    let opsi = '', info = '', n = 0;
    if (tab === 'kartu') {
      const t = ckTemplat(), list = ckSiswa(), per = t.cols * t.rows; n = list.length;
      opsi = `<label class="fld"><span>Templat kartu</span><select class="in" data-ch="ckSet" name="tpl">${tpls.length ? opts(tpls.map(x => [x.id, x.L.nama + ' — ' + x.kertas + ', ' + x.cols + '×' + x.rows]), t.id) : '<option>Templat bawaan (belum disimpan)</option>'}</select></label>
        <div class="fld"><span>Cakupan</span><span class="seg">${[['semua', 'Semua siswa'], ['kelas', 'Per kelas'], ['ruang', 'Per ruang']].map(s => `<button class="${Ck.scope === s[0] ? 'on' : ''}" data-act="ckScope" data-v="${s[0]}">${s[1]}</button>`).join('')}</span></div>
        ${Ck.scope === 'kelas' ? `<label class="fld"><span>Kelas</span><select class="in" data-ch="ckSet" name="kelas">${opts(kelas, Ck.kelas)}</select></label>` : ''}
        ${Ck.scope === 'ruang' ? `<label class="fld"><span>Ruang</span><select class="in" data-ch="ckSet" name="ruang">${opts(rooms.map(r => [r.id, r.nama]), Ck.ruang)}</select></label>` : ''}
        ${sel('Urutan cetak', 'urut', [['no', 'Nomor ujian'], ['kelas', 'Kelas, lalu nama']], Ck.urut, 'data-ch="ckSet"')}`;
      info = `<b>${n}</b> kartu · <b>${Math.ceil(n / per)}</b> lembar ${t.kertas}` + (!DB.peserta.length && n ? '<div class="note wa" style="margin-top:10px">' + ic('alert') + '<span>Peserta belum dibagi ke ruang — kartu akan tercetak tanpa nomor ujian.</span></div>' : '');
    } else if (tab === 'terima') {
      const list = ckTerima(), W = waliData(), kosong = list.filter(k => !(W[k] || {}).nama); n = list.length;
      opsi = `<div class="fld"><span>Ukuran kertas</span><span class="seg">${['A4', 'F4'].map(k => `<button class="${Ck.kertas === k ? 'on' : ''}" data-act="ckKertas" data-v="${k}">${k}</button>`).join('')}</span></div>
        <label class="fld"><span>Kelas</span><select class="in" data-ch="ckSet" name="tkKelas">${opts(kelas, Ck.tkKelas, 'Semua kelas (satu halaman per kelas)')}</select></label>
        <div class="fld"><span>Penanda tangan</span><span class="seg">${['Wali Kelas', 'Guru Kelas'].map(k => `<button class="${Ck.sebutan === k ? 'on' : ''}" data-act="ckSebutan" data-v="${k}">${k}</button>`).join('')}</span></div>
        <button class="btn" style="width:100%;margin-bottom:14px" data-act="waliAtur">${ic('users')} Atur Data Wali / Guru Kelas</button>
        ${kosong.length ? `<div class="note wa" style="margin-bottom:14px">${ic('alert')}<span>${kosong.length} kelas belum diisi nama ${Ck.sebutan.toLowerCase()} (${esc(kosong.slice(0, 4).join(', '))}${kosong.length > 4 ? ', …' : ''}). Kolom nama akan dicetak titik-titik.</span></div>` : ''}`;
      info = `<b>${n}</b> daftar terima kartu (satu per kelas)` + (!DB.peserta.length && n ? '<div class="note wa" style="margin-top:10px">' + ic('alert') + '<span>Peserta belum dibagi — kolom No. Peserta akan kosong.</span></div>' : '');
    } else {
      const list = ckSesi(); n = list.length;
      const tgl = [...new Set(DB.sesi.map(x => x.tanggal))].sort(), mapel = [...new Set(DB.sesi.filter(x => !Ck.tgl || x.tanggal === Ck.tgl).map(x => x.mapel))].sort(nat);
      opsi = `<div class="fld"><span>Ukuran kertas</span><span class="seg">${['A4', 'F4'].map(k => `<button class="${Ck.kertas === k ? 'on' : ''}" data-act="ckKertas" data-v="${k}">${k}</button>`).join('')}</span></div>
        ${DB.sesi.length ? `<label class="fld"><span>Hari / tanggal</span><select class="in" data-ch="ckSet" name="tgl">${opts(tgl.map(t => [t, fTgl(t, true)]), Ck.tgl, 'Semua tanggal')}</select></label>
          <label class="fld"><span>Mata pelajaran</span><select class="in" data-ch="ckSet" name="mapel">${opts(mapel, Ck.mapel, 'Semua mata pelajaran')}</select></label>`
          : `<div class="note" style="margin-bottom:14px">${ic('info')}<span>Belum ada jadwal sesi — dokumen dicetak per ruang dengan isian kosong untuk ditulis tangan.</span></div>`}
        <label class="fld"><span>Ruang</span><select class="in" data-ch="ckSet" name="fr">${opts(rooms.map(r => [r.id, r.nama]), Ck.fr, 'Semua ruang')}</select></label>
        <div class="fld"><span>Jumlah pengawas ruang</span><span class="seg">${[1, 2].map(k => `<button class="${Ck.nPengawas === k ? 'on' : ''}" data-act="ckPengawas" data-v="${k}">${k} pengawas</button>`).join('')}</span></div>
        ${tab === 'berita' ? `<label class="row" style="gap:8px;font-weight:500;margin-bottom:14px"><span class="sw"><input type="checkbox" data-ch="ckKepsek" ${Ck.baKepsek ? 'checked' : ''}><i></i></span>Kolom tanda tangan Kepala Sekolah</label>` : ''}`;
      info = `<b>${n}</b> ${tab === 'hadir' ? 'daftar hadir' : 'berita acara'} (satu per ruang per sesi)`;
    }
    el.innerHTML = `
      <div class="ph"><div><h1>Cetak Dokumen</h1><p>Pilih dokumen dan cakupannya. Di dialog cetak, pilih printer atau <b>Simpan sebagai PDF</b>, skala 100%, dan matikan "Header dan footer".</p></div></div>
      <div class="tabs">${[['kartu', 'Kartu Sumatif'], ['terima', 'Daftar Terima Kartu'], ['hadir', 'Daftar Hadir'], ['berita', 'Berita Acara']].map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="ckTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="g g-12" style="align-items:start"><div class="card">${opsi}
          <div style="padding:12px 0;border-top:1px solid var(--bd);margin-top:4px">${info}</div>
          <button class="btn pri" style="width:100%" data-act="ckCetak" ${n ? '' : 'disabled'}>${ic('printer')} Cetak / Simpan PDF</button></div>
        <div class="card"><div class="ch"><h3>Pratinjau</h3><span class="mu">halaman pertama</span></div><div class="pv"><div class="pv-paper" id="ck-pv"></div></div></div></div>`;
    ckPreview();
  }
};
function ckPreview() {
  const p = $('#ck-pv'); if (!p) return;
  if (Ck.tab === 'kartu') {
    const t = ckTemplat(), d = dims(t), list = ckSiswa().slice(0, t.cols * t.rows);
    p.style.cssText = `width:${d.pw}mm;height:${d.ph}mm;padding:${t.L.margin}mm`;
    const isi = () => { p.innerHTML = list.length ? lembarKartu(t, list) : emptyBox('Tidak ada siswa pada cakupan ini'); cetakFit(); };
    isi(); if (t.L.showFoto) Foto.ensure(list).then(() => { if (p.isConnected && Ck.tab === 'kartu') isi(); });
  } else if (Ck.tab === 'terima') {
    const [pw, ph] = PAPER[Ck.kertas], k = ckTerima()[0];
    p.style.cssText = `width:${pw}mm;min-height:${ph}mm;padding:${DOC_MARGIN}`;
    p.innerHTML = k ? terimaHTML(k) : emptyBox('Belum ada data siswa');
    cetakFit();
  } else {
    const [pw, ph] = PAPER[Ck.kertas], x = ckSesi()[0];
    p.style.cssText = `width:${pw}mm;min-height:${ph}mm;padding:${DOC_MARGIN}`;
    p.innerHTML = x ? (Ck.tab === 'hadir' ? daftarHadirHTML(x) : beritaAcaraHTML(x)) : emptyBox('Tidak ada sesi yang cocok', 'Ubah filter atau tambahkan ruang / jadwal sesi.');
    cetakFit();
  }
}
function cetakFit() { fitPaper('#ck-pv', Ck.tab === 'kartu' ? dims(ckTemplat()).pw : PAPER[Ck.kertas][0], .85); }
window.cetakFit = cetakFit;
Act.ckTab = t => { Ck.tab = t.dataset.v; rerender(); };
Act.ckScope = t => { Ck.scope = t.dataset.v; rerender(); };
Act.ckKertas = t => { Ck.kertas = t.dataset.v; ckSimpan(); rerender(); };
Act.ckSebutan = t => { Ck.sebutan = t.dataset.v; ckSimpan(); rerender(); };
Act.ckPengawas = t => { Ck.nPengawas = +t.dataset.v; ckSimpan(); rerender(); };
On.ckKepsek = t => { Ck.baKepsek = t.checked; ckSimpan(); rerender(); };
On.ckSet = t => { Ck[t.name] = t.value; if (t.name === 'tgl') Ck.mapel = ''; rerender(); };
Act.ckCetak = async t => {
  if (Ck.tab === 'terima') { printDoc(ckTerima().map(terimaHTML), Ck.kertas, DOC_MARGIN); return; }
  if (Ck.tab !== 'kartu') { const list = ckSesi(); printDoc(list.map(Ck.tab === 'hadir' ? daftarHadirHTML : beritaAcaraHTML), Ck.kertas, DOC_MARGIN); return; }
  const tpl = ckTemplat(), list = ckSiswa(), per = tpl.cols * tpl.rows, pages = [];
  if (tpl.L.showFoto) {                                             // muat foto yang belum ada di perangkat (per 20)
    t.disabled = true; const label = t.innerHTML;
    await Foto.ensure(list, (i, n) => { t.textContent = `Memuat foto ${i}/${n}…`; });
    t.disabled = false; t.innerHTML = label;
  }
  for (let i = 0; i < list.length; i += per) pages.push(lembarKartu(tpl, list.slice(i, i + per)));
  printDoc(pages, tpl.kertas, tpl.L.margin + 'mm');
};

/* ================= LAPORAN TABEL ================= */
const Lp = { tab: 'siswa', q: '', f: '', page: 1 };
function lapData() {
  const ix = IX(), q = Lp.q.trim().toLowerCase(), cari = a => !q || a.join(' ').toLowerCase().includes(q);
  if (Lp.tab === 'siswa') return {
    judul: 'DATA SISWA', berkas: 'Data-Siswa', cols: ['No', 'Nama', 'NIS', 'NISN', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas'], filter: daftarKelas(), label: 'Semua Kelas',
    rows: DB.siswa.filter(s => !Lp.f || s.kelas === Lp.f).sort((a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama)).map(s => [s.nama, s.nis, s.nisn, s.tempatLahir, fTgl(s.tglLahir), s.kelas]).filter(cari)
  };
  if (Lp.tab === 'peserta') return {
    judul: 'DAFTAR PESERTA, NOMOR UJIAN, DAN RUANG', berkas: 'Peserta', cols: ['No', 'No Ujian', 'Nama', 'NISN', 'Kelas', 'Ruang', 'No Urut'], filter: ruangUrut().map(r => [r.id, r.nama]), label: 'Semua Ruang',
    rows: DB.peserta.filter(p => ix.sis.has(p.nisn) && (!Lp.f || p.idRuang === Lp.f)).sort((a, b) => nat(a.noUjian, b.noUjian)).map(p => { const s = ix.sis.get(p.nisn); return [p.noUjian, s.nama, s.nisn, s.kelas, (ix.ruang.get(p.idRuang) || {}).nama || '', p.noUrut]; }).filter(cari)
  };
  return {
    judul: 'JADWAL SESI', berkas: 'Jadwal-Sesi', lanskap: true, cols: ['No', 'Hari / Tanggal', 'Mata Pelajaran', 'Jam', 'Ruang', 'Pengawas 1', 'Pengawas 2', 'Hadir', 'Tidak Hadir', 'Catatan'], filter: [...new Set(DB.sesi.map(x => x.tanggal))].sort().map(t => [t, fTgl(t, true)]), label: 'Semua Tanggal',
    rows: sesiUrut(DB.sesi.filter(x => !Lp.f || x.tanggal === Lp.f)).map(x => [fTgl(x.tanggal, true), x.mapel, x.jam, (ix.ruang.get(x.idRuang) || {}).nama || '', x.pengawas, x.pengawas2 || '', x.hadir, x.tidakHadir, x.catatan]).filter(cari)
  };
}
Pages.laporan = {
  title: 'Laporan Tabel', crumb: 'Laporan',
  render(el) {
    const d = lapData();
    el.innerHTML = `
      <div class="ph"><div><h1>Laporan Tabel</h1><p>Lihat, saring, lalu unduh tabel sebagai Excel atau PDF. Unduhan mengikuti pencarian dan filter yang sedang aktif.</p></div></div>
      <div class="tabs">${[['siswa', 'Data Siswa'], ['peserta', 'Peserta (No Ujian & Ruang)'], ['sesi', 'Jadwal Sesi']].map(t => `<button class="${Lp.tab === t[0] ? 'on' : ''}" data-act="lpTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="card flush"><div class="tools"><div class="srch">${ic('search')}<input class="in" placeholder="Cari di tabel…" value="${esc(Lp.q)}" data-on="lpCari" aria-label="Cari di tabel"></div>
        <select class="in" data-ch="lpFilter" aria-label="Filter">${opts(d.filter, Lp.f, d.label)}</select><span class="grow"></span>
        <button class="btn" data-act="lpExcel">${ic('download')} Unduh Excel</button><button class="btn" data-act="lpPdf">${ic('file')} Unduh PDF</button></div>
        <div id="lp-tbl"></div></div>`;
    lapTbl();
  }
};
function lapTbl() {
  const el = $('#lp-tbl'); if (!el) return;
  const d = lapData(); Lp.page = clamp(Lp.page, 1, Math.max(1, Math.ceil(d.rows.length / 25)));
  const mulai = (Lp.page - 1) * 25;
  el.innerHTML = d.rows.length ? `<div class="tw"><table class="tbl"><thead><tr>${d.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>
    ${d.rows.slice(mulai, mulai + 25).map((r, i) => `<tr><td class="mu">${mulai + i + 1}</td>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${pager(d.rows.length, Lp.page, 25, 'lpPage')}`
    : emptyBox('Tidak ada data', 'Tabel ini masih kosong atau tidak ada yang cocok dengan filter.');
}
Act.lpTab = t => { Lp.tab = t.dataset.v; Lp.q = ''; Lp.f = ''; Lp.page = 1; rerender(); };
On.lpCari = debounce(t => { Lp.q = t.value; Lp.page = 1; lapTbl(); }, 200);
On.lpFilter = t => { Lp.f = t.value; Lp.page = 1; lapTbl(); };
Act.lpPage = t => { Lp.page = +t.dataset.p; lapTbl(); };
Act.lpExcel = async () => {
  const d = lapData(); if (!d.rows.length) { toast('Tidak ada data untuk diunduh.', 'er'); return; }
  try {
    await loadXLSX();                                               // Excel dibuat di peramban — tanpa beban server
    const aoa = [d.cols].concat(d.rows.map((r, i) => [String(i + 1)].concat(r.map(c => String(c == null ? '' : c)))));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = d.cols.map((c, i) => ({ wch: clamp(Math.max(c.length, ...aoa.slice(1, 200).map(r => r[i].length)) + 2, 5, 45) }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, d.berkas.slice(0, 30));
    XLSX.writeFile(wb, 'ASAS-' + d.berkas + '-' + isoHariIni() + '.xlsx');
  } catch (e) { toast(e.message, 'er'); }
};
Act.lpPdf = () => {
  const d = lapData(); if (!d.rows.length) { toast('Tidak ada data untuk diunduh.', 'er'); return; }
  const s = DB.set;
  printDoc([`<div class="doc rep">${kopHTML(1)}<h2>${d.judul}</h2><p>SUMATIF AKHIR SEMESTER ${esc((s.semester || '').toUpperCase())} TAHUN AJARAN ${esc(s.tahunAjaran || '')}</p>
    <table class="grid"><thead><tr>${d.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${d.rows.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`], 'A4', '12mm', d.lanskap);
  toast('Pilih "Simpan sebagai PDF" pada dialog cetak.');
};
