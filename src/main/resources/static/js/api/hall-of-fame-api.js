import { apiRequest } from './api-client.js';

export const getHallOfFame = () => apiRequest('/hall-of-fame');
export const getFinisher = (no) => apiRequest(`/hall-of-fame/finishers/${encodeURIComponent(no)}`);
