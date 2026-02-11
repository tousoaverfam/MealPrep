import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "testemeals.firebaseapp.com",
  projectId: "testemeals",
  storageBucket: "testemeals.firebasestorage.app",
  messagingSenderId: "467182854778",
  appId: "1:467..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

const mealsBase = [
  "Frango com arroz",
  "Massa à bolonhesa",
  "Salmão grelhado",
  "Stir-fry de legumes",
  "Wrap de frango",
  "Arroz de pato",
  "Bowl vegetariano"
];

let meals = [...mealsBase];

const weekDays = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo"
];

let currentIndex = 0;
let currentDay = 0;

const mealName = document.getElementById("mealName");
const dayDisplay = document.getElementById("currentDayDisplay");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const resetDayBtn = document.getElementById("resetDayBtn");

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function updateUserIndicator(){
  const indicator = document.getElementById("user-indicator");
  if(!currentUser){ indicator.textContent=""; return; }
  indicator.textContent = currentUser === "hugo" ? "Hugo" : "Lúcia";
}

function setUser(user){
  currentUser = user;
  localStorage.setItem(USER_KEY,user);
  updateUserIndicator();
  showScreen("home");
}

function init(){
  if(!currentUser){
    showScreen("user-select");
  } else {
    updateUserIndicator();
    showScreen("home");
  }
}

function updateMeal(){
  if(currentIndex >= meals.length){
    mealName.textContent = "Já não há mais refeições chefe!";
    yesBtn.style.display="none";
    noBtn.style.display="none";
    return;
  }

  yesBtn.style.display="inline-block";
  noBtn.style.display="inline-block";

  mealName.textContent = meals[currentIndex];
  dayDisplay.textContent = weekDays[currentDay];
}

async function chooseMeal(like){
  const meal = meals[currentIndex];

  if(like){
    await setDoc(doc(db,"preferences",`${currentUser}_${currentDay}_${meal}`),{
      user: currentUser,
      day: currentDay,
      meal: meal
    });
    meals.splice(currentIndex,1);
  } else {
    currentIndex++;
  }

  updateMeal();
}

async function resetDay(){
  const q = query(collection(db,"preferences"),
    where("user","==",currentUser),
    where("day","==",currentDay)
  );

  const snap = await getDocs(q);
  for(const d of snap.docs){
    await deleteDoc(d.ref);
  }

  meals = [...mealsBase];
  currentIndex = 0;
  updateMeal();
}

async function loadWeek(){
  showScreen("week");
  const snap = await getDocs(collection(db,"week"));
  snap.forEach(d=>{
    document.getElementById(`day-${d.data().day}`).textContent = d.data().meal;
  });
}

document.getElementById("selectHugo").onclick=()=>setUser("hugo");
document.getElementById("selectLucia").onclick=()=>setUser("lucia");

document.getElementById("btnEscolher").onclick=()=>{showScreen("swipe");updateMeal();};
document.getElementById("btnSemana").onclick=loadWeek;
document.getElementById("btnHistorico").onclick=()=>showScreen("history");

document.getElementById("backFromSwipe").onclick=()=>showScreen("home");
document.getElementById("backFromWeek").onclick=()=>showScreen("home");
document.getElementById("backFromHistory").onclick=()=>showScreen("home");

yesBtn.onclick=()=>chooseMeal(true);
noBtn.onclick=()=>chooseMeal(false);
resetDayBtn.onclick=resetDay;

init();
