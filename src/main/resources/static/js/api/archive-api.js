import { apiRequest } from './api-client.js';

export const getArchive = () => apiRequest('/archive');
export const getCollectionRecord = (recordId) => apiRequest(`/collections/${encodeURIComponent(recordId)}`);
