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

// ================= USER =================

const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

function formatUser(user) {
  if (user === "hugo") return "Hugo";
  if (user === "lucia") return "Lúcia";
  return "";
}

function updateUserIndicator() {
  document.getElementById("user-indicator").textContent = formatUser(currentUser);
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

document.getElementById("selectHugo").onclick = () => setUser("hugo");
document.getElementById("selectLucia").onclick = () => setUser("lucia");

// ================= NAVEGAÇÃO =================

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.getElementById("btnEscolher").onclick = async () => {
  await syncCurrentDayFromWeek();
  meals = [...baseMeals];
  currentIndex = 0;
  showScreen("swipe");
  updateUI();
};

document.getElementById("btnSemana").onclick = async () => {
  showScreen("week");
  await loadWeek();
};

document.getElementById("btnHistorico").onclick = () => showScreen("history");

document.getElementById("backFromSwipe").onclick = () => showScreen("home");
document.getElementById("backFromWeek").onclick = () => showScreen("home");
document.getElementById("backFromHistory").onclick = () => showScreen("home");

// ================= DADOS =================

const baseMeals = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

let meals = [];
let currentIndex = 0;
let currentDay = 0;

// ================= UI =================

const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");

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

  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = weekDays[currentDay];
  buttons.style.display = "flex";
}

// ================= SINCRONIZAR DIA ATUAL =================

async function syncCurrentDayFromWeek() {
  const snapshot = await getDocs(collection(db, "week"));

  currentDay = snapshot.size; 
  // se há 2 documentos na week -> estamos no dia 2 (terça já preenchida)
}

// ================= ESCOLHA =================

document.getElementById("yesBtn").onclick = async () => {
  const selectedMeal = meals[currentIndex];

  await setDoc(
    doc(db, "preferences", `${currentUser}_${currentDay}_${selectedMeal}`),
    {
      user: currentUser,
      day: weekDays[currentDay],
      meal: selectedMeal
    }
  );

  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", weekDays[currentDay]))
  );

  const hugo = [];
  const lucia = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.user === "hugo") hugo.push(data.meal);
    if (data.user === "lucia") lucia.push(data.meal);
  });

  const intersection = hugo.filter(m => lucia.includes(m));

  if (intersection.length > 0) {
    await setDoc(doc(db, "week", weekDays[currentDay]), {
      meal: intersection[0]
    });

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    }

    currentDay++;
    meals = [...baseMeals];
    currentIndex = 0;
    updateUI();
    return;
  }

  meals.splice(currentIndex, 1);
  if (currentIndex >= meals.length) currentIndex = 0;
  updateUI();
};

document.getElementById("noBtn").onclick = () => {
  meals.push(meals.splice(currentIndex, 1)[0]);
  updateUI();
};

// ================= LIMPAR ESCOLHAS DO DIA =================

document.getElementById("clearSelectionsBtn").onclick = async () => {
  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", weekDays[currentDay]))
  );

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "preferences", docSnap.id));
  }

  meals = [...baseMeals];
  currentIndex = 0;
  updateUI();
};

// ================= LIMPAR SEMANA =================

document.getElementById("clearWeekBtn").onclick = async () => {
  const snapshot = await getDocs(collection(db, "week"));

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "week", docSnap.id));
  }

  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;

  showScreen("swipe");
  updateUI();
};

// ================= SEMANA =================

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

initUser();
