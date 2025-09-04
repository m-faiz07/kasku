# Kasku — Buku Kas Kelas (Expo + MongoDB)

Kasku adalah aplikasi buku kas kelas yang fokus pada kemudahan pencatatan pemasukan/pengeluaran, pengelolaan anggota, dan iuran bulanan. Aplikasi mobile dibangun dengan Expo Router + React Native (TypeScript), sedangkan data tersimpan di MongoDB Atlas melalui API Node/Express yang ringan.

• Cepat digunakan • Tampilan minimalis • Siap produksi

---

## Fitur Utama
- Transaksi masuk/keluar; saldo pada Home/Statistik ditampilkan “diklem” ke 0 (visual).
- Anggota (aktif/nonaktif/hapus); generate tagihan iuran per bulan (idempoten).
- Bulk “Tandai Lunas” untuk iuran; otomatis membuat transaksi pemasukan kategori “Iuran”.
- Export CSV di tab Statistik (share sheet mobile; fallback path di web/dev).
- Mode server: data tersimpan di MongoDB Atlas melalui API (tanpa penyimpanan lokal offline).
- Aksesibilitas dasar (label tombol, ukuran tap); locale `id-ID` untuk tanggal dan mata uang.

## Arsitektur Singkat
- App (Expo Router): TypeScript, Zustand (state memori, tanpa persist).
- API (Node/Express): endpoint CRUD + logika generate iuran dan bulk paid.
- Database: MongoDB Atlas.

Struktur folder:
- `app/` (layar/tabs), `components/`, `lib/` (store, util, api client)
- `server/` (Express + MongoDB driver)

## Teknologi
- React Native (Expo), Expo Router, TypeScript
- Zustand, expo-file-system, expo-sharing
- Node.js, Express, MongoDB driver

---

## Menjalankan Secara Lokal
### 1) Persyaratan
- Node.js LTS, Android Studio/iOS Simulator (opsional), MongoDB Atlas Cluster.

### 2) Konfigurasi Environment
- Server: salin `server/.env.example` → `server/.env`, lalu isi:
  - `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/`
  - `DB_NAME=kasku`
  - `PORT=4000`
  - `API_KEY=` (kosongkan saat dev agar mudah)
- App (opsional): salin `.env.example` → `.env` jika ingin menjalankan dengan skrip `*:env`.

### 3) Jalankan Server
```
cd server
npm install
npm run dev
```
Cek health: `http://<IP-PC>:4000/health` → `{ ok: true }`

### 4) Jalankan App
```
npm run start
```
- Base URL default diambil dari `app.json > expo.extra.apiBaseUrl`.
- Android emulator: alamat `localhost` otomatis dipetakan ke `10.0.2.2` oleh `lib/api.ts`.
- Perangkat fisik: set `apiBaseUrl` ke IP LAN PC Anda (contoh `http://192.168.1.10:4000`).

Skrip terkait di root:
- App: `npm run clean` | `npm run start` | `npm run android` | `npm run ios`
- Server: `npm run server:dev` | `npm run server:build` | `npm run server:start`

---

## Konfigurasi App (Expo)
- `app.json` memuat `name`, `slug`, icons, splash, dan `extra.apiBaseUrl`.
- (Opsional) set `extra.apiKey` agar app mengirim header `x-api-key` ke server.

## Keamanan & CORS (Server)
- `API_KEY` (opsional): jika diisi, server mewajibkan header `x-api-key` untuk semua endpoint (kecuali `/health`).
- `CORS_ORIGINS`: daftar origin yang diizinkan (dipisahkan koma). Kosong → allow all (dev). Isi domain Anda untuk produksi.

---

## API Singkat
Header umum (opsional): `x-api-key: <your-key>`

Members
- `GET /members`
- `POST /members` body: `{ name, nim?, phone? }`
- `PATCH /members/:id` body: `{ name?, nim?, phone?, active? }`
- `DELETE /members/:id`

Dues (Nominal Iuran)
- `GET /dues/amount` → `{ duesAmount }`
- `POST /dues/amount` body: `{ amount: number }`

Bills (Tagihan Iuran)
- `GET /bills?ym=YYYY-MM`
- `POST /bills/generate` body: `{ ym? }` (default bulan berjalan)
- `POST /bills/bulkPaid` body: `{ memberIds: string[], ym: string }`

Transactions
- `GET /txs[?ym=YYYY-MM]`
- `POST /txs` body: `{ type: 'in'|'out', amount, category?, note?, date, memberId? }`
- `DELETE /txs/:id`

---

## Model Data
- Member: `{ id, name, nim?, phone?, active }`
- DuesBill: `{ id, memberId, ym, amount, status: 'UNPAID'|'PAID'|'WAIVED' }`
- Tx: `{ id, type: 'in'|'out', amount, category?, note?, date(ISO), memberId? }`

---

## Export CSV (Statistik)
- Tombol “Export CSV” menulis file ke direktori dokumen/cache dan memunculkan share sheet (mobile).
- Header kolom: `id,type,amount,category,note,date,memberId`.
- Fallback web/dev: menampilkan path file di layar.

---

## QA Fungsional (Checklist)
1) Iuran
   - Tambah 3 anggota (aktif), set iuran 20000, generate bulan aktif → bill muncul.
   - Bulk “Tandai Lunas” untuk sebagian → Tx pemasukan kategori “Iuran” dibuat (`note: Iuran YYYY-MM - Name`).
2) Blokir OUT
   - Tambah transaksi OUT melebihi saldo global → tombol simpan nonaktif/peringatan muncul.
3) Idempoten + aktif/nonaktif
   - Ganti bulan lalu generate → tidak ada duplikasi untuk kombinasi (member, ym) yang sama.
   - Nonaktifkan 1 member lalu generate → member nonaktif tidak dibuat bill.
4) Hapus anggota
   - Hapus 1 member → bill terkait hilang dari daftar.
5) Regresi saldo diklem
   - Home/Statistik: saldo tampil diklem ke 0 (visual).

---

## Aksesibilitas & Performa
- A11y: label pada tombol utama, ukuran tap memadai, locale `id-ID` untuk tanggal/mata uang.
- Performa: FlatList dengan keyExtractor stabil; kalkulasi difilter/memo sesuai kebutuhan.

---

## Deploy
Server (contoh Render/Railway/Cloud Run):
- Root: `server/`, Build: `npm install && npm run build`, Start: `npm run start`
- Env: `MONGODB_URI`, `DB_NAME`, `API_KEY`, `CORS_ORIGINS`

App (EAS):
- Set `expo.extra.apiBaseUrl` ke URL API produksi dan (opsional) `expo.extra.apiKey`.
- `eas build -p android --profile production` (dan iOS bila perlu)

---

## Troubleshooting
- Android emulator: gunakan `10.0.2.2` untuk mengakses host (di-handle otomatis).
- Perangkat fisik tidak bisa akses API lokal:
  - Gunakan IP LAN PC untuk `apiBaseUrl` (mis. `http://192.168.x.x:4000`).
  - Izinkan port 4000/Node.js di Windows Firewall (Private network).
  - Matikan AP/Client isolation di router Wi‑Fi.
- 401 Unauthorized: pastikan `x-api-key` di app sama dengan `API_KEY` server.

---

## Kontribusi
Pull Request dipersilakan untuk perbaikan bug, docs, dan peningkatan UX. Untuk fitur besar (mis. multi buku kas, autentikasi pengguna), buka diskusi terlebih dahulu.
