document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // Navegação
  // ======================
  window.navigate = function(target) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });
    setTimeout(() => {
      document.getElementById(target).classList.add("active");
    }, 50);
  }

  // ======================
  // Dados locais
  // ======================
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

  let currentIndex = 0;
  let currentDay = 0;

  // ======================
  // Elementos
  // ======================
  const mealName = document.getElementById("mealName");
  const currentDayDisplay = document.getElementById("currentDayDisplay");
  const buttons = document.getElementById("buttons");

  // ======================
  // Helpers UI
  // ======================
  function highlightDay() {
    for (let i = 0; i < 7; i++) {
      document.getElementById(`day-row-${i}`)
        .classList.toggle("active", i === currentDay);
    }
  }

  function showMeal() {
    highlightDay();

    if (currentDay >= 7 || currentIndex >= meals.length) {
      mealName.textContent = "Já não há mais refeições chefe!";
      currentDayDisplay.textContent = "";
      buttons.style.display = "none";
      return;
    }

    buttons.style.display = "flex";
    mealName.textContent = meals[currentIndex];
    currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
  }

  showMeal();

  // ======================
  // Escolha refeição
  // ======================
  window.chooseMeal = function(isLike) {
    if (currentDay >= 7) return;

    if (isLike) {
      const meal = meals[currentIndex];
      const dayId = currentDay;

      document.getElementById(`day-${dayId}`).textContent = meal;

      // Guardar no Firebase
      db.collection("testemeals").doc("currentWeek").set({
        [`day${dayId}`]: meal
      }, { merge: true });

      currentDay++;
    }

    currentIndex++;
    showMeal();
  }

  // ======================
  // Limpar semana
  // ======================
  window.clearWeek = function() {
    if (!confirm("Tens a certeza de que queres limpar todas as refeições?"))
      return;

    for (let i = 0; i < 7; i++) {
      document.getElementById(`day-${i}`).textContent = "—";
      document.getElementById(`day-row-${i}`).classList.remove("active");
    }

    currentIndex = 0;
    currentDay = 0;
    showMeal();

    // Limpar Firebase
    db.collection("testemeals").doc("currentWeek").set({}, { merge: true });
  }

});
