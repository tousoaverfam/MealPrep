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

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {

  // 🔥 CONFIG FIREBASE
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

  // 🔹 USERS
  let currentUser = null;

  // 🔹 DIAS
  const days = ["segunda", "terca", "quarta", "quinta", "sexta"];
  let currentDay = 0;

  // 🔹 REFEIÇÕES BASE
  const baseMeals = [
    "Frango Grelhado",
    "Massa à Bolonhesa",
    "Arroz de Atum",
    "Bife com Batatas",
    "Salmão no Forno",
    "Omelete"
  ];

  // 🔹 ELEMENTOS DOM
  const userSelection = document.getElementById("userSelection");
  const mainMenu = document.getElementById("mainMenu");
  const mealSelection = document.getElementById("mealSelection");
  const mealName = document.getElementById("mealName");
  const dayLabel = document.getElementById("dayLabel");

  const user1Btn = document.getElementById("user1Btn");
  const user2Btn = document.getElementById("user2Btn");
  const startSelectionBtn = document.getElementById("startSelectionBtn");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const resetWeekBtn = document.getElementById("resetWeekBtn");

  // 🔹 UTIL
  function showMainMenu() {
    if (userSelection) userSelection.style.display = "none";
    if (mealSelection) mealSelection.style.display = "none";
    if (mainMenu) mainMenu.style.display = "block";
  }

  async function syncCurrentDayFromDB() {
    const configRef = doc(db, "config", "weekState");
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      currentDay = configSnap.data().currentDay || 0;
    } else {
      currentDay = 0;
      await setDoc(configRef, { currentDay: 0 });
    }
  }

  async function saveCurrentDayToDB() {
    const configRef = doc(db, "config", "weekState");
    await setDoc(configRef, { currentDay });
  }

  async function getAvailableMealsForDay(day) {

    const weekSnapshot = await getDocs(collection(db, "week"));
    const usedMeals = weekSnapshot.docs.map(d => d.data().meal);

    const userPrefsSnapshot = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", day),
        where("user", "==", currentUser)
      )
    );

    const likedMeals = userPrefsSnapshot.docs.map(d => d.data().meal);

    return baseMeals.filter(
      meal =>
        !usedMeals.includes(meal) &&
        !likedMeals.includes(meal)
    );
  }

  async function updateDay() {

    if (currentDay >= days.length) {
      alert("Semana concluída!");
      showMainMenu();
      return;
    }

    if (!dayLabel || !mealName) return;

    dayLabel.textContent = days[currentDay];

    const availableMeals = await getAvailableMealsForDay(days[currentDay]);

    if (availableMeals.length === 0) {
      mealName.textContent = "Sem refeições disponíveis";
      return;
    }

    const randomMeal =
      availableMeals[Math.floor(Math.random() * availableMeals.length)];

    mealName.textContent = randomMeal;
  }

  async function checkConsensus(meal, day) {

    const snapshot = await getDocs(
      query(
        collection(db, "preferences"),
        where("day", "==", day),
        where("meal", "==", meal)
      )
    );

    if (snapshot.size >= 2) {

      await addDoc(collection(db, "week"), { day, meal });

      const dayPrefs = await getDocs(
        query(collection(db, "preferences"), where("day", "==", day))
      );

      for (const docSnap of dayPrefs.docs) {
        await deleteDoc(docSnap.ref);
      }

      currentDay++;
      await saveCurrentDayToDB();
    }
  }

  // 🔹 EVENT LISTENERS (SEGUROS)

  if (user1Btn) {
    user1Btn.addEventListener("click", () => {
      currentUser = "user1";
      showMainMenu();
    });
  }

  if (user2Btn) {
    user2Btn.addEventListener("click", () => {
      currentUser = "user2";
      showMainMenu();
    });
  }

  if (startSelectionBtn) {
    startSelectionBtn.addEventListener("click", async () => {
      await syncCurrentDayFromDB();
      if (mainMenu) mainMenu.style.display = "none";
      if (mealSelection) mealSelection.style.display = "block";
      updateDay();
    });
  }

  if (yesBtn) {
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
  }

  if (noBtn) {
    noBtn.addEventListener("click", () => {
      updateDay();
    });
  }

  if (resetWeekBtn) {
    resetWeekBtn.addEventListener("click", async () => {

      if (!confirm("Tens a certeza que queres resetar a semana?")) return;

      const weekSnapshot = await getDocs(collection(db, "week"));
      for (const docSnap of weekSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      const prefsSnapshot = await getDocs(collection(db, "preferences"));
      for (const docSnap of prefsSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      currentDay = 0;
      await saveCurrentDayToDB();

      alert("Semana resetada com sucesso!");
      showMainMenu();
    });
  }

}
