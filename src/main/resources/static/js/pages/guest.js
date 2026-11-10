// 09-4 게스트 환영 ('게스트로 로그인'를 고른 뒤)
import { getMe } from '../api/auth-api.js';
import { clearNextPath, nextPath, rememberGuestChoice } from '../common/auth-flow.js';
import { ROOMS } from '../common/collection-data.js';

// 이 브라우저는 게스트로 로그인했다는 것을 기억해, 홈을 열 때 로그인 화면으로 다시 보내지 않는다.
rememberGuestChoice();

if (ROOMS[0]) document.querySelector('#done-room').textContent = `${ROOMS[0].name}부터 둘러봐요`;

const start = document.querySelector('#done-start');
start.href = nextPath();
start.addEventListener('click', clearNextPath);

// 이미 로그인한 회원이 들어오면 게스트 안내 없이 바로 보내 준다.
getMe().then((member) => {
  if (member) {
    clearNextPath();
    window.location.replace(start.href);
  }
}).catch(() => {});
