import { apiRequest } from './api-client.js';

export const getArchive = () => apiRequest('/archive');
export const getCard = (cardId) => apiRequest(`/cards/${encodeURIComponent(cardId)}`);
