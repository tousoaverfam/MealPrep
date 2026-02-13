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
const userSelection = document.getElementById("userSelection");

document.getElementById("user1Btn").addEventListener("click", () => {
  currentUser = "user1";
  showMainMenu();
});

document.getElementById("user2Btn").addEventListener("click", () => {
  currentUser = "user2";
  showMainMenu();
});

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
const mainMenu = document.getElementById("mainMenu");
const mealSelection = document.getElementById("mealSelection");
const mealName = document.getElementById("mealName");
const dayLabel = document.getElementById("dayLabel");

// 🔹 MOSTRAR MENU
function showMainMenu() {
  userSelection.style.display = "none";
  mealSelection.style.display = "none";
  mainMenu.style.display = "block";
}

// 🔹 INICIAR ESCOLHA
document.getElementById("startSelectionBtn").addEventListener("click", async () => {
  await syncCurrentDayFromDB();
  mainMenu.style.display = "none";
  mealSelection.style.display = "block";
  updateDay();
});

// 🔹 SINCRONIZAR DIA ATUAL
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

// 🔹 GUARDAR DIA ATUAL
async function saveCurrentDayToDB() {
  const configRef = doc(db, "config", "weekState");
  await setDoc(configRef, { currentDay });
}

// 🔹 ATUALIZAR DIA
async function updateDay() {

  if (currentDay >= days.length) {
    alert("Semana concluída!");
    showMainMenu();
    return;
  }

  dayLabel.textContent = days[currentDay];

  const availableMeals = await getAvailableMealsForDay(days[currentDay]);

  if (availableMeals.length === 0) {
    mealName.textContent = "Sem refeições disponíveis";
    return;
  }

  const randomMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
  mealName.textContent = randomMeal;
}

// 🔹 FILTRAR REFEIÇÕES DISPONÍVEIS
async function getAvailableMealsForDay(day) {

  // 1️⃣ Refeições já escolhidas na semana (consenso)
  const weekSnapshot = await getDocs(collection(db, "week"));
  const usedMeals = weekSnapshot.docs.map(docSnap => docSnap.data().meal);

  // 2️⃣ Refeições que ESTE utilizador já marcou como "sim" neste dia
  const userPrefsSnapshot = await getDocs(
    query(
      collection(db, "preferences"),
      where("day", "==", day),
      where("user", "==", currentUser)
    )
  );

  const likedMeals = userPrefsSnapshot.docs.map(docSnap => docSnap.data().meal);

  // 3️⃣ Filtrar base
  return baseMeals.filter(
    meal =>
      !usedMeals.includes(meal) &&
      !likedMeals.includes(meal)
  );
}

// 🔹 BOTÃO SIM
document.getElementById("yesBtn").addEventListener("click", async () => {

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

// 🔹 BOTÃO NÃO
document.getElementById("noBtn").addEventListener("click", () => {
  updateDay();
});

// 🔹 VERIFICAR CONSENSO
async function checkConsensus(meal, day) {

  const snapshot = await getDocs(
    query(
      collection(db, "preferences"),
      where("day", "==", day),
      where("meal", "==", meal)
    )
  );

  if (snapshot.size >= 2) {

    // Guardar consenso
    await addDoc(collection(db, "week"), {
      day,
      meal
    });

    // Limpar preferências desse dia
    const dayPrefs = await getDocs(
      query(collection(db, "preferences"), where("day", "==", day))
    );

    for (const docSnap of dayPrefs.docs) {
      await deleteDoc(docSnap.ref);
    }

    // Avançar dia
    currentDay++;
    await saveCurrentDayToDB();
  }
}

// 🔹 RESET SEMANA
document.getElementById("resetWeekBtn").addEventListener("click", async () => {

  if (!confirm("Tens a certeza que queres resetar a semana?")) return;

  // Apagar week
  const weekSnapshot = await getDocs(collection(db, "week"));
  for (const docSnap of weekSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Apagar preferences
  const prefsSnapshot = await getDocs(collection(db, "preferences"));
  for (const docSnap of prefsSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Resetar dia
  currentDay = 0;
  await saveCurrentDayToDB();

  alert("Semana resetada com sucesso!");
  showMainMenu();
});
