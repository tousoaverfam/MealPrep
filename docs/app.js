// ------------------- FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ------------------- USER -------------------
const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

function formatUser(user) {
  if (user === "hugo") return "Hugo";
  if (user === "lucia") return "Lúcia";
  return "";
}

// ------------------- SPA NAVIGATION -------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");
}

function initUser() {
  if (!currentUser) {
    showScreen("user-select");
  } else {
    updateUserIndicator();
    showScreen("home");
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
  if (indicator) indicator.textContent = formatUser(currentUser);
}

// ------------------- USER SELECT -------------------
const selectHugo = document.getElementById("selectHugo");
const selectLucia = document.getElementById("selectLucia");
if (selectHugo) selectHugo.onclick = () => setUser("hugo");
if (selectLucia) selectLucia.onclick = () => setUser("lucia");

// ------------------- NAVIGATION -------------------
const btnEscolher = document.getElementById("btnEscolher");
const btnSemana = document.getElementById("btnSemana");
const btnHistorico = document.getElementById("btnHistorico");
const backFromSwipe = document.getElementById("backFromSwipe");
const backFromWeek = document.getElementById("backFromWeek");
const backFromHistory = document.getElementById("backFromHistory");
if (btnEscolher) btnEscolher.onclick = () => { showScreen("swipe"); updateDay(); };
if (btnSemana) btnSemana.onclick = () => { showScreen("week"); loadWeek(); };
if (btnHistorico) btnHistorico.onclick = () => showScreen("history");
if (backFromSwipe) backFromSwipe.onclick = () => showScreen("home");
if (backFromWeek) backFromWeek.onclick = () => showScreen("home");
if (backFromHistory) backFromHistory.onclick = () => showScreen("home");

// ------------------- DADOS -------------------
const baseMeals = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];
let meals = [...baseMeals];

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

let currentDay = 0;

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");

// ------------------- UI -------------------
function highlightDay() {
  for (let i = 0; i < 7; i++) {
    const row = document.getElementById(`day-row-${i}`);
    if (row) row.classList.toggle("active", i === currentDay);
  }
}

function updateDay() {
  if (!mealName || !currentDayDisplay || !buttons) return;

  if (currentDay >= 7) {
    mealName.textContent = "Semana concluída 👌";
    currentDayDisplay.textContent = "";
    buttons.style.display = "none";
    return;
  }

  if (meals.length === 0) {
    mealName.textContent = "Já não há mais refeições chefe!";
    currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
    buttons.style.display = "none";
    return;
  }

  buttons.style.display = "flex";
  mealName.textContent = meals[0]; // sempre mostrar a primeira refeição do loop
  currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
  highlightDay();
}

// ------------------- CONSENSO -------------------
async function checkConsensus(day) {
  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", day))
  );

  const hugoMeals = [];
  const luciaMeals = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.user === "hugo") hugoMeals.push(data.meal);
    if (data.user === "lucia") luciaMeals.push(data.meal);
  });

  const intersection = hugoMeals.filter(meal => luciaMeals.includes(meal));

  if (intersection.length > 0) {
    const chosen = intersection[Math.floor(Math.random() * intersection.length)];
    await setDoc(doc(db, "week", day), { meal: chosen });

    // apagar as preferências do dia
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    }
    return true;
  }
  return false;
}

// ------------------- ESCOLHA -------------------
async function chooseMeal(isLike) {
  if (currentDay >= 7 || meals.length === 0) return;

  const selectedMeal = meals[0];

  if (isLike) {
    await setDoc(
      doc(db, "preferences", `${currentUser}_${currentDay}_${selectedMeal}`),
      { user: currentUser, day: weekDays[currentDay], meal: selectedMeal }
    );

    const consensus = await checkConsensus(weekDays[currentDay]);
    if (consensus) {
      currentDay++;
      meals = [...baseMeals];
    } else {
      meals.shift();
    }
  } else {
    meals.push(meals.shift());
  }

  updateDay();
}

// ------------------- LIMPAR ESCOLHAS -------------------
if (clearSelectionsBtn) clearSelectionsBtn.onclick = async () => {
  if (currentDay >= 7) return;

  // apagar as escolhas do user no dia atual
  const snapshot = await getDocs(
    query(collection(db, "preferences"),
    where("day", "==", weekDays[currentDay]),
    where("user", "==", currentUser))
  );

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  // reset local das refeições do dia
  meals = [...baseMeals];
  updateDay();
};

// ------------------- SEMANA -------------------
async function loadWeek() {
  for (let i = 0; i < 7; i++) {
    const el = document.getElementById(`day-${i}`);
    if (el) el.textContent = "—";
  }

  const snapshot = await getDocs(collection(db, "week"));
  snapshot.forEach(docSnap => {
    const idx = weekDays.indexOf(docSnap.id);
    if (idx >= 0) {
      const el = document.getElementById(`day-${idx}`);
      if (el) el.textContent = docSnap.data().meal;
    }
  });
}

// ------------------- REAL TIME -------------------
// listener para atualizar semana em tempo real
onSnapshot(collection(db, "week"), snapshot => {
  snapshot.docChanges().forEach(change => {
    const idx = weekDays.indexOf(change.doc.id);
    if (idx >= 0) {
      const el = document.getElementById(`day-${idx}`);
      if (el) el.textContent = change.doc.data().meal;
    }
  });

  // avançar o currentDay se houver consenso já definido
  while (currentDay < 7) {
    const dayDoc = snapshot.docs.find(d => d.id === weekDays[currentDay]);
    if (!dayDoc) break; // ainda sem consenso
    currentDay++;
    meals = [...baseMeals];
  }

  updateDay();
});

// listener para atualizar escolhas em tempo real
onSnapshot(collection(db, "preferences"), snapshot => {
  // se houver alterações no dia atual, atualizar lista de refeições
  const prefsForDay = snapshot.docs
    .filter(d => d.data().day === weekDays[currentDay] && d.data().user === currentUser)
    .map(d => d.data().meal);

  // remover refeições já escolhidas do loop local
  meals = baseMeals.filter(m => !prefsForDay.includes(m));
  updateDay();
});

// ------------------- EVENTOS -------------------
if (yesBtn) yesBtn.onclick = () => chooseMeal(true);
if (noBtn) noBtn.onclick = () => chooseMeal(false);

// ------------------- INIT -------------------
initUser();
updateDay();
