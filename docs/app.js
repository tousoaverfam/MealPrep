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

function updateUserIndicator() {
  const el = document.getElementById("user-indicator");
  if (el) el.textContent = formatUser(currentUser);
}

// ------------------- SCREENS -------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

// ------------------- USER SELECT -------------------
document.getElementById("selectHugo")?.addEventListener("click", () => {
  localStorage.setItem(USER_KEY, "hugo");
  currentUser = "hugo";
  updateUserIndicator();
  showScreen("home");
});

document.getElementById("selectLucia")?.addEventListener("click", () => {
  localStorage.setItem(USER_KEY, "lucia");
  currentUser = "lucia";
  updateUserIndicator();
  showScreen("home");
});

// ------------------- NAV -------------------
document.getElementById("btnEscolher")?.addEventListener("click", () => {
  showScreen("swipe");
  updateDay();
});

document.getElementById("btnSemana")?.addEventListener("click", () => {
  showScreen("week");
});

document.getElementById("btnHistorico")?.addEventListener("click", () => {
  showScreen("history");
});

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
let processing = false;

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");
const clearWeekBtn = document.getElementById("clearWeekBtn");

// ------------------- UI -------------------
function updateDay() {
  if (!mealName) return;

  if (currentDay >= 7) {
    mealName.textContent = "Semana concluída 👌";
    currentDayDisplay.textContent = "";
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
    return;
  }

  if (meals.length === 0) {
    mealName.textContent = "Já não há mais refeições chefe!";
    currentDayDisplay.textContent = weekDays[currentDay];
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
    return;
  }

  yesBtn.style.display = "inline-block";
  noBtn.style.display = "inline-block";

  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = weekDays[currentDay];
}

// ------------------- CONSENSO -------------------
async function checkConsensus(day) {
  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", day))
  );

  const hugo = [];
  const lucia = [];

  snapshot.forEach(d => {
    const data = d.data();
    if (data.user === "hugo") hugo.push(data.meal);
    if (data.user === "lucia") lucia.push(data.meal);
  });

  const intersection = hugo.filter(m => lucia.includes(m));

  if (intersection.length > 0) {
    const chosen = intersection[Math.floor(Math.random() * intersection.length)];

    await setDoc(doc(db, "week", day), { meal: chosen });

    snapshot.forEach(d => deleteDoc(doc(db, "preferences", d.id)));

    return true;
  }

  return false;
}

// ------------------- ESCOLHA -------------------
async function chooseMeal(isLike) {
  if (processing) return;
  processing = true;

  const meal = meals[currentIndex];
  if (!meal) { processing = false; return; }

  if (isLike) {
    await setDoc(
      doc(db, "preferences", `${currentUser}_${currentDay}_${meal}`),
      { user: currentUser, day: weekDays[currentDay], meal }
    );

    const consensus = await checkConsensus(weekDays[currentDay]);

    if (consensus) {
      currentDay++;
      meals = [...baseMeals];
      currentIndex = 0;
      updateDay();
      processing = false;
      return;
    }

    meals.splice(currentIndex, 1);
  } else {
    meals.push(meals.splice(currentIndex, 1)[0]);
  }

  if (currentIndex >= meals.length) currentIndex = 0;

  updateDay();
  processing = false;
}

yesBtn?.addEventListener("click", () => chooseMeal(true));
noBtn?.addEventListener("click", () => chooseMeal(false));

// ------------------- LIMPAR ESCOLHAS DO DIA -------------------
clearSelectionsBtn?.addEventListener("click", async () => {

  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", weekDays[currentDay]))
  );

  snapshot.forEach(d => {
    if (d.data().user === currentUser) {
      deleteDoc(doc(db, "preferences", d.id));
    }
  });

  meals = [...baseMeals];
  currentIndex = 0;
  updateDay();
});

// ------------------- LIMPAR SEMANA -------------------
clearWeekBtn?.addEventListener("click", async () => {

  // apagar week
  const weekSnap = await getDocs(collection(db, "week"));
  weekSnap.forEach(d => deleteDoc(doc(db, "week", d.id)));

  // apagar preferences
  const prefSnap = await getDocs(collection(db, "preferences"));
  prefSnap.forEach(d => deleteDoc(doc(db, "preferences", d.id)));

  // reset local
  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;

  updateDay();
});

// ------------------- REALTIME LISTENER -------------------
onSnapshot(collection(db, "week"), snapshot => {

  const chosenDays = [];

  snapshot.forEach(docSnap => {
    const idx = weekDays.indexOf(docSnap.id);
    if (idx >= 0) {
      chosenDays.push(idx);
      document.getElementById(`day-${idx}`).textContent = docSnap.data().meal;
    }
  });

  // Atualiza automaticamente o dia atual
  if (chosenDays.length > 0) {
    currentDay = Math.max(...chosenDays) + 1;
  } else {
    currentDay = 0;
  }

  meals = [...baseMeals];
  currentIndex = 0;

  updateDay();
});

// ------------------- INIT -------------------
if (!currentUser) {
  showScreen("user-select");
} else {
  updateUserIndicator();
  showScreen("home");
}

updateDay();
