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
  apiKey: "XXXX",
  authDomain: "XXXX",
  projectId: "XXXX",
  storageBucket: "XXXX",
  messagingSenderId: "XXXX",
  appId: "XXXX"
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
let processing = false;

// ------------------- UI ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const buttons = document.getElementById("buttons");

// ------------------- NAVEGAÇÃO -------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

function initUser() {
  if (!currentUser) {
    showScreen("user-select");
  } else {
    document.getElementById("user-indicator").textContent = formatUser(currentUser);
    showScreen("home");
  }
}

document.getElementById("selectHugo")?.onclick = () => {
  localStorage.setItem(USER_KEY, "hugo");
  location.reload();
};

document.getElementById("selectLucia")?.onclick = () => {
  localStorage.setItem(USER_KEY, "lucia");
  location.reload();
};

document.getElementById("btnEscolher")?.onclick = () => {
  showScreen("swipe");
  updateDay();
};

document.getElementById("btnSemana")?.onclick = async () => {
  showScreen("week");
  await loadWeek();
};

document.getElementById("backFromSwipe")?.onclick = () => showScreen("home");
document.getElementById("backFromWeek")?.onclick = () => showScreen("home");

// ------------------- UPDATE DIA -------------------
function updateDay() {
  if (currentDay >= 7) {
    mealName.textContent = "Semana concluída 👌";
    currentDayDisplay.textContent = "";
    buttons.style.display = "none";
    return;
  }

  mealName.textContent = meals[currentIndex];
  currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
  buttons.style.display = "flex";
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
    const chosen = intersection[0];

    await setDoc(doc(db, "week", day), { meal: chosen });

    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "preferences", d.id));
    }

    return true;
  }

  return false;
}

// ------------------- ESCOLHA -------------------
async function chooseMeal(isLike) {
  if (processing) return;
  processing = true;

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

yesBtn?.onclick = () => chooseMeal(true);
noBtn?.onclick = () => chooseMeal(false);

// ------------------- LIMPAR ESCOLHAS DO DIA -------------------
document.getElementById("clearSelectionsBtn")?.onclick = async () => {

  const snapshot = await getDocs(
    query(collection(db, "preferences"), where("day", "==", weekDays[currentDay]))
  );

  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, "preferences", d.id));
  }

  meals = [...baseMeals];
  currentIndex = 0;
  updateDay();
};

// ------------------- LIMPAR SEMANA -------------------
document.getElementById("clearWeekBtn")?.onclick = async () => {

  if (!confirm("Tens a certeza que queres limpar a semana?")) return;

  const weekSnap = await getDocs(collection(db, "week"));
  for (const d of weekSnap.docs) {
    await deleteDoc(doc(db, "week", d.id));
  }

  const prefSnap = await getDocs(collection(db, "preferences"));
  for (const d of prefSnap.docs) {
    await deleteDoc(doc(db, "preferences", d.id));
  }

  currentDay = 0;
  meals = [...baseMeals];
  currentIndex = 0;

  for (let i = 0; i < 7; i++) {
    const el = document.getElementById(`day-${i}`);
    if (el) el.textContent = "—";
  }

  alert("Semana limpa.");
  showScreen("home");
};

// ------------------- LOAD WEEK -------------------
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

// ------------------- INIT -------------------
initUser();
