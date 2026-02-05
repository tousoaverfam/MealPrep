document.addEventListener("DOMContentLoaded", () => {

  /* ======================
     Navegação
  ====================== */
  window.navigate = function(target) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.remove("active");
    });
    setTimeout(() => {
      document.getElementById(target).classList.add("active");
    }, 50);
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
    "Segunda-feira","Terça-feira","Quarta-feira",
    "Quinta-feira","Sexta-feira","Sábado","Domingo"
  ];

  let currentIndex = 0;
  let currentDay = 0;
  let rejectedMeals = [];

  /* ======================
     Elementos
  ====================== */
  const mealName = document.getElementById("mealName");
  const currentDayDisplay = document.getElementById("currentDayDisplay");
  const buttons = document.getElementById("buttons");

  /* ======================
     Helpers
  ====================== */
  function highlightDay() {
    for (let i = 0; i < 7; i++) {
      document.getElementById(`day-row-${i}`).classList.toggle("active", i === currentDay);
    }
  }

  function showMeal() {
    highlightDay();

    if (currentDay >= 7) {
      mealName.textContent = "Já não há mais refeições chefe!";
      currentDayDisplay.textContent = "";
      buttons.style.display = "none";
      return;
    }

    if (currentIndex >= meals.length) {
      // voltar a mostrar rejeitadas
      meals.push(...rejectedMeals);
      rejectedMeals = [];
      currentIndex = 0;
    }

    buttons.style.display = "flex";
    mealName.textContent = meals[currentIndex];
    currentDayDisplay.textContent = "Dia: " + weekDays[currentDay];
  }

  showMeal();

  /* ======================
     Escolha
  ====================== */
  window.chooseMeal = function(isLike) {
    const meal = meals[currentIndex];

    if (!isLike) {
      rejectedMeals.push(meal);
    } else {
      document.getElementById(`day-${currentDay}`).textContent = meal;

      // guardar no Firebase
      window.db.collection("testemeals").doc("currentWeek").set({
        [`day${currentDay}`]: meal
      }, { merge: true });

      currentDay++;
    }

    currentIndex++;
    showMeal();
  }

  /* ======================
     Limpar semana
  ====================== */
  window.clearWeek = function() {
    if (!confirm("Tens a certeza de que queres limpar todas as refeições?")) return;

    for (let i = 0; i < 7; i++) {
      document.getElementById(`day-${i}`).textContent = "—";
      document.getElementById(`day-row-${i}`).classList.remove("active");
    }

    currentIndex = 0;
    currentDay = 0;
    rejectedMeals = [];
    showMeal();

    // limpar Firebase
    window.db.collection("testemeals").doc("currentWeek").set({}, { merge: true });
  }

});
