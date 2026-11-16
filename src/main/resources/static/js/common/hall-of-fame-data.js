// 명예의 전당·완주자 프로필이 함께 쓰는 완주자 명단과 실시간 기록.
// 완주자: 6개 전시실의 그림 24칸을 모두 채운 사람. 채운 순서대로 완주 번호(No.1, No.2 …)를 받는다.
// 순위는 매기지 않고, 가장 최근에 완주한 사람이 맨 위에 온다.
//
// 백엔드 API가 아직 없어서(docs/api-contract.md에 명세 없음) 화면에 보이는 모양 그대로 적은 예시 데이터다.
// API가 정해지면 응답을 이 모양으로 바꿔 주는 함수로 바꾼다.

// 전체 완주자 수와 오늘 완주한 사람 수
export const SUMMARY = { total: 128, today: 7 };

// when: 목록에 보이는 완주 시각 / finishedAt: 프로필에 보이는 완주 일시 / duration: 탐험 시간 / message: 한마디(없을 수 있음)
const finisher = (no, name, when, finishedAt, duration, message = null) => ({ no, name, when, finishedAt, duration, message });

// 최근에 완주한 순서
export const FINISHERS = [
  finisher(128, '게스트 2741', '오늘 16:27', '2026.11.11 16:27', '11분 48초', '소줏고리가 제일 신기했어요!'),
  finisher(127, '게스트 0193', '오늘 16:05', '2026.11.11 16:05', '13분 05초', '수석전시실 돌이 진짜 그림 같았어요'),
  finisher(126, '게스트 5520', '오늘 15:48', '2026.11.11 15:48', '10분 32초'),
  finisher(125, '게스트 8806', '오늘 14:12', '2026.11.11 14:12', '12분 55초', '학교종 소리가 들리는 것 같았어요'),
  finisher(124, '게스트 3317', '오늘 13:30', '2026.11.11 13:30', '16분 40초'),
  finisher(123, '게스트 1029', '오늘 11:02', '2026.11.11 11:02', '14분 12초', '반달돌칼 찾기가 제일 어려웠어요'),
  finisher(122, '게스트 6648', '오늘 10:41', '2026.11.11 10:41', '11분 58초'),
  finisher(121, '게스트 4402', '어제 17:55', '2026.11.10 17:55', '18분 05초', '가족이랑 같이 완주했어요'),
  finisher(120, '게스트 7715', '어제 16:20', '2026.11.10 16:20', '15분 20초'),
];

export const findFinisher = (no) => FINISHERS.find((item) => item.no === no) ?? null;

// 실시간 기록의 종류: fill 그림 채움 / done 전시실 완료 / finish 모든 전시실 완주
const record = (type, text, detail, time) => ({ type, text, detail, time });

// 최근 순서
export const LIVE_RECORDS = [
  record('fill', '게스트 6045님이 「세브르 평화의 화병」으로 그림을 채웠어요', '유럽자기전시실', '방금'),
  record('done', '게스트 1187님이 옹기2전시실을 완료했어요', '4/4 완성', '1분 전'),
  record('fill', '게스트 3920님이 「반달돌칼」로 그림을 채웠어요', '부천향토역사관', '2분 전'),
  record('finish', '게스트 2741님이 모든 전시실을 완주했어요', 'No.128 완주 · 11분 48초', '3분 전'),
  record('fill', '게스트 8806님이 「소줏고리」로 그림을 채웠어요', '옹기2전시실', '5분 전'),
  record('done', '게스트 0193님이 수석전시실을 완료했어요', '4/4 완성', '6분 전'),
  record('fill', '게스트 5520님이 「인화문 토기병」으로 그림을 채웠어요', '부천향토역사관', '8분 전'),
  record('fill', '게스트 3317님이 「학교종」으로 그림을 채웠어요', '교육전시실', '9분 전'),
  record('done', '게스트 1029님이 교육전시실을 완료했어요', '4/4 완성', '11분 전'),
  record('fill', '게스트 6648님이 「화초문항아리」로 그림을 채웠어요', '옹기1전시실', '12분 전'),
];

// 프로필 동그라미(.art-avatar, art-theme.css): 이름 첫 글자와 색 번호(0~4)
const AVATAR_TONES = 5;

export function avatar(name, seed = 0) {
  const node = document.createElement('span');
  node.className = 'art-avatar';
  node.dataset.tone = String(seed % AVATAR_TONES);
  node.setAttribute('aria-hidden', 'true');
  node.textContent = name.trim().charAt(0);
  return node;
}

// 실시간 기록 아이콘 (24×24, 선 색은 글자색을 따른다). finish는 트로피 그림을 쓴다.
const TROPHY_SRC = '/images/home/icon-ranking.webp';
const RECORD_ICONS = {
  fill: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M4 16.5l4.5-4.5 4 4 2.5-2.5 5 5"/><circle cx="15.5" cy="9.5" r="1.4"/>',
  done: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

export function recordIcon(type) {
  if (type === 'finish') {
    const image = document.createElement('img');
    image.src = TROPHY_SRC;
    image.alt = '';
    return image;
  }
  const holder = document.createElement('span');
  holder.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${RECORD_ICONS[type]}</svg>`;
  return holder.firstChild;
}
