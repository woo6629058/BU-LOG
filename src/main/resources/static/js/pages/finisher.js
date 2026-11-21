import { getMe } from '../api/auth-api.js';
import { ROOMS, acquiredSet, loadCollection, summarizeAll, summarizeRoom } from '../common/collection-data.js';
import { avatar, formatDuration, loadFinisher, loadHallOfFame } from '../common/hall-of-fame-data.js';
import { renderScene } from '../common/scene.js';

const HALL_OF_FAME_URL = '/pages/hall-of-fame.html';
const FINISHER_URL = '/pages/finisher.html';
const TROPHY_SRC = '/images/home/icon-ranking.webp';

// 주소의 ?no= 가 완주 번호다. 서버에서 그 완주자를 받아 온다.
// 없는 번호면 '찾을 수 없어요', 잠깐 못 받아 온 것이면 '다시 불러오기'를 보여 준다.
// ?me 로 열면 완주 전인 내 프로필 미리보기를 보여 준다 (?no 보다 우선).
const params = new URLSearchParams(window.location.search);
const previewMode = params.has('me');
let loadError = false;
const finisher = previewMode ? null : await loadFinisher(Number(params.get('no'))).catch(() => {
  loadError = true;
  return null;
});
const root = document.querySelector('#finisher');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function trophy() {
  const image = element('img');
  image.src = TROPHY_SRC;
  image.alt = '';
  return image;
}

// 명예의 전당에서 밀려 들어오는 다음 화면이라 왼쪽 위에 뒤로가기를 둔다 (유물 상세와 같은 모양).
// 온 곳으로 돌아가고, 바로 열어서 돌아갈 곳이 없으면 명예의 전당으로 간다.
function backButton() {
  const button = element('button', 'finisher__back art-round-button');
  button.type = 'button';
  button.setAttribute('aria-label', '뒤로 가기');
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg>';
  button.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = HALL_OF_FAME_URL;
  });
  return button;
}

function renderNotFound() {
  const box = element('section', 'finisher__notice');
  if (loadError) {
    const retry = element('button', 'art-button', '다시 불러오기');
    retry.type = 'button';
    retry.addEventListener('click', () => window.location.reload());
    box.append(
      element('h1', 'finisher__name', '프로필을 불러오지 못했어요'),
      element('p', 'finisher__notice-text', '잠시 뒤 다시 시도해 주세요'),
      retry,
    );
    root.replaceChildren(backButton(), box);
    return;
  }
  const link = element('a', 'art-button', '명예의 전당으로');
  link.href = HALL_OF_FAME_URL;
  box.append(
    element('h1', 'finisher__name', '탐험가를 찾을 수 없어요'),
    element('p', 'finisher__notice-text', '명예의 전당에서 다시 골라 주세요'),
    link,
  );
  root.replaceChildren(backButton(), box);
}

function stat(label, value) {
  const item = element('div', 'finisher__stat');
  item.append(element('dt', 'finisher__stat-label', label), element('dd', 'finisher__stat-value', value));
  return item;
}

// 완주자는 여섯 전시실 그림을 모두 완성했으므로 완성 그림 여섯 장을 그대로 보여 준다.
function picture(room) {
  const image = element('img', 'finisher__picture-image');
  image.src = room.scene.colorSrc;
  image.alt = `${room.name} 완성 그림`;
  image.width = room.scene.width;
  image.height = room.scene.height;
  image.loading = 'lazy';
  image.decoding = 'async';
  const figure = element('figure', 'finisher__picture');
  figure.append(image, element('figcaption', 'finisher__picture-name', room.name));
  const li = element('li');
  li.append(figure);
  return li;
}

function renderProfile() {
  document.title = `${finisher.name} | BU:LOG`;
  const total = ROOMS.reduce((sum, room) => sum + room.regions.length, 0);

  const header = element('header', 'finisher__header');
  const photo = avatar(finisher.name);
  photo.classList.add('finisher__photo');

  const number = element('p', 'finisher__number art-badge');
  number.append(trophy(), `No.${finisher.no} 완주자`);
  const badges = element('div', 'finisher__badges');
  badges.append(number, element('p', 'finisher__date', finisher.finishedAt));

  header.append(element('p', 'finisher__eyebrow', '탐험가 프로필'), photo, element('h1', 'finisher__name', finisher.name), badges);
  if (finisher.message) header.append(element('p', 'finisher__message', `“${finisher.message}”`));

  const stats = element('dl', 'finisher__stats');
  stats.append(stat('채운 유물', `${total} / ${total}`), stat('탐험 시간', finisher.duration));

  const gallery = element('section', 'finisher__gallery');
  gallery.setAttribute('aria-labelledby', 'finisher-gallery-title');
  const title = element('h2', 'finisher__gallery-title', `완성한 그림 ${ROOMS.length}장`);
  title.id = 'finisher-gallery-title';
  const pictures = element('ul', 'finisher__pictures');
  pictures.append(...ROOMS.map(picture));
  gallery.append(title, pictures);

  root.replaceChildren(backButton(), header, stats, gallery);
}

/* 내 프로필 미리보기 (?me): 완주하면 받게 될 프로필을 같은 틀로, 아직 채우지 않은 칸은 빈 채로 보여 준다. */

// 내 수집 기록·이름·다음 완주 번호. 수집 기록을 못 받으면 null.
// 처음 온 방문자는 첫 요청에서 방문자 쿠키를 받으므로 수집 기록을 먼저 받은 뒤 나머지를 함께 부른다.
async function loadPreview() {
  const { rooms, records, failed } = await loadCollection();
  if (failed) return null;
  const [member, hall] = await Promise.all([
    getMe().catch(() => null),
    loadHallOfFame().catch(() => null),
  ]);
  const times = records.map((record) => new Date(record.acquiredAt)).filter((date) => !Number.isNaN(date.getTime()));
  return {
    name: hall?.myName ?? member?.nickname ?? '게스트',
    myNo: hall?.myNo ?? null,
    nextNo: hall ? hall.total + 1 : null,
    rooms,
    acquired: acquiredSet(records),
    firstAcquiredAt: times.length > 0 ? new Date(Math.min(...times)) : null,
  };
}

// 채운 구역만 색칠된 전시실 그림과 이름·채운 수
function previewPicture(room, acquired) {
  const { filled, total } = summarizeRoom(room, acquired);
  const scene = renderScene(room, acquired);
  scene.classList.add('finisher__scene');
  const figure = element('figure', 'finisher__picture');
  figure.append(scene, element('figcaption', 'finisher__picture-name', `${room.name} ${filled}/${total}`));
  const li = element('li');
  li.append(figure);
  return li;
}

function renderPreview({ name, nextNo, rooms, acquired, firstAcquiredAt }) {
  document.title = '내 프로필 미리보기 | BU:LOG';
  const { filled, total } = summarizeAll(rooms, acquired);
  const remaining = total - filled;

  const header = element('header', 'finisher__header');
  const photo = avatar(name);
  photo.classList.add('finisher__photo');

  // 다 채웠는데 아직 완주 번호가 없으면(기록 중) 번호를 약속하지 않는다.
  const badges = element('div', 'finisher__badges');
  if (nextNo && remaining > 0) {
    const number = element('p', 'finisher__number art-badge');
    number.append(trophy(), `완주하면 No.${nextNo}`);
    badges.append(number);
  }
  badges.append(element('p', 'finisher__date', remaining > 0 ? `완주까지 ${remaining}개 남았어요` : '모든 그림을 완성했어요'));

  header.append(element('p', 'finisher__eyebrow', '내 프로필 미리보기'), photo, element('h1', 'finisher__name', name), badges);

  const stats = element('dl', 'finisher__stats');
  const elapsed = firstAcquiredAt ? formatDuration((Date.now() - firstAcquiredAt.getTime()) / 1000) : '아직 시작 전';
  stats.append(stat('채운 유물', `${filled} / ${total}`), stat('탐험 시간', elapsed));

  const gallery = element('section', 'finisher__gallery');
  gallery.setAttribute('aria-labelledby', 'finisher-gallery-title');
  const title = element('h2', 'finisher__gallery-title', `채워 가는 그림 ${rooms.length}장`);
  title.id = 'finisher-gallery-title';
  const pictures = element('ul', 'finisher__pictures');
  pictures.append(...rooms.map((room) => previewPicture(room, acquired)));
  gallery.append(title, pictures);

  root.replaceChildren(backButton(), header, stats, gallery);
}

if (previewMode) {
  const preview = await loadPreview();
  // 이미 완주했으면 진짜 프로필로 바꾼다 (뒤로 가기에 미리보기가 남지 않게 replace).
  if (preview?.myNo) window.location.replace(`${FINISHER_URL}?no=${preview.myNo}`);
  else if (preview) renderPreview(preview);
  else {
    loadError = true;
    renderNotFound();
  }
} else if (finisher) renderProfile();
else renderNotFound();
