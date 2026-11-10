// 09-1 약관 동의 (회원가입 1/2)
import { loadAgreements, rememberNextFromUrl, saveAgreements } from '../common/auth-flow.js';

rememberNextFromUrl();

const form = document.querySelector('#terms-form');
const allBox = document.querySelector('#terms-all');
const termBoxes = [...form.querySelectorAll('input[data-term]')];
const requiredBoxes = termBoxes.filter((box) => box.required);
const next = document.querySelector('#terms-next');

function sync() {
  const checkedCount = termBoxes.filter((box) => box.checked).length;
  allBox.checked = checkedCount === termBoxes.length;
  allBox.indeterminate = checkedCount > 0 && checkedCount < termBoxes.length;
  next.disabled = !requiredBoxes.every((box) => box.checked);
}

// 회원가입 화면에서 뒤로 돌아왔을 때 이전 선택을 그대로 보여 준다.
const saved = loadAgreements();
if (saved) termBoxes.forEach((box) => { box.checked = saved[box.name] === true; });
sync();

allBox.addEventListener('change', () => {
  termBoxes.forEach((box) => { box.checked = allBox.checked; });
  sync();
});
termBoxes.forEach((box) => box.addEventListener('change', sync));

// 오른쪽 화살표: 약관 내용을 펼치고 접는다.
form.querySelectorAll('.auth-term__toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const body = document.getElementById(toggle.getAttribute('aria-controls'));
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (next.disabled) return;
  saveAgreements(Object.fromEntries(termBoxes.map((box) => [box.name, box.checked])));
  window.location.href = '/pages/signup.html';
});
