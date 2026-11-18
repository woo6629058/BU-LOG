import { apiRequest } from './api-client.js';

export const getHallOfFame = (options = {}) => apiRequest('/hall-of-fame', options);
export const getFinisher = (no) => apiRequest(`/hall-of-fame/finishers/${encodeURIComponent(no)}`);
