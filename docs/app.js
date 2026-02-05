// ------------------- FIREBASE -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Substituir pelo teu firebaseConfig
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

// ------------------- SPA NAVIGATION -------------------
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

document.getElementById("btnEscolher").onclick = () => { showScreen("swipe"); updateDay(); };
document.getElementById("btnSemana").onclick = () => { showScreen("week"); loadWeek(); };
document.getElementById("btnHistorico").onclick = () => { showScreen("history"); };
document.getElementById("backFromSwipe").onclick = () => { showScreen("home"); };
document.getElementById("backFromWeek").onclick = () => { showScreen("home"); };
document.getElementById("backFromHistory").onclick = () => { showScreen("home"); };

// ------------------- DADOS -------------------
let meals = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];

const weekDays = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];

let currentIndex = 0;
let currentDay = 0;

// ------------------- ELEMENTOS -------------------
const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const clearWeekBtn = document.getElementById("clearWeekBtn");

// ------------------- FUNÇÕES -------------------
function highlightDay() {
  for(let i=0;i<7;i++){
    const el = document.getElementById(`day-row-${i}`);
    el.classList.toggle("active", i === currentDay);
    el.style.transform = i===currentDay ? "scale(1.03)" : "scale(1)";
  }
}

function updateDay() {
  if(currentDay >= 7 || meals.length === 0){
    mealName.textContent = "Já não há mais refeições chefe!";
    mealName.classList.add("finished");
    currentDayDisplay.textContent = "";
    buttons.style.display = "none";
    highlightDay();
    return;
  }

  buttons.style.display = "flex";
  mealName.classList.remove("finished");

  mealName.style.opacity = 0;
  currentDayDisplay.style.opacity = 0;
  setTimeout(()=>{
    mealName.textContent = meals[currentIndex];
    currentDayDisplay.textContent = "Dia: "+weekDays[currentDay];
    mealName.style.opacity = 1;
    currentDayDisplay.style.opacity = 1;
  }, 150);

  highlightDay();
}

// ------------------- ESCOLHA -------------------
async function chooseMeal(isLike){
  if(currentDay >= 7) return;

  const selectedMeal = meals[currentIndex];

  if(isLike){
    try{
      await setDoc(doc(db,"testemeals",weekDays[currentDay]),{
        nome: selectedMeal,
        dia: weekDays[currentDay]
      });
      document.getElementById(`day-${currentDay}`).textContent = selectedMeal;
    }catch(e){
      console.error("Erro Firebase:", e);
    }
    currentDay++;
    meals.splice(currentIndex,1);
  } else {
    meals.push(meals.splice(currentIndex,1)[0]); // "Não" → volta ao fim
  }

  if(currentIndex >= meals.length){
    currentIndex = 0;
  }

  updateDay();
}

// ------------------- SEMANA -------------------
async function loadWeek(){
  for(let i=0;i<7;i++){
    document.getElementById(`day-${i}`).textContent = "—";
    document.getElementById(`day-row-${i}`).classList.remove("active");
  }

  try{
    const col = collection(db,"testemeals");
    const snapshot = await getDocs(col);
    snapshot.forEach(docSnap=>{
      const id = docSnap.id;
      const idx = weekDays.indexOf(id);
      if(idx>=0){
        document.getElementById(`day-${idx}`).textContent = docSnap.data().nome;
      }
    });
  }catch(e){
    console.error("Erro ao carregar semana:", e);
  }
}

// ------------------- LIMPAR -------------------
async function clearWeek(){
  if(!confirm("Tens a certeza de que queres limpar todas as refeições?")) return;

  try{
    const col = collection(db,"testemeals");
    const snapshot = await getDocs(col);

    for(const docSnap of snapshot.docs){
      await deleteDoc(doc(db,"testemeals",docSnap.id));
    }

    currentDay = 0;
    currentIndex = 0;
    meals = [
      "Frango com arroz",
      "Massa à bolonhesa",
      "Salmão grelhado",
      "Stir-fry de legumes",
      "Wrap de frango",
      "Arroz de pato",
      "Bowl vegetariano"
    ];
    updateDay();
    loadWeek();
    buttons.style.display = "flex";

  }catch(e){
    console.error("Erro ao limpar semana:", e);
    alert("Ocorreu um erro ao limpar a semana.");
  }
}

// ------------------- EVENTOS -------------------
yesBtn.onclick = ()=>chooseMeal(true);
noBtn.onclick = ()=>chooseMeal(false);
clearWeekBtn.onclick = clearWeek;

// Inicialização
updateDay();
