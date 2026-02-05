/* ======================
   Navegação
====================== */

function navigate(target) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(target).classList.add("active");
}

/* ======================
   Dados
====================== */

const meals = [
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

let currentDay = 0;
let mealQueue = [...meals];

/* ======================
   Elementos
====================== */

const mealName = document.getElementById("mealName");
const currentDayDisplay = document.getElementById("currentDayDisplay");
const buttons = document.getElementById("buttons");

/* ======================
   UI helpers
====================== */

function highlightDay() {
  for (let i = 0; i < 7; i++) {
    document
      .getElementById(`day-row-${i}`)
      .classList.toggle("active", i === currentDay);
  }
}

/* ======================
   Mostrar refeição
====================== */

function showMeal() {
  highlightDay();

  if (currentDay >= 7) {
    mealName.textContent = "Já não há mais refeições chefe!";
    currentDayDisplay.textContent = "";
    buttons.style.display = "none";
    return;
  }

  if (mealQueue.length === 0) {
    mealQueue = [...meals];
  }

  mealName.textContent = mealQueue[0];
  currentDayDisplay.textContent = weekDays[currentDay];
  buttons.style.display = "flex";
}

showMeal();

/* ======================
   Escolha
====================== */

function chooseMeal(isLike) {
  const meal = mealQueue.shift();

  if (isLike) {
    document.getElementById(`day-${currentDay}`).textContent = meal;
    currentDay++;
  } else {
    mealQueue.push(meal);
  }

  showMeal();
}

/* ======================
   Limpar semana
====================== */

function clearWeek() {
  if (!confirm("Tens a certeza de que queres limpar todas as refeições?")) {
    return;
  }

  for (let i = 0; i < 7; i++) {
    document.getElementById(`day-${i}`).textContent = "—";
    document.getElementById(`day-row-${i}`).classList.remove("active");
  }

  currentDay = 0;
  mealQueue = [...meals];
  showMeal();
}
