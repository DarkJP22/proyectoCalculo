// Variables globales
let isPaused = false;
let questions = [];
let currentQuestion = null;
let availableQuestions = [];
let answeredQuestions = [];

// Selectores del DOM
const domElements = {
  mainMenu: document.getElementById("main-menu"),
  tower: document.getElementById("tower"),
  rules: document.getElementById("rules"),
  credits: document.getElementById("credits"),
  pauseMenu: document.getElementById("pause-menu"),
  mathQuestionModal: document.getElementById("math-question-modal"),
  mathQuestionImage: document.getElementById("math-question-image"),
  mathAnswerOptions: document.querySelectorAll("#math-answer-options button"),
  messageModal: document.getElementById("message-modal"),
  messageTitle: document.getElementById("message-title"),
  messageText: document.getElementById("message-text"),
  feedbackModal: document.getElementById("feedback-modal"),
  feedbackQuestionsList: document.getElementById("feedback-questions-list"),
  procedureModal: document.getElementById("procedure-modal"),
  procedureImage: document.getElementById("procedure-image"),
};

// Funciones para mostrar y ocultar reglas y créditos
function showRules() {
  domElements.rules.style.display = "block";
}

function hideRules() {
  domElements.rules.style.display = "none";
}

function showCredits() {
  domElements.credits.style.display = "block";
}

function hideCredits() {
  domElements.credits.style.display = "none";
}

// Funciones de manejo del juego
function startGame() {
  isPaused = false;
  domElements.mainMenu.style.display = "none";
  domElements.tower.style.display = "block";
  startMusic();
  stopMenuMusic();
}

function togglePause() {
  if (domElements.mathQuestionModal.style.display === "block") return;

  isPaused = !isPaused;
  domElements.pauseMenu.style.display = isPaused ? "block" : "none";
  player.paused = isPaused;
  if (isPaused) {
    backgroundMusic.pause(); // Pausar la música
  } else {
    backgroundMusic.play(); // Reanudar la música
  }
}

function resumeGame() {
  isPaused = false;
  domElements.pauseMenu.style.display = "none";
  player.paused = false;
}

function returnToMainMenu() {
  showMessageModal("¡Vuelve pronto!", `Puntos obtenidos: ${player.score}`);
  const acceptButton = domElements.messageModal.querySelector("button");
  acceptButton.onclick = () => {
    closeMessageModal();
    stopMusic(); 
    startMenuMusic(); 
    window.location.reload();
  };
}

// Funciones de manejo de preguntas
function loadQuestions() {
  fetch("images/questions/questions.json")
    .then((response) => response.json())
    .then((data) => {
      questions = data;
      availableQuestions = [...data];
    })
    .catch((error) => console.error("Error al cargar las preguntas:", error));
}

function getRandomQuestion() {
  if (availableQuestions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const question = availableQuestions[randomIndex];
  availableQuestions.splice(randomIndex, 1);
  return question;
}

function showMathQuestion() {
  player.paused = true;
  isPaused = true;

  if (availableQuestions.length === 0) {
    showMessageModal(
      "Vuelve pronto",
      `No hay más preguntas disponibles. Puntos obtenidos: ${player.score}`
    );
    player.paused = false;
    isPaused = false;
    return;
  }

  currentQuestion = getRandomQuestion();
  if (!currentQuestion) {
    showMessageModal(
      "Error",
      "Hubo un problema al cargar la pregunta. Inténtalo de nuevo."
    );
    player.paused = false;
    isPaused = false;
    return;
  }

  domElements.mathQuestionImage.src = currentQuestion.questionImage;
  currentQuestion.options.forEach((option, index) => {
    domElements.mathAnswerOptions[index].querySelector("img").src =
      option.image;
  });

  domElements.mathAnswerOptions.forEach((button) => {
    button.disabled = false;
    button.style.backgroundColor = "#555";
    button.style.cursor = "pointer";
  });

  domElements.mathQuestionModal.style.display = "block";
}

function submitMathAnswer(selectedOptionIndex) {
  if (!currentQuestion) return;

  const correctAnswerIndex = currentQuestion.options.findIndex(
    (option) => option.isCorrect
  );

  if (!answeredQuestions.includes(currentQuestion)) {
    answeredQuestions.push(currentQuestion);
    localStorage.setItem(
      "answeredQuestions",
      JSON.stringify(answeredQuestions)
    );
  }

  domElements.mathAnswerOptions.forEach((button, index) => {
    if (index === correctAnswerIndex) {
      button.style.backgroundColor = "#4CAF50";
    } else if (index === selectedOptionIndex) {
      button.style.backgroundColor = "#f44336";
    } else {
      button.style.backgroundColor = "#555";
    }
    button.disabled = true;
    button.style.cursor = "not-allowed";
  });

  setTimeout(() => {
    if (selectedOptionIndex === correctAnswerIndex) {
      const coinsToLose = Math.floor(player.score * 0.25);
      player.score = Math.max(0, player.score - coinsToLose);
      if (window.renderer) window.renderer.renderScore();
      showMessageModal(
        "¡Correcto!",
        `Ganaste una vida extra. Perdiste ${coinsToLose} monedas.`
      );
      player.lives++;
      player.x = player.savedX;
      player.y = player.savedY;
    } else {
      showMessageModal(
        "Incorrecto",
        "¡Juego terminado!",
        "Tus puntos son los siguientes: " + player.score
      );
      player.gameOver();
    }
    closeMathQuestionModal();
    player.paused = false;
    isPaused = false;
  }, 1000);
}

function closeMathQuestionModal() {
  domElements.mathAnswerOptions.forEach((button) => {
    button.disabled = false;
    button.style.backgroundColor = "#555";
    button.style.cursor = "pointer";
  });

  domElements.mathQuestionModal.style.display = "none";

  if (player.lives <= 0) {
    returnToMainMenu();
  } else {
    player.paused = false;
    isPaused = false;
  }
}

// Funciones de manejo de modales
function showMessageModal(title, message) {
  domElements.messageTitle.textContent = title;
  domElements.messageText.textContent = message;
  domElements.messageModal.style.display = "block";
}

function closeMessageModal() {
  domElements.messageModal.style.display = "none";
  player.paused = false;
  isPaused = false;
}

function showFeedback() {
  domElements.feedbackQuestionsList.innerHTML = "";

  if (answeredQuestions.length === 0) {
    domElements.feedbackQuestionsList.innerHTML =
      "<p>No has respondido ninguna pregunta todavía.</p>";
  } else {
    answeredQuestions.forEach((question, index) => {
      const button = document.createElement("button");
      button.textContent = `Pregunta ${index + 1}`;
      button.onclick = () => showProcedure(question.procedureImage);
      domElements.feedbackQuestionsList.appendChild(button);
    });
  }

  domElements.feedbackModal.style.display = "block";
}

function showProcedure(procedureImage) {
  domElements.procedureImage.src = procedureImage;
  domElements.procedureModal.style.display = "block";
}

function closeFeedbackModal() {
  domElements.feedbackModal.style.display = "none";
}

function closeProcedureModal() {
  domElements.procedureModal.style.display = "none";
}

// Cargar preguntas respondidas desde localStorage
function loadAnsweredQuestions() {
  const storedAnsweredQuestions = localStorage.getItem("answeredQuestions");
  answeredQuestions = storedAnsweredQuestions
    ? JSON.parse(storedAnsweredQuestions)
    : [];
}

// Event listeners
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") togglePause();
});

document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();
  loadAnsweredQuestions();
  startMenuMusic();
});

const backgroundMusic = document.getElementById("background-music");
const menuMusic = document.getElementById('menu-music');
const coinSound = document.getElementById('coin-sound');
const hitSound = document.getElementById('hit-sound');

// Iniciar música de fondo del juego
function startMusic() {
  backgroundMusic.play();
  backgroundMusic.volume = 0.15; // Ajusta el volumen al 15%
}

function stopMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

// Iniciar música del menú
function startMenuMusic() {
    menuMusic.volume = 0.12; // Ajusta el volumen al 12%
    menuMusic.play().catch(error => {
        console.error("Error al reproducir la música del menú:", error);
    });
}

// Detener música del menú
function stopMenuMusic() {
    menuMusic.pause();
    menuMusic.currentTime = 0; // Reinicia la música al principio
}

// Reproducir sonido de la moneda
function playCoinSound() {
  coinSound.volume = 0.11; // Ajusta el volumen al 11%
  coinSound.currentTime = 0; // Reinicia el sonido para que se reproduzca desde el principio
  coinSound.play().catch(error => {
      console.error("Error al reproducir el sonido de la moneda:", error);
  });
}

// Reproducir sonido de golpe
function playHitSound() {
  hitSound.volume = 0.11; // Ajusta el volumen al 11%
  hitSound.currentTime = 0; // Reinicia el sonido para que se reproduzca desde el principio
  hitSound.play().catch(error => {
      console.error("Error al reproducir el sonido de golpe:", error);
  });
}