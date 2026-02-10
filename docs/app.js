import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAZ4D0oRlCIwEEjRjPA2RauyxvIBFhzS-U",
  authDomain: "testemeals.firebaseapp.com",
  projectId: "testemeals"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* User */
const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

/* Data (IMUTÁVEL) */
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
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

/* Estado MUTÁVEL */
let meals = [...ORIGINAL_MEALS];
let currentIndex = 0;
let currentDay = 0;

/* Elements */
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const resetDayBtn = document.getElementById("resetDayBtn");

/* Screens */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function initUser() {
  if (!currentUser) showScreen("user-select");
  else showScreen("home");
}

function setUser(user) {
  currentUser = user;
  localStorage.setItem(USER_KEY, user);
  document.getElementById("user-indicator").textContent = user;
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

/* Escolha */
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

/* RESET CORRETO */
async function resetDay() {
  const prefix = `${weekDays[currentDay]}_${currentUser}_`;
  const snapshot = await getDocs(collection(db, "preferences"));

  for (const d of snapshot.docs) {
    if (d.id.startsWith(prefix)) {
      await deleteDoc(doc(db, "preferences", d.id));
    }
  }

  // 🔥 RESET TOTAL DO LOOP
  meals = [...ORIGINAL_MEALS];
  currentIndex = 0;
  updateDay();
}

/* Events */
yesBtn.onclick = () => chooseMeal(true);
noBtn.onclick = () => chooseMeal(false);
resetDayBtn.onclick = resetDay;

document.getElementById("selectHugo").onclick = () => setUser("hugo");
document.getElementById("selectLucia").onclick = () => setUser("lucia");
document.getElementById("btnEscolher").onclick = () => { showScreen("swipe"); updateDay(); };
document.getElementById("backFromSwipe").onclick = () => showScreen("home");

/* Init */
initUser();
updateDay();
