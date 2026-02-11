import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot
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

// ---------------- USER ----------------
const USER_KEY = "mealprep_user";
let currentUser = localStorage.getItem(USER_KEY);

function formatUser(user){
  if(user==="hugo") return "Hugo";
  if(user==="lucia") return "Lúcia";
  return "";
}

// ---------------- DATA ----------------
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
let currentIndex = 0;
let currentDay = 0;

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

// ---------------- UI ----------------
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function updateIndicator(){
  document.getElementById("user-indicator").textContent = formatUser(currentUser);
}

function updateUI(){
  const mealName=document.getElementById("mealName");
  const dayDisplay=document.getElementById("currentDayDisplay");
  const buttons=document.getElementById("buttons");

  if(currentDay>=7){
    mealName.textContent="Semana concluída 👌";
    dayDisplay.textContent="";
    buttons.style.display="none";
    return;
  }

  mealName.textContent=meals[currentIndex] || "";
  dayDisplay.textContent="Dia: "+weekDays[currentDay];
  buttons.style.display="flex";
}

// ---------------- REALTIME WEEK LISTENER ----------------
onSnapshot(collection(db,"week"), (snapshot)=>{
  const daysFilled = snapshot.docs.length;
  currentDay = daysFilled;
  meals = [...baseMeals];
  currentIndex = 0;
  updateUI();
});

// ---------------- CONSENSO ----------------
async function checkConsensus(day){
  const snapshot=await getDocs(query(collection(db,"preferences"),where("day","==",day)));

  let hugo=[],lucia=[];
  snapshot.forEach(d=>{
    const data=d.data();
    if(data.user==="hugo") hugo.push(data.meal);
    if(data.user==="lucia") lucia.push(data.meal);
  });

  const intersection=hugo.filter(m=>lucia.includes(m));

  if(intersection.length>0){
    const chosen=intersection[Math.floor(Math.random()*intersection.length)];

    await setDoc(doc(db,"week",day),{meal:chosen});

    for(const d of snapshot.docs){
      await deleteDoc(doc(db,"preferences",d.id));
    }
  }
}

// ---------------- BUTTONS ----------------
document.getElementById("yesBtn").onclick=async()=>{
  const meal=meals[currentIndex];

  await setDoc(doc(db,"preferences",`${currentUser}_${currentDay}_${meal}`),{
    user:currentUser,
    day:weekDays[currentDay],
    meal:meal
  });

  await checkConsensus(weekDays[currentDay]);

  meals.splice(currentIndex,1);
  if(currentIndex>=meals.length) currentIndex=0;
  updateUI();
};

document.getElementById("noBtn").onclick=()=>{
  meals.push(meals.splice(currentIndex,1)[0]);
  updateUI();
};

// ---------------- LIMPAR DIA ----------------
document.getElementById("clearSelectionsBtn").onclick=async()=>{
  const snapshot=await getDocs(query(collection(db,"preferences"),where("day","==",weekDays[currentDay])));

  for(const d of snapshot.docs){
    if(d.data().user===currentUser){
      await deleteDoc(doc(db,"preferences",d.id));
    }
  }

  meals=[...baseMeals];
  currentIndex=0;
  updateUI();
};

// ---------------- SEMANA ----------------
async function loadWeek(){
  for(let i=0;i<7;i++){
    document.getElementById(`day-${i}`).textContent="—";
  }

  const snapshot=await getDocs(collection(db,"week"));
  snapshot.forEach(d=>{
    const idx=weekDays.indexOf(d.id);
    if(idx>=0){
      document.getElementById(`day-${idx}`).textContent=d.data().meal;
    }
  });
}

document.getElementById("clearWeekBtn").onclick=async()=>{
  const snapshot=await getDocs(collection(db,"week"));
  for(const d of snapshot.docs){
    await deleteDoc(doc(db,"week",d.id));
  }
};

// ---------------- NAV ----------------
document.getElementById("btnEscolher").onclick=()=>{showScreen("swipe");updateUI();}
document.getElementById("btnSemana").onclick=()=>{showScreen("week");loadWeek();}
document.getElementById("btnHistorico").onclick=()=>showScreen("history");
document.getElementById("backFromSwipe").onclick=()=>showScreen("home");
document.getElementById("backFromWeek").onclick=()=>showScreen("home");
document.getElementById("backFromHistory").onclick=()=>showScreen("home");

// ---------------- USER ----------------
function initUser(){
  if(!currentUser){
    showScreen("user-select");
  } else {
    updateIndicator();
    showScreen("home");
  }
}

document.getElementById("selectHugo").onclick=()=>{localStorage.setItem(USER_KEY,"hugo");currentUser="hugo";initUser();}
document.getElementById("selectLucia").onclick=()=>{localStorage.setItem(USER_KEY,"lucia");currentUser="lucia";initUser();}

initUser();
updateUI();
