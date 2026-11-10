import { ApiError, apiRequest } from './api-client.js';

const json = (body) => JSON.stringify(body);

export const login = ({ email, password }) => apiRequest('/auth/login', {
  method: 'POST',
  body: json({ email, password }),
});

export const signup = ({ email, password, nickname, termsAgreed, privacyAgreed, marketingAgreed }) => apiRequest('/auth/signup', {
  method: 'POST',
  body: json({ email, password, nickname, termsAgreed, privacyAgreed, marketingAgreed }),
});

export const logout = () => apiRequest('/auth/logout', { method: 'POST' });

export const checkNickname = (nickname) => apiRequest(
  `/auth/nickname-availability?nickname=${encodeURIComponent(nickname)}`,
);

// 로그인한 회원 정보. 게스트(로그인 전)이면 null을 돌려준다.
export async function getMe() {
  try {
    const body = await apiRequest('/auth/me');
    return body.result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
