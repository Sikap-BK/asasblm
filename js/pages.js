/* ============================================================
   ASAS — Halaman data: Dashboard, Data Siswa, Ruang & No Ujian, Jadwal Sesi
   Semua filter / cari / urut / halaman dikerjakan lokal (tanpa server).
   ============================================================ */
'use strict';
const St = {
  siswa: { q: '', kelas: '', status: '', page: 1 },
  ruang: { q: '', fr: '', page: 1 },
  sesi: { q: '', tgl: '', page: 1 },
  fmt: null
};
const PER = 20;

/* ================= DASHBOARD ================= */
Pages.dashboard = {
  title: 'Dashboard', crumb: 'Administrasi Sumatif',
  render(el) {
    const s = DB.set, nS = DB.siswa.length, nR = DB.ruang.length, nP = DB.peserta.length;
    const nFoto = DB.siswa.filter(x => x.fotoId).length;
    const slot = new Map(); DB.sesi.forEach(x => { const k = x.tanggal + '|' + x.jam + '|' + x.mapel; slot.set(k, (slot.get(k) || 0) + 1); });
    const steps = [
      ['siswa', 'Impor Data Siswa', nS ? `${nS} siswa di ${daftarKelas().length} kelas` : 'Unduh templat Excel, isi, lalu impor', nS > 0],
      ['ruang', 'Atur Ruang & Nomor Ujian', nP ? `${nP} peserta terbagi di ${nR} ruang` : 'Buat ruang lalu bagi peserta otomatis', nS > 0 && nP >= nS],
      ['sesi', 'Susun Jadwal Sesi', slot.size ? `${slot.size} sesi terjadwal` : 'Isi hari, mata pelajaran, jam, dan pengawas', slot.size > 0],
      ['kop', 'Atur Kop Surat', s.kop ? 'Kop surat tersimpan' : 'Atur logo dan baris teks kop', !!s.kop],
      ['kartu', 'Desain Kartu', DB.templat.length ? `${DB.templat.length} templat tersimpan` : 'Pilih kertas, jumlah kartu, dan tata letak', DB.templat.length > 0]
    ];
    const done = steps.filter(x => x[3]).length, now = steps.findIndex(x => !x[3]);
    const hariIni = isoHariIni();
    const mendatang = [...slot.keys()].map(k => { const [tanggal, jam, mapel] = k.split('|'); return { tanggal, jam, mapel, n: slot.get(k) }; })
      .filter(x => x.tanggal >= hariIni).sort((a, b) => (a.tanggal + a.jam).localeCompare(b.tanggal + b.jam)).slice(0, 5);
    const kpi = (label, val, icon, cls, foot) => `<div class="card"><div class="kpi"><div><small>${label}</small><b>${val}</b></div><span class="ki ${cls}">${ic(icon)}</span></div><div class="kpi-f">${foot}</div></div>`;
    el.innerHTML = `
      <div class="ph"><div><h1>Selamat datang, ${esc(S.user || 'Admin')}</h1>
        <p>${esc(namaSekolah() || 'ASAS')} — kelola persiapan Sumatif Akhir Semester ${esc(s.semester || '')} Tahun Ajaran ${esc(s.tahunAjaran || '—')}.</p></div>
        <div class="acts"><span class="btn" style="cursor:default">${ic('calendar')} ${fTgl(hariIni, true)}</span></div></div>
      <div class="g g4">
        ${kpi('Total Siswa', nS, 'users', '', `Terdaftar di ${daftarKelas().length} kelas`)}
        ${kpi('Jumlah Ruang', nR, 'building', '', `Kapasitas total ${DB.ruang.reduce((a, r) => a + (+r.kapasitas || 0), 0)} kursi`)}
        ${kpi('Jumlah Sesi', slot.size, 'clock', '', `${DB.sesi.length} jadwal ruang`)}
        ${kpi('Foto Siswa', nFoto, 'camera', 's', nS ? `${Math.round(nFoto / nS * 100)}% dari seluruh siswa` : 'Belum ada siswa')}
      </div>
      <div class="g g-21 mt">
        <div class="card"><div class="ch"><h3>Langkah Persiapan</h3><span class="chip chip-ok">${done} dari ${steps.length} selesai</span><span class="grow"></span><b style="color:var(--p)">${Math.round(done / steps.length * 100)}%</b>
          <p>Selesaikan seluruh tahapan sebelum mencetak kartu, daftar hadir, dan berita acara.</p></div>
          <div class="bar" style="margin-bottom:14px"><i style="width:${done / steps.length * 100}%"></i></div>
          ${steps.map((x, i) => `<a class="step ${x[3] ? 'done' : i === now ? 'now' : ''}" href="#/${x[0]}"><span class="sn">${ic(x[3] ? 'check' : i === now ? 'edit' : 'clock')}</span><span><b>${x[1]}</b><small>${esc(x[2])}</small></span>
            <span class="bdg ${x[3] ? 'ok' : i === now ? 'pr' : 'wa'}">${x[3] ? 'Selesai' : i === now ? 'Kerjakan' : 'Menunggu'}</span></a>`).join('')}
          <div class="row" style="margin-top:16px;justify-content:flex-end"><a class="btn pri" href="#/${now < 0 ? 'cetak' : steps[now][0]}">${now < 0 ? 'Cetak Dokumen' : 'Lanjutkan: ' + steps[now][1]} ${ic('right')}</a></div>
        </div>
        <div class="card"><div class="ch"><h3>Sesi Mendatang</h3><span class="grow"></span><a href="#/sesi" class="btn sm">Lihat semua</a><p>Jadwal pelaksanaan terdekat</p></div>
          ${mendatang.length ? mendatang.map(x => { const d = pTgl(x.tanggal); return `<div class="ses"><div class="dt"><small>${d ? BLN[d.getMonth()].slice(0, 3).toUpperCase() : ''}</small>${d ? d.getDate() : ''}</div><div><b>${esc(x.mapel)}</b><span>${esc(x.jam)} · ${x.n} ruang</span></div></div>`; }).join('')
            : emptyBox('Belum ada sesi mendatang', 'Tambahkan jadwal di menu Jadwal Sesi.')}
          <div class="note" style="margin-top:14px">${ic('info')}<span>Cetak kartu dan daftar hadir beberapa hari sebelum sesi pertama, lalu uji ukuran di printer yang akan dipakai.</span></div>
        </div>
      </div>`;
  }
};

/* ================= DATA SISWA ================= */
function nisnGanda() { const c = new Map(); DB.siswa.forEach(s => c.set(s.nisn, (c.get(s.nisn) || 0) + 1)); return c; }
function siswaTersaring() {
  const f = St.siswa, q = f.q.trim().toLowerCase(), g = nisnGanda();
  return DB.siswa.filter(s => (!f.kelas || s.kelas === f.kelas)
    && (!q || (s.nama + ' ' + s.nis + ' ' + s.nisn).toLowerCase().includes(q))
    && (!f.status || (f.status === 'ganda' ? g.get(s.nisn) > 1 : f.status === 'foto' ? !!s.fotoId : !s.fotoId)))
    .sort((a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama));
}
Pages.siswa = {
  title: 'Data Siswa',
  render(el) {
    const n = DB.siswa.length, nFoto = DB.siswa.filter(s => s.fotoId).length, ganda = [...nisnGanda().values()].filter(v => v > 1).reduce((a, v) => a + v, 0);
    const kpi = (label, val, icon, cls, foot) => `<div class="card"><div class="kpi"><div><small>${label}</small><b>${val}</b></div><span class="ki ${cls}">${ic(icon)}</span></div><div class="kpi-f">${foot}</div></div>`;
    el.innerHTML = `
      <div class="ph"><div><h1>Data Siswa Peserta Ujian</h1><p>Kelola identitas peserta dan pasfoto untuk penerbitan kartu sumatif.</p></div>
        <div class="acts"><button class="btn" data-act="sisTemplat">${ic('download')} Unduh Templat Excel</button><button class="btn" data-act="sisFoto">${ic('camera')} Unggah Foto</button>
          <button class="btn" data-act="sisTambah">${ic('plus')} Tambah</button><button class="btn pri" data-act="sisImpor">${ic('upload')} Impor Excel</button></div></div>
      <div class="g g4">
        ${kpi('TOTAL SISWA', n, 'users', '', `${daftarKelas().length} kelas`)}
        ${kpi('FOTO LENGKAP', nFoto, 'check', 's', n ? Math.round(nFoto / n * 100) + '% siap cetak dengan foto' : '—')}
        ${kpi('PASFOTO KOSONG', n - nFoto, 'image', 'w', 'Perlu unggah foto')}
        ${kpi('NISN GANDA', ganda, 'alert', ganda ? 'e' : '', ganda ? 'Perlu diperbaiki' : 'Tidak ada duplikasi')}
      </div>
      <div class="card flush mt">
        <div class="tools"><div class="srch">${ic('search')}<input class="in" placeholder="Cari nama, NIS, atau NISN siswa…" value="${esc(St.siswa.q)}" data-on="sisCari" aria-label="Cari siswa"></div>
          <select class="in" data-ch="sisKelas" aria-label="Filter kelas">${opts(daftarKelas(), St.siswa.kelas, 'Semua Kelas')}</select>
          <select class="in" data-ch="sisStatus" aria-label="Filter status">${opts([['foto', 'Foto ada'], ['nofoto', 'Foto belum ada'], ['ganda', 'NISN ganda']], St.siswa.status, 'Semua Status')}</select></div>
        <div id="sis-tbl"></div>
      </div>
      <div class="note mt">${ic('info')}<span><b>Unggah foto massal:</b> beri nama berkas sesuai NISN (contoh <span class="mono">0091823412.jpg</span>), pilih banyak berkas sekaligus. Foto diperkecil otomatis menjadi 3×4 sebelum diunggah.</span></div>`;
    siswaTbl();
  }
};
function siswaTbl() {
  const el = $('#sis-tbl'); if (!el) return;
  const rows = siswaTersaring(), g = nisnGanda(), f = St.siswa;
  f.page = clamp(f.page, 1, Math.max(1, Math.ceil(rows.length / PER)));
  const view = rows.slice((f.page - 1) * PER, f.page * PER);
  if (!DB.siswa.length) { el.innerHTML = emptyBox('Belum ada data siswa', 'Unduh templat Excel, isi data siswa, lalu klik Impor Excel.'); return; }
  el.innerHTML = `<div class="tw"><table class="tbl"><thead><tr><th>No</th><th>Foto</th><th>Nama Siswa</th><th>NIS</th><th>NISN</th><th>Tempat, Tanggal Lahir</th><th>Kelas</th><th>Status</th><th class="r">Aksi</th></tr></thead><tbody>
    ${view.map((s, i) => {
      const dup = g.get(s.nisn) > 1, ini = s.nama.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
      return `<tr><td class="mu">${(f.page - 1) * PER + i + 1}</td><td><span class="ava" ${s.fotoId ? `data-foto="${esc(s.nisn)}"` : ''}>${esc(ini)}</span></td>
        <td><b>${esc(s.nama)}</b></td><td class="mono">${esc(s.nis)}</td><td class="mono" ${dup ? 'style="color:var(--er);font-weight:700"' : ''}>${esc(s.nisn)}</td>
        <td class="nw">${esc([s.tempatLahir, fTgl(s.tglLahir)].filter(Boolean).join(', '))}</td><td><span class="bdg pr">${esc(s.kelas)}</span></td>
        <td>${dup ? '<span class="bdg er">NISN ganda</span>' : s.fotoId ? '<span class="bdg ok">Lengkap</span>' : '<span class="bdg se">Foto belum ada</span>'}</td>
        <td class="r nw"><button class="ib" data-act="sisEdit" data-id="${s.id}" aria-label="Ubah">${ic('edit')}</button><button class="ib dan" data-act="sisHapus" data-id="${s.id}" aria-label="Hapus">${ic('trash')}</button></td></tr>`;
    }).join('') || '<tr><td colspan="9">' + emptyBox('Tidak ada yang cocok', 'Ubah kata kunci atau filter.') + '</td></tr>'}
    </tbody></table></div>${pager(rows.length, f.page, PER, 'sisPage')}`;
  Foto.hydrate(el);
}
On.sisCari = debounce(t => { St.siswa.q = t.value; St.siswa.page = 1; siswaTbl(); }, 200);
On.sisKelas = t => { St.siswa.kelas = t.value; St.siswa.page = 1; siswaTbl(); };
On.sisStatus = t => { St.siswa.status = t.value; St.siswa.page = 1; siswaTbl(); };
Act.sisPage = t => { St.siswa.page = +t.dataset.p; siswaTbl(); };

function formSiswa(s) {
  const baru = !s; s = s || { id: uid(), nama: '', nis: '', nisn: '', tempatLahir: '', tglLahir: '', kelas: St.siswa.kelas || '' };
  const adaFoto = !baru && s.fotoId;
  modal({
    title: baru ? 'Tambah Siswa' : 'Ubah Data Siswa',
    body: fld('Nama Lengkap', 'nama', s.nama, 'required maxlength="80"') + `<div class="f2">${fld('NIS', 'nis', s.nis, 'maxlength="20"')}${fld('NISN', 'nisn', s.nisn, 'required maxlength="20" inputmode="numeric"')}</div>
      <div class="f2">${fld('Tempat Lahir', 'tempatLahir', s.tempatLahir, 'maxlength="40"')}${fld('Tanggal Lahir', 'tglLahir', pTgl(s.tglLahir) ? s.tglLahir : '', '', 'date')}</div>
      ${fld('Kelas', 'kelas', s.kelas, 'required maxlength="15" list="dl-kelas" placeholder="contoh: VII-A"')}<datalist id="dl-kelas">${daftarKelas().map(k => `<option value="${esc(k)}">`).join('')}</datalist>
      ${baru ? '' : `<div class="row"><button type="button" class="btn sm" data-act="sisFotoSatu" data-id="${s.id}" data-x>${ic('camera')} ${adaFoto ? 'Ganti' : 'Unggah'} foto</button>${adaFoto ? `<button type="button" class="btn sm dan" data-act="sisFotoHapus" data-id="${s.id}" data-x>${ic('trash')} Hapus foto</button>` : ''}</div>`}`,
    onOk(v) {
      const row = { id: s.id, nama: v.nama.trim(), nis: v.nis.trim(), nisn: v.nisn.trim(), tempatLahir: v.tempatLahir.trim(), tglLahir: v.tglLahir, kelas: v.kelas.trim() };
      if (!row.nama || !row.nisn || !row.kelas) { toast('Nama, NISN, dan Kelas wajib diisi.', 'er'); return false; }
      if (DB.siswa.some(x => x.id !== row.id && x.nisn === row.nisn)) { toast('NISN ' + row.nisn + ' sudah dipakai siswa lain.', 'er'); return false; }
      if (!baru && s.nisn !== row.nisn) {                           // NISN berubah → ikutkan data peserta & cache foto
        if (IX().pes.has(s.nisn)) Data.replace('peserta', DB.peserta.map(p => p.nisn === s.nisn ? Object.assign({}, p, { nisn: row.nisn }) : p));
        const m = Foto.mem.get(s.nisn); if (m) { Foto.put(row.nisn, m.id, m.d); Foto.del(s.nisn); }
      }
      Data.save('siswa', row); rerender(); toast(baru ? 'Siswa ditambahkan.' : 'Perubahan disimpan.', 'ok');
    }
  });
}
Act.sisTambah = () => formSiswa(null);
Act.sisEdit = t => formSiswa(DB.siswa.find(s => s.id === t.dataset.id));
Act.sisHapus = t => { const s = DB.siswa.find(x => x.id === t.dataset.id); if (s) confirmBox(`Hapus ${s.nama}? Foto dan nomor ujiannya ikut terhapus.`, () => { Foto.del(s.nisn); Data.remove('siswa', s.id); rerender(); toast('Siswa dihapus.', 'ok'); }, 'Hapus', true); };

Act.sisTemplat = async () => {
  try {
    await loadXLSX();
    const ws = XLSX.utils.aoa_to_sheet([['Nama', 'NIS', 'NISN', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas'], ['Contoh Nama Siswa', '2425001', '0091823412', 'Sangatta', '12/02/2012', 'VII-A']]);
    ws['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 10 }];
    ['B2', 'C2', 'E2'].forEach(c => { ws[c].t = 's'; ws[c].z = '@'; });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Siswa'); XLSX.writeFile(wb, 'Templat-Data-Siswa-ASAS.xlsx');
  } catch (e) { toast(e.message, 'er'); }
};

/** Ubah berbagai bentuk tanggal Excel menjadi yyyy-mm-dd. */
function bacaTgl(v) {
  const iso = (y, m, d) => (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) ? y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') : '';
  if (v instanceof Date && !isNaN(v)) { const d = new Date(v.getTime() + 12 * 3600e3); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  if (typeof v === 'number' && v > 10000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  const s = String(v || '').trim(); let m;
  if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(s))) return iso(+m[1], +m[2], +m[3]) || s;
  if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(s))) return iso(+m[3], +m[2], +m[1]) || s;
  if ((m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(s))) { const b = BLN.findIndex(x => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3))); if (b > -1) return iso(+m[3], b + 1, +m[1]) || s; }
  return s;
}
Act.sisImpor = async () => {
  const [file] = await pickFiles('.xlsx,.xls,.csv'); if (!file) return;
  let rows;
  try {
    await loadXLSX();
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
  } catch (e) { toast(e.message || 'Berkas tidak bisa dibaca.', 'er'); return; }
  const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
  const hi = rows.findIndex(r => r.some(c => norm(c) === 'nisn'));
  if (hi < 0) { toast('Kolom NISN tidak ditemukan. Gunakan templat Excel dari aplikasi.', 'er'); return; }
  const want = { nama: ['nama', 'namasiswa', 'namalengkap'], nis: ['nis'], nisn: ['nisn'], tempatLahir: ['tempatlahir'], tglLahir: ['tanggallahir', 'tgllahir'], kelas: ['kelas', 'rombel'] };
  const col = {}; rows[hi].forEach((c, i) => { const n = norm(c); Object.keys(want).forEach(k => { if (col[k] == null && want[k].includes(n)) col[k] = i; }); });
  const get = (r, k) => col[k] == null ? '' : r[col[k]];
  const ada = IX().sis, lihat = new Set(), items = [];
  rows.slice(hi + 1).forEach((r, i) => {
    if (r.every(c => String(c).trim() === '')) return;
    let nisn = String(get(r, 'nisn')).trim(); if (/^\d{1,9}$/.test(nisn)) nisn = nisn.padStart(10, '0');   // Excel membuang 0 di depan
    const it = { baris: hi + i + 2, nama: String(get(r, 'nama')).trim(), nis: String(get(r, 'nis')).trim(), nisn, tempatLahir: String(get(r, 'tempatLahir')).trim(), tglLahir: bacaTgl(get(r, 'tglLahir')), kelas: String(get(r, 'kelas')).trim() };
    const kosong = ['nama', 'nisn', 'kelas'].filter(k => !it[k]);
    it.err = kosong.length ? 'Kolom kosong: ' + kosong.join(', ') : lihat.has(nisn) ? 'NISN ganda di berkas' : '';
    if (!it.err) { lihat.add(nisn); it.lama = ada.get(nisn); }
    items.push(it);
  });
  if (!items.length) { toast('Tidak ada baris data di berkas.', 'er'); return; }
  const valid = items.filter(x => !x.err), nBaru = valid.filter(x => !x.lama).length, nUbah = valid.length - nBaru, nErr = items.length - valid.length;
  modal({
    title: 'Pratinjau Impor — ' + file.name, wide: true, ok: valid.length ? `Impor ${valid.length} baris valid` : false,
    body: `<div class="row" style="margin-bottom:14px"><span class="bdg ok">${nBaru} siswa baru</span><span class="bdg pr">${nUbah} diperbarui (NISN sudah ada)</span><span class="bdg ${nErr ? 'er' : 'ok'}">${nErr} baris dilewati</span></div>
      <div class="tw" style="max-height:52vh;overflow:auto"><table class="tbl"><thead><tr><th>Baris</th><th>Nama</th><th>NIS</th><th>NISN</th><th>Tempat, Tgl Lahir</th><th>Kelas</th><th>Status</th></tr></thead><tbody>
      ${items.slice().sort((a, b) => (b.err ? 1 : 0) - (a.err ? 1 : 0)).slice(0, 120).map(x => `<tr><td class="mu">${x.baris}</td><td>${esc(x.nama)}</td><td class="mono">${esc(x.nis)}</td><td class="mono">${esc(x.nisn)}</td><td>${esc([x.tempatLahir, fTgl(x.tglLahir)].filter(Boolean).join(', '))}</td><td>${esc(x.kelas)}</td>
        <td>${x.err ? `<span class="bdg er">${esc(x.err)}</span>` : x.lama ? '<span class="bdg pr">Perbarui</span>' : '<span class="bdg ok">Baru</span>'}</td></tr>`).join('')}
      </tbody></table></div>${items.length > 120 ? `<p class="mu" style="margin-top:8px">Menampilkan 120 dari ${items.length} baris (baris bermasalah di atas).</p>` : ''}`,
    onOk() {
      Data.bulk('siswa', valid.map(x => ({ id: x.lama ? x.lama.id : uid(), nama: x.nama, nis: x.nis, nisn: x.nisn, tempatLahir: x.tempatLahir, tglLahir: x.tglLahir, kelas: x.kelas })));
      rerender(); toast(`${valid.length} siswa diimpor${nErr ? ', ' + nErr + ' baris dilewati' : ''}.`, 'ok', 'Impor selesai');
    }
  });
};

/** Unggah foto: perkecil di peramban → kirim per 8 berkas → simpan juga di cache perangkat. */
async function unggahFoto(pasangan) {                               // [[nisn, File], …]
  const m = modal({ title: 'Mengunggah Foto', ok: false, cancel: 'Sembunyikan', body: '<p id="uf-t">Menyiapkan…</p><div class="bar" style="margin-top:12px"><i id="uf-b" style="width:0"></i></div>' });
  let ok = 0, gagal = 0;
  for (let i = 0; i < pasangan.length; i += 8) {
    const items = [];
    for (const [nisn, f] of pasangan.slice(i, i + 8)) { try { items.push({ nisn, dataUrl: await resizeImage(f, { cover: [300, 400], q: .82 }) }); } catch (e) { gagal++; } }
    if (items.length) {
      const res = await api('fotoPut', { items });
      if (res.success) items.forEach(it => { const id = res.data[it.nisn]; if (!id) { gagal++; return; } ok++; Foto.put(it.nisn, id, it.dataUrl); const s = IX().sis.get(it.nisn); if (s) { s.foto = it.nisn + '.jpg'; s.fotoId = id; } });
      else { gagal += items.length; if (res.code === 'AUTH') break; }
    }
    const n = Math.min(pasangan.length, i + 8);
    if ($('#uf-t')) { $('#uf-t').textContent = `${n} dari ${pasangan.length} foto diproses…`; $('#uf-b').style.width = n / pasangan.length * 100 + '%'; }
  }
  m.close(); Data.touch(); rerender();
  toast(`${ok} foto tersimpan${gagal ? ', ' + gagal + ' gagal' : ''}.`, gagal && !ok ? 'er' : 'ok', 'Unggah foto');
}
Act.sisFoto = async () => {
  if (!DB.siswa.length) { toast('Impor data siswa dulu sebelum mengunggah foto.', 'er'); return; }
  const files = await pickFiles('image/jpeg,image/png,image/webp', true); if (!files.length) return;
  const ix = IX().sis, cocok = [], tak = [];
  files.forEach(f => { const n = f.name.replace(/\.[^.]+$/, '').trim(); ix.has(n) ? cocok.push([n, f]) : tak.push(f.name); });
  if (tak.length) toast(`${tak.length} berkas dilewati karena namanya bukan NISN siswa (mis. ${tak[0]}).`, cocok.length ? '' : 'er');
  if (cocok.length) unggahFoto(cocok);
};
Act.sisFotoSatu = async t => { const s = DB.siswa.find(x => x.id === t.dataset.id); const [f] = await pickFiles('image/jpeg,image/png,image/webp'); if (s && f) unggahFoto([[s.nisn, f]]); };
Act.sisFotoHapus = async t => {
  const s = DB.siswa.find(x => x.id === t.dataset.id); if (!s) return;
  const res = await api('fotoDel', { nisn: s.nisn });
  if (!res.success) { toast(res.message || 'Gagal menghapus foto.', 'er'); return; }
  s.foto = ''; s.fotoId = ''; Foto.del(s.nisn); Data.touch(); rerender(); toast('Foto dihapus.', 'ok');
};

/* ================= RUANG & NO UJIAN ================= */
function fmtNo() {
  if (!St.fmt) St.fmt = Object.assign({ prefiks: '', tahun: String(new Date().getFullYear()), digit: 3, sep: '-', urut: 'kelas' }, DB.set.fmtNo || {});
  return St.fmt;
}
const buatNo = n => { const f = fmtNo(); return [f.prefiks, f.tahun, String(n).padStart(clamp(+f.digit || 3, 1, 6), '0')].filter(x => x !== '').join(f.sep); };
/** Nomor urut di ruang selalu mengikuti urutan nomor ujian. */
function urutkanUlang(pes) {
  const by = new Map(); pes.forEach(p => { if (!by.has(p.idRuang)) by.set(p.idRuang, []); by.get(p.idRuang).push(p); });
  by.forEach(a => a.sort((x, y) => nat(x.noUjian, y.noUjian)).forEach((p, i) => p.noUrut = String(i + 1)));
  return pes;
}
function bagiPeserta(sisaSaja) {
  const f = fmtNo(), rooms = ruangUrut(), ix = IX();
  if (!DB.siswa.length) { toast('Belum ada data siswa.', 'er'); return; }
  if (!rooms.length) { toast('Buat ruang terlebih dahulu.', 'er'); return; }
  let list = DB.siswa.slice(), pes = [], n = 0;
  const isi = new Map(rooms.map(r => [r.id, 0]));
  if (sisaSaja) {
    pes = DB.peserta.map(p => Object.assign({}, p)); list = list.filter(s => !ix.pes.has(s.nisn));
    pes.forEach(p => { isi.set(p.idRuang, (isi.get(p.idRuang) || 0) + 1); const m = /(\d+)\D*$/.exec(p.noUjian); if (m) n = Math.max(n, +m[1]); });
  }
  const total = rooms.reduce((a, r) => a + (+r.kapasitas || 0), 0) - [...isi.values()].reduce((a, v) => a + v, 0);
  if (total < list.length) { toast(`Kapasitas ruang kurang ${list.length - total} kursi. Tambah ruang atau naikkan kapasitas.`, 'er', 'Belum bisa dibagi'); return; }
  if (f.urut === 'acak') { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } }
  else list.sort(f.urut === 'abjad' ? (a, b) => nat(a.nama, b.nama) : (a, b) => cmpKelas(a.kelas, b.kelas) || nat(a.nama, b.nama));
  let ri = 0;
  list.forEach(s => {
    while (isi.get(rooms[ri].id) >= (+rooms[ri].kapasitas || 0)) ri++;
    isi.set(rooms[ri].id, isi.get(rooms[ri].id) + 1);
    pes.push({ nisn: s.nisn, noUjian: buatNo(++n), idRuang: rooms[ri].id, noUrut: '' });
  });
  Data.set({ fmtNo: Object.assign({}, f) }); Data.replace('peserta', urutkanUlang(pes)); rerender();
  toast(`${list.length} peserta dibagi ke ruang dan diberi nomor ujian.`, 'ok', 'Pembagian selesai');
}
Pages.ruang = {
  title: 'Ruang & No Ujian',
  render(el) {
    const f = fmtNo(), rooms = ruangUrut(), ix = IX();
    const isi = new Map(); DB.peserta.forEach(p => isi.set(p.idRuang, (isi.get(p.idRuang) || 0) + 1));
    const belum = DB.siswa.filter(s => !ix.pes.has(s.nisn)).length, kap = rooms.reduce((a, r) => a + (+r.kapasitas || 0), 0);
    el.innerHTML = `
      <div class="ph"><div><h1>Ruang & Nomor Ujian</h1><p>Buat ruang, atur format nomor ujian, bagi peserta otomatis, lalu sesuaikan manual bila perlu.</p></div></div>
      <div class="g g-12">
        <div class="card flush"><div class="tools"><h3 style="font-size:16px">Daftar Ruang</h3><span class="chip plain">${rooms.length} ruang · ${kap} kursi</span><span class="grow"></span>
            <button class="btn sm" data-act="rgBanyak">${ic('layout')} Buat Banyak</button><button class="btn sm pri" data-act="rgTambah">${ic('plus')} Tambah</button></div>
          ${rooms.length ? `<div class="tw" style="max-height:330px;overflow:auto"><table class="tbl"><thead><tr><th>Nama Ruang</th><th class="r">Kapasitas</th><th class="r">Terisi</th><th class="r">Aksi</th></tr></thead><tbody>
            ${rooms.map(r => `<tr><td><b>${esc(r.nama)}</b></td><td class="r">${esc(r.kapasitas)}</td><td class="r">${isi.get(r.id) || 0}</td>
              <td class="r nw"><button class="ib" data-act="rgEdit" data-id="${r.id}" aria-label="Ubah">${ic('edit')}</button><button class="ib dan" data-act="rgHapus" data-id="${r.id}" aria-label="Hapus">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
            : emptyBox('Belum ada ruang', 'Klik Buat Banyak untuk membuat beberapa ruang sekaligus.')}
        </div>
        <div class="card"><div class="ch"><h3>Format Nomor & Pembagian</h3><span class="grow"></span><span class="chip plain mono" id="no-prev">${esc(buatNo(1))}</span></div>
          <div class="f2">${fld('Prefiks', 'prefiks', f.prefiks, 'data-on="fmtNo" maxlength="10" placeholder="mis. 04"')}${fld('Tahun', 'tahun', f.tahun, 'data-on="fmtNo" maxlength="9"')}</div>
          <div class="f2">${fld('Jumlah digit urut', 'digit', f.digit, 'data-on="fmtNo" min="1" max="6"', 'number')}${sel('Pemisah', 'sep', [['-', 'Tanda hubung ( - )'], ['.', 'Titik ( . )'], ['/', 'Garis miring ( / )'], ['', 'Tanpa pemisah']], f.sep, 'data-ch="fmtNo"')}</div>
          ${sel('Urutan pembagian', 'urut', [['kelas', 'Urut kelas, lalu abjad nama'], ['abjad', 'Urut abjad nama (kelas tercampur)'], ['acak', 'Acak']], f.urut, 'data-ch="fmtNo"')}
          ${belum && DB.peserta.length ? `<div class="note wa" style="margin-bottom:14px">${ic('alert')}<span>${belum} siswa belum mendapat ruang dan nomor ujian.</span></div>` : ''}
          <div class="row"><button class="btn pri" data-act="rgBagi">${ic('shuffle')} ${DB.peserta.length ? 'Bagi Ulang Semua' : 'Bagi Otomatis'}</button>
            ${belum && DB.peserta.length ? `<button class="btn" data-act="rgSisa">${ic('plus')} Bagikan ${belum} Sisanya</button>` : ''}</div>
        </div>
      </div>
      <div class="card flush mt">
        <div class="tools"><h3 style="font-size:16px">Peserta per Ruang</h3><div class="srch">${ic('search')}<input class="in" placeholder="Cari nama atau nomor ujian…" value="${esc(St.ruang.q)}" data-on="pesCari" aria-label="Cari peserta"></div>
          <select class="in" data-ch="pesFilter" aria-label="Filter ruang">${opts(rooms.map(r => [r.id, r.nama]), St.ruang.fr, 'Semua Ruang')}</select></div>
        <div id="pes-tbl"></div>
      </div>`;
    pesertaTbl();
  }
};
function pesertaTbl() {
  const el = $('#pes-tbl'); if (!el) return;
  const f = St.ruang, q = f.q.trim().toLowerCase(), ix = IX(), rooms = ruangUrut();
  const rows = DB.peserta.map(p => ({ p, s: ix.sis.get(p.nisn) })).filter(x => x.s && (!f.fr || x.p.idRuang === f.fr) && (!q || (x.s.nama + ' ' + x.p.noUjian).toLowerCase().includes(q)))
    .sort((a, b) => nat(a.p.noUjian, b.p.noUjian));
  if (!DB.peserta.length) { el.innerHTML = emptyBox('Peserta belum dibagi', 'Atur format nomor lalu klik Bagi Otomatis.'); return; }
  f.page = clamp(f.page, 1, Math.max(1, Math.ceil(rows.length / PER)));
  el.innerHTML = `<div class="tw"><table class="tbl"><thead><tr><th>No Ujian</th><th>Nama Siswa</th><th>Kelas</th><th>Ruang</th><th class="r">No Urut</th></tr></thead><tbody>
    ${rows.slice((f.page - 1) * PER, f.page * PER).map(x => `<tr><td class="mono"><b>${esc(x.p.noUjian)}</b></td><td>${esc(x.s.nama)}</td><td><span class="bdg pr">${esc(x.s.kelas)}</span></td>
      <td><select class="in sm" style="width:auto" data-ch="pesRuang" data-n="${esc(x.p.nisn)}" aria-label="Pindah ruang">${opts(rooms.map(r => [r.id, r.nama]), x.p.idRuang)}</select></td><td class="r">${esc(x.p.noUrut)}</td></tr>`).join('')
    || '<tr><td colspan="5">' + emptyBox('Tidak ada yang cocok') + '</td></tr>'}</tbody></table></div>${pager(rows.length, f.page, PER, 'pesPage')}`;
}
On.fmtNo = t => { const f = fmtNo(); f[t.name] = t.value; const p = $('#no-prev'); if (p) p.textContent = buatNo(1); };
On.pesCari = debounce(t => { St.ruang.q = t.value; St.ruang.page = 1; pesertaTbl(); }, 200);
On.pesFilter = t => { St.ruang.fr = t.value; St.ruang.page = 1; pesertaTbl(); };
Act.pesPage = t => { St.ruang.page = +t.dataset.p; pesertaTbl(); };
On.pesRuang = t => {
  const pes = DB.peserta.map(p => p.nisn === t.dataset.n ? Object.assign({}, p, { idRuang: t.value }) : Object.assign({}, p));
  Data.replace('peserta', urutkanUlang(pes)); rerender(); toast('Peserta dipindahkan.', 'ok');
};
function formRuang(r) {
  const baru = !r; r = r || { id: uid(), nama: '', kapasitas: '20' };
  modal({
    title: baru ? 'Tambah Ruang' : 'Ubah Ruang', body: fld('Nama Ruang', 'nama', r.nama, 'required maxlength="40" placeholder="mis. Ruang 01"') + fld('Kapasitas (kursi)', 'kapasitas', r.kapasitas, 'required min="1" max="200"', 'number'),
    onOk(v) { Data.save('ruang', { id: r.id, nama: v.nama.trim(), kapasitas: String(clamp(+v.kapasitas || 1, 1, 200)) }); rerender(); }
  });
}
Act.rgTambah = () => formRuang(null);
Act.rgEdit = t => formRuang(DB.ruang.find(r => r.id === t.dataset.id));
Act.rgHapus = t => { const r = DB.ruang.find(x => x.id === t.dataset.id); if (r) confirmBox(`Hapus ${r.nama}? Peserta dan jadwal sesi di ruang ini ikut dilepas.`, () => { Data.remove('ruang', r.id); rerender(); }, 'Hapus', true); };
Act.rgBanyak = () => modal({
  title: 'Buat Banyak Ruang', ok: 'Buat',
  body: `<div class="f2">${fld('Jumlah ruang', 'n', Math.max(1, Math.ceil(DB.siswa.length / 20)), 'required min="1" max="60"', 'number')}${fld('Kapasitas tiap ruang', 'kap', 20, 'required min="1" max="200"', 'number')}</div>${fld('Awalan nama', 'awalan', 'Ruang', 'maxlength="30"')}`,
  onOk(v) {
    const mulai = DB.ruang.length, rows = [];
    for (let i = 1; i <= clamp(+v.n || 1, 1, 60); i++) rows.push({ id: uid() + i, nama: (v.awalan.trim() || 'Ruang') + ' ' + String(mulai + i).padStart(2, '0'), kapasitas: String(clamp(+v.kap || 1, 1, 200)) });
    Data.bulk('ruang', rows); rerender(); toast(rows.length + ' ruang dibuat.', 'ok');
  }
});
Act.rgBagi = () => DB.peserta.length ? confirmBox('Pembagian ruang dan semua nomor ujian yang ada akan dibuat ulang dari awal.', () => bagiPeserta(false), 'Bagi ulang') : bagiPeserta(false);
Act.rgSisa = () => bagiPeserta(true);

/* ================= JADWAL SESI ================= */
Pages.sesi = {
  title: 'Jadwal Sesi',
  render(el) {
    const tgl = [...new Set(DB.sesi.map(x => x.tanggal))].sort();
    el.innerHTML = `
      <div class="ph"><div><h1>Jadwal Sesi</h1><p>Satu baris = satu sesi di satu ruang. Pengawas, jumlah hadir, dan catatan dipakai pada Daftar Hadir dan Berita Acara.</p></div>
        <div class="acts"><button class="btn pri" data-act="sesTambah">${ic('plus')} Tambah Sesi</button></div></div>
      <div class="card flush"><div class="tools"><div class="srch">${ic('search')}<input class="in" placeholder="Cari mata pelajaran atau pengawas…" value="${esc(St.sesi.q)}" data-on="sesCari" aria-label="Cari sesi"></div>
        <select class="in" data-ch="sesTgl" aria-label="Filter tanggal">${opts(tgl.map(t => [t, fTgl(t, true)]), St.sesi.tgl, 'Semua Tanggal')}</select></div>
        <div id="ses-tbl"></div></div>`;
    sesiTbl();
  }
};
function sesiUrut(list) { const ix = IX(); const nm = x => (ix.ruang.get(x.idRuang) || {}).nama || ''; return list.slice().sort((a, b) => (a.tanggal + a.jam).localeCompare(b.tanggal + b.jam) || nat(a.mapel, b.mapel) || nat(nm(a), nm(b))); }
function sesiTbl() {
  const el = $('#ses-tbl'); if (!el) return;
  const f = St.sesi, q = f.q.trim().toLowerCase(), ix = IX();
  const rows = sesiUrut(DB.sesi.filter(x => (!f.tgl || x.tanggal === f.tgl) && (!q || (x.mapel + ' ' + x.pengawas + ' ' + (x.pengawas2 || '')).toLowerCase().includes(q))));
  if (!DB.sesi.length) { el.innerHTML = emptyBox('Belum ada jadwal sesi', 'Klik Tambah Sesi — satu sesi bisa langsung dibuat untuk semua ruang.'); return; }
  f.page = clamp(f.page, 1, Math.max(1, Math.ceil(rows.length / PER)));
  el.innerHTML = `<div class="tw"><table class="tbl"><thead><tr><th>Hari / Tanggal</th><th>Mata Pelajaran</th><th>Jam</th><th>Ruang</th><th>Pengawas</th><th class="c">Hadir / Tidak</th><th class="r">Aksi</th></tr></thead><tbody>
    ${rows.slice((f.page - 1) * PER, f.page * PER).map(x => `<tr><td class="nw">${fTgl(x.tanggal, true)}</td><td><b>${esc(x.mapel)}</b></td><td class="nw">${esc(x.jam)}</td><td>${esc((ix.ruang.get(x.idRuang) || {}).nama || '—')}</td>
      <td>${x.pengawas || x.pengawas2 ? esc([x.pengawas, x.pengawas2].filter(Boolean).join(' & ')) : '<span class="mu">Belum diisi</span>'}</td><td class="c">${x.hadir !== '' || x.tidakHadir !== '' ? esc(x.hadir || 0) + ' / ' + esc(x.tidakHadir || 0) : '<span class="mu">—</span>'}</td>
      <td class="r nw"><button class="ib" data-act="sesEdit" data-id="${x.id}" aria-label="Ubah">${ic('edit')}</button><button class="ib dan" data-act="sesHapus" data-id="${x.id}" aria-label="Hapus">${ic('trash')}</button></td></tr>`).join('')
    || '<tr><td colspan="7">' + emptyBox('Tidak ada yang cocok') + '</td></tr>'}</tbody></table></div>${pager(rows.length, f.page, PER, 'sesPage')}`;
}
On.sesCari = debounce(t => { St.sesi.q = t.value; St.sesi.page = 1; sesiTbl(); }, 200);
On.sesTgl = t => { St.sesi.tgl = t.value; St.sesi.page = 1; sesiTbl(); };
Act.sesPage = t => { St.sesi.page = +t.dataset.p; sesiTbl(); };
function formSesi(x) {
  const baru = !x, rooms = ruangUrut();
  if (!rooms.length) { toast('Buat ruang terlebih dahulu di menu Ruang & No Ujian.', 'er'); return; }
  x = x || { id: uid(), tanggal: St.sesi.tgl || isoHariIni(), mapel: '', jam: '07.30 - 09.30', idRuang: '*', pengawas: '', pengawas2: '', hadir: '', tidakHadir: '', catatan: '' };
  const [m1, m2] = (x.jam.match(/\d{1,2}[.:]\d{2}/g) || ['07.30', '09.30']).map(s => s.replace('.', ':').padStart(5, '0'));
  modal({
    title: baru ? 'Tambah Sesi' : 'Ubah Sesi',
    body: `<div class="f2">${fld('Tanggal', 'tanggal', x.tanggal, 'required', 'date')}${fld('Mata Pelajaran', 'mapel', x.mapel, 'required maxlength="60" list="dl-mapel"')}</div><datalist id="dl-mapel">${[...new Set(DB.sesi.map(s => s.mapel))].map(m => `<option value="${esc(m)}">`).join('')}</datalist>
      <div class="f2">${fld('Jam mulai', 'mulai', m1, 'required', 'time')}${fld('Jam selesai', 'selesai', m2, 'required', 'time')}</div>
      ${sel('Ruang', 'idRuang', (baru ? [['*', 'Semua ruang (' + rooms.length + ')']] : []).concat(rooms.map(r => [r.id, r.nama])), x.idRuang)}
      <div class="f2">${fld('Pengawas 1', 'pengawas', x.pengawas, 'maxlength="60"')}${fld('Pengawas 2 (opsional)', 'pengawas2', x.pengawas2 || '', 'maxlength="60"')}</div>${baru ? '<p class="mu" style="font-size:12px;margin:-8px 0 14px">Untuk "Semua ruang", pengawas diisi nanti per ruang.</p>' : ''}
      ${baru ? '' : `<div class="f2">${fld('Jumlah hadir', 'hadir', x.hadir, 'min="0"', 'number')}${fld('Jumlah tidak hadir', 'tidakHadir', x.tidakHadir, 'min="0"', 'number')}</div>
      <label class="fld"><span>Catatan pelaksanaan</span><textarea class="in" name="catatan" rows="3" maxlength="600">${esc(x.catatan)}</textarea></label>`}`,
    onOk(v) {
      const dasar = { tanggal: v.tanggal, mapel: v.mapel.trim(), jam: v.mulai.replace(':', '.') + ' - ' + v.selesai.replace(':', '.') };
      if (!dasar.tanggal || !dasar.mapel) { toast('Tanggal dan mata pelajaran wajib diisi.', 'er'); return false; }
      if (v.idRuang === '*') Data.bulk('sesi', rooms.map((r, i) => Object.assign({ id: uid() + i, idRuang: r.id, pengawas: '', pengawas2: '', hadir: '', tidakHadir: '', catatan: '' }, dasar)));
      else Data.save('sesi', Object.assign({ id: x.id, idRuang: v.idRuang, pengawas: v.pengawas.trim(), pengawas2: v.pengawas2.trim(), hadir: baru ? '' : v.hadir, tidakHadir: baru ? '' : v.tidakHadir, catatan: baru ? '' : v.catatan.trim() }, dasar));
      rerender(); toast('Jadwal disimpan.', 'ok');
    }
  });
}
Act.sesTambah = () => formSesi(null);
Act.sesEdit = t => formSesi(DB.sesi.find(x => x.id === t.dataset.id));
Act.sesHapus = t => {
  const x = DB.sesi.find(s => s.id === t.dataset.id); if (!x) return;
  const serupa = DB.sesi.filter(s => s.tanggal === x.tanggal && s.jam === x.jam && s.mapel === x.mapel);
  modal({
    title: 'Hapus Sesi', ok: 'Hapus', danger: true,
    body: `<p>Hapus sesi <b>${esc(x.mapel)}</b> (${fTgl(x.tanggal, true)}, ${esc(x.jam)})?</p>${serupa.length > 1 ? `<label class="chk" style="margin-top:14px"><input type="checkbox" name="semua" value="1"> Hapus juga sesi yang sama di ${serupa.length - 1} ruang lain</label>` : ''}`,
    onOk(v) { Data.remove('sesi', v.semua ? serupa.map(s => s.id) : x.id); rerender(); toast('Sesi dihapus.', 'ok'); }
  });
};
