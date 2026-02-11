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
let currentIndex = 0;
let currentDay = 0;

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearDayBtn = document.getElementById("clearDayBtn");
const resetWeekBtn = document.getElementById("resetWeekBtn");

// ------------------- UTIL -------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

function updateUserIndicator() {
  const indicator = document.getElementById("user-indicator");
  if (indicator) indicator.textContent = formatUser(currentUser);
}

// ------------------- DETETAR PRIMEIRO DIA NÃO RESOLVIDO -------------------
async function syncCurrentDay() {
  const snapshot = await getDocs(collection(db, "week"));
  const resolvedDays = snapshot.docs.map(d => d.id);

  currentDay = weekDays.findIndex(day => !resolvedDays.includes(day));

  if (currentDay === -1) currentDay = 7; // semana concluída
}

// ------------------- UI -------------------
function updateUI() {
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
      await syncCurrentDay();
      meals = [...baseMeals];
      currentIndex = 0;
      updateUI();
      return;
    }

    meals.splice(currentIndex, 1);
  } else {
    currentIndex++;
  }

  if (currentIndex >= meals.length) currentIndex = 0;
  updateUI();
}

// ------------------- LIMPAR DIA -------------------
async function clearCurrentDay() {
  if (currentDay >= 7) return;

  const dayName = weekDays[currentDay];

  const weekDoc = await getDocs(query(collection(db, "week"), where("__name__", "==", dayName)));
  if (!weekDoc.empty) return; // não apaga se já houver consenso

  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", dayName))
  );

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  meals = [...baseMeals];
  currentIndex = 0;
  updateUI();
}

// ------------------- RESET SEMANA -------------------
async function resetWeek() {
  const weekSnap = await getDocs(collection(db, "week"));
  for (const docSnap of weekSnap.docs) {
    await deleteDoc(doc(db, "week", docSnap.id));
  }

  const prefSnap = await getDocs(collection(db, "preferences"));
  for (const docSnap of prefSnap.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;

  updateUI();
}

// ------------------- SEMANA VIEW -------------------
async function loadWeek() {
  for (let i = 0; i < 7; i++) {
    document.getElementById(`day-${i}`).textContent = "—";
  }

  const snapshot = await getDocs(collection(db, "week"));

  snapshot.forEach(docSnap => {
    const idx = weekDays.indexOf(docSnap.id);
    if (idx >= 0) {
      document.getElementById(`day-${idx}`).textContent = docSnap.data().meal;
    }
  });
}

// ------------------- EVENTOS -------------------
yesBtn?.addEventListener("click", () => chooseMeal(true));
noBtn?.addEventListener("click", () => chooseMeal(false));
clearDayBtn?.addEventListener("click", clearCurrentDay);
resetWeekBtn?.addEventListener("click", resetWeek);

document.getElementById("btnEscolher")?.addEventListener("click", async () => {
  await syncCurrentDay();
  showScreen("swipe");
  updateUI();
});

document.getElementById("btnSemana")?.addEventListener("click", async () => {
  showScreen("week");
  await loadWeek();
});

// ------------------- INIT -------------------
updateUserIndicator();
syncCurrentDay().then(updateUI);
