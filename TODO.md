# TODO - Perbaikan Error 401, Gambar, & id_kategori Artikel

## Masalah 1: Error 401 "Unauthenticated" saat Tambah Artikel
- [x] Tambah `handleUnauthorized()` & `clearSession()` di `auth.js`
- [x] `artikelData.js`: tangani 401 → redirect login
- [x] `RichTextEditor.jsx`: tangani 401 pada upload → redirect login
- [x] Login ulang CMS untuk token baru yang valid

## Masalah 2: Gambar di Quill Tidak Muncul (ERR_CONNECTION_REFUSED)
Backend mengembalikan URL absolut `http://localhost/storage/...` (karena `APP_URL` backend = `http://localhost`), padahal frontend jalan di `localhost:5173` & memakai proxy ke produksi.

- [x] `RichTextEditor.jsx`: ubah URL `/storage/...` menjadi path relatif
- [x] `vite.config.js`: tambah proxy `/storage` → `citra.faaruq.com`
- [x] Restart Vite dev server agar proxy baru aktif
- [x] Verifikasi gambar muncul di editor Quill

## Masalah 3: Error 422 "the id kategori field is required"
Backend produksi memakai foreign key `id_kategori` (bukan string `kategori_artikel`).

- [x] `artikelData.js`: kirim `id_kategori` (Tips Kesehatan → 1, Kegiatan → 2) di samping `kategori_artikel`
- [ ] Verifikasi artikel berhasil disimpan di produksi

## Catatan
- Migration `views` sudah ada di `database/migrations/`.
- Database lokal masih kosong (0 bytes) karena memakai DB produksi via proxy.
</content>
