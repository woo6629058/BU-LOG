// 09-0 로그인
import { ApiError } from '../api/api-client.js';
import { getMe, login } from '../api/auth-api.js';
import {
  clearGuestChoice,
  clearNextPath,
  fieldErrorsFrom,
  nextPath,
  rememberNextFromUrl,
  setFieldMessage,
} from '../common/auth-flow.js';

rememberNextFromUrl();

const form = document.querySelector('#login-form');
const email = document.querySelector('#login-email');
const password = document.querySelector('#login-password');
const submit = document.querySelector('#login-submit');
const alertBox = document.querySelector('#login-alert');

// '게스트로 로그인'는 게스트 환영 화면을 거쳐 원래 보던 화면(nextPath)으로 간다.

function goNext() {
  const next = nextPath();
  clearNextPath();
  clearGuestChoice();
  window.location.replace(next);
}

// 이미 로그인한 상태라면 이 화면을 건너뛴다.
getMe().then((member) => {
  if (member) goNext();
}).catch(() => {});

function validate() {
  let firstInvalid = null;
  if (!email.value.trim()) {
    setFieldMessage(email, '이메일을 입력해 주세요.');
    firstInvalid ??= email;
  } else if (!email.checkValidity()) {
    setFieldMessage(email, '이메일 형식을 확인해 주세요.');
    firstInvalid ??= email;
  } else {
    setFieldMessage(email, null);
  }
  if (!password.value) {
    setFieldMessage(password, '비밀번호를 입력해 주세요.');
    firstInvalid ??= password;
  } else {
    setFieldMessage(password, null);
  }
  firstInvalid?.focus();
  return !firstInvalid;
}

[email, password].forEach((input) => input.addEventListener('input', () => {
  setFieldMessage(input, null);
  alertBox.textContent = '';
}));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertBox.textContent = '';
  if (!validate()) return;

  submit.disabled = true;
  submit.textContent = '로그인하는 중…';
  try {
    await login({ email: email.value.trim(), password: password.value });
    goNext();
  } catch (error) {
    const fieldErrors = fieldErrorsFrom(error);
    if (fieldErrors.email) setFieldMessage(email, fieldErrors.email);
    if (fieldErrors.password) setFieldMessage(password, fieldErrors.password);
    if (!fieldErrors.email && !fieldErrors.password) {
      alertBox.textContent = error instanceof ApiError && error.status === 401
        ? '이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.'
        : '지금은 로그인할 수 없어요. 잠시 후 다시 시도해 주세요.';
    }
    password.value = '';
    submit.disabled = false;
    submit.textContent = '로그인';
  }
});
