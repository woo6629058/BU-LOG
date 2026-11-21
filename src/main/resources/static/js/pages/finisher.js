import { getMe } from '../api/auth-api.js';
import { ROOMS, acquiredSet, loadCollection, summarizeAll, summarizeRoom } from '../common/collection-data.js';
import { avatar, explorerName, formatDuration, loadFinisher, loadHallOfFame } from '../common/hall-of-fame-data.js';
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

// 트로피를 붙인 번호 배지 (No.3 완주자 / 완주하면 No.4)
function numberBadge(text) {
  const number = element('p', 'finisher__number art-badge');
  number.append(trophy(), text);
  return number;
}

// 완주자 프로필과 내 프로필 미리보기가 함께 쓰는 틀: 머리말(프로필 그림·이름·배지) → 숫자 두 칸 → 그림 목록.
// 미리보기가 진짜 프로필과 같은 모양으로 남도록 화면 구성은 여기 한 곳에만 둔다.
function renderLayout({ title, eyebrow, name, badges, message = null, stats, galleryTitle, pictures }) {
  document.title = title;

  const header = element('header', 'finisher__header');
  const photo = avatar(name);
  photo.classList.add('finisher__photo');
  const badgeRow = element('div', 'finisher__badges');
  badgeRow.append(...badges);
  header.append(element('p', 'finisher__eyebrow', eyebrow), photo, element('h1', 'finisher__name', name), badgeRow);
  if (message) header.append(element('p', 'finisher__message', `“${message}”`));

  const statList = element('dl', 'finisher__stats');
  statList.append(...stats.map(([label, value]) => stat(label, value)));

  const gallery = element('section', 'finisher__gallery');
  gallery.setAttribute('aria-labelledby', 'finisher-gallery-title');
  const heading = element('h2', 'finisher__gallery-title', galleryTitle);
  heading.id = 'finisher-gallery-title';
  const list = element('ul', 'finisher__pictures');
  list.append(...pictures);
  gallery.append(heading, list);

  root.replaceChildren(backButton(), header, statList, gallery);
}

function renderProfile() {
  const total = ROOMS.reduce((sum, room) => sum + room.regions.length, 0);
  renderLayout({
    title: `${finisher.name} | BU:LOG`,
    eyebrow: '탐험가 프로필',
    name: finisher.name,
    badges: [numberBadge(`No.${finisher.no} 완주자`), element('p', 'finisher__date', finisher.finishedAt)],
    message: finisher.message,
    stats: [['채운 유물', `${total} / ${total}`], ['탐험 시간', finisher.duration]],
    galleryTitle: `완성한 그림 ${ROOMS.length}장`,
    pictures: ROOMS.map(picture),
  });
}

/* 내 프로필 미리보기 (?me): 완주하면 받게 될 프로필을 같은 틀로, 아직 채우지 않은 칸은 빈 채로 보여 준다. */

// 로그인 확인이 늦어도 화면이 멈추지 않게 8초 뒤에는 게스트로 본다 (명예의 전당 요청과 같은 제한).
const ME_TIMEOUT_MS = 8000;
const withTimeout = (promise, ms) => Promise.race([promise, new Promise((resolve) => { setTimeout(() => resolve(null), ms); })]);

// 내 수집 기록·이름·다음 완주 번호. 수집 기록을 못 받으면 null, 이미 완주했으면 { myNo } 만.
// 처음 온 방문자는 첫 요청에서 방문자 쿠키를 받으므로 수집 기록을 먼저 받은 뒤 나머지를 부른다.
async function loadPreview() {
  const { rooms, records, failed } = await loadCollection();
  if (failed) return null;
  const hall = await loadHallOfFame().catch(() => null);
  if (hall?.myNo) return { myNo: hall.myNo };
  // 회원 닉네임은 명예의 전당이 이름을 못 줄 때만 쓰므로 그때만 물어본다.
  const member = hall?.myName ? null : await withTimeout(getMe().catch(() => null), ME_TIMEOUT_MS);
  const times = records.map((record) => new Date(record.acquiredAt).getTime()).filter((time) => !Number.isNaN(time));
  return {
    name: explorerName(hall, member),
    myNo: null,
    nextNo: hall ? hall.total + 1 : null,
    rooms,
    acquired: acquiredSet(records),
    firstAcquiredAt: times.length > 0 ? Math.min(...times) : null,
    lastAcquiredAt: times.length > 0 ? Math.max(...times) : null,
  };
}

// 채운 구역만 색칠된 전시실 그림과 이름·채운 수.
// 화면 낭독기가 그림 설명과 아래 이름을 두 번 읽지 않게, 설명은 그림에 한 번만 붙이고 이름 줄은 읽지 않게 한다.
function previewPicture(room, acquired) {
  const { filled, total } = summarizeRoom(room, acquired);
  const scene = renderScene(room, acquired, { label: `${room.name} 그림, ${total}칸 중 ${filled}칸 채움` });
  scene.classList.add('finisher__scene');
  const caption = element('figcaption', 'finisher__picture-name', `${room.name} ${filled}/${total}`);
  caption.setAttribute('aria-hidden', 'true');
  const figure = element('figure', 'finisher__picture');
  figure.append(scene, caption);
  const li = element('li');
  li.append(figure);
  return li;
}

function renderPreview({ name, nextNo, rooms, acquired, firstAcquiredAt, lastAcquiredAt }) {
  const { filled, total } = summarizeAll(rooms, acquired);
  const remaining = total - filled;

  // 다 채웠는데 아직 완주 번호가 없으면(기록 중) 번호를 약속하지 않는다.
  const badges = [];
  if (nextNo && remaining > 0) badges.push(numberBadge(`완주하면 No.${nextNo}`));
  badges.push(element('p', 'finisher__date', remaining > 0 ? `완주까지 ${remaining}개 남았어요` : '모든 그림을 완성했어요'));

  // 탐험 시간은 진짜 프로필처럼 첫 카드부터 잰다. 다 채웠으면 마지막 카드에서 멈춘다 (완주 기록과 같은 값).
  const end = remaining > 0 ? Date.now() : lastAcquiredAt;
  const elapsed = firstAcquiredAt === null ? '아직 시작 전' : formatDuration((end - firstAcquiredAt) / 1000);

  renderLayout({
    title: '내 프로필 미리보기 | BU:LOG',
    eyebrow: '내 프로필 미리보기',
    name,
    badges,
    stats: [['채운 유물', `${filled} / ${total}`], ['탐험 시간', elapsed]],
    galleryTitle: `채워 가는 그림 ${rooms.length}장`,
    pictures: rooms.map((room) => previewPicture(room, acquired)),
  });
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
