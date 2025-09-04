Kasku — Catatan Kas Sederhana (Expo Router)

Ringkas: Expo + React Native + TypeScript. State disimpan dengan Zustand + persist (AsyncStorage). Tanpa alias babel (pakai relative imports saja).

Fitur utama
- Transaksi masuk/keluar, saldo diklem ke 0 secara visual (Home, Statistik).
- Anggota (aktif/nonaktif/hapus) dengan iuran bulanan. Generate tagihan UNPAID per bulan. Tandai lunas (bulk) akan menambah transaksi pemasukan kategori "Iuran".
- Export CSV semua transaksi dari tab Statistik.
 - Mode server: data tersimpan di MongoDB Atlas via API Node.

Persyaratan
- Node.js LTS, Expo CLI.
- iOS: Xcode (macOS), Android: Android Studio/Emulator.

Script npm (app)
- `npm run clean` — jalankan Metro dengan cache bersih (`expo start -c`).
- `npm run start` — jalankan dev server.
- `npm run android` — buka di emulator/perangkat Android.
- `npm run ios` — buka di simulator iOS.
- `npm run web` — buka di web (dev).

Konfigurasi App
- `app.json` sudah berisi `name`, `slug`, `icon`, `splash`, skema `kasku`, dan edge-to-edge Android.
- Izin minimum: tidak ada akses kamera/mikrofon. Modul yang digunakan: AsyncStorage, FileSystem, Sharing, dsb.

Export CSV (Statistik)
- Tombol "Export CSV" menulis file CSV ke direktori dokumen/cache dan memunculkan share sheet (mobile).
- Header kolom: `id,type,amount,category,note,date,memberId`.
- Fallback web/dev: path file ditampilkan di layar bila share sheet tidak tersedia.

Backend (API + MongoDB)
- Kode server ada di `server/` (Express + MongoDB driver).
- Endpoint utama:
  - GET/POST/PATCH/DELETE `/members`
  - GET `/bills?ym=YYYY-MM`, POST `/bills/generate`, POST `/bills/bulkPaid`
  - GET `/dues/amount`, POST `/dues/amount`
  - GET `/txs[?ym]`, POST `/txs`, DELETE `/txs/:id`
- Konfigurasi env (server): `MONGODB_URI`, `DB_NAME`.
  - Keamanan produksi:
    - `API_KEY`: aktifkan proteksi header `x-api-key` (server menolak jika tidak cocok).
    - `CORS_ORIGINS`: daftar origin yang diizinkan (dipisahkan koma). Jika kosong → allow all (dev).
  - Contoh file: `server/.env.example` (salin ke `server/.env`).
  - Jalankan cepat: `npm run server:dev` (membaca `server/.env`).
- Script server: di `server/` jalankan `npm i`, lalu `npm run dev`. Default listen `:4000`.
- App membaca base URL dari `app.json > expo.extra.apiBaseUrl` (default `http://localhost:4000`). Untuk produksi, ubah ke domain API Anda.
- App dapat mengirim `x-api-key` bila di-set:
  - `app.json > expo.extra.apiKey` atau env `EXPO_PUBLIC_API_KEY` saat build.
  - Contoh file: `.env.example` (salin ke `.env`) lalu gunakan skrip `start:env`/`android:env`/`ios:env`.

QA Fungsional (Smoke Test)
1) Iuran
   - Tambah 3 anggota (aktif), set iuran 20000.
   - Generate tagihan untuk bulan aktif.
   - Pilih sebagian lalu "Tandai Lunas (Bulk)". Periksa transaksi pemasukan kategori "Iuran" dibuat dengan catatan `Iuran YYYY-MM - Name`.
2) Blokir OUT
   - Coba tambah transaksi `out` melebihi saldo global. Tombol simpan harus nonaktif dan/atau muncul peringatan.
3) Generate idempoten + aktif/nonaktif
   - Ganti bulan iuran, generate lagi (bill tidak duplikat untuk bulan yang sama).
   - Nonaktifkan satu anggota lalu generate lagi: anggota nonaktif tidak dibuatkan bill.
4) Hapus anggota
   - Hapus salah satu anggota; tagihan terkait menghilang dari daftar.
5) Regresi saldo diklem
   - Home dan Statistik menampilkan saldo yang diklem ke 0 secara visual.

Rilis (EAS)
- Opsional: `eas build -p android --profile preview` untuk uji; `--profile production` untuk rilis.
- Pastikan login ke Expo dan sudah menginisialisasi EAS (`eas login`, `eas init`).

Tips
- Jika terjadi error aneh saat hot reload, jalankan `npm run clean`.
- Error runtime tidak mematikan app; lihat log pada Metro/console dev.

Catatan migrasi ke MongoDB (tanpa lokal)
- Store lokal (Zustand) sekarang bertindak sebagai cache memori; data sumber kebenaran ada di server.
- App melakukan sinkronisasi awal pada startup (`app/_layout.tsx`).
- Tidak ada AsyncStorage/persist; jika offline, data tidak termuat. Pertimbangkan penanganan offline di masa depan bila diperlukan.
