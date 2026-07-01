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
const VARSAYILAN_MENU = {"restoranAdi":"Zeyrekhane","kategoriler":[{"id":"gune-baslarken","isim":"Güne Başlarken","ikon":"🍳","renk":"#d35400","urunler":[{"id":1,"isim":"Kahvaltı Tabağı","aciklama":"Haşlama Yumurta, Tereyağı, Bal, Reçel, Y. Zeytin, S. Zeytin, B. Peynir, Acuka, Çeri Domates, Salatalık, 2 Bardak Çay","fiyat":370},{"id":2,"isim":"Menemen","aciklama":"Domates, Yumurta, Yeşil Biber, Kuru Kaşar Peyniri","fiyat":140},{"id":3,"isim":"Sade Omlet","aciklama":"","fiyat":100},{"id":4,"isim":"Peynirli Omlet","aciklama":"","fiyat":140},{"id":5,"isim":"Karışık Omlet","aciklama":"Sucuk, Kırmızı Biber, Yeşil Biber, Kaşar Peynir","fiyat":140},{"id":6,"isim":"Sahanda Yumurta","aciklama":"","fiyat":110},{"id":7,"isim":"Sucuklu Yumurta","aciklama":"","fiyat":160},{"id":8,"isim":"Patates Tava","aciklama":"","fiyat":110}]},{"id":"ana-yemekler","isim":"Ana Yemekler","ikon":"🍽️","renk":"#7b1fa2","urunler":[{"id":9,"isim":"Piliç Pirzola","aciklama":"","fiyat":380},{"id":10,"isim":"Izgara Köfte","aciklama":"","fiyat":380},{"id":11,"isim":"Piliç Kavurma","aciklama":"","fiyat":370},{"id":12,"isim":"Beğendili Piliç","aciklama":"","fiyat":370},{"id":13,"isim":"Beğendili Kavurma","aciklama":"","fiyat":485},{"id":14,"isim":"Çoban Kavurma","aciklama":"","fiyat":470},{"id":15,"isim":"Köri Soslu Tavuk","aciklama":"","fiyat":370}]},{"id":"corbalar","isim":"Çorbalar","ikon":"🍲","renk":"#e65100","urunler":[{"id":16,"isim":"Günün Çorbası","aciklama":"","fiyat":85},{"id":17,"isim":"Sebze Çorbası","aciklama":"","fiyat":130}]},{"id":"salatalar","isim":"Salatalar","ikon":"🥗","renk":"#2e7d32","urunler":[{"id":18,"isim":"Çoban Salatası","aciklama":"","fiyat":100},{"id":19,"isim":"Mevsim Salatası","aciklama":"","fiyat":100}]},{"id":"baslangiclar","isim":"Başlangıçlar","ikon":"🥪","renk":"#c62828","urunler":[{"id":20,"isim":"Mantı","aciklama":"Un, Süt, Tuz, Sıvıyağı, Yumurta, İç Harcı: Et, Karabiber, Tuz","fiyat":290},{"id":21,"isim":"Kızarmış Mantı","aciklama":"Un, Süt, Tuz, Sıvıyağı, Yumurta, İç Harcı: Et, Karabiber, Tuz","fiyat":315},{"id":22,"isim":"Combo Tabağı","aciklama":"Sigara Böreği, Soğan Halkası, Kroket, Sosis, Patates ve Soslar ile Servis Yapılır.","fiyat":270},{"id":23,"isim":"Patates Tava","aciklama":"","fiyat":100},{"id":24,"isim":"Paçanga Böreği","aciklama":"","fiyat":140},{"id":25,"isim":"Pizza","aciklama":"Akdeniz Pizza","fiyat":270}]},{"id":"sicak-icecekler","isim":"Sıcak İçecekler","ikon":"☕","renk":"#4e342e","urunler":[{"id":26,"isim":"Latte","aciklama":"","fiyat":110},{"id":27,"isim":"Kapucino","aciklama":"","fiyat":120},{"id":28,"isim":"Filtre Kahve","aciklama":"","fiyat":90},{"id":29,"isim":"Türk Kahvesi","aciklama":"","fiyat":90},{"id":30,"isim":"Bitki Çayları","aciklama":"","fiyat":45},{"id":31,"isim":"Fincan Çayı","aciklama":"","fiyat":40}]},{"id":"soguk-icecekler","isim":"Soğuk İçecekler","ikon":"🥤","renk":"#01579b","urunler":[{"id":32,"isim":"Ayran","aciklama":"","fiyat":50},{"id":33,"isim":"Sade Soda","aciklama":"","fiyat":35},{"id":34,"isim":"Meyveli Soda","aciklama":"Limonlu","fiyat":40},{"id":35,"isim":"Kutu Meşrubat","aciklama":"Cola, Fanta, Soğukçay","fiyat":55},{"id":36,"isim":"Su","aciklama":"","fiyat":25}]},{"id":"tatlilar","isim":"Tatlılar","ikon":"🍰","renk":"#ad1457","urunler":[{"id":37,"isim":"Sütlaç","aciklama":"","fiyat":160},{"id":38,"isim":"Künefe","aciklama":"","fiyat":180},{"id":39,"isim":"Fıstıklı Katmer","aciklama":"","fiyat":200},{"id":40,"isim":"Kabak Tatlısı","aciklama":"Tahin ve Ceviz ile Servis Edilir.","fiyat":210},{"id":41,"isim":"Profiterollü Mono Siyah Ice Pasta","aciklama":"Sıcak Çikolato ve Kenarları Çikolata Kaplıdır.","fiyat":170},{"id":42,"isim":"Lotus Cheesecake","aciklama":"","fiyat":170},{"id":43,"isim":"Gökkuşağı Pasta","aciklama":"","fiyat":170},{"id":44,"isim":"Çikolatam","aciklama":"Karamilize Edilmiş Süt, Kakao, Bal, Fındık ve Cevizden Oluşmaktadır.","fiyat":170},{"id":45,"isim":"Profiterollü Mono Beyaz Ice Pasta","aciklama":"Beyaz Çikolata ve Kenarları Çikolata Kaplıdır.","fiyat":170},{"id":46,"isim":"Limonlu Cheesecake","aciklama":"Tereyağı, Bisküvi, Limon Sos, Fırınlanmış Cheesecake Peyniri, Doğal Krema","fiyat":170},{"id":47,"isim":"Frambuazlı Cheesecake","aciklama":"Özel Hazırlanmış Frambuaz Sos, Labne Peyniri ve Burçak Bisküvii tabanından oluşmaktadır.","fiyat":170},{"id":48,"isim":"Tiramisu Kare Ice Pasta","aciklama":"Krema Özel Tiramisu Sosu ve Kahve Tazından oluşmaktadır.","fiyat":170},{"id":49,"isim":"Fıstıklım","aciklama":"Karamelize Edilmiş Süt, Bal ve Antep Fıstığından Oluşmaktadır.","fiyat":170},{"id":50,"isim":"Bella Vista Ice Pasta","aciklama":"Siyah Çikolata ve Frambuazdan Oluşmaktadır.","fiyat":170},{"id":51,"isim":"Latte Mono Pasta","aciklama":"Latte Sos (Kahve Sosu) Bulunmaktadır.","fiyat":170},{"id":52,"isim":"Fıstık Dünyası","aciklama":"","fiyat":170},{"id":53,"isim":"Dubai Çikolatalı Pasta","aciklama":"","fiyat":170},{"id":54,"isim":"Magnolia","aciklama":"","fiyat":185}]}]};
let menuVerisi = VARSAYILAN_MENU;
try {
  menuVerisi = JSON.parse(fs.readFileSync(menuDosyaYolu, 'utf8'));
  console.log('menu.json yuklendi.');
} catch (e) {
  console.log('menu.json bulunamadi, varsayilan menu kullaniliyor.');
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
