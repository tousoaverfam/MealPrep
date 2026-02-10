import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAZ4D0oRlCIwEEjRjPA2RauyxvIBFhzS-U",
  authDomain: "testemeals.firebaseapp.com",
  projectId: "testemeals",
  storageBucket: "testemeals.firebasestorage.app",
  messagingSenderId: "467182854778",
  appId: "1:467182854778:web:ebd40e0426d1c053b611c3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// USER
const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

// NAVIGATION
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function initUser() {
  if (!currentUser) showScreen("user-select");
  else {
    showScreen("home");
    updateUserIndicator();
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, user);
  currentUser = user;
  updateUserIndicator();
  showScreen("home");
}

function updateUserIndicator() {
  const indicator = document.getElementById("user-indicator");
  indicator.textContent = currentUser === "hugo" ? "Hugo" : "Lúcia";
}

// USER SELECT EVENTS
document.getElementById("selectHugo").onclick = () => setUser("hugo");
document.getElementById("selectLucia").onclick = () => setUser("lucia");

// NAVIGATION
document.getElementById("btnEscolher").onclick = () => { showScreen("swipe"); updateDay(); };
document.getElementById("btnSemana").onclick = () => { showScreen("week"); loadWeek(); };
document.getElementById("btnHistorico").onclick = () => { showScreen("history"); };
document.getElementById("backFromSwipe").onclick = () => showScreen("home");
document.getElementById("backFromWeek").onclick = () => showScreen("home");
document.getElementById("backFromHistory").onclick = () => showScreen("home");

// DADOS
let meals = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];

const weekDays = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];
let currentIndex = 0;
let currentDay = 0;

// ELEMENTOS
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearWeekBtn = document.getElementById("clearWeekBtn");
const resetDayBtn = document.getElementById("resetDayBtn");

// ------------------ FUNÇÕES ------------------
function highlightDay() {
  for (let i = 0; i < 7; i++) {
    const el = document.getElementById(`day-row-${i}`);
    el.classList.toggle("active", i === currentDay);
  }
}

function updateDay() {
  if (currentDay >= 7 || meals.length === 0) {
    mealName.textContent = "Já não há mais refeições chefe!";
    currentDayDisplay.textContent = "";
    buttons.style.display = "none";
    resetDayBtn.style.display = "none";
    highlightDay();
    return;
  }

  buttons.style.display = "flex";
  resetDayBtn.style.display = "block"; // sempre visível
  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
  highlightDay();
}

// ------------------ ESCOLHA ------------------
async function chooseMeal(isLike) {
  if (!navigator.onLine) {
    alert("Sem ligação à internet. As escolhas serão resolvidas depois.");
    return;
  }

  const selectedMeal = meals[currentIndex];

  if (isLike) {
    await setDoc(
      doc(db, "preferences", `${weekDays[currentDay]}_${currentUser}_${selectedMeal}`),
      { user: currentUser, day: weekDays[currentDay], meal: selectedMeal }
    );
    meals.splice(currentIndex,1); // remove do loop do user
  } else {
    meals.push(meals.splice(currentIndex,1)[0]);
  }

  if (currentIndex >= meals.length) currentIndex = 0;
  updateDay();
}

// ------------------ RESET DO DIA ------------------
async function resetDay() {
  const snapshot = await getDocs(collection(db, "preferences"));

  // apagar apenas escolhas do user no dia atual
  snapshot.forEach(async docSnap => {
    const data = docSnap.data();
    if (data.day === weekDays[currentDay] && data.user === currentUser) {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    }
  });

  // restaurar loop de refeições do user
  meals = [
    "Frango com arroz",
    "Massa à bolonhesa",
    "Salmão grelhado",
    "Stir-fry de legumes",
    "Wrap de frango",
    "Arroz de pato",
    "Bowl vegetariano"
  ];

  // volta ao início do menu de escolha do dia
  currentIndex = 0;
  updateDay();
}

// ------------------ SEMANA ------------------
async function loadWeek() {
  for (let i = 0; i < 7; i++) {
    document.getElementById(`day-${i}`).textContent = "—";
  }

  const snapshot = await getDocs(collection(db, "week"));
  snapshot.forEach(docSnap => {
    const idx = weekDays.indexOf(docSnap.id);
    if (idx >= 0) document.getElementById(`day-${idx}`).textContent = docSnap.data().meal;
  });
}

// ------------------ LIMPAR SEMANA ------------------
async function clearWeek() {
  if (!confirm("Limpar todas as refeições?")) return;
  const snapshot = await getDocs(collection(db, "week"));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "week", docSnap.id));
  }
  currentDay = 0;
  currentIndex = 0;
  meals = [
    "Frango com arroz",
    "Massa à bolonhesa",
    "Salmão grelhado",
    "Stir-fry de legumes",
    "Wrap de frango",
    "Arroz de pato",
    "Bowl vegetariano"
  ];
  updateDay();
}

// ------------------ EVENTOS ------------------
yesBtn.onclick = () => chooseMeal(true);
noBtn.onclick = () => chooseMeal(false);
clearWeekBtn.onclick = clearWeek;
resetDayBtn.onclick = resetDay;

// ------------------ INIT ------------------
initUser();
updateDay();
