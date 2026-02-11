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

let currentIndex = 0;
let currentDay = 0;

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

// ------------------- UI -------------------
function updateUserIndicator() {
  const indicator = document.getElementById("user-indicator");
  if (indicator) indicator.textContent = formatUser(currentUser);
}

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
    currentDayDisplay.textContent = weekDays[currentDay];
    buttons.style.display = "none";
    return;
  }

  if (currentIndex >= meals.length) currentIndex = 0;

  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = weekDays[currentDay];
  buttons.style.display = "flex";
}

// ------------------- CONSENSO -------------------
async function checkConsensus(dayName) {
  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", dayName))
  );

  const hugo = [];
  const lucia = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.user === "hugo") hugo.push(data.meal);
    if (data.user === "lucia") lucia.push(data.meal);
  });

  const match = hugo.find(meal => lucia.includes(meal));

  if (match) {
    await setDoc(doc(db, "week", dayName), { meal: match });

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    }

    return true;
  }

  return false;
}

// ------------------- ESCOLHER -------------------
async function chooseMeal(isLike) {
  if (currentDay >= 7) return;
  if (meals.length === 0) return;

  const selectedMeal = meals[currentIndex];
  if (!selectedMeal) return;

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
      currentDay++;
      meals = [...baseMeals];
      currentIndex = 0;
      updateDay();
      return;
    }

    meals.splice(currentIndex, 1);
  } else {
    currentIndex++;
  }

  if (currentIndex >= meals.length) currentIndex = 0;
  updateDay();
}

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

// ------------------- NAVIGATION -------------------
document.getElementById("selectHugo")?.addEventListener("click", () => setUser("hugo"));
document.getElementById("selectLucia")?.addEventListener("click", () => setUser("lucia"));

document.getElementById("btnEscolher")?.addEventListener("click", () => {
  showScreen("swipe");
  updateDay();
});

document.getElementById("btnSemana")?.addEventListener("click", async () => {
  showScreen("week");
  await loadWeek();
});

document.getElementById("btnHistorico")?.addEventListener("click", () => {
  showScreen("history");
});

document.getElementById("backFromSwipe")?.addEventListener("click", () => showScreen("home"));
document.getElementById("backFromWeek")?.addEventListener("click", () => showScreen("home"));
document.getElementById("backFromHistory")?.addEventListener("click", () => showScreen("home"));

yesBtn?.addEventListener("click", () => chooseMeal(true));
noBtn?.addEventListener("click", () => chooseMeal(false));

// ------------------- INIT -------------------
initUser();
updateDay();
