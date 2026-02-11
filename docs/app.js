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
  document.getElementById(id).classList.add("active");
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
  document.getElementById("user-indicator").textContent = formatUser(currentUser);
}

document.getElementById("selectHugo").onclick = () => setUser("hugo");
document.getElementById("selectLucia").onclick = () => setUser("lucia");

document.getElementById("btnEscolher").onclick = () => {
  showScreen("swipe");
  updateDay();
};
document.getElementById("btnSemana").onclick = () => {
  showScreen("week");
  loadWeek();
};
document.getElementById("btnHistorico").onclick = () => showScreen("history");
document.getElementById("backFromSwipe").onclick = () => showScreen("home");
document.getElementById("backFromWeek").onclick = () => showScreen("home");
document.getElementById("backFromHistory").onclick = () => showScreen("home");

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
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");

// ------------------- UI -------------------
function highlightDay() {
  for (let i = 0; i < 7; i++) {
    document
      .getElementById(`day-row-${i}`)
      .classList.toggle("active", i === currentDay);
  }
}

function updateDay() {
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

  const intersection = hugoMeals.filter(meal =>
    luciaMeals.includes(meal)
  );

  if (intersection.length > 0) {
    const chosen =
      intersection[Math.floor(Math.random() * intersection.length)];

    await setDoc(doc(db, "week", day), {
      meal: chosen
    });

    // apagar preferências desse dia
    snapshot.forEach(async docSnap => {
      await deleteDoc(doc(db, "preferences", docSnap.id));
    });

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
      doc(
        db,
        "preferences",
        `${currentUser}_${currentDay}_${selectedMeal}`
      ),
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
    meals.push(meals.splice(currentIndex, 1)[0]);
  }

  if (currentIndex >= meals.length) currentIndex = 0;

  updateDay();
}

// ------------------- LIMPAR DIA -------------------
async function clearSelectionsForDay() {
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
  updateDay();
}

clearSelectionsBtn.onclick = clearSelectionsForDay;

// ------------------- SEMANA -------------------
async function loadWeek() {
  for (let i = 0; i < 7; i++) {
    document.getElementById(`day-${i}`).textContent = "—";
  }

  const snapshot = await getDocs(collection(db, "week"));

  snapshot.forEach(docSnap => {
    const idx = weekDays.indexOf(docSnap.id);
    if (idx >= 0) {
      document.getElementById(`day-${idx}`).textContent =
        docSnap.data().meal;
    }
  });
}

// ------------------- EVENTOS -------------------
document.getElementById("yesBtn").onclick = () => chooseMeal(true);
document.getElementById("noBtn").onclick = () => chooseMeal(false);

// ------------------- INIT -------------------
initUser();
updateDay();
