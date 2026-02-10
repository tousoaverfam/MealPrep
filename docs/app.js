import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase */
const app = initializeApp({
  apiKey: "AIzaSyAZ4D0oRlCIwEEjRjPA2RauyxvIBFhzS-U",
  authDomain: "testemeals.firebaseapp.com",
  projectId: "testemeals"
});
const db = getFirestore(app);

/* User */
const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

/* Data */
const ORIGINAL_MEALS = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];

const weekDays = [
  "Segunda-feira","Terça-feira","Quarta-feira",
  "Quinta-feira","Sexta-feira","Sábado","Domingo"
];

let meals = [...ORIGINAL_MEALS];
let currentIndex = 0;
let currentDay = 0;

/* Elements */
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const indicator = document.getElementById("user-indicator");

/* Screens */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* User */
function updateUserIndicator() {
  indicator.textContent = currentUser ? currentUser : "";
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
  currentUser = user;
  localStorage.setItem(USER_KEY, user);
  updateUserIndicator();
  showScreen("home");
}

/* UI */
function updateDay() {
  currentDayDisplay.textContent = `Dia: ${weekDays[currentDay]}`;

  if (meals.length === 0) {
    mealName.textContent = "Já não há mais refeições chefe!";
    buttons.style.display = "none";
    return;
  }

  buttons.style.display = "flex";
  mealName.textContent = meals[currentIndex];
}

/* Actions */
async function chooseMeal(isLike) {
  const meal = meals[currentIndex];

  if (isLike) {
    await setDoc(
      doc(db, "preferences", `${weekDays[currentDay]}_${currentUser}_${meal}`),
      { user: currentUser, day: weekDays[currentDay], meal }
    );
    meals.splice(currentIndex, 1);
  } else {
    meals.push(meals.splice(currentIndex, 1)[0]);
  }

  if (currentIndex >= meals.length) currentIndex = 0;
  updateDay();
}

async function resetDay() {
  const snapshot = await getDocs(collection(db, "preferences"));
  snapshot.forEach(d => {
    if (d.id.startsWith(`${weekDays[currentDay]}_${currentUser}_`)) {
      deleteDoc(doc(db, "preferences", d.id));
    }
  });

  meals = [...ORIGINAL_MEALS];
  currentIndex = 0;
  updateDay();
}

/* Events */
document.getElementById("selectHugo").onclick = () => setUser("Hugo");
document.getElementById("selectLucia").onclick = () => setUser("Lúcia");

document.getElementById("btnEscolher").onclick = () => {
  showScreen("swipe");
  updateDay();
};
document.getElementById("btnSemana").onclick = () => showScreen("week");
document.getElementById("btnHistorico").onclick = () => showScreen("history");

document.getElementById("backFromSwipe").onclick = () => showScreen("home");
document.getElementById("backFromWeek").onclick = () => showScreen("home");
document.getElementById("backFromHistory").onclick = () => showScreen("home");

document.getElementById("yesBtn").onclick = () => chooseMeal(true);
document.getElementById("noBtn").onclick = () => chooseMeal(false);
document.getElementById("resetDayBtn").onclick = resetDay;

/* Init */
initUser();
updateDay();
