import { ROOMS } from '../common/collection-data.js';
import { avatar, loadFinisher } from '../common/hall-of-fame-data.js';

const HALL_OF_FAME_URL = '/pages/hall-of-fame.html';
const TROPHY_SRC = '/images/home/icon-ranking.webp';

// 주소의 ?no= 가 완주 번호다. 서버에서 그 완주자를 받아 온다 (못 받으면 '찾을 수 없어요').
const finisher = await loadFinisher(Number(new URLSearchParams(window.location.search).get('no'))).catch(() => null);
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

if (finisher) renderProfile();
else renderNotFound();
