import { mountTabBar } from '../common/tab-bar.js';
import {
  ROOMS,
  SAMPLE_RECORDS,
  acquiredSet,
  describeNextGoal,
  progressPercent,
  summarizeAll,
  summarizeRoom,
} from '../common/collection-data.js';

const showNotice = mountTabBar({ active: 'home' });
document.querySelector('#home-login').addEventListener('click', showNotice);

// 전시실 목록의 대표 그림. 홈 화면에서만 쓴다.
const ROOM_THUMBS = {
  ongi1: '/images/home/thumb-ongi1.webp',
  ongi2: '/images/home/thumb-ongi2.webp',
  local: '/images/home/thumb-local.webp',
  europe: '/images/home/thumb-europe.webp',
  education: '/images/home/thumb-education.webp',
  stone: '/images/home/thumb-stone.webp',
};

const acquired = acquiredSet(SAMPLE_RECORDS);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderProgress() {
  const { filled, total } = summarizeAll(ROOMS, acquired);
  document.querySelector('#home-filled').textContent = filled;
  document.querySelector('#home-total').textContent = total;
  document.querySelector('#home-count-label').textContent = `${total}칸 중 ${filled}칸 채움`;
  document.querySelector('#home-progress-fill').style.width = `${progressPercent(filled, total)}%`;
  document.querySelector('#home-hint').textContent = describeNextGoal(ROOMS, acquired);
}

function renderRoom({ room, filled, total, complete }, index) {
  const state = complete ? 'complete' : filled > 0 ? 'active' : 'idle';
  const item = element('li');
  const link = element('a', `home-room home-room--${state}`);
  link.href = `/pages/picture-book.html?room=${encodeURIComponent(room.id)}`;

  const number = element('span', 'home-room__number', complete ? '' : String(index + 1));
  number.setAttribute('aria-hidden', 'true');

  const thumb = element('img', `home-room__thumb home-room__thumb--${room.id}`);
  thumb.src = ROOM_THUMBS[room.id];
  thumb.alt = '';
  thumb.width = 56;
  thumb.height = 56;

  const text = element('span', 'home-room__text');
  text.append(element('span', 'home-room__name', room.name), element('span', 'home-room__desc', room.description));

  const status = element('span', 'home-room__status');
  const count = element('span', 'home-room__count', complete ? '완료' : `${filled} / ${total}`);
  count.setAttribute('aria-hidden', 'true');
  const bar = element('span', 'home-room__bar');
  bar.setAttribute('aria-hidden', 'true');
  const fill = element('span');
  fill.style.width = `${progressPercent(filled, total)}%`;
  bar.append(fill);
  status.append(count, bar);

  const label = complete ? '그림 완성' : `${total}칸 중 ${filled}칸 채움`;
  link.append(number, thumb, text, status, element('span', 'visually-hidden', `, ${label}`));
  item.append(link);
  return item;
}

function renderRooms() {
  const list = document.querySelector('#home-room-list');
  list.replaceChildren(...ROOMS.map((room, index) => renderRoom(summarizeRoom(room, acquired), index)));
}

renderProgress();
renderRooms();
