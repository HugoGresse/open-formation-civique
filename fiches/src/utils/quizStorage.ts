const PREFIX = 'quiz_result_';

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  date: string;
}

export function saveQuizResult(quizId: string, score: number, total: number): void {
  try {
    const result: QuizResult = {
      quizId,
      score,
      total,
      date: new Date().toISOString(),
    };
    localStorage.setItem(`${PREFIX}${quizId}`, JSON.stringify(result));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

export function getQuizResult(quizId: string): QuizResult | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${quizId}`);
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
      if (key?.startsWith(PREFIX)) {
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

export function resetQuizResult(quizId: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${quizId}`);
  } catch {
    // localStorage unavailable
  }
}

export function resetAllQuizzes(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable
  }
}
