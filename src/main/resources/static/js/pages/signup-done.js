// 09-3 가입 완료
import { getMe } from '../api/auth-api.js';
import { clearNextPath, loadSignedUpNickname, nextPath } from '../common/auth-flow.js';
import { ROOMS } from '../common/collection-data.js';

const nicknameWrap = document.querySelector('#done-nickname-wrap');
const nicknameText = document.querySelector('#done-nickname');
const start = document.querySelector('#done-start');

function showNickname(nickname) {
  if (!nickname) return;
  nicknameText.textContent = nickname;
  nicknameWrap.hidden = false;
}

// 첫 전시실을 추천 출발 장소로 보여 준다.
if (ROOMS[0]) document.querySelector('#done-room').textContent = `${ROOMS[0].name}부터 둘러봐요`;

// 로그인 전에 보던 화면이 있으면 그곳으로, 없으면 홈으로 간다.
start.href = nextPath();
start.addEventListener('click', clearNextPath);

showNickname(loadSignedUpNickname());

// 새로고침해도 서버의 회원 정보로 다시 확인한다. 로그인 상태가 아니면 로그인 화면으로 보낸다.
getMe().then((member) => {
  if (!member) {
    window.location.replace('/pages/login.html');
    return;
  }
  showNickname(member.nickname);
}).catch(() => {});
