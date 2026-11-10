/*
 * 로그인·회원가입 화면(09-0 ~ 09-3)이 함께 쓰는 도우미.
 * 약관 동의 → 회원가입 → 가입 완료 사이에서 넘겨야 하는 값은 sessionStorage에 잠깐 담는다.
 * (탭을 닫으면 사라지고, 서버 저장은 가입 요청 한 번으로만 한다.)
 */
const AGREEMENT_KEY = 'bulog.signup.agreements';
const NICKNAME_KEY = 'bulog.signup.nickname';
const NEXT_KEY = 'bulog.auth.next';
// '게스트로 로그인'를 고른 브라우저인지 (홈에서 로그인 화면으로 다시 보내지 않기 위해)
const GUEST_KEY = 'bulog.guest';

function readSession(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 기본 흐름으로 동작한다.
  }
}

// 같은 사이트 안의 경로만 허용한다 (//다른사이트, https://... 로 빠져나가지 않게).
export function safeNextPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}

// 로그인 뒤 돌아갈 곳: 주소의 ?next= 값을 기억해 두고, 회원가입을 거쳐도 이어지게 한다.
export function rememberNextFromUrl() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next) writeSession(NEXT_KEY, safeNextPath(next));
}

export function nextPath() {
  return safeNextPath(readSession(NEXT_KEY) ?? '/');
}

export function clearNextPath() {
  writeSession(NEXT_KEY, null);
}

export function rememberGuestChoice() {
  try {
    window.localStorage.setItem(GUEST_KEY, '1');
  } catch {
    // 저장할 수 없으면 홈을 열 때마다 로그인 화면을 거친다.
  }
}

export function clearGuestChoice() {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    // 무시
  }
}

export function hasChosenGuest() {
  try {
    return window.localStorage.getItem(GUEST_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveAgreements(agreements) {
  writeSession(AGREEMENT_KEY, JSON.stringify(agreements));
}

export function loadAgreements() {
  try {
    const value = JSON.parse(readSession(AGREEMENT_KEY));
    if (value?.termsAgreed === true && value?.privacyAgreed === true) {
      return { termsAgreed: true, privacyAgreed: true, marketingAgreed: value.marketingAgreed === true };
    }
  } catch {
    // 잘못된 값이면 약관 동의부터 다시 받는다.
  }
  return null;
}

export function clearAgreements() {
  writeSession(AGREEMENT_KEY, null);
}

export function saveSignedUpNickname(nickname) {
  writeSession(NICKNAME_KEY, nickname);
}

export function loadSignedUpNickname() {
  return readSession(NICKNAME_KEY);
}

// 입력칸 아래 안내 문구. type: 'error' | 'success' | null
export function setFieldMessage(input, message, type = 'error') {
  const help = document.getElementById(input.getAttribute('aria-describedby')?.split(' ')[0] ?? '');
  const field = input.closest('.auth-field');
  if (help) {
    help.textContent = message ?? '';
    help.dataset.state = message ? type : '';
  }
  if (field) field.dataset.state = message ? type : '';
  input.setAttribute('aria-invalid', message && type === 'error' ? 'true' : 'false');
}

// 서버 검증 실패(COMMON_400_002)의 errorDetail은 { 필드이름: 메시지 } 형태다.
export function fieldErrorsFrom(error) {
  const detail = error?.details?.errorDetail;
  return detail && typeof detail === 'object' ? detail : {};
}
