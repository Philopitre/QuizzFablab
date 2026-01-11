// @ts-check
document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "fablab-quiz-state";
  const QUESTIONS_PER_GAME = 5;

  const $consentRoot = document.getElementById("consent-root");
  const $statsRoot = document.getElementById("stats-root");
  const $contentRoot = document.getElementById("content-root");

  if (!$consentRoot || !$statsRoot || !$contentRoot) {
    alert("Erreur : éléments HTML manquants (consent-root / stats-root / content-root).");
    return;
  }

  // 20 questions + explications
  const allQuestionsRaw = [
    { question: "Des makers utilisent les fablabs pour créer des prothèses ou aides techniques.", correct: true, explanation: "Oui. Beaucoup de fablabs soutiennent des projets d'assistance (prothèses, adaptations, aides techniques) via l'impression 3D et l'électronique." },
    { question: "Des fablabs organisent des ateliers intergénérationnels.", correct: true, explanation: "Oui. Ateliers enfants/parents, seniors, débutants : le fablab est souvent un lieu de transmission entre publics." },
    { question: "Des enfants apprennent à coder ou modéliser en fablab.", correct: true, explanation: "Oui. Scratch, Arduino, modélisation 3D… les fablabs proposent souvent des initiations adaptées." },
    { question: "Certains fablabs sont accessibles aux personnes en situation de handicap.", correct: true, explanation: "Oui. Certains lieux adaptent l'accueil et les postes de travail, ou mènent des projets inclusifs avec des partenaires." },
    { question: "Il existe des fablabs dans des bibliothèques, des écoles et des centres sociaux.", correct: true, explanation: "Oui. Les fablabs peuvent être intégrés à des structures publiques/associatives : écoles, médiathèques, maisons de quartier." },
    { question: "Des fablabs ont été créés à l'initiative de citoyens.", correct: true, explanation: "Oui. Beaucoup naissent de collectifs locaux qui veulent mutualiser outils, savoir-faire et projets." },
    { question: "Des fablabs participent à des projets de recherche scientifique.", correct: true, explanation: "Oui. Prototypage rapide, instrumentation, tests : certains fablabs collaborent avec universités, écoles, labs." },
    { question: "Des fablabs organisent des hackathons citoyens.", correct: true, explanation: "Oui. Il arrive qu'ils animent des événements de co-création (solutions locales, écologie, mobilité, inclusion)." },
    { question: "Certains fablabs ont des règles de sécurité strictes.", correct: true, explanation: "Oui. Machines + outils = procédures : formation, EPI, encadrement, zones dédiées, etc." },
    { question: "Des fablabs utilisent des logiciels libres pour la modélisation.", correct: true, explanation: "Oui. On peut y utiliser Blender, FreeCAD, Inkscape, etc. (même si certains utilisent aussi des logiciels propriétaires)." },

    { question: "Tous les fablabs sont ouverts 24h/24 et 7j/7.", correct: false, explanation: "Non. Les horaires dépendent du lieu, de l'équipe, des bénévoles, et des contraintes de sécurité." },
    { question: "On peut utiliser toutes les machines sans aucune formation.", correct: false, explanation: "Non. La plupart des machines nécessitent une initiation (sécurité + bonnes pratiques) avant usage autonome." },
    { question: "Tous les projets réalisés en fablab sont automatiquement open source.", correct: false, explanation: "Non. Le partage est encouragé, mais un projet peut rester privé. Cela dépend des règles du lieu et du choix du maker." },
    { question: "Les fablabs sont toujours gratuits pour tout le monde.", correct: false, explanation: "Non. Beaucoup demandent une cotisation, un coût matière, ou un tarif atelier (parfois socialement modulé)." },
    { question: "Il n'y a jamais de règles dans un fablab.", correct: false, explanation: "Non. Il y a presque toujours un cadre : sécurité, réservation machines, respect du matériel, usage des espaces." },
    { question: "Les fablabs sont réservés aux ingénieurs et techniciens.", correct: false, explanation: "Non. Le principe d'un fablab, c'est l'ouverture : curieux, artistes, étudiants, bricoleurs, pros…" },
    { question: "On peut y fabriquer une voiture roulante et homologuée pour la route en une journée.", correct: false, explanation: "Non. Un fablab aide à prototyper, mais fabriquer une voiture complète homologuée en 24h n'est pas réaliste." },
    { question: "Les fablabs ne servent qu'à imprimer des gadgets.", correct: false, explanation: "Non. On y fait du prototypage utile, de la réparation, de l'apprentissage, des objets fonctionnels, artistiques, éducatifs." },
    { question: "Il n'y a pas besoin de respecter les règles de sécurité.", correct: false, explanation: "Non. C'est l'inverse : la sécurité est centrale (machines dangereuses, outils coupants, lasers, etc.)." },
    { question: "Les fablabs sont des magasins de bricolage.", correct: false, explanation: "Non. Un fablab est un lieu de fabrication/formation/communauté, pas une surface de vente de matériel." }
  ];

  const TOTAL_QUESTIONS = allQuestionsRaw.length;
  const MAX_GAMES = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_GAME);
  let state = {
    currentQuestions: [],
    usedQuestionIndices: [],
    userAnswers: [],
    totalScore: 0,
    totalAnswered: 0,
    gamesPlayed: 0,
    showResults: false,
    gameHistory: [],
    storageConsent: false,
    showConsentModal: false
  };

  /** @type {any|null} */
  let pendingSaved = null;

  function safeParse(raw) { try { return JSON.parse(raw); } catch { return null; } }

  async function loadState() {
    try {
      const result = await window.storage.get(STORAGE_KEY);
      if (!result || !result.value) {
        // Rien à restaurer : on joue sans sauvegarde par défaut (pas de pop-up au démarrage)
        state.storageConsent = false;
        state.showConsentModal = false;
        pendingSaved = null;
        render();
        return;
      }

      const saved = safeParse(result.value);
      const hasProgress = !!(saved && (
        (Array.isArray(saved.usedQuestionIndices) && saved.usedQuestionIndices.length > 0) ||
        (typeof saved.gamesPlayed === "number" && saved.gamesPlayed > 0) ||
        (Array.isArray(saved.gameHistory) && saved.gameHistory.length > 0) ||
        (typeof saved.totalAnswered === "number" && saved.totalAnswered > 0)
      ));

      if (!hasProgress) {
        // Sauvegarde vide / corrompue : on ignore
        state.storageConsent = false;
        state.showConsentModal = false;
        pendingSaved = null;
        render();
        return;
      }

      // Il existe une progression : on propose de la reprendre (et seulement dans ce cas)
      pendingSaved = saved;
      state.showConsentModal = true;
      render();
    } catch (error) {
      // Stockage indisponible : on continue sans pop-up ni sauvegarde
      state.storageConsent = false;
      state.showConsentModal = false;
      pendingSaved = null;
      render();
    }
  }

  async function saveState() {
    if (state.storageConsent !== true) return;
    const toSave = {
      usedQuestionIndices: state.usedQuestionIndices,
      totalScore: state.totalScore,
      totalAnswered: state.totalAnswered,
      gamesPlayed: state.gamesPlayed,
      gameHistory: state.gameHistory,
      storageConsent: state.storageConsent
    };
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function allAnswered() {
    return state.userAnswers.length > 0 && state.userAnswers.every(v => v !== undefined);
  }

  function computeGlobalProgress() {
    return (state.usedQuestionIndices.length / TOTAL_QUESTIONS) * 100;
  }

  function handleRestore(resume) {
    state.showConsentModal = false;

    if (resume) {
      state = {
        ...state,
        ...pendingSaved,
        currentQuestions: [],
        userAnswers: [],
        showResults: false,
        // Si une sauvegarde existe, on considère que l'utilisateur accepte la sauvegarde
        storageConsent: true
      };
    } else {
      // On supprime la sauvegarde et on repart proprement
      window.storage.delete(STORAGE_KEY).catch(() => {});
      state = {
        currentQuestions: [],
        usedQuestionIndices: [],
        userAnswers: [],
        totalScore: 0,
        totalAnswered: 0,
        gamesPlayed: 0,
        showResults: false,
        gameHistory: [],
        storageConsent: false,
        showConsentModal: false
      };
    }

    pendingSaved = null;
    render();
  }

  function enableSaving() {
    state.storageConsent = true;
    saveState();
    render();
  }

  function startNewGame() {
    const available = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => !state.usedQuestionIndices.includes(i));

    if (available.length === 0) {
      render();
      return;
    }

    const picked = shuffle(available).slice(0, Math.min(QUESTIONS_PER_GAME, available.length));
    state.currentQuestions = picked.map(i => ({
      question: allQuestionsRaw[i].question,
      correct: allQuestionsRaw[i].correct,
      explanation: allQuestionsRaw[i].explanation,
      originalIndex: i
    }));

    state.userAnswers = new Array(state.currentQuestions.length).fill(undefined);
    state.showResults = false;
    render();
  }

  function handleAnswer(questionIdx, answer) {
    state.userAnswers[questionIdx] = answer;
    render();
  }

  function submitAnswers() {
    let score = 0;
    for (let i = 0; i < state.currentQuestions.length; i++) {
      if (state.userAnswers[i] === state.currentQuestions[i].correct) score++;
    }

    const total = state.currentQuestions.length;
    const percentage = Math.round((score / total) * 100);

    state.usedQuestionIndices = state.usedQuestionIndices.concat(
      state.currentQuestions.map(q => q.originalIndex)
    );

    state.gameHistory = state.gameHistory.concat([{
      gameNumber: state.gamesPlayed + 1,
      score,
      total,
      percentage
    }]);

    state.totalScore += score;
    state.totalAnswered += total;
    state.gamesPlayed += 1;
    state.showResults = true;

    saveState();
    render();

    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function resetAll() {
    const ok = window.confirm("Voulez-vous vraiment réinitialiser toute votre progression ?");
    if (!ok) return;

    try {
      await window.storage.delete(STORAGE_KEY);
    } catch (error) {
      console.log('Rien à supprimer');
    }

    state = {
      currentQuestions: [],
      usedQuestionIndices: [],
      userAnswers: [],
      totalScore: 0,
      totalAnswered: 0,
      gamesPlayed: 0,
      showResults: false,
      gameHistory: [],
      storageConsent: false,
      showConsentModal: false
    };

    render();
    startNewGame();
  }

  function renderConsentModal() {
    $consentRoot.innerHTML = "";
    if (!state.showConsentModal || !pendingSaved) return;

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";

    const card = document.createElement("div");
    card.className = "modalCard";
    const answered = typeof pendingSaved.totalAnswered === "number" ? pendingSaved.totalAnswered : 0;
    const played = typeof pendingSaved.gamesPlayed === "number" ? pendingSaved.gamesPlayed : 0;

    card.innerHTML = `
      <div class="modalIcon">💾</div>
      <h2>Reprendre votre progression ?</h2>
      <p>Nous avons trouvé une progression sauvegardée (${played} partie${played > 1 ? "s" : ""}, ${answered} réponse${answered > 1 ? "s" : ""}).</p>
      <div class="modalActions">
        <button class="btnLight" id="btn-restore-reset">Repartir à zéro</button>
        <button class="btnSave" id="btn-restore-yes">Reprendre</button>
      </div>
    `;

    overlay.appendChild(card);
    $consentRoot.appendChild(overlay);

    document.getElementById("btn-restore-reset").onclick = () => handleRestore(false);
    document.getElementById("btn-restore-yes").onclick = () => handleRestore(true);
  }

  function renderStats() {
    $statsRoot.innerHTML = "";
    if (state.gamesPlayed <= 0) return;

    const percent = state.totalAnswered > 0 ? Math.round((state.totalScore / state.totalAnswered) * 100) : 0;
    const progress = computeGlobalProgress();

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

      <div class="progressTrack">
        <div class="progressBar" style="width:${progress}%;"></div>
      </div>
    `;
    $statsRoot.appendChild(wrapper);
  }

  function renderStartScreen() {
    const wrap = document.createElement("div");
    wrap.className = "startScreen";

    const isFirst = state.gamesPlayed === 0;
    wrap.innerHTML = `
      <div class="emoji">🚀</div>
      <h2>${isFirst ? "Prêt à commencer ?" : "Bienvenue de retour !"}</h2>
      <p>${isFirst ? `Testez vos connaissances avec ${QUESTIONS_PER_GAME} questions !`
        : `Continuez votre progression (${state.usedQuestionIndices.length}/${TOTAL_QUESTIONS} questions)`}</p>
      <button class="btn btnStart">${isFirst ? "🎯 Commencer le quiz" : "▶️ Continuer"}</button>
    `;
    wrap.querySelector("button").onclick = () => startNewGame();
    $contentRoot.appendChild(wrap);
  }

  function renderQuestions() {
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
    submit.disabled = !allAnswered();
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

  function renderResults() {
    const container = document.createElement("div");
    const last = state.gameHistory[state.gameHistory.length - 1];
    const good = last.percentage >= 80;

    const banner = document.createElement("div");
    banner.className = "resultBanner";
    banner.style.background = good ? "var(--success)" : "var(--danger)";
    banner.textContent = `${good ? "🎉" : "💪"} Partie ${state.gamesPlayed} : ${last.score} / ${last.total} (${last.percentage}%)`;
    container.appendChild(banner);

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
      replay.textContent = "🔁 Rejouer (5 nouvelles questions)";
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
      <p>Ce quiz s'inspire de contenus pédagogiques disponibles sur la chaîne <a href=https://tube.oisux.org/c/agrilab_channel/videos" target="_blank" rel="noopener noreferrer">Agrilab Channel</a> (CC BY-NC-SA 4.0).</p>
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
          <svg class="socialIcon" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
        <a href="https://www.instagram.com/brikabrac_philow/" target="_blank" rel="noopener noreferrer" class="socialBtn instagram">
          <svg class="socialIcon" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagram
        </a>
      </div>
    `;
    container.appendChild(social);

    // Partage (Facebook + copie d'URL)
    const shareBox = document.createElement("div");
    shareBox.style.marginTop = "24px";
    shareBox.style.textAlign = "center";

    const shareRow = document.createElement("div");
    shareRow.style.display = "flex";
    shareRow.style.justifyContent = "center";
    shareRow.style.gap = "12px";
    shareRow.style.flexWrap = "wrap";

    function getShareUrl() {
      // On partage l'URL propre (sans fragments)
      return window.location.href.split("#")[0];
    }

    function copyLinkFeedback(btn) {
      const url = getShareUrl();
      navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = "✅ Lien copié";
        btn.style.background = "var(--success)";
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = "var(--primary)";
        }, 1800);
      }).catch(() => {
        alert(`Copiez ce lien pour partager le quiz :

${url}`);
      });
    }

    const fbBtn = document.createElement("button");
    fbBtn.className = "btn btnPrimary";
    fbBtn.style.width = "min(320px, 100%)";
    fbBtn.innerHTML = "📣 Partager sur Facebook";
    fbBtn.onclick = () => {
      const url = getShareUrl();
      const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      const win = window.open(fbShare, "_blank", "noopener,noreferrer,width=600,height=500");
      // Si pop-up bloquée, on retombe sur la copie
      if (!win) copyLinkFeedback(copyBtn);
    };

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btnPrimary";
    copyBtn.style.width = "min(320px, 100%)";
    copyBtn.innerHTML = "🔗 Copier le lien du quiz";
    copyBtn.onclick = () => copyLinkFeedback(copyBtn);

    shareRow.appendChild(fbBtn);
    shareRow.appendChild(copyBtn);
    shareBox.appendChild(shareRow);

    $contentRoot.appendChild(shareBox);

    $contentRoot.appendChild(container);
  }

  function render() {
    renderConsentModal();
    renderStats();
    $contentRoot.innerHTML = "";

    if (state.currentQuestions.length > 0 && !state.showResults) {
      renderQuestions();
      return;
    }

    if (state.showResults) {
      renderResults();
      return;
    }

    if (state.currentQuestions.length === 0 && !state.showConsentModal) {
      renderStartScreen();
    }
  }

  // Boot
  loadState();
});
