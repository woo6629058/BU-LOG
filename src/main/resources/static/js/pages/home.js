import { mountTabBar } from '../common/tab-bar.js';
import {
  SAMPLE_CARDS,
  SAMPLE_ROOMS,
  describeNextGoal,
  progressPercent,
  summarize,
  summarizeRooms,
} from '../common/collection-data.js';

mountTabBar({ active: 'home' });

const rooms = SAMPLE_ROOMS;
const cards = SAMPLE_CARDS;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderProgress() {
  const { acquired, total } = summarize(cards);
  document.querySelector('#home-acquired').textContent = acquired;
  document.querySelector('#home-total').textContent = total;
  document.querySelector('#home-count-label').textContent = `${total}장 중 ${acquired}장 수집`;
  document.querySelector('#home-progress-fill').style.width = `${progressPercent(acquired, total)}%`;
  document.querySelector('#home-hint').textContent = describeNextGoal(rooms, cards);
}

function renderRoom({ room, acquired, total, complete }) {
  const item = element('li', `home-room${complete ? ' home-room--complete' : ''}`);

  const text = element('div', 'home-room__text');
  text.append(element('h3', 'home-room__name', room.name));
  if (room.description) text.append(element('p', 'home-room__desc', room.description));

  const status = element('div', 'home-room__status');
  if (complete) {
    const badge = element('span', 'home-room__badge', '세트 완성');
    badge.append(element('span', 'visually-hidden', `, ${total}장 모두 수집`));
    status.append(badge);
  } else {
    const count = element('span', `home-room__count${acquired > 0 ? ' is-active' : ''}`);
    count.append(
      element('span', '', `${acquired} / ${total}`),
      element('span', 'visually-hidden', `${total}장 중 ${acquired}장 수집`),
    );
    count.firstChild.setAttribute('aria-hidden', 'true');
    status.append(count);
  }

  const bar = element('span', 'home-room__bar');
  bar.setAttribute('aria-hidden', 'true');
  const fill = element('span');
  fill.style.width = `${progressPercent(acquired, total)}%`;
  bar.append(fill);
  status.append(bar);

  item.append(text, status);
  return item;
}

function renderRooms() {
  const { total } = summarize(cards);
  document.querySelector('#home-rooms-meta').textContent = `${rooms.length}개 전시실 · ${total}장`;
  document.querySelector('#home-room-list').replaceChildren(...summarizeRooms(rooms, cards).map(renderRoom));
}

renderProgress();
renderRooms();
