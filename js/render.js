// render.js
import { QUESTIONS } from "./questions.js";
import { shuffle, allAnswered } from "./utils.js";
import { saveStateSilently, clearSavedState, createInitialState } from "./state.js";
import { copyLinkFeedback, shareOnFacebookOrFallback } from "./share.js";

export function createRenderer({
  QUESTIONS_PER_GAME,
  TOTAL_QUESTIONS,
  MAX_GAMES,
  $statsRoot,
  $contentRoot,
  getState,
  setState
}) {
  function computeGlobalProgress(state) {
    return (state.usedQuestionIndices.length / TOTAL_QUESTIONS) * 100;
  }

  function startNewGame() {
  const state = getState();

  const available = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
    .filter(i => !state.usedQuestionIndices.includes(i));

  if (available.length === 0) {
    const next = { ...state, currentQuestions: [], userAnswers: [], showResults: true };
    setState(next);
    saveStateSilently(next);
    render();
    return;
  }

  const picked = shuffle(available).slice(0, Math.min(QUESTIONS_PER_GAME, available.length));
  const currentQuestions = picked.map(i => ({
    question: QUESTIONS[i].question,
    correct: QUESTIONS[i].correct,
    explanation: QUESTIONS[i].explanation,
    originalIndex: i
  }));

  const next = {
    ...state,
    currentQuestions,
    userAnswers: new Array(currentQuestions.length).fill(undefined),
    showResults: false
  };

  setState(next);
  saveStateSilently(next);
  render();

 // Empêche le navigateur de re-scroller sur le bouton "Rejouer" (focus)
if (document.activeElement && typeof document.activeElement.blur === "function") {
  document.activeElement.blur();
}

// Scroll en haut après que le DOM soit réellement stabilisé (2 frames)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const opts = { top: 0, left: 0, behavior: "smooth" };

    // Certains navigateurs scrollent sur documentElement, d'autres sur body
    document.documentElement.scrollTo(opts);
    document.body.scrollTo(opts);

    // Et on assure le coup (fallback)
    window.scrollTo(opts);
  });
});
}

  function handleAnswer(questionIdx, answer) {
    const state = getState();
    const userAnswers = state.userAnswers.slice();
    userAnswers[questionIdx] = answer;

    const next = { ...state, userAnswers };
    setState(next);
    saveStateSilently(next);
    render();
  }

  function submitAnswers() {
    const state = getState();

    let score = 0;
    for (let i = 0; i < state.currentQuestions.length; i++) {
      if (state.userAnswers[i] === state.currentQuestions[i].correct) score++;
    }

    const total = state.currentQuestions.length;
    const percentage = Math.round((score / total) * 100);

    const usedQuestionIndices = state.usedQuestionIndices.concat(
      state.currentQuestions.map(q => q.originalIndex)
    );

    const gameHistory = state.gameHistory.concat([{
      gameNumber: state.gamesPlayed + 1,
      score,
      total,
      percentage
    }]);

    const next = {
      ...state,
      usedQuestionIndices,
      gameHistory,
      totalScore: state.totalScore + score,
      totalAnswered: state.totalAnswered + total,
      gamesPlayed: state.gamesPlayed + 1,
      showResults: true
    };

    setState(next);
    saveStateSilently(next);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    const ok = window.confirm("Voulez-vous vraiment réinitialiser toute votre progression ?");
    if (!ok) return;

    const next = createInitialState();
    setState(next);
    clearSavedState();
    render();
  }

  function renderStats() {
    const state = getState();
    $statsRoot.innerHTML = "";
    if (state.gamesPlayed <= 0) return;

    const percent = state.totalAnswered > 0 ? Math.round((state.totalScore / state.totalAnswered) * 100) : 0;
    const progress = computeGlobalProgress(state);

    const wrapper = document.createElement("section");
    wrapper.className = "stats";
    wrapper.innerHTML = `
      <div class="statsRow">
        <div class="statBlock">
          <div class="statBig">🏆 <span>${state.totalScore} / ${state.totalAnswered}</span></div>
          <div class="statSmall">Score total cumulé (${percent}%)</div>
        </div>
        <div class="statBlock" style="text-align:right;">
          <div class="statBig" style="justify-content:flex-end;">🎯 <span>Partie ${state.gamesPlayed}/${MAX_GAMES}</span></div>
          <div class="statSmall">${state.usedQuestionIndices.length} / ${TOTAL_QUESTIONS} questions répondues</div>
        </div>
      </div>

      <div class="progressTrack" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progression globale du quiz">
        <div class="progressBar" style="width:${progress}%;"></div>
      </div>
    `;
    $statsRoot.appendChild(wrapper);
  }

  function renderStartScreen() {
    const state = getState();
    const wrap = document.createElement("div");
    wrap.className = "startScreen";

    const hasProgress = state.usedQuestionIndices.length > 0 || state.gamesPlayed > 0;
    const canContinue = state.usedQuestionIndices.length < TOTAL_QUESTIONS;

    const headline = hasProgress ? "Bienvenue de retour !" : "Prêt à commencer ?";
    const sub = hasProgress
      ? `Votre progression est sauvegardée (${state.usedQuestionIndices.length}/${TOTAL_QUESTIONS} questions).`
      : `Testez vos connaissances avec ${QUESTIONS_PER_GAME} questions !`;

    const btnText = hasProgress ? (canContinue ? "▶️ Continuer" : "🏁 Voir mes résultats") : "🎯 Commencer le quiz";

    wrap.innerHTML = `
      <div class="emoji">🚀</div>
      <h2>${headline}</h2>
      <p>${sub}</p>
      <button class="btn btnStart">${btnText}</button>
    `;

    wrap.querySelector("button").onclick = () => {
      if (!hasProgress) return startNewGame();
      if (canContinue) return startNewGame();
      const next = { ...state, showResults: true };
      setState(next);
      saveStateSilently(next);
      render();
    };

    if (hasProgress) {
      const actions = document.createElement("div");
      actions.className = "actionsRow";
      const reset = document.createElement("button");
      reset.className = "btn btnGray";
      reset.textContent = "⟲ Réinitialiser tout";
      reset.onclick = () => resetAll();
      actions.appendChild(reset);
      wrap.appendChild(actions);
    }

    $contentRoot.appendChild(wrap);
  }

  function renderQuestions() {
    const state = getState();
    const container = document.createElement("div");

    state.currentQuestions.forEach((q, idx) => {
      const selected = state.userAnswers[idx];
      const card = document.createElement("div");
      card.className = "questionCard";
      card.innerHTML = `
        <h3 class="qTitle">Question ${idx + 1} / ${state.currentQuestions.length}</h3>
        <p class="qText">${q.question}</p>
        <div class="answerRow">
          <button class="btn btnAnswer ${selected === true ? "selected" : ""}" data-q="${idx}" data-a="true">Vrai</button>
          <button class="btn btnAnswer ${selected === false ? "selected" : ""}" data-q="${idx}" data-a="false">Faux</button>
        </div>
      `;
      container.appendChild(card);
    });

    const submit = document.createElement("button");
    submit.className = "btn btnPrimary";
    submit.textContent = "Valider mes réponses";
    submit.disabled = !allAnswered(state.userAnswers);
    submit.setAttribute("aria-label", `Valider mes ${state.currentQuestions.length} réponses`);
    if (!allAnswered(state.userAnswers)) submit.setAttribute("aria-disabled", "true");
    submit.onclick = () => submitAnswers();
    container.appendChild(submit);

    container.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLButtonElement)) return;
      if (!t.dataset.q || !t.dataset.a) return;
      handleAnswer(Number(t.dataset.q), t.dataset.a === "true");
    });

    $contentRoot.appendChild(container);
  }

  function renderShareBox(container) {
    const shareBox = document.createElement("div");
    shareBox.className = "shareBox";
    shareBox.innerHTML = `
      <h3 style="margin:0 0 4px;">📣 Partager le quiz</h3>
      <p style="margin:0; color:#4a5568;">Si tu veux le transmettre, voici les boutons.</p>
    `;

    const shareRow = document.createElement("div");
    shareRow.className = "shareRow";

    const fbBtn = document.createElement("button");
    fbBtn.className = "btn btnPrimary shareBtn";
    fbBtn.innerHTML = "📘 Partager sur Facebook";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btnPrimary shareBtn";
    copyBtn.innerHTML = "🔗 Copier le lien du quiz";

    copyBtn.onclick = () => copyLinkFeedback(copyBtn);
    fbBtn.onclick = () => shareOnFacebookOrFallback(copyBtn);

    shareRow.appendChild(fbBtn);
    shareRow.appendChild(copyBtn);
    shareBox.appendChild(shareRow);

    container.appendChild(shareBox);
  }

  function renderResults() {
    const state = getState();
    const container = document.createElement("div");

    const last = state.gameHistory[state.gameHistory.length - 1];
    const good = last ? last.percentage >= 80 : false;

    const banner = document.createElement("div");
    banner.className = "resultBanner";
    banner.style.background = good ? "var(--success)" : "var(--danger)";
    banner.textContent = last
      ? `${good ? "🎉" : "💪"} Partie ${state.gamesPlayed} : ${last.score} / ${last.total} (${last.percentage}%)`
      : `📌 Résultats`;
    container.appendChild(banner);

    // ✅ Partage (après bannière)
    renderShareBox(container);

    // Correction complète
    const correctionBox = document.createElement("div");
    correctionBox.className = "infoBox";
    correctionBox.innerHTML = `
      <h3>🧠 Correction complète</h3>
      <div class="correctionList">
        ${state.currentQuestions.map((q, i) => {
          const user = state.userAnswers[i];
          const isCorrect = user === q.correct;
          const userLabel = user === true ? "Vrai" : "Faux";
          const correctLabel = q.correct === true ? "Vrai" : "Faux";

          return `
            <div class="correctionItem ${isCorrect ? "ok" : "ko"}">
              <div class="correctionTop">
                <div class="correctionIcon">${isCorrect ? "✅" : "❌"}</div>
                <div class="correctionQ"><b>${q.question}</b></div>
              </div>
              <div class="correctionMeta">
                <span class="tag ${isCorrect ? "tagOk" : "tagWrong"}">Ta réponse : ${userLabel}</span>
                <span class="tag tagCorrect">Bonne réponse : ${correctLabel}</span>
              </div>
              <div class="correctionExplain">${q.explanation || ""}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    container.appendChild(correctionBox);

    // Historique
    const histWrap = document.createElement("div");
    histWrap.innerHTML = `
      <h3 class="historyTitle">📈 Historique des parties</h3>
      <div class="historyList">
        ${state.gameHistory.map(g => {
          const color = g.percentage >= 80 ? "var(--success)" : "var(--danger)";
          return `
            <div class="historyItem">
              <b>Partie ${g.gameNumber}</b>
              <span class="historyScore" style="color:${color}">${g.score}/${g.total} (${g.percentage}%)</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
    container.appendChild(histWrap);

    const canPlayMore = state.usedQuestionIndices.length < TOTAL_QUESTIONS;
    const isComplete = state.usedQuestionIndices.length >= TOTAL_QUESTIONS && state.showResults;

    if (isComplete) {
      const finalPct = state.totalAnswered > 0 ? Math.round((state.totalScore / state.totalAnswered) * 100) : 0;
      const cele = document.createElement("div");
      cele.className = "celebration";
      cele.innerHTML = `
        <div class="emoji">🏆</div>
        <h2>Félicitations !</h2>
        <p>Vous avez répondu aux ${TOTAL_QUESTIONS} questions !</p>
        <div class="finalScore">Score final : ${state.totalScore} / ${state.totalAnswered} (${finalPct}%)</div>
      `;
      container.appendChild(cele);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "actionsRow";

    if (canPlayMore && !isComplete) {
      const replay = document.createElement("button");
      replay.className = "btn btnGreen";
      replay.textContent = "🔄 Rejouer (5 nouvelles questions)";
      replay.onclick = () => startNewGame();
      actions.appendChild(replay);
    }

    const reset = document.createElement("button");
    reset.className = "btn btnGray";
    reset.textContent = "⟲ Réinitialiser tout";
    reset.onclick = () => resetAll();
    actions.appendChild(reset);

    container.appendChild(actions);

    // Infos + crédits
    const about = document.createElement("div");
    about.className = "infoBox";
    about.innerHTML = `
      <h3>💡 À propos du Fab-C de Charleroi</h3>
      <p>Le Fab-C est un fablab ouvert à tous, situé à Charleroi. Il propose des ateliers, des formations, et un espace de création numérique.</p>
      <p>👉 <a href="https://fablab-charleroi.be/" target="_blank" rel="noopener noreferrer">Découvrez le Fab-C</a></p>
    `;
    container.appendChild(about);

    const credits = document.createElement("div");
    credits.className = "infoBox";
    credits.innerHTML = `
      <h3>🎥 Vidéos sur les fablabs</h3>
      <p>Ce quiz s'inspire de contenus pédagogiques disponibles sur la chaîne <a href="https://tube.oisux.org/c/agrilab_channel/videos" target="_blank" rel="noopener noreferrer">Agrilab Channel</a> (CC BY-NC-SA 4.0).</p>
      <p>Créé par <strong>Luc Hanneuse</strong>. Vous pouvez réutiliser ce contenu à but non commercial, en citant l'auteur et en respectant les mêmes conditions de licence.</p>
    `;
    container.appendChild(credits);

    // Réseaux sociaux
    const social = document.createElement("div");
    social.className = "infoBox";
    social.innerHTML = `
      <h3>💬 Proposer une question ou partager vos idées</h3>
      <p>Vous avez une idée de question ou un retour à partager ? Contactez-moi sur les réseaux sociaux :</p>
      <div class="socialButtons">
        <a href="https://www.facebook.com/profile.php?id=61568348016730" target="_blank" rel="noopener noreferrer" class="socialBtn facebook">
          <svg class="socialIcon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
        <a href="https://www.instagram.com/brikabrac_philow/" target="_blank" rel="noopener noreferrer" class="socialBtn instagram">
          <svg class="socialIcon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagram
        </a>
      </div>
    `;
    container.appendChild(social);

    $contentRoot.appendChild(container);
  }

  function render() {
    renderStats();
    $contentRoot.innerHTML = "";

    const state = getState();

    if (state.currentQuestions.length > 0 && !state.showResults) {
      renderQuestions();
      return;
    }

    if (state.showResults) {
      renderResults();
      return;
    }

    renderStartScreen();
  }

  return { render };
}
