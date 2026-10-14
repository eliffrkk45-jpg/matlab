// Firebase ayarlarını firebase-config.js dosyasına ekledikten sonra kimlik doğrulama aktif olur.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const localKey = "matematikKasifiProgress_v1";
let app = null, auth = null, db = null, authReady = false, authMode = "login", currentUser = null;
let progress = { xp: 0, completed: [], streak: 0, lastVisit: "", quizDone: [], note: "" };
let toastTimer;

const topics = {
  yamuk: {
    name: "Yamuk", label: "ŞEKİL 01", intro: "Bir dörtgende karşılıklı kenar çiftlerinden en az biri paralelse bu dörtgen yamuk olarak incelenir. Şekli hareket ettirerek hangi özelliklerin korunduğunu araştır.",
    diagram: `<svg viewBox="0 0 360 180"><polygon points="90,35 260,35 315,140 35,140" fill="#55dfb2" fill-opacity=".13" stroke="#39bc91" stroke-width="3"/><line x1="90" y1="35" x2="90" y2="140" stroke="#2fae86" stroke-dasharray="5 5" stroke-width="2"/><path d="M90 127 L103 127 L103 140" fill="none" stroke="#2fae86" stroke-width="2"/><text x="172" y="25" fill="#16845f" font-size="15" font-weight="700">a</text><text x="171" y="160" fill="#16845f" font-size="15" font-weight="700">c</text><text x="70" y="92" fill="#16845f" font-size="15" font-weight="700">h</text></svg>`,
    explore: `<h4>Önce gözlemle</h4><p>Şekilde üst ve alt taban birbirine paraleldir. Yükseklik, tabanlar arasındaki dik uzaklıktır; yan kenar uzunluğuyla aynı olmak zorunda değildir.</p><ul><li>Paralel tabanları belirle.</li><li>Taban uzunluklarını a ve c, yüksekliği h ile göster.</li><li>Yüksekliği artırmanın alanı nasıl etkilediğini tahmin et.</li></ul>`,
    connect: `<h4>Alan ilişkisini kur</h4><p>Yamuğun alanı, taban uzunluklarının toplamının yükseklikle çarpımının yarısıdır:</p><p><strong>A = (a + c) · h / 2</strong></p><p>Bu bağıntı, iki tabanın aritmetik ortalaması ile yüksekliğin çarpımı olarak da yorumlanabilir.</p>`,
    questions: [
      {q:"Tabanları 8 cm ve 14 cm, yüksekliği 5 cm olan yamuğun alanı kaç cm²'dir?", options:["22","55","70"], answer:1, explain:"A = (8 + 14) × 5 / 2 = 55 cm²."},
      {q:"Tabanlar sabitken yükseklik iki katına çıkarsa alan ne olur?", options:["İki katına çıkar","Değişmez","Yarıya iner"], answer:0, explain:"Alan yükseklikle doğru orantılıdır; yükseklik iki katına çıkınca alan da iki katına çıkar."},
      {q:"Yamukta yükseklik hangi uzaklıktır?", options:["Yan kenarın uzunluğu","Paralel tabanlar arasındaki dik uzaklık","Tabanların toplamı"], answer:1, explain:"Yükseklik, paralel tabanlar arasındaki dik uzaklıktır."}
    ]
  },
  paralelkenar: {
    name: "Paralelkenar", label: "ŞEKİL 02", intro: "Paralelkenarda karşılıklı kenarlar paraleldir. Kenarları, açıları ve köşegenleri inceleyerek hangi özelliklerin her zaman geçerli olduğunu keşfet.",
    diagram: `<svg viewBox="0 0 360 180"><polygon points="100,30 310,30 260,140 50,140" fill="#65aaff" fill-opacity=".13" stroke="#5299ed" stroke-width="3"/><line x1="100" y1="30" x2="260" y2="140" stroke="#5299ed" stroke-dasharray="5 5"/><line x1="310" y1="30" x2="50" y2="140" stroke="#5299ed" stroke-dasharray="5 5"/><text x="190" y="20" fill="#3479c0" font-size="13" font-weight="700">a</text><text x="25" y="88" fill="#3479c0" font-size="13" font-weight="700">b</text></svg>`,
    explore: `<h4>Özellikleri araştır</h4><ul><li>Karşılıklı kenar çiftleri paraleldir.</li><li>Karşılıklı kenarlar eşit uzunluktadır.</li><li>Karşılıklı açılar eşit, komşu açılar bütünlerdir.</li><li>Köşegenler birbirini ortalar; her zaman eşit uzunlukta olmaları gerekmez.</li></ul>`,
    connect: `<h4>Alanı yorumla</h4><p>Paralelkenarın alanı taban uzunluğu ile o tabana ait yüksekliğin çarpımıdır:</p><p><strong>A = taban × yükseklik</strong></p><p>Şeklin eğimini değiştirmek alanı tek başına değiştirmez; taban ve yükseklik aynı kaldığı sürece alan sabit kalır.</p>`,
    questions: [
      {q:"Tabanı 12 cm, bu tabana ait yüksekliği 7 cm olan paralelkenarın alanı kaç cm²'dir?", options:["19","42","84"], answer:2, explain:"A = 12 × 7 = 84 cm²."},
      {q:"Paralelkenarda köşegenler için hangisi doğrudur?", options:["Her zaman eşittir","Birbirini ortalar","Her zaman diktir"], answer:1, explain:"Paralelkenarın köşegenleri birbirini ortalar. Eşit ya da dik olmaları genel durumda zorunlu değildir."},
      {q:"Komşu iki açının ölçüleri toplamı kaç derecedir?", options:["90°","180°","360°"], answer:1, explain:"Komşu açılar bütünlerdir; ölçüleri toplamı 180° olur."}
    ]
  },
  eskenar: {
    name: "Eşkenar dörtgen", label: "ŞEKİL 03", intro: "Eşkenar dörtgenin dört kenarı eşit uzunluktadır. Köşegenlerini ve açı ilişkilerini inceleyerek onu diğer paralelkenarlardan ayıran özellikleri belirle.",
    diagram: `<svg viewBox="0 0 360 180"><polygon points="180,15 300,90 180,165 60,90" fill="#a78bfa" fill-opacity=".14" stroke="#9678e8" stroke-width="3"/><line x1="180" y1="15" x2="180" y2="165" stroke="#9678e8" stroke-dasharray="5 5" stroke-width="2"/><line x1="60" y1="90" x2="300" y2="90" stroke="#9678e8" stroke-dasharray="5 5" stroke-width="2"/><text x="194" y="90" fill="#7758c4" font-size="12" font-weight="700">d₁</text><text x="180" y="106" fill="#7758c4" font-size="12" font-weight="700">d₂</text></svg>`,
    explore: `<h4>Özellikleri bul</h4><ul><li>Dört kenarın uzunluğu eşittir.</li><li>Karşılıklı kenarlar paraleldir.</li><li>Köşegenler birbirini dik keser ve ortalar.</li><li>Köşegenler karşılıklı açıları ortalar.</li><li>Köşegen uzunlukları genel durumda eşit değildir.</li></ul>`,
    connect: `<h4>Alanı iki yoldan düşün</h4><p>Paralelkenar olarak alan, taban × yüksekliktir. Köşegenleri biliniyorsa eşkenar dörtgenin alanı şu bağıntıyla bulunabilir:</p><p><strong>A = d₁ × d₂ / 2</strong></p><p>Bu formül, köşegenlerin şekli dört üçgene ayırması üzerinden gerekçelendirilebilir.</p>`,
    questions: [
      {q:"Köşegenleri 10 cm ve 6 cm olan eşkenar dörtgenin alanı kaç cm²'dir?", options:["16","30","60"], answer:1, explain:"A = 10 × 6 / 2 = 30 cm²."},
      {q:"Eşkenar dörtgenin dört kenarı için hangisi doğrudur?", options:["Hepsi eşit uzunluktadır","Sadece karşılıklı kenarlar eşittir","Hepsi farklıdır"], answer:0, explain:"Eşkenar dörtgende dört kenarın uzunluğu birbirine eşittir."},
      {q:"Eşkenar dörtgenin köşegenleri nasıl kesişir?", options:["Birbirine paralel","Birbirini dik keserek ortalar","Birbirini ortalamaz"], answer:1, explain:"Eşkenar dörtgenin köşegenleri birbirini dik keser ve ortalar."}
    ]
  }
};

function showToast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function safeProgress(p) {
  return { xp: Number(p?.xp)||0, completed: Array.isArray(p?.completed)?p.completed:[], streak: Number(p?.streak)||0, lastVisit: p?.lastVisit||"", quizDone: Array.isArray(p?.quizDone)?p.quizDone:[], note: typeof p?.note==="string"?p.note:"" };
}
function loadLocal() { try { progress = safeProgress(JSON.parse(localStorage.getItem(localKey)||"{}")); } catch { progress = safeProgress({}); } }
function saveLocal() { localStorage.setItem(localKey, JSON.stringify(progress)); updateDashboard(); }
function updateDashboard() {
  $("#xpValue").textContent = `${progress.xp} XP`;
  $("#streakValue").textContent = `${progress.streak} gün`;
  $("#completedValue").textContent = `${progress.completed.length} / 3`;
  const pct = Math.round(progress.completed.length/3*100);
  $("#progressPercent").textContent = `${pct}%`; $("#progressBar").style.width = `${pct}%`;
  $("#journalNote").value = progress.note || "";
  $("#noteStatus").textContent = progress.note ? "Kaydedildi ✓" : "Henüz kaydedilmedi";
}
async function saveProgress() {
  saveLocal();
  if (currentUser && db) {
    try { await setDoc(doc(db,"users",currentUser.uid), { progress, email: currentUser.email || "", displayName: currentUser.displayName || "", updatedAt: serverTimestamp() }, {merge:true}); }
    catch (e) { console.warn("İlerleme buluta kaydedilemedi:", e); }
  }
}
async function loadUserProgress(user) {
  if (!user || !db) return;
  try { const snap = await getDoc(doc(db,"users",user.uid)); if (snap.exists() && snap.data().progress) { progress = safeProgress(snap.data().progress); saveLocal(); } }
  catch(e) { console.warn("Bulut ilerlemesi alınamadı:",e); }
}
function markVisit() {
  const today = new Date().toISOString().slice(0,10);
  if (progress.lastVisit !== today) {
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    progress.streak = progress.lastVisit === yesterday ? progress.streak + 1 : 1;
    progress.lastVisit = today;
  }
}
function setAuthUI(user) {
  currentUser = user;
  $("#loginOpen").classList.toggle("hidden",!!user); $("#signupOpen").classList.toggle("hidden",!!user);
  $("#logoutBtn").classList.toggle("hidden",!user); $("#userBadge").classList.toggle("hidden",!user);
  $("#userBadge").textContent = user ? (user.displayName || user.email || "Öğrenci") : "";
}
function authError(message) { $("#authError").textContent = message; $("#authError").classList.remove("hidden"); }
function clearAuthError() { $("#authError").textContent=""; $("#authError").classList.add("hidden"); }
function openAuth(mode) {
  authMode = mode; clearAuthError();
  $("#authTitle").textContent = mode==="signup" ? "Hesabını oluştur" : "Tekrar hoş geldin!";
  $("#authSubtitle").textContent = mode==="signup" ? "Ücretsiz hesabınla öğrenme yolculuğunu başlat." : "İlerlemeni hesabınla farklı cihazlarda sürdür.";
  $("#authSubmit").textContent = mode==="signup" ? "Hesap oluştur" : "Giriş yap";
  $("#switchText").textContent = mode==="signup" ? "Zaten hesabın var mı?" : "Hesabın yok mu?";
  $("#switchAuth").textContent = mode==="signup" ? "Giriş yap" : "Kayıt ol";
  $("#authModal").classList.remove("hidden");
}
function closeAuth() { $("#authModal").classList.add("hidden"); }
function setAuthMode(mode) { openAuth(mode); }
function initFirebase() {
  const ready = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "BURAYA_API_KEY";
  if (!ready) {
    $("#loginOpen").title = "Önce firebase-config.js ayarlanmalı";
    $("#signupOpen").title = "Önce firebase-config.js ayarlanmalı";
    return;
  }
  try {
    app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); authReady = true;
    onAuthStateChanged(auth, async user => {
      setAuthUI(user);
      if (user) { await loadUserProgress(user); showToast("Hoş geldin! İlerlemen hesabınla eşitlendi."); }
    });
  } catch(e) { console.error(e); }
}
async function googleSignIn() {
  clearAuthError();
  if (!authReady) { authError("Firebase henüz ayarlanmadı. README dosyasındaki kurulum adımlarını tamamla."); return; }
  try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth,provider); closeAuth(); }
  catch(e) { authError(authMessage(e)); }
}
function authMessage(e) {
  const code=e?.code||"";
  if(code.includes("auth/invalid-email")) return "E-posta adresini kontrol et.";
  if(code.includes("auth/email-already-in-use")) return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
  if(code.includes("auth/weak-password")) return "Şifren en az 6 karakter olmalı.";
  if(code.includes("auth/invalid-credential")||code.includes("auth/wrong-password")||code.includes("auth/user-not-found")) return "E-posta veya şifre doğru görünmüyor.";
  if(code.includes("auth/popup-closed-by-user")) return "Giriş penceresi kapatıldı.";
  if(code.includes("auth/unauthorized-domain")) return "Bu alan adı Firebase Console > Authentication > Settings bölümüne eklenmeli.";
  return "İşlem tamamlanamadı. Firebase ayarlarını ve bağlantını kontrol et.";
}
async function submitAuth(event) {
  event.preventDefault(); clearAuthError();
  if (!authReady) { authError("Firebase henüz ayarlanmadı. README dosyasındaki kurulum adımlarını tamamla."); return; }
  const email=$("#authEmail").value.trim(), password=$("#authPassword").value;
  try {
    if(authMode==="signup") {
      const credential=await createUserWithEmailAndPassword(auth,email,password);
      const name=email.split("@")[0]; await updateProfile(credential.user,{displayName:name});
      setAuthUI(credential.user); await saveProgress();
    } else { await signInWithEmailAndPassword(auth,email,password); }
    closeAuth(); showToast("Başarıyla giriş yaptın!");
  } catch(e) { authError(authMessage(e)); }
}
function openLesson(key) {
  const topic=topics[key]; if(!topic) return;
  const modal=$("#lessonModal"), content=$("#lessonContent");
  content.innerHTML = `<span class="lesson-eyebrow">${topic.label} • KEŞİF LABORATUVARI</span><h2 class="lesson-title">${topic.name}</h2><p class="lesson-intro">${topic.intro}</p><div class="lesson-diagram">${topic.diagram}</div><div class="lesson-tabs"><button class="active" data-tab="explore">Gözlemle</button><button data-tab="connect">Bağlantı kur</button><button data-tab="quiz">Kendini sına</button></div><div class="lesson-panel" id="lessonPanel">${topic.explore}</div><div class="lesson-footer"><small id="lessonProgress">Bu konuyu tamamlamak için mini testi çöz.</small><button id="completeTopic" class="btn btn-primary">Konuyu tamamla <span>✓</span></button></div>`;
  modal.classList.remove("hidden");
  let questionIndex=0, correctCount=0, quizFinished=false;
  const panel=$("#lessonPanel");
  $$(".lesson-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".lesson-tabs button").forEach(b=>b.classList.toggle("active",b===btn));
    if(btn.dataset.tab==="explore") panel.innerHTML=topic.explore;
    else if(btn.dataset.tab==="connect") panel.innerHTML=topic.connect;
    else renderQuestion();
  }));
  function renderQuestion() {
    const q=topic.questions[questionIndex];
    if(!q) { quizFinished=true; panel.innerHTML=`<h4>Mini test tamamlandı!</h4><p>${correctCount}/${topic.questions.length} doğru yanıt. ${correctCount===topic.questions.length?"Harika, bütün ilişkileri doğru kurdun!":"Yanıtları tekrar inceleyip bir tur daha deneyebilirsin."}</p><button id="retryQuiz" class="btn btn-ghost">Yeniden dene ↻</button>`; $("#retryQuiz").addEventListener("click",()=>{questionIndex=0;correctCount=0;quizFinished=false;renderQuestion();}); $("#lessonProgress").textContent=`Mini test: ${correctCount}/${topic.questions.length} doğru`; return; }
    panel.innerHTML=`<p class="quiz-question">${questionIndex+1}/${topic.questions.length} • ${q.q}</p><div class="quiz-options">${q.options.map((o,i)=>`<button data-option="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div class="quiz-feedback" id="quizFeedback">Bir yanıt seç. Ardından gerekçeyi incele.</div>`;
    $$(".quiz-options button").forEach(btn=>btn.addEventListener("click",()=>{
      if(btn.disabled)return;
      const selected=Number(btn.dataset.option);
      $$(".quiz-options button").forEach(b=>b.disabled=true);
      if(selected===q.answer){btn.classList.add("correct");correctCount++;$("#quizFeedback").textContent="Doğru! "+q.explain;}
      else {btn.classList.add("incorrect");$$(".quiz-options button")[q.answer].classList.add("correct");$("#quizFeedback").textContent="Bir daha düşün: "+q.explain;}
      if(!progress.quizDone.includes(`${key}-${questionIndex}`)){progress.xp+=selected===q.answer?15:3;progress.quizDone.push(`${key}-${questionIndex}`);saveProgress();}
      const next=document.createElement("button");next.className="btn btn-primary";next.style.marginTop="12px";next.textContent=questionIndex===topic.questions.length-1?"Sonuçları gör":"Sonraki soru →";next.addEventListener("click",()=>{questionIndex++;renderQuestion();});panel.appendChild(next);
    }));
  }
  $("#completeTopic").onclick=async()=>{
    if(!progress.completed.includes(key)){progress.completed.push(key);progress.xp+=25;await saveProgress();showToast(`${topic.name} tamamlandı! +25 XP`);}
    else showToast("Bu konuyu zaten tamamladın.");
    $("#lessonProgress").textContent="Konu tamamlandı ✓"; $("#completeTopic").textContent="Tamamlandı ✓"; $("#completeTopic").disabled=true;
  };
}
function initMission() {
  let selected=null;
  $$("#missionChoices button").forEach(btn=>btn.addEventListener("click",()=>{
    selected=btn.dataset.answer;
    $$("#missionChoices button").forEach(b=>b.classList.toggle("selected",b===btn));
    $("#missionFeedback").textContent="Tahminin seçildi. Şimdi alan bağıntısıyla gerekçeni kontrol et.";
    $("#missionFeedback").className="feedback";
  }));
  $("#missionExplain").addEventListener("click",async()=>{
    if(!selected){$("#missionFeedback").textContent="Önce seçeneklerden bir tahmin seç.";return;}
    const correct=selected==="b";
    $("#missionFeedback").textContent=correct?"Doğru! A = (a + c) · h / 2 olduğundan tabanlar sabitken h iki katına çıkarsa alan da iki katına çıkar.":"Henüz değil. A = (a + c) · h / 2 bağıntısında tabanlar sabitse alan yükseklikle doğru orantılıdır. Doğru seçenek: İki katına çıkar.";
    $("#missionFeedback").className="feedback "+(correct?"correct":"incorrect");
    if(correct&&!progress.quizDone.includes("mission-area")){progress.xp+=50;progress.quizDone.push("mission-area");await saveProgress();showToast("+50 XP kazandın!");}
    $("#missionExplain").textContent="Gerekçeyi inceledin ✓";
  });
}
$("#loginOpen").addEventListener("click",()=>openAuth("login"));
$("#signupOpen").addEventListener("click",()=>openAuth("signup"));
$("#authClose").addEventListener("click",closeAuth);
$("#authModal").addEventListener("click",e=>{if(e.target===$("#authModal"))closeAuth();});
$("#lessonClose").addEventListener("click",()=>$("#lessonModal").classList.add("hidden"));
$("#lessonModal").addEventListener("click",e=>{if(e.target===$("#lessonModal"))$("#lessonModal").classList.add("hidden");});
$("#switchAuth").addEventListener("click",()=>setAuthMode(authMode==="login"?"signup":"login"));
$("#googleLogin").addEventListener("click",googleSignIn);
$("#authForm").addEventListener("submit",submitAuth);
$("#logoutBtn").addEventListener("click",async()=>{if(authReady){try{await signOut(auth);showToast("Çıkış yapıldı.");}catch{showToast("Çıkış yapılamadı.");}}else showToast("Firebase henüz yapılandırılmadı.");});
$$("[data-topic]").forEach(btn=>btn.addEventListener("click",()=>openLesson(btn.dataset.topic)));
$("#saveNote").addEventListener("click",async()=>{progress.note=$("#journalNote").value.trim();await saveProgress();$("#noteStatus").textContent="Kaydedildi ✓";showToast("Öğrenme notun kaydedildi.");});
$("#mobileMenu").addEventListener("click",()=>{$(".desktop-nav").classList.toggle("open");});
$$(".desktop-nav a").forEach(a=>a.addEventListener("click",()=>$(".desktop-nav").classList.remove("open")));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAuth();$("#lessonModal").classList.add("hidden");}});
loadLocal(); markVisit(); saveLocal(); initFirebase(); initMission();
