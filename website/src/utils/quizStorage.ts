const RESULT_PREFIX = 'quiz_result_';
const PROGRESS_PREFIX = 'quiz_progress_';

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  date: string;
}

export interface QuizProgress {
  quizId: string;
  currentIndex: number;
  answers: (number | null)[];
  validated: boolean[];
}

export function saveQuizResult(quizId: string, score: number, total: number): void {
  try {
    const result: QuizResult = {
      quizId,
      score,
      total,
      date: new Date().toISOString(),
    };
    localStorage.setItem(`${RESULT_PREFIX}${quizId}`, JSON.stringify(result));
    localStorage.removeItem(`${PROGRESS_PREFIX}${quizId}`);
  } catch {
    // localStorage unavailable
  }
}

export function getQuizResult(quizId: string): QuizResult | null {
  try {
    const raw = localStorage.getItem(`${RESULT_PREFIX}${quizId}`);
    if (!raw) return null;
    return JSON.parse(raw) as QuizResult;
  } catch {
    return null;
  }
}

export function getAllQuizResults(): QuizResult[] {
  const results: QuizResult[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(RESULT_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          results.push(JSON.parse(raw) as QuizResult);
        }
      }
    }
  } catch {
    // localStorage unavailable
  }
  return results;
}

export function getAllQuizProgress(): QuizProgress[] {
  const progress: QuizProgress[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PROGRESS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          progress.push(JSON.parse(raw) as QuizProgress);
        }
      }
    }
  } catch {
    // localStorage unavailable
  }
  return progress;
}

export function saveQuizProgress(quizId: string, currentIndex: number, answers: (number | null)[], validated: boolean[]): void {
  try {
    const progress: QuizProgress = { quizId, currentIndex, answers, validated };
    localStorage.setItem(`${PROGRESS_PREFIX}${quizId}`, JSON.stringify(progress));
  } catch {
    // localStorage unavailable
  }
}

export function getQuizProgress(quizId: string): QuizProgress | null {
  try {
    const raw = localStorage.getItem(`${PROGRESS_PREFIX}${quizId}`);
    if (!raw) return null;
    return JSON.parse(raw) as QuizProgress;
  } catch {
    return null;
  }
}

export function resetQuizResult(quizId: string): void {
  try {
    localStorage.removeItem(`${RESULT_PREFIX}${quizId}`);
    localStorage.removeItem(`${PROGRESS_PREFIX}${quizId}`);
  } catch {
    // localStorage unavailable
  }
}

export function resetAllQuizzes(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(RESULT_PREFIX) || key?.startsWith(PROGRESS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable
  }
}
