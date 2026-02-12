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
  where
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
document.getElementById("selectHugo")?.addEventListener("click", () => setUser("hugo"));
document.getElementById("selectLucia")?.addEventListener("click", () => setUser("lucia"));

// ------------------- NAVIGATION -------------------
document.getElementById("btnEscolher")?.addEventListener("click", async () => {
  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;
  await updateDay();
  showScreen("swipe");
});

document.getElementById("btnSemana")?.addEventListener("click", async () => {
  await loadWeek();
  showScreen("week");
});

document.getElementById("btnHistorico")?.addEventListener("click", () => showScreen("history"));
document.getElementById("backFromSwipe")?.addEventListener("click", () => showScreen("home"));
document.getElementById("backFromWeek")?.addEventListener("click", () => showScreen("home"));
document.getElementById("backFromHistory")?.addEventListener("click", () => showScreen("home"));

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
let currentIndex = 0;

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");
const resetWeekBtn = document.getElementById("resetWeekBtn");

// ------------------- UI -------------------
async function getConsolidatedDays() {
  const snapshot = await getDocs(collection(db, "week"));
  return snapshot.docs.map(docSnap => docSnap.id);
}

async function updateDay() {
  if (!mealName || !currentDayDisplay || !buttons) return;

  const consolidated = await getConsolidatedDays();

  while (currentDay < 7 && consolidated.includes(weekDays[currentDay])) {
    currentDay++;
  }

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
  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
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

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    }

    return true;
  }

  return false;
}

// ------------------- ESCOLHA -------------------
async function chooseMeal(isLike) {
  if (currentDay >= 7) return;
  const selectedMeal = meals[currentIndex];

  if (isLike) {
    await setDoc(
      doc(db, "preferences", `${currentUser}_${currentDay}_${selectedMeal}`),
      {
        user: currentUser,
        day: weekDays[currentDay],
        meal: selectedMeal
      }
    );

    const consensus = await checkConsensus(weekDays[currentDay]);

    if (consensus) {
      meals = [...baseMeals];
      currentIndex = 0;
      currentDay++;
      await updateDay();
      return;
    }

    meals.splice(currentIndex, 1);
  } else {
    meals.push(meals.splice(currentIndex, 1)[0]);
  }

  if (currentIndex >= meals.length) currentIndex = 0;
  await updateDay();
}

// ------------------- LIMPAR ESCOLHAS DO DIA -------------------
clearSelectionsBtn?.addEventListener("click", async () => {
  if (currentDay >= 7) return;

  const snapshot = await getDocs(
    query(
      collection(db, "preferences"),
      where("day", "==", weekDays[currentDay]),
      where("user", "==", currentUser)
    )
  );

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  meals = [...baseMeals];
  currentIndex = 0;
  await updateDay();
});

// ------------------- LIMPAR SEMANA -------------------
resetWeekBtn?.addEventListener("click", async () => {
  if (!confirm("Limpar toda a semana?")) return;

  const snapshot = await getDocs(collection(db, "week"));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "week", docSnap.id));
  }

  const prefsSnapshot = await getDocs(collection(db, "preferences"));
  for (const docSnap of prefsSnapshot.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;

  await loadWeek();
});

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

// ------------------- EVENTOS -------------------
yesBtn?.addEventListener("click", () => chooseMeal(true));
noBtn?.addEventListener("click", () => chooseMeal(false));

// ------------------- INIT -------------------
initUser();
updateDay();
