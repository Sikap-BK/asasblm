/* ============================================================
   ASAS — MODE DEMO (hanya aktif bila GAS_URL di config.js kosong)
   Meniru jawaban server memakai penyimpanan perangkat, supaya aplikasi
   bisa dicoba sebelum backend Google Apps Script disambungkan.
   Login demo:  admin / admin
   ============================================================ */
'use strict';
window.Demo = (() => {
  const K = 'asas:demo', KEYS = { siswa: 'id', ruang: 'id', peserta: 'nisn', sesi: 'id', templat: 'id' };
  const foto = {};                                                   // foto demo hanya di memori
  let d = null;
  function seed() {
    const depan = ['Aditya', 'Anindya', 'Bagus', 'Cantika', 'Dimas', 'Farhan', 'Gita', 'Hafiz', 'Intan', 'Joko', 'Kirana', 'Lukman', 'Maya', 'Nabil', 'Olivia', 'Putra', 'Qonita', 'Rizky', 'Salsa', 'Taufik', 'Umar', 'Vina', 'Wahyu', 'Yusuf', 'Zahra'];
    const belakang = ['Pratama', 'Rahmawati', 'Wicaksono', 'Maharani', 'Nugraha', 'Kurniawan', 'Aini', 'Ramadhan', 'Lestari', 'Saputra', 'Anggraini', 'Hidayat'];
    const kelas = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'], kota = ['Sangatta', 'Bontang', 'Samarinda', 'Bengalon', 'Balikpapan'];
    const siswa = [];
    for (let i = 0; i < 72; i++) siswa.push({ id: 's' + i, nama: depan[i % depan.length] + ' ' + belakang[(i * 5 + 3) % belakang.length], nis: String(2425001 + i), nisn: '00' + String(91823400 + i * 37), tempatLahir: kota[i % kota.length], tglLahir: (2010 + Math.floor(i / 24)) + '-' + String(i % 12 + 1).padStart(2, '0') + '-' + String(i % 27 + 1).padStart(2, '0'), kelas: kelas[Math.floor(i / 12)], foto: '', fotoId: '' });
    const y = new Date().getFullYear();
    return { user: 'admin', sandi: 'admin', siswa, ruang: [], peserta: [], sesi: [], templat: [], assets: { logo1: '', logo2: '', ttd: '', loginbg: '' },
      set: { namaSekolah: 'SMP BUDI LUHUR MANDIRI', tahunAjaran: y + '/' + (y + 1), semester: 'Ganjil', kepsek: '', nipKepsek: '', titimangsa: '', warna1: '#4F46E5', warna2: '#0EA5A4', bgVer: '' } };
  }
  const load = () => { if (!d) { try { d = JSON.parse(localStorage.getItem(K)); } catch (e) { } if (!d) d = seed(); } return d; };
  const save = () => { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) { } };
  const ok = data => ({ success: true, data: JSON.parse(JSON.stringify(data)), ms: 1 });
  const fail = (message, x) => Object.assign({ success: false, message }, x);
  const boot = () => ({ siswa: d.siswa, ruang: d.ruang, peserta: d.peserta, sesi: d.sesi, templat: d.templat, set: d.set, assets: { logo1: d.assets.logo1, logo2: d.assets.logo2, ttd: d.assets.ttd } });
  function upsert(t, rows) { const k = KEYS[t]; rows.forEach(r => { const i = d[t].findIndex(x => x[k] === r[k]); if (i > -1) d[t][i] = Object.assign({}, d[t][i], r); else d[t].push(r); }); }
  const A = {
    login: x => (x.u === d.user && x.p === d.sandi) ? ok({ token: 'demo', exp: Date.now() + 864e5, user: d.user, boot: boot() }) : fail('Nama pengguna atau kata sandi salah. (Mode demo: admin / admin)'),
    public: () => ok({ namaSekolah: d.set.namaSekolah, warna1: d.set.warna1, warna2: d.set.warna2, bgVer: d.set.bgVer, logo1: d.assets.logo1 }),
    publicBg: () => ok({ bgVer: d.set.bgVer, bg: d.assets.loginbg }),
    boot: () => ok(boot()),
    save: x => { upsert(x.t, [x.row]); return ok({}); },
    bulk: x => { upsert(x.t, x.rows); return ok({}); },
    replace: x => { d[x.t] = x.rows; return ok({}); },
    remove: x => {
      const ids = new Set([].concat(x.id)), k = KEYS[x.t], gone = d[x.t].filter(r => ids.has(r[k]));
      d[x.t] = d[x.t].filter(r => !ids.has(r[k]));
      if (x.t === 'siswa') { const n = new Set(gone.map(r => r.nisn)); d.peserta = d.peserta.filter(p => !n.has(p.nisn)); }
      if (x.t === 'ruang') { d.peserta = d.peserta.filter(p => !ids.has(p.idRuang)); d.sesi = d.sesi.filter(s => !ids.has(s.idRuang)); }
      return ok({});
    },
    setSave: x => { Object.keys(x.kv).forEach(k => { if (k !== 'bgVer') d.set[k] = x.kv[k]; }); return ok({}); },
    asset: x => { d.assets[x.kind] = x.dataUrl || ''; if (x.kind === 'loginbg') d.set.bgVer = x.dataUrl ? String(Date.now()) : ''; return ok({ bgVer: d.set.bgVer }); },
    fotoPut: x => { const out = {}; x.items.forEach(it => { const s = d.siswa.find(r => r.nisn === it.nisn); if (!s) return; s.foto = it.nisn + '.jpg'; s.fotoId = 'demo' + Date.now() + it.nisn; foto[it.nisn] = it.dataUrl; out[it.nisn] = s.fotoId; }); return ok(out); },
    fotoGet: x => { const out = {}; x.nisns.forEach(n => { const s = d.siswa.find(r => r.nisn === n); if (s && foto[n]) out[n] = { id: s.fotoId, d: foto[n] }; }); return ok(out); },
    fotoDel: x => { const s = d.siswa.find(r => r.nisn === x.nisn); if (s) { s.foto = ''; s.fotoId = ''; } return ok({}); },
    akun: x => { if (x.pLama !== d.sandi) return fail('Kata sandi lama salah.'); if (String(x.pBaru).length < 8) return fail('Kata sandi baru minimal 8 karakter.'); d.user = x.u; d.sandi = x.pBaru; return ok({ token: 'demo', exp: Date.now() + 864e5, user: d.user }); }
  };
  return {
    async call(action, data, token) {
      load();
      await new Promise(r => setTimeout(r, 60));
      if (!A[action]) return fail('Aksi tidak dikenal.');
      if (!/^(login|public|publicBg)$/.test(action) && token !== 'demo') return fail('Sesi berakhir.', { code: 'AUTH' });
      const res = A[action](JSON.parse(JSON.stringify(data || {})));
      save();
      return res;
    }
  };
})();
