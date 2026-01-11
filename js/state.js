// state.js
import { safeJsonParse } from "./utils.js";

const STORAGE_KEY = "fablab_quiz_state_v1";

export function createInitialState() {
  return {
    currentQuestions: [],
    usedQuestionIndices: [],
    userAnswers: [],
    totalScore: 0,
    totalAnswered: 0,
    gamesPlayed: 0,
    showResults: false,
    gameHistory: []
  };
}

export function saveStateSilently(state) {
  try {
    const payload = { ...state, _savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore (localStorage bloqué)
  }
}

export function loadStateSilently() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = safeJsonParse(raw);
    if (!data || typeof data !== "object") return null;

    // Validation minimale
    if (!Array.isArray(data.usedQuestionIndices)) return null;
    if (!Array.isArray(data.gameHistory)) return null;
    if (typeof data.totalScore !== "number") return null;
    if (typeof data.totalAnswered !== "number") return null;
    if (typeof data.gamesPlayed !== "number") return null;

    return {
      currentQuestions: Array.isArray(data.currentQuestions) ? data.currentQuestions : [],
      usedQuestionIndices: data.usedQuestionIndices,
      userAnswers: Array.isArray(data.userAnswers) ? data.userAnswers : [],
      totalScore: data.totalScore,
      totalAnswered: data.totalAnswered,
      gamesPlayed: data.gamesPlayed,
      showResults: !!data.showResults,
      gameHistory: data.gameHistory
    };
  } catch {
    return null;
  }
}

export function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
