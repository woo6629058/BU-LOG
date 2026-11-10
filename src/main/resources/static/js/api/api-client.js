const API_BASE_URL = '/api';

// 상태를 바꾸는 요청에는 CSRF 토큰이 필요하다 (docs/api-contract.md의 CSRF 토큰 항목).
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_DENIED_CODE = 'COMMON_403_001';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  // 서버가 내려준 오류 코드 (예: MEMBER_409_001)
  get code() {
    return this.details?.code;
  }
}

let csrfTokenPromise = null;

// 토큰은 한 번 받아 두고 재사용하다가, 서버가 거부하면 새로 받는다.
function getCsrfToken({ refresh = false } = {}) {
  if (refresh || !csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.result?.token) {
          throw new ApiError('보안 토큰을 받지 못했습니다.', response.status, body);
        }
        return body.result;
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

async function send(path, options, csrf) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (csrf) headers[csrf.headerName] = csrf.token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers,
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  return { response, body };
}

export async function apiRequest(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const needsCsrf = UNSAFE_METHODS.has(method);

  let { response, body } = await send(path, options, needsCsrf ? await getCsrfToken() : null);
  // 세션이 바뀌어 토큰이 만료된 경우 한 번만 새 토큰으로 다시 보낸다.
  if (needsCsrf && response.status === 403 && body?.code === CSRF_DENIED_CODE) {
    ({ response, body } = await send(path, options, await getCsrfToken({ refresh: true })));
  }

  if (!response.ok) throw new ApiError(body?.message ?? '요청을 처리하지 못했습니다.', response.status, body);
  return body;
}
