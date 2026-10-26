import { apiRequest } from './api-client.js';

export const submitQuizAnswer = (quizId, selectedOptionId) => apiRequest(`/quizzes/${encodeURIComponent(quizId)}/attempts`, {
  method: 'POST',
  body: JSON.stringify({ selectedOptionId }),
});
