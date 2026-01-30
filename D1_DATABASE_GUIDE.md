# 📊 Cloudflare D1 Database Yönetim Rehberi

Bu rehber, CRM uygulamanızın Cloudflare D1 database'ini yönetmek için tüm komutları ve en iyi pratikleri içerir.

---

## 📑 İçindekiler

1. [Temel Komutlar](#temel-komutlar)
2. [Database Yedekleme (Backup)](#database-yedekleme-backup)
3. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
4. [Veri Temizleme](#veri-temizleme)
5. [Migration İşlemleri](#migration-işlemleri)
6. [İleri Seviye SQL Sorguları](#ileri-seviye-sql-sorguları)
7. [Acil Durum Kurtarma](#acil-durum-kurtarma)
8. [En İyi Pratikler](#en-iyi-pratikler)

---

## 🎯 Temel Komutlar

### Database Listesi
```bash
pnpm wrangler d1 list
```
Tüm D1 database'lerinizi listeler.

### Database Bilgisi
```bash
pnpm wrangler d1 info crm-final
```
Database'in boyutunu, tablo sayısını ve diğer detayları gösterir.

### Tabloları Listele
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

### Tablo Yapısını İncele
```bash
pnpm wrangler d1 execute crm-final --remote --command="PRAGMA table_info(user)"
```

---

## 💾 Database Yedekleme (BACKUP)

### ⚠️ ÇOK ÖNEMLİ: Her Deploy Öncesi Yedek Alın!

**Temel Yedekleme:**
```bash
pnpm wrangler d1 export crm-final --remote --output=backup.sql
```

**Tarih İle Yedekleme (Önerilen):**

**Windows PowerShell:**
```powershell
$date = Get-Date -Format "yyyyMMdd-HHmmss"
pnpm wrangler d1 export crm-final --remote --output="backup-$date.sql"
```

**Windows CMD:**
```cmd
pnpm wrangler d1 export crm-final --remote --output=backup-%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
```

**Git Bash (Windows):**
```bash
pnpm wrangler d1 export crm-final --remote --output=backup-$(date +%Y%m%d-%H%M%S).sql
```

### 📁 Yedekleme Stratejisi

**Backup Klasörü Oluştur:**
```bash
mkdir backups
```

**Düzenli Yedekleme:**
```powershell
# Her gün
pnpm wrangler d1 export crm-final --remote --output="backups/daily-backup-$(Get-Date -Format 'yyyyMMdd').sql"

# Her hafta
pnpm wrangler d1 export crm-final --remote --output="backups/weekly-backup-$(Get-Date -Format 'yyyy-ww').sql"

# Önemli update öncesi
pnpm wrangler d1 export crm-final --remote --output="backups/before-v2-migration.sql"
```

### 🔄 Backup'tan Geri Yükleme

**⚠️ DİKKAT: Bu işlem mevcut verileri SİLER!**

```bash
# 1. Backup'ı geri yükle
pnpm wrangler d1 execute crm-final --remote --file=backups/backup-20260129.sql
```

**Eğer sorun yaşarsanız:**
```bash
# Önce tabloları temizle
pnpm wrangler d1 execute crm-final --remote --command="DROP TABLE IF EXISTS companies; DROP TABLE IF EXISTS user; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS assignments; DROP TABLE IF EXISTS contacts; DROP TABLE IF EXISTS conversationNotes; DROP TABLE IF EXISTS teams; DROP TABLE IF EXISTS teamMembers; DROP TABLE IF EXISTS activities; DROP TABLE IF EXISTS session; DROP TABLE IF EXISTS account; DROP TABLE IF EXISTS verification"

# Sonra backup'ı yükle
pnpm wrangler d1 execute crm-final --remote --file=backups/backup-20260129.sql
```

---

## 👤 Kullanıcı Yönetimi

### İlk Admin Hesabı Oluşturma

**1. Web'de Kayıt Ol:**
```
https://crm-final.keremoezel.workers.dev/register
```

**2. Admin Yap:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="UPDATE user SET role = 'Admin' WHERE email = 'admin@example.com'"
```

### Kullanıcıları Görüntüle

**Tüm Kullanıcılar:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT id, name, email, role, createdAt FROM user ORDER BY createdAt DESC"
```

**Sadece Adminler:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT name, email FROM user WHERE role = 'Admin'"
```

**Kullanıcı Sayısı:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT role, COUNT(*) as count FROM user GROUP BY role"
```

### Rol Değiştirme

**Admin Yap:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="UPDATE user SET role = 'Admin' WHERE email = 'user@example.com'"
```

**Teamlead Yap:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="UPDATE user SET role = 'Teamlead' WHERE email = 'user@example.com'"
```

**Agent Yap:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="UPDATE user SET role = 'Agent' WHERE email = 'user@example.com'"
```

### Kullanıcı Silme

**⚠️ DİKKAT: İlişkili veriler (assignments, tasks) silinebilir!**

```bash
pnpm wrangler d1 execute crm-final --remote --command="DELETE FROM user WHERE email = 'user@example.com'"
```

---

## 🗑️ Veri Temizleme

### Development Endpoints (Sadece Development Ortamında)

**Local Development (http://127.0.0.1:8787):**

```bash
# Sadece müşteri ve görevleri sil (Users/Teams kalır)
curl http://127.0.0.1:8787/api/dev/reset-customers-tasks

# Tüm database'i sıfırla
curl http://127.0.0.1:8787/api/dev/reset-db

# Test verileri oluştur
curl http://127.0.0.1:8787/api/dev/seed
```

### Manuel Temizleme (Production'da)

**Müşterileri Temizle:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="DELETE FROM companies"
```

**Görevleri Temizle:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="DELETE FROM tasks"
```

**Atamaları Temizle:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="DELETE FROM assignments"
```

**Tüm İş Verilerini Temizle (Users/Teams Kalır):**
```bash
pnpm wrangler d1 execute crm-final --remote --command="DELETE FROM activities; DELETE FROM tasks; DELETE FROM assignments; DELETE FROM conversationNotes; DELETE FROM contacts; DELETE FROM companies"
```

---

## 🔄 Migration İşlemleri

### Yeni Migration Uygulama

**Tek Bir Migration:**
```bash
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0005_new_feature.sql
```

**Tüm Migrationları Sırayla:**
```bash
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0000_uneven_hardball.sql
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0001_overjoyed_excalibur.sql
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0002_hot_starjammers.sql
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0003_parched_changeling.sql
pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0004_slimy_lorna_dane.sql
```

### ⚠️ Migration Öncesi Checklist

1. ✅ **BACKUP AL!**
   ```bash
   pnpm wrangler d1 export crm-final --remote --output=backups/before-migration-$(Get-Date -Format 'yyyyMMdd').sql
   ```

2. ✅ **Local'de Test Et:**
   ```bash
   pnpm wrangler d1 execute crm-final --local --file=server/database/migrations/0005_new_feature.sql
   ```

3. ✅ **Production'da Uygula:**
   ```bash
   pnpm wrangler d1 execute crm-final --remote --file=server/database/migrations/0005_new_feature.sql
   ```

4. ✅ **Doğrula:**
   ```bash
   pnpm wrangler d1 execute crm-final --remote --command="PRAGMA table_info(new_table_name)"
   ```

---

## 🔍 İleri Seviye SQL Sorguları

### İstatistikler

**Müşteri İstatistikleri:**
```bash
# Toplam müşteri sayısı
pnpm wrangler d1 execute crm-final --remote --command="SELECT COUNT(*) as total_customers FROM companies"

# Proje bazında müşteri dağılımı
pnpm wrangler d1 execute crm-final --remote --command="SELECT project, COUNT(*) as count FROM companies GROUP BY project ORDER BY count DESC"

# En son eklenen 10 müşteri
pnpm wrangler d1 execute crm-final --remote --command="SELECT name, createdAt FROM companies ORDER BY createdAt DESC LIMIT 10"
```

**Görev İstatistikleri:**
```bash
# Durum bazında görev sayısı
pnpm wrangler d1 execute crm-final --remote --command="SELECT status, COUNT(*) as count FROM tasks GROUP BY status ORDER BY count DESC"

# Öncelik bazında görev sayısı
pnpm wrangler d1 execute crm-final --remote --command="SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY count DESC"

# Agent bazında görev yükü
pnpm wrangler d1 execute crm-final --remote --command="SELECT u.name, COUNT(t.id) as task_count FROM user u LEFT JOIN tasks t ON u.id = t.assignedTo GROUP BY u.id, u.name ORDER BY task_count DESC"
```

**Atama İstatistikleri:**
```bash
# Agent bazında müşteri dağılımı
pnpm wrangler d1 execute crm-final --remote --command="SELECT u.name as agent, COUNT(DISTINCT a.companyId) as customer_count FROM user u LEFT JOIN assignments a ON u.id = a.agentId GROUP BY u.id, u.name ORDER BY customer_count DESC"

# Bu ayki yeni atamalar
pnpm wrangler d1 execute crm-final --remote --command="SELECT COUNT(*) as this_month FROM assignments WHERE assignedAt >= date('now', 'start of month')"
```

### Veri Analizi

**En Aktif Agents:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT u.name, COUNT(DISTINCT t.id) as completed_tasks FROM user u JOIN tasks t ON u.id = t.assignedTo WHERE t.status = 'Erledigt' GROUP BY u.id ORDER BY completed_tasks DESC LIMIT 10"
```

**Müşteri Yaşı:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT name, CAST((julianday('now') - julianday(createdAt)) AS INTEGER) as days_since_created FROM companies ORDER BY days_since_created DESC LIMIT 20"
```

**Yaklaşan Görevler:**
```bash
pnpm wrangler d1 execute crm-final --remote --command="SELECT t.title, c.name as company, t.dueDate, u.name as assignee FROM tasks t JOIN companies c ON t.companyId = c.id JOIN user u ON t.assignedTo = u.id WHERE t.dueDate >= date('now') AND t.dueDate <= date('now', '+7 days') AND t.status != 'Erledigt' ORDER BY t.dueDate"
```

---

## 🚨 Acil Durum Kurtarma

### Senaryo 1: Yanlış Veri Silindi

**1. Hemen Backup Al (Mevcut durumu kaydet):**
```bash
pnpm wrangler d1 export crm-final --remote --output=backups/after-accident.sql
```

**2. Son Backup'ı Geri Yükle:**
```bash
pnpm wrangler d1 execute crm-final --remote --file=backups/backup-20260129.sql
```

### Senaryo 2: Migration Başarısız Oldu

**1. Hemen Durdur:**
```bash
# Ctrl+C ile komutları durdur
```

**2. Önceki Backup'a Dön:**
```bash
pnpm wrangler d1 execute crm-final --remote --file=backups/before-migration.sql
```

### Senaryo 3: Database Bozuldu

**1. Yeni Database Oluştur:**
```bash
pnpm wrangler d1 create crm-final-recovery
```

**2. Backup'ı Yeni Database'e Yükle:**
```bash
pnpm wrangler d1 execute crm-final-recovery --remote --file=backups/latest-backup.sql
```

**3. wrangler.jsonc'de Database ID'yi Değiştir**

**4. Yeni Deploy:**
```bash
pnpm wrangler deploy
```

---

## 📚 En İyi Pratikler

### 1. Düzenli Yedekleme

**Günlük (Otomatik Script):**
```powershell
# backup-daily.ps1
$date = Get-Date -Format "yyyyMMdd"
pnpm wrangler d1 export crm-final --remote --output="backups/daily/backup-$date.sql"

# Eski backupları temizle (30 günden eski)
Get-ChildItem backups/daily -Filter *.sql | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

**Önemli İşlemler Öncesi:**
```bash
# Deploy öncesi
pnpm wrangler d1 export crm-final --remote --output=backups/before-deploy.sql
pnpm wrangler deploy

# Migration öncesi
pnpm wrangler d1 export crm-final --remote --output=backups/before-migration-v2.sql
pnpm wrangler d1 execute crm-final --remote --file=migrations/new.sql
```

### 2. Test → Production İş Akışı

```bash
# 1. Local'de test et
pnpm wrangler dev
# Test yap...

# 2. Local database'e test verileri ekle
pnpm wrangler d1 execute crm-final --local --file=test-data.sql

# 3. Preview'a deploy et
pnpm wrangler deploy --env preview

# 4. Preview'da test et
# https://crm-final-preview.keremoezel.workers.dev

# 5. Backup al
pnpm wrangler d1 export crm-final --remote --output=backups/before-prod-deploy.sql

# 6. Production'a deploy et
pnpm wrangler deploy
```

### 3. Version Control

**Backupları Git'e Ekleme (KÜÇÜk database için):**
```bash
git add backups/important-milestone.sql
git commit -m "Backup: Before major refactoring"
```

**Backupları Dışarıda Sakla (BÜYÜK database için):**
```bash
# .gitignore'a ekle
echo "backups/*.sql" >> .gitignore

# Harici storage'a kopyala (Google Drive, Dropbox, vb.)
# Manuel veya script ile
```

### 4. Güvenlik

**❌ Asla Production'da Yapma:**
- Test verileri oluşturma
- `DROP TABLE` komutları
- Tüm verileri silme
- `/api/dev/*` endpoint'lerini açık bırakma

**✅ Her Zaman:**
- Backup almadan deploy yapma
- Migration'ları local'de test et
- Kritik SQL komutları `WHERE` clause ile sınırla
- Production'a erişimi sınırla

### 5. Monitoring

**Günlük Kontroller:**
```bash
# Database boyutu
pnpm wrangler d1 info crm-final

# Toplam kayıtlar
pnpm wrangler d1 execute crm-final --remote --command="SELECT 'users' as table_name, COUNT(*) as count FROM user UNION ALL SELECT 'companies', COUNT(*) FROM companies UNION ALL SELECT 'tasks', COUNT(*) FROM tasks"

# Son 24 saatteki yeni müşteriler
pnpm wrangler d1 execute crm-final --remote --command="SELECT COUNT(*) as new_customers_24h FROM companies WHERE createdAt >= datetime('now', '-1 day')"
```

---

## 🔗 Hızlı Referans

| Komut | Açıklama |
|-------|----------|
| `pnpm wrangler d1 list` | Tüm database'leri listele |
| `pnpm wrangler d1 info crm-final` | Database bilgisi |
| `pnpm wrangler d1 export crm-final --remote --output=backup.sql` | Backup al |
| `pnpm wrangler d1 execute crm-final --remote --file=backup.sql` | Backup'tan geri yükle |
| `pnpm wrangler d1 execute crm-final --remote --command="SQL"` | SQL komutu çalıştır |
| `--remote` | Production database |
| `--local` | Development database |

---

## 📞 Yardım

**Wrangler Dokümantasyonu:**
- https://developers.cloudflare.com/d1/

**D1 Limits:**
- Free Plan: 5GB total, 10,000,000 rows/day
- Paid Plan: Unlimited

**Sorun Giderme:**
```bash
# Wrangler versiyonunu kontrol et
pnpm wrangler --version

# Güncel versiyona güncelle
pnpm add -D wrangler@latest

# Debug modu
pnpm wrangler d1 execute crm-final --remote --command="SELECT 1" --verbose
```

---

## ⚠️ Önemli Hatırlatmalar

1. **HER DEPLOY ÖNCESİ BACKUP AL!** ✅
2. **Production'da direkt SQL yerine API kullan** ✅
3. **Backupları düzenli temizle (eski olanları sil)** ✅
4. **Migration'ları local'de test et** ✅
5. **Kritik işlemler için double-check yap** ✅

---

**Son Güncelleme:** 29 Ocak 2026  
**Database Adı:** `crm-final`  
**Production URL:** https://crm-final.keremoezel.workers.dev
