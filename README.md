# Matematik Kaşifi — 11. Sınıf Geometri

Mavi-yeşil temalı, mobil uyumlu öğrenme sitesi prototipi. Konular: Yamuk, paralelkenar ve eşkenar dörtgen. Araştırma görevi, mini testler, XP, ilerleme göstergesi, öğrenme günlüğü ve animasyonlar içerir.

## 1. Bilgisayarda çalıştırma
Bu proje ES modülleri ve Firebase'in web SDK'sını kullandığı için `index.html` dosyasını doğrudan çift tıklayarak açma. VS Code'da klasörü aç ve **Live Server** eklentisiyle `index.html` dosyasını çalıştır. Alternatif olarak bir yerel HTTP sunucusu kullan.

## 2. Firebase ve Google/e-posta kayıt sistemi
1. https://console.firebase.google.com/ adresinden proje oluştur.
2. Proje ayarlarından bir **Web app** ekle.
3. Verilen `firebaseConfig` bilgilerini `firebase-config.js` dosyasındaki yer tutucularla değiştir.
4. Firebase Console → **Authentication** → **Get started** → **Sign-in method** bölümünde **Email/Password** ve **Google** sağlayıcılarını etkinleştir.
5. Authentication → Settings → **Authorized domains** bölümüne geliştirme/hosting alan adını ekle. Yerel geliştirme için kullandığın alan adının listede olduğundan emin ol.
6. Firebase Console → **Firestore Database** → **Create database** ile veritabanı oluştur.
7. Firestore → **Rules** alanına `firestore.rules` dosyasının içeriğini yapıştırıp yayımla.
8. `index.html` dosyasını Live Server ile yeniden aç. Google ve e-posta kayıt/giriş akışlarını dene.

**Önemli:** Firebase bilgileri eklenmeden site öğrenme ekranlarıyla çalışır; giriş/kayıt özelliği etkinleşmez. İlerleme cihazda yerel olarak tutulur, giriş yapıldığında Firestore ile eşitlenir. Firestore kuralları kişisel ilerlemeyi yalnızca ilgili kullanıcıya açar. Gerçek öğrenci kullanımından önce öğretmen/veli gözetiminde test et; gizlilik metni, yaşa uygun izinler, erişilebilirlik ve güvenlik kontrollerini tamamla.

## 3. Ücretsiz yayınlama
Firebase Hosting kullanabilirsin:
1. Node.js ve Firebase CLI kur.
2. Terminalde proje klasörüne gir: `npm install -g firebase-tools`
3. `firebase login`
4. `firebase init hosting` — mevcut projeyi seç, public dizini olarak `.` kullan; tek sayfa uygulama yönlendirmesi sorulursa `No` seç.
5. `firebase deploy`
6. Yayınlanan URL'yi Firebase Authentication → Authorized domains listesine ekle.

`firebase init` bir `firebase.json` dosyası oluşturabilir. Hosting için en basit yapı:
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "README.md", "firestore.rules"]
  }
}
```
## 4. Öğrenme yaklaşımı
Site; gözlem, tahmin, gerekçelendirme, aktif hatırlama, geri bildirim ve kısa öğrenme günlüğü gibi teknikleri bir araya getirir. İçerikler öğretim amaçlı başlangıç materyalidir; yayımlamadan önce güncel 11. sınıf Türkiye Yüzyılı Maarif Modeli kazanımlarıyla öğretmen tarafından karşılaştırılmalıdır.
