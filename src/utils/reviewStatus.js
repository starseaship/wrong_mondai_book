export function statusToReviewResult(status) {
  if (status === 'mastered') return 'correct';
  if (status === 'uncertain') return 'uncertain';
  return 'wrong';
}

export function answerToReviewUpdate(isCorrect) {
  return {
    result: isCorrect ? 'correct' : 'wrong',
    status: isCorrect ? 'mastered' : 'unmastered'
  };
}
