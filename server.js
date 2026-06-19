const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MASA_SAYISI = 28;

// Aktif çağrılar: { masaNo: { saat, zaman } }
const aktivCagriler = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Müşteri sayfası (QR koddan açılır)
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

// Garson çağır (müşteri butona basınca)
app.post('/cagir/:no', (req, res) => {
  const no = parseInt(req.params.no);
  if (isNaN(no) || no < 1 || no > MASA_SAYISI) {
    return res.status(400).json({ hata: 'Geçersiz masa numarası' });
  }

  const saat = new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  aktivCagriler[no] = { saat, zaman: Date.now() };
  io.emit('yeni-cagri', { masa: no, saat });

  console.log(`[${saat}] Masa ${no} garson çağırdı`);
  res.json({ tamam: true });
});

// Çağrıyı kapat (dashboard'dan tıklanınca)
app.post('/temizle/:no', (req, res) => {
  const no = parseInt(req.params.no);
  delete aktivCagriler[no];
  io.emit('temizlendi', { masa: no });
  res.json({ tamam: true });
});

// Tüm aktif çağrılar (dashboard yenilenince senkronize eder)
app.get('/durum', (req, res) => {
  res.json(aktivCagriler);
});

// Menü kategorileri
app.get('/menu-kategoriler', (req, res) => {
  const menuDir = path.join(__dirname, 'public', 'menu');
  if (!fs.existsSync(menuDir)) return res.json([]);
  const kategoriler = fs.readdirSync(menuDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
  res.json(kategoriler);
});

// Kategori içindeki resimler
app.get('/menu-kategoriler/:kategori', (req, res) => {
  const kategoriDir = path.join(__dirname, 'public', 'menu', req.params.kategori);
  if (!fs.existsSync(kategoriDir)) return res.json([]);
  const resimler = fs.readdirSync(kategoriDir)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .sort();
  res.json(resimler);
});

function yerelIP() {
  const arayuzler = os.networkInterfaces();
  for (const isim of Object.keys(arayuzler)) {
    for (const ag of arayuzler[isim]) {
      if (ag.family === 'IPv4' && !ag.internal) {
        return ag.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const ip = yerelIP();
  console.log('');
  console.log('='.repeat(52));
  console.log('   GARSON ÇAĞIRMA SİSTEMİ ÇALIŞIYOR');
  console.log('='.repeat(52));
  console.log(`   Dashboard : http://${ip}:${PORT}/dashboard.html`);
  console.log(`   Sunucu IP : ${ip}`);
  console.log('');
  console.log('   QR kodları oluşturmak için yeni terminalde:');
  console.log('   node generate-qr.js');
  console.log('='.repeat(52));
  console.log('');
});
