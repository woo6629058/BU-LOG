import { apiRequest } from './api-client.js';

export const getExhibit = (exhibitId) => apiRequest(`/exhibits/${encodeURIComponent(exhibitId)}`);
export const getExhibitQuiz = (exhibitId) => apiRequest(`/exhibits/${encodeURIComponent(exhibitId)}/quiz`);
