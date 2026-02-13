import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  // FIREBASE CONFIG
  const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "AUTH_DOMAIN",
    projectId: "PROJECT_ID",
    storageBucket: "STORAGE_BUCKET",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // -----------------------------
  // ELEMENTOS
  // -----------------------------
  const screens = document.querySelectorAll(".screen");
  const userSelectScreen = document.getElementById("user-select");
  const homeScreen = document.getElementById("home");
  const swipeScreen = document.getElementById("swipe");
  const weekScreen = document.getElementById("week");

  const selectHugo = document.getElementById("selectHugo");
  const selectLucia = document.getElementById("selectLucia");
  const btnEscolher = document.getElementById("btnEscolher");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const resetWeekBtn = document.getElementById("resetWeekBtn");

  const mealName = document.getElementById("mealName");
  const currentDayDisplay = document.getElementById("currentDayDisplay");
  const userIndicator = document.getElementById("user-indicator");

  // -----------------------------
  // ESTADO
  // -----------------------------
  let currentUser = null;
  let currentDay = 0;

  const days = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo"
  ];

  const baseMeals = [
    "Frango Grelhado",
    "Massa à Bolonhesa",
    "Arroz de Atum",
    "Bife com Batatas",
    "Salmão no Forno",
    "Omelete"
  ];

  // -----------------------------
  // UTILIDADES
  // -----------------------------
  function showScreen(screen) {
    screens.forEach(s => s.style.display = "none");
    screen.style.display = "block";
  }

  async function saveCurrentDay() {
    await setDoc(doc(db, "config", "weekState"), { currentDay });
  }

  async function loadCurrentDay() {
    const snap = await getDoc(doc(db, "config", "weekState"));
    currentDay = snap.exists() ? snap.data().currentDay : 0;
  }

  async function getAvailableMeals(dayName) {
    // Refeições já escolhidas como consenso
    const weekSnap = await getDocs(collection(db, "week"));
    const usedMeals = weekSnap.docs.map(d => d.data().meal);

    // Refeições já marcadas pelo user como "sim" neste dia
    const userSnap = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", dayName),
        where("user", "==", currentUser)
      )
    );
    const likedMeals = userSnap.docs.map(d => d.data().meal);

    // Apenas refeições disponíveis
    return baseMeals.filter(
      meal => !usedMeals.includes(meal) && !likedMeals.includes(meal)
    );
  }

  async function updateMeal() {
    if (currentDay >= days.length) {
      alert("Semana concluída!");
      showScreen(homeScreen);
      return;
    }

    const dayName = days[currentDay];
    currentDayDisplay.textContent = dayName;

    const meals = await getAvailableMeals(dayName);

    if (meals.length === 0) {
      mealName.textContent = "Sem refeições disponíveis";
      return;
    }

    mealName.textContent = meals[Math.floor(Math.random() * meals.length)];
  }

  async function checkConsensus(meal, dayName) {
    const snap = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", dayName),
        where("meal", "==", meal)
      )
    );

    // Se ambos users disseram "sim", define como consenso
    if (snap.size >= 2) {
      await addDoc(collection(db, "week"), { day: dayName, meal });

      // Limpa todas preferências do dia
      const dayPrefs = await getDocs(
        query(collection(db, "preferences"), where("day", "==", dayName))
      );
      for (const d of dayPrefs.docs) await deleteDoc(d.ref);

      currentDay++;
      await saveCurrentDay();
    }
  }

  // -----------------------------
  // EVENTOS
  // -----------------------------
  selectHugo.addEventListener("click", () => {
    currentUser = "Hugo";
    userIndicator.textContent = "Utilizador: Hugo";
    showScreen(homeScreen);
  });

  selectLucia.addEventListener("click", () => {
    currentUser = "Lucia";
    userIndicator.textContent = "Utilizador: Lúcia";
    showScreen(homeScreen);
  });

  btnEscolher.addEventListener("click", async () => {
    await loadCurrentDay();
    showScreen(swipeScreen);
    updateMeal();
  });

  yesBtn.addEventListener("click", async () => {
    const meal = mealName.textContent;
    const dayName = days[currentDay];

    await addDoc(collection(db, "preferences"), {
      user: currentUser,
      day: dayName,
      meal
    });

    await checkConsensus(meal, dayName);
    updateMeal();
  });

  noBtn.addEventListener("click", updateMeal);

  resetWeekBtn.addEventListener("click", async () => {
    if (!confirm("Resetar semana?")) return;

    // Limpa semana e preferências
    const weekSnap = await getDocs(collection(db, "week"));
    for (const d of weekSnap.docs) await deleteDoc(d.ref);

    const prefSnap = await getDocs(collection(db, "preferences"));
    for (const d of prefSnap.docs) await deleteDoc(d.ref);

    currentDay = 0;
    await saveCurrentDay();

    alert("Semana resetada!");
    showScreen(homeScreen);
  });

  // -----------------------------
  // ARRANQUE
  // -----------------------------
  showScreen(userSelectScreen);

});
