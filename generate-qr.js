const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MASA_SAYISI = 28;
const PORT = 3000;

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

async function qrOlustur() {
  const arg = process.argv[2] || yerelIP();
  const klasor = path.join(__dirname, 'qrcodes');

  // ngrok veya domain ise https ve port yok, IP ise http ve port var
  const isIP = /^[\d.]+$/.test(arg);
  const baseURL = isIP ? `http://${arg}:${PORT}` : `https://${arg}`;

  if (!fs.existsSync(klasor)) {
    fs.mkdirSync(klasor);
  }

  console.log('');
  console.log(`QR kodları oluşturuluyor...  (${baseURL})`);
  console.log('');

  const skipWarning = isIP ? '' : '?ngrok-skip-browser-warning=true';

  for (let i = 1; i <= MASA_SAYISI; i++) {
    const url = `${baseURL}/masa/${i}${skipWarning}`;
    const dosya = path.join(klasor, `masa_${String(i).padStart(2, '0')}.png`);

    await QRCode.toFile(dosya, url, {
      width: 400,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    });

    console.log(`  Masa ${String(i).padStart(2, ' ')}: ${dosya}`);
  }

  console.log('');
  console.log(`Tüm ${MASA_SAYISI} QR kod "qrcodes" klasörüne kaydedildi.`);
  console.log('Yazdırıp masalara koyabilirsiniz.');
  console.log('');
}

qrOlustur().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});
