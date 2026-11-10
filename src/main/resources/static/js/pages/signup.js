// 09-2 회원가입 (회원가입 2/2)
import { checkNickname, signup } from '../api/auth-api.js';
import {
  clearAgreements,
  clearGuestChoice,
  fieldErrorsFrom,
  loadAgreements,
  saveSignedUpNickname,
  setFieldMessage,
} from '../common/auth-flow.js';

// 백엔드 Member.NICKNAME_REGEX와 같은 규칙
const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9]{2,10}$/;
const NICKNAME_RULE = '한글·영문·숫자 2~10자로 지어 주세요. (띄어쓰기·특수문자 제외)';
const PASSWORD_MIN = 8;

// 약관 동의를 거치지 않고 들어오면 약관 화면부터 보여 준다.
const agreements = loadAgreements();
if (!agreements) window.location.replace('/pages/terms.html');

const form = document.querySelector('#signup-form');
const nickname = document.querySelector('#signup-nickname');
const nicknameButton = document.querySelector('#nickname-check');
const email = document.querySelector('#signup-email');
const password = document.querySelector('#signup-password');
const passwordConfirm = document.querySelector('#signup-password-confirm');
const submit = document.querySelector('#signup-submit');
const alertBox = document.querySelector('#signup-alert');

// 중복확인을 통과한 닉네임 (입력이 바뀌면 다시 확인해야 한다)
let confirmedNickname = null;

function nicknameValue() {
  return nickname.value.trim();
}

function validateNicknameFormat() {
  const value = nicknameValue();
  if (!value) {
    setFieldMessage(nickname, '닉네임을 입력해 주세요.');
    return false;
  }
  if (!NICKNAME_PATTERN.test(value)) {
    setFieldMessage(nickname, NICKNAME_RULE);
    return false;
  }
  return true;
}

async function confirmNickname() {
  if (!validateNicknameFormat()) return false;
  const value = nicknameValue();
  if (confirmedNickname === value) return true;

  nicknameButton.disabled = true;
  nicknameButton.textContent = '확인 중';
  try {
    const { result } = await checkNickname(value);
    if (nicknameValue() !== value) return false; // 확인하는 동안 입력이 바뀐 경우
    if (result.available) {
      confirmedNickname = value;
      setFieldMessage(nickname, '멋진 닉네임이에요! 순위표에 이 이름으로 보여요', 'success');
      return true;
    }
    setFieldMessage(nickname, '이미 다른 탐험가가 쓰고 있어요. 다른 이름을 지어 주세요.');
    return false;
  } catch (error) {
    setFieldMessage(nickname, error.code === 'MEMBER_400_001' ? NICKNAME_RULE : '지금은 확인할 수 없어요. 잠시 후 다시 눌러 주세요.');
    return false;
  } finally {
    nicknameButton.disabled = false;
    nicknameButton.textContent = '중복확인';
  }
}

function validateEmail() {
  if (!email.value.trim()) {
    setFieldMessage(email, '이메일을 입력해 주세요.');
    return false;
  }
  if (!email.checkValidity()) {
    setFieldMessage(email, '이메일 형식을 확인해 주세요. 예) bulog@example.com');
    return false;
  }
  setFieldMessage(email, null);
  return true;
}

function validatePassword() {
  if (password.value.length < PASSWORD_MIN) {
    setFieldMessage(password, `비밀번호는 ${PASSWORD_MIN}자 이상으로 만들어 주세요.`);
    return false;
  }
  setFieldMessage(password, null);
  return true;
}

function validatePasswordConfirm() {
  if (!passwordConfirm.value) {
    setFieldMessage(passwordConfirm, '비밀번호를 한 번 더 입력해 주세요.');
    return false;
  }
  if (passwordConfirm.value !== password.value) {
    setFieldMessage(passwordConfirm, '비밀번호가 서로 달라요.');
    return false;
  }
  setFieldMessage(passwordConfirm, '비밀번호가 같아요', 'success');
  return true;
}

nickname.addEventListener('input', () => {
  confirmedNickname = null;
  setFieldMessage(nickname, null);
});
nickname.addEventListener('keydown', (event) => {
  // 닉네임 칸에서 Enter를 누르면 가입 대신 중복확인을 한다.
  if (event.key === 'Enter') {
    event.preventDefault();
    confirmNickname();
  }
});
nicknameButton.addEventListener('click', confirmNickname);

email.addEventListener('input', () => setFieldMessage(email, null));
email.addEventListener('blur', () => { if (email.value) validateEmail(); });

password.addEventListener('input', () => {
  setFieldMessage(password, null);
  if (passwordConfirm.value) validatePasswordConfirm();
});
password.addEventListener('blur', () => { if (password.value) validatePassword(); });
passwordConfirm.addEventListener('input', () => {
  // 끝까지 입력한 뒤에만 같은지 알려 준다 (입력 중에는 오류를 띄우지 않는다).
  if (passwordConfirm.value && passwordConfirm.value.length >= password.value.length) validatePasswordConfirm();
  else setFieldMessage(passwordConfirm, null);
});

function showServerError(error) {
  const fieldErrors = fieldErrorsFrom(error);
  const inputs = { nickname, email, password };
  let shown = false;
  Object.entries(inputs).forEach(([name, input]) => {
    if (fieldErrors[name]) {
      setFieldMessage(input, fieldErrors[name]);
      shown = true;
    }
  });

  switch (error.code) {
    case 'MEMBER_409_001':
      setFieldMessage(email, '이미 가입된 이메일이에요. 로그인해 주세요.');
      email.focus();
      return;
    case 'MEMBER_409_002':
      confirmedNickname = null;
      setFieldMessage(nickname, '그사이 다른 탐험가가 이 이름을 가져갔어요. 다른 이름을 지어 주세요.');
      nickname.focus();
      return;
    case 'MEMBER_400_002':
      clearAgreements();
      window.location.replace('/pages/terms.html');
      return;
    default:
      if (fieldErrors.termsAgreed || fieldErrors.privacyAgreed) {
        clearAgreements();
        window.location.replace('/pages/terms.html');
        return;
      }
      if (!shown) {
        alertBox.textContent = error.code === 'MEMBER_409_003'
          ? '이미 사용 중인 이메일 또는 닉네임이에요. 다시 확인해 주세요.'
          : '지금은 가입할 수 없어요. 잠시 후 다시 시도해 주세요.';
      }
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertBox.textContent = '';
  if (!agreements) return;

  submit.disabled = true;
  submit.textContent = '확인하는 중…';
  try {
    // 각 칸을 모두 검사한 뒤, 처음 틀린 칸으로 이동한다.
    const checks = [
      [nickname, await confirmNickname()],
      [email, validateEmail()],
      [password, validatePassword()],
      [passwordConfirm, validatePasswordConfirm()],
    ];
    const firstInvalid = checks.find(([, ok]) => !ok)?.[0];
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submit.textContent = '가입하는 중…';
    const { result } = await signup({
      nickname: nicknameValue(),
      email: email.value.trim(),
      password: password.value,
      ...agreements,
    });
    clearAgreements();
    clearGuestChoice();
    saveSignedUpNickname(result?.nickname ?? nicknameValue());
    window.location.replace('/pages/signup-done.html');
  } catch (error) {
    showServerError(error);
  } finally {
    submit.disabled = false;
    submit.textContent = '가입하기';
  }
});
