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

  // 🔥 FIREBASE
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

  // 🔹 ELEMENTOS
  const userSelection = document.getElementById("userSelection");
  const mainMenu = document.getElementById("mainMenu");
  const mealSelection = document.getElementById("mealSelection");

  const user1Btn = document.getElementById("user1Btn");
  const user2Btn = document.getElementById("user2Btn");

  const startSelectionBtn = document.getElementById("startSelectionBtn");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const resetWeekBtn = document.getElementById("resetWeekBtn");

  const mealName = document.getElementById("mealName");
  const dayLabel = document.getElementById("dayLabel");

  // 🔹 GARANTIR ECRÃ INICIAL VISÍVEL
  userSelection.style.display = "block";
  mainMenu.style.display = "none";
  mealSelection.style.display = "none";

  let currentUser = null;
  let currentDay = 0;

  const days = ["segunda", "terca", "quarta", "quinta", "sexta"];

  const baseMeals = [
    "Frango Grelhado",
    "Massa à Bolonhesa",
    "Arroz de Atum",
    "Bife com Batatas",
    "Salmão no Forno",
    "Omelete"
  ];

  function showMainMenu() {
    userSelection.style.display = "none";
    mealSelection.style.display = "none";
    mainMenu.style.display = "block";
  }

  async function saveCurrentDay() {
    await setDoc(doc(db, "config", "weekState"), { currentDay });
  }

  async function loadCurrentDay() {
    const snap = await getDoc(doc(db, "config", "weekState"));
    currentDay = snap.exists() ? snap.data().currentDay : 0;
  }

  async function getAvailableMeals(day) {

    const weekSnap = await getDocs(collection(db, "week"));
    const used = weekSnap.docs.map(d => d.data().meal);

    const userSnap = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", day),
        where("user", "==", currentUser)
      )
    );

    const liked = userSnap.docs.map(d => d.data().meal);

    return baseMeals.filter(
      m => !used.includes(m) && !liked.includes(m)
    );
  }

  async function updateDay() {

    if (currentDay >= days.length) {
      alert("Semana concluída!");
      showMainMenu();
      return;
    }

    dayLabel.textContent = days[currentDay];

    const meals = await getAvailableMeals(days[currentDay]);

    if (meals.length === 0) {
      mealName.textContent = "Sem refeições disponíveis";
      return;
    }

    mealName.textContent =
      meals[Math.floor(Math.random() * meals.length)];
  }

  async function checkConsensus(meal, day) {

    const snap = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", day),
        where("meal", "==", meal)
      )
    );

    if (snap.size >= 2) {

      await addDoc(collection(db, "week"), { day, meal });

      const dayPrefs = await getDocs(
        query(collection(db, "preferences"), where("day", "==", day))
      );

      for (const d of dayPrefs.docs) {
        await deleteDoc(d.ref);
      }

      currentDay++;
      await saveCurrentDay();
    }
  }

  // 🔹 EVENTOS

  user1Btn.addEventListener("click", () => {
    currentUser = "user1";
    showMainMenu();
  });

  user2Btn.addEventListener("click", () => {
    currentUser = "user2";
    showMainMenu();
  });

  startSelectionBtn.addEventListener("click", async () => {
    await loadCurrentDay();
    mainMenu.style.display = "none";
    mealSelection.style.display = "block";
    updateDay();
  });

  yesBtn.addEventListener("click", async () => {
    const meal = mealName.textContent;
    const day = days[currentDay];

    await addDoc(collection(db, "preferences"), {
      user: currentUser,
      day,
      meal
    });

    await checkConsensus(meal, day);
    updateDay();
  });

  noBtn.addEventListener("click", updateDay);

  resetWeekBtn.addEventListener("click", async () => {

    const weekSnap = await getDocs(collection(db, "week"));
    for (const d of weekSnap.docs) await deleteDoc(d.ref);

    const prefSnap = await getDocs(collection(db, "preferences"));
    for (const d of prefSnap.docs) await deleteDoc(d.ref);

    currentDay = 0;
    await saveCurrentDay();

    alert("Semana resetada!");
    showMainMenu();
  });

});
