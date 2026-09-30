# pred.app Referral Bot v2.0

Bot otomatis untuk mendaftar akun **pred.app** secara massal memakai dompet HD, menyelesaikan
Cloudflare Turnstile lewat **2Captcha**, lalu menerapkan kode referral dan mengatur username.

Dibangun dengan Puppeteer + `puppeteer-extra-plugin-stealth`,(random device fingerprint),
`ethers` (derivasi wallet EVM), dan `axios` (API pred.app).

> **Peringatan:** repo ini melakukan otomasi signup massal & bypass CAPTCHA. Penggunaan
> melanggar ToS pred.app dan dapat resulted akun diblokir. Gunakan hanya untuk pengujian
> pribadi. Anda bertanggung jawab penuh atas penggunaan tool ini.

---

## Fitur

- **Derivasi wallet HD** — 1 seed phrase (BIP-44 `m/44'/60'/0'/0`) di-expand menjadi N wallet
- **Mode Otomatis** — Puppeteer headless + stealth + 2Captcha untuk solve Turnstile
- **Mode Manual** — buka Chrome asli (non-headless) untuk signup dengan Private Key
- **Random fingerprint** — pool perangkat nyata dari `fingerprint.txt` (UA, viewport, GPU, locale)
- **Auto referral** — menerapkan kode referral via API, approve Safe agar trading aktif
- **Auto username** — mengambil nama acak dari `username.txt`
- **Resume** — wallet yang sudah sukses dilewati, tersimpan di `processed_wallets.json`
- **Menu interaktif** — 6 mode operasi dalam satu proses

---

## Requirements

- Node.js v18+ (disarankan v20)
- Google Chrome terpasang
- Akun **2Captcha** dengan saldo cukup
- Wallet browser (extension) jika memakai Mode Manual

## Instalasi

```bash
git clone https://github.com/VionaNadhira/pred-referral-bot.git
cd pred-referral-bot
npm install
npx puppeteer browsers install chrome
```

## Konfigurasi

Buat file `.env` di root project:

```env
MNEMONIC="word1 word2 word3 ... word12"
REFERRAL_CODE=REF886AC1C25E
MAX_INDEX=200
DELAY_MS=5000
CAPTCHA_API_KEY=xxxxxxxxxxxxxxxx
VERBOSE=1
```

| Variabel | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `MNEMONIC` | ya (mode 2 & 3) | — | Seed phrase 12 kata. Boleh dikosongkan, akan dibuat lewat menu `1` |
| `REFERRAL_CODE` | tidak | `REF886AC1C25E` | Kode referral yang akan diterapkan |
| `MAX_INDEX` | tidak | `200` / `50` | Jumlah wallet yang akan diproses |
| `DELAY_MS` | tidak | `5000` | Jeda antar wallet (ms) |
| `CAPTCHA_API_KEY` | ya (mode 2) | — | API key 2Captcha |
| `VERBOSE` | tidak | — | Set `1` untuk log detail |
| `BASE_URL` | tidak | `https://www.pred.app` | Override target URL |

> `.env` sudah masuk `.gitignore` — **jangan pernah** commit seed phrase atau API key.

## Menjalankan

```bash
npm start
```

### Menu

```
1) Generate New Wallet    Buat mnemonic acak + simpan ke .env
2) Run Bot Auto           Headless + 2Captcha (butuh CAPTCHA_API_KEY)
3) Run Bot Manual         Chrome asli, tanpa Puppeteer
4) Check Referral Status  Cek data referral semua wallet sukses
5) View Processed Wallets Lihat riwayat hasil
6) Reset Wallet Data      Hapus processed_wallets.json & kosongkan MNEMONIC
0) Exit
```

### Alur Mode Auto (2)

```
1. Buka pred.app/signup di Chromium headless (stealth)
2. Isi form signup dengan wallet[index]
3. Tangkap parameter Turnstile (sitekey, action, cData) via hook
4. Kirim ke 2Captcha -> token -> inject ke widget
5. Tangkap privyToken dari response network
6. Tukar ke accessToken pred.app (login-with-signature)
7. Approve Safe (safe-approval/prepare + execute) -> trading aktif
8. Apply referral code (campaigns/referrals/apply)
9. Set username dari username.txt
10. Simpan hasil ke processed_wallets.json
```

## Script Pendamping

```bash
node test-run.js              # Smoke test: 1 wallet, signup saja
node test_one_wallet.js 5     # Debug wallet index 5, verbose penuh
npm run reset                 # Reset data wallet
```

## Struktur Project

```
├── index.js               # Menu utama + semua mode operasi
├── browser.js             # Puppeteer: signup, stealth, fingerprint, token capture
├── captcha.js             # 2Captcha Turnstile solver + injection script
├── api.js                 # Axios: pred.app API (login, referral, username, safe)
├── wallet.js              # Derivasi HD wallet, EIP-712 Safe signing, tracking
├── fingerprint.txt        # Pool device fingerprint (219 baris, pipe-separated)
├── username.txt           # Daftar username yang dipakai acak (berkurang tiap dipakai)
├── processed_wallets.json # Hasil proses (gitignored)
└── .env                   # Konfigurasi (gitignored)
```

## Field `processed_wallets.json`

```json
{
  "index": 0,
  "address": "0x...",
  "status": "success | partial | failed",
  "privyToken": "...",
  "userId": "...",
  "accessToken": "...",
  "proxyWalletAddr": "0x...",
  "isEnabledTrading": true,
  "username": "...",
  "error": null,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

File ini berisi **token sesi aktif** — jangan di-share dan jangan di-commit.

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `Set CAPTCHA_API_KEY di .env` | Isi API key 2Captcha, pastikan saldo > 0 |
| Turnstile `empty solution` | 2Captcha Timeout (default 3 detik) di `captcha.js:20` — naikkan ke `60000` |
| Chrome tidak ditemukan | Jalankan `npx puppeteer browsers install chrome` |
| `ECONNRESET` / timeout | Naikkan `DELAY_MS`, Kurangi `MAX_INDEX` |
| Bot terdeteksi | Buka `browser.js:569` (`--headless=new`) lalu ganti ke mode manual (menu `3`) |
| Zat browser tidak terhapus | `/tmp/pred-*` dibersihkan otomatis tiap wallet (lihat `index.js:222`) |

## Lisensi

MIT — gunakan dengan tanggung jawab Anda sendiri.
