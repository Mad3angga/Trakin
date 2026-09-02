# Trakin — Gym Management System

<p align="center">
  <img src="public/images/logo_trakin.png" width="80" alt="Trakin Logo" />
</p>

<p align="center">
  <strong>Aplikasi manajemen gym untuk Web, Android & iOS</strong><br/>
  Laravel 13 · React 19 · Inertia 3 · PostgreSQL · Capacitor 8
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel" alt="Laravel 13" />
  <img src="https://img.shields.io/badge/PHP-8.3-777BB4?logo=php" alt="PHP 8.3" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" alt="Capacitor 8" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

---

## Tentang

Trakin adalah sistem manajemen gym terintegrasi untuk operasional harian: pendaftaran member & paket membership, absensi QR kiosk, jadwal kelas & sesi PT, kasir POS & inventory, pengeluaran, laporan, dashboard analitik, serta AI Chat Advisor (Gemini) untuk owner.

Mendukung **Web Admin** (Owner, Manager, Front Desk, Sales, Trainer) dan **Member Portal** (mobile-friendly + Capacitor Android/iOS dengan push notification & local notification).

---

## Fitur Utama

- **Member & Membership** — registrasi member baru, paket Bronze/Silver/Gold, komisi penjualan, perpanjangan & freeze membership, QR code check-in
- **Kelas & PT** — jadwal kelas, booking, manajemen trainer, sesi PT & subscription
- **Kehadiran** — kiosk QR, check-in/out, histori, streak mingguan
- **POS & Inventory** — kasir ritel & paket, kategori produk, stok & mutasi, kustomisasi receipt 
- **Pengeluaran & Laporan** — expense, laporan finansial Harian/Mingguan/Bulanan
- **Dashboard Owner** — ringkasan member aktif, grafik & AI assistant

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 13, PHP 8.3, Sanctum, Spatie Permission 8, Ziggy |
| **Frontend** | React 19, Inertia 3, Vite 8, Tailwind 4, Recharts, React Hook Form + Zod, Lucide |
| **Mobile** | Capacitor 8 (Android, iOS) |
| **Database** | PostgreSQL 15+ |
| **Tooling** | Vite, Laravel Pail, Pint, PHPUnit 12 |

---

## Requirements

| Kebutuhan | Versi Minimal | Keterangan |
|-----------|---------------|------------|
| **PHP** | 8.3 | `php -v` |
| **Composer** | 2.7 | `composer --version` |
| **Node.js** | 20 LTS | `node -v` (disarankan 20.18+) |
| **npm** | 10+ | atau `bun`/`pnpm` |
| **PostgreSQL** | 15 | `psql --version` + extension `pgsql` aktif di PHP |
| **GD / Imagick** | — | untuk resize foto profil (opsional) |
| **Android Studio** | Hedgehog+ | hanya untuk build Android |
| **Xcode 15+** | — | hanya untuk build iOS (macOS) |

> Tested di macOS 15 + PHP 8.3.12 + PostgreSQL 16 + Node 20.

---

## Instalasi Lokal (5 Menit)

```bash
# 1. Clone & deps
git clone <repo-url> trakin
cd trakin
composer install
npm install

# 2. Env
cp .env.example .env
php artisan key:generate

# 3. Database — buat DB trakin_gym di PostgreSQL dulu
# contoh: createdb trakin_gym   atau via pgAdmin
php artisan migrate --seed
# atau via composer shortcut:
composer run setup

# 4. Storage link (wajib untuk foto profil & logo)
php artisan storage:link

# 5. Run dev — 4 proses: server, queue, pail, vite
composer run dev
# manual alternatif:
# php artisan serve
# npm run dev
```

Buka http://127.0.0.1:8000 → login pakai akun demo di bawah.

---

## Akun Demo (password semua `password`)

Seeder `DatabaseSeeder` membuat 7 user:

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| **Owner** | `owner@trakin.com` | `password` | Semua modul + Settings Details/System/Receipt + Broadcast/Dev |
| **Manager** | `manager@trakin.com` | `password` | Hampir semua (kecuali kelola user Owner-only) |
| **Front Desk** | `frontdesk@trakin.com` | `password` | Member, Attendance, POS, Kiosk |
| **Sales** | `sales@trakin.com` | `password` | Member (komisi), POS |
| **Trainer** | `alex@trakin.com` | `password` | Kelas, Trainer, Sesi PT |
| **Trainer 2** | `sarah@trakin.com` | `password` | sama |
| **Member** | `member@trakin.com` | `password` | Member Portal |

---

## Struktur Project

```
app/
  Http/Controllers/  # Member, GymSettings, POS, Trainer, Class, etc.
  Models/            # User, Member, Trainer, Product, Sale, Setting, ...
resources/
  js/
    Pages/Admin/     # Dashboard, Members, POS, Inventory, Settings, Users, ...
    Pages/Member/    # Dashboard, Classes, Profile, Trainers, History
    Components/Auth/ # MobileLoginView, DesktopLoginView
    Layouts/         # AdminLayout, MemberLayout
  css/app.css
public/
  images/login.avif
  uploads/           # trainers, classes, settings
storage/app/public/uploads/ # profiles, settings
routes/web.php
database/seeders/    # DatabaseSeeder & RealWorldTestSeeder
```

---

## Build & Mobile (Capacitor)

```bash
npm run build        # vite build → public/build
npm run cap:sync     # build + npx cap sync (android & ios)
npm run cap:ios      # build + sync ios saja

npx cap open android # buka Android Studio
npx cap open ios     # buka Xcode
```

- `capacitor.config.json` → `appId: com.trakin.app`, `webDir: public`
- Background login `public/images/login.avif` otomatis ikut ter-bundle

---

## Testing

```bash
composer run test   # php artisan config:clear + php artisan test
php artisan test    # langsung
```
