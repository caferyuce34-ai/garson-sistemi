const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const PORT = process.env.PORT || 3000;
const MASA_SAYISI = 28;
const YONETIM_SIFRESI = 'baksan2026'; // Şifreyi buradan değiştirebilirsiniz

// ── MENÜ VERİSİ ──────────────────────────────────
const menuDosyaYolu = path.join(__dirname, 'menu.json');
let menuVerisi = { restoranAdi: '', kategoriler: [] };
try {
  menuVerisi = JSON.parse(fs.readFileSync(menuDosyaYolu, 'utf8'));
} catch (e) {
  console.log('menu.json bulunamadi, bos menu kullaniliyor.');
}

// ── AKTİF ÇAĞRILAR ───────────────────────────────
const aktivCagriler = {};

// ── STATİK DOSYALAR ──────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Kök dizindeki HTML dosyaları (GitHub'a public/ altına yüklenmeyenler için)
['dashboard.html', 'masa.html', 'yonetim.html'].forEach(dosya => {
  const tam = path.join(__dirname, dosya);
  if (fs.existsSync(tam)) app.use('/' + dosya, (req, res) => res.sendFile(tam));
});

// ── MÜŞTERİ SAYFASI ──────────────────────────────
app.get('/masa/:no', (req, res) => {
  const no = parseInt(req.params.no);
  if (isNaN(no) || no < 1 || no > MASA_SAYISI) {
    return res.status(404).send('Geçersiz masa numarası');
  }
  const masaDosya = fs.existsSync(path.join(__dirname, 'public', 'masa.html'))
    ? path.join(__dirname, 'public', 'masa.html')
    : path.join(__dirname, 'masa.html');
  res.sendFile(masaDosya);
});

// ── GARSON ÇAĞIR ─────────────────────────────────
app.post('/cagir/:no', (req, res) => {
  const no = parseInt(req.params.no);
  if (isNaN(no) || no < 1 || no > MASA_SAYISI) {
    return res.status(400).json({ hata: 'Geçersiz masa numarası' });
  }
  const saat = new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  aktivCagriler[no] = { saat, zaman: Date.now() };
  io.emit('yeni-cagri', { masa: no, saat });
  console.log(`[${saat}] Masa ${no} garson cagirdi`);
  res.json({ tamam: true });
});

// ── ÇAĞRI KAPAT ──────────────────────────────────
app.post('/temizle/:no', (req, res) => {
  const no = parseInt(req.params.no);
  delete aktivCagriler[no];
  io.emit('temizlendi', { masa: no });
  res.json({ tamam: true });
});

// ── DURUM ─────────────────────────────────────────
app.get('/durum', (req, res) => {
  res.json(aktivCagriler);
});

// ── MENÜ VERİSİ (MÜŞTERİ) ────────────────────────
app.get('/menu', (req, res) => {
  res.json(menuVerisi);
});

// ── YÖNETİM: GİRİŞ ───────────────────────────────
app.post('/yonetim/giris', (req, res) => {
  const { sifre } = req.body;
  if (sifre === YONETIM_SIFRESI) {
    res.json({ tamam: true });
  } else {
    res.status(401).json({ hata: 'Şifre yanlış' });
  }
});

// ── YÖNETİM: ÜRÜN GÜNCELLE ───────────────────────
app.post('/yonetim/urun-guncelle', (req, res) => {
  const { sifre, kategoriId, urunId, isim, aciklama, fiyat } = req.body;
  if (sifre !== YONETIM_SIFRESI) return res.status(401).json({ hata: 'Yetkisiz' });

  const kategori = menuVerisi.kategoriler.find(k => k.id === kategoriId);
  if (!kategori) return res.status(404).json({ hata: 'Kategori bulunamadı' });

  const urun = kategori.urunler.find(u => u.id === urunId);
  if (!urun) return res.status(404).json({ hata: 'Ürün bulunamadı' });

  urun.isim = isim;
  urun.aciklama = aciklama;
  urun.fiyat = parseFloat(fiyat);

  menuDosyaKaydet();
  res.json({ tamam: true });
});

// ── YÖNETİM: ÜRÜN EKLE ───────────────────────────
app.post('/yonetim/urun-ekle', (req, res) => {
  const { sifre, kategoriId, isim, aciklama, fiyat } = req.body;
  if (sifre !== YONETIM_SIFRESI) return res.status(401).json({ hata: 'Yetkisiz' });

  const kategori = menuVerisi.kategoriler.find(k => k.id === kategoriId);
  if (!kategori) return res.status(404).json({ hata: 'Kategori bulunamadı' });

  const maxId = Math.max(0, ...menuVerisi.kategoriler.flatMap(k => k.urunler.map(u => u.id)));
  kategori.urunler.push({ id: maxId + 1, isim, aciklama: aciklama || '', fiyat: parseFloat(fiyat) });

  menuDosyaKaydet();
  res.json({ tamam: true });
});

// ── YÖNETİM: ÜRÜN SİL ────────────────────────────
app.post('/yonetim/urun-sil', (req, res) => {
  const { sifre, kategoriId, urunId } = req.body;
  if (sifre !== YONETIM_SIFRESI) return res.status(401).json({ hata: 'Yetkisiz' });

  const kategori = menuVerisi.kategoriler.find(k => k.id === kategoriId);
  if (!kategori) return res.status(404).json({ hata: 'Kategori bulunamadı' });

  kategori.urunler = kategori.urunler.filter(u => u.id !== urunId);
  menuDosyaKaydet();
  res.json({ tamam: true });
});

// ── YÖNETİM: MENÜ İNDİR ──────────────────────────
app.get('/yonetim/menu-indir', (req, res) => {
  const sifre = req.query.sifre;
  if (sifre !== YONETIM_SIFRESI) return res.status(401).send('Yetkisiz');
  res.setHeader('Content-Disposition', 'attachment; filename="menu.json"');
  res.json(menuVerisi);
});

function menuDosyaKaydet() {
  try {
    fs.writeFileSync(menuDosyaYolu, JSON.stringify(menuVerisi, null, 2), 'utf8');
  } catch (e) {
    console.log('menu.json kaydedilemedi (ephemeral ortam)');
  }
}

function yerelIP() {
  const arayuzler = os.networkInterfaces();
  for (const isim of Object.keys(arayuzler)) {
    for (const ag of arayuzler[isim]) {
      if (ag.family === 'IPv4' && !ag.internal) return ag.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = yerelIP();
  console.log('');
  console.log('='.repeat(52));
  console.log('   GARSON CAGIRMA SISTEMI CALISIYOR');
  console.log('='.repeat(52));
  console.log(`   Dashboard : http://${ip}:${PORT}/dashboard.html`);
  console.log(`   Yonetim   : http://${ip}:${PORT}/yonetim.html`);
  console.log('='.repeat(52));
  console.log('');
});
