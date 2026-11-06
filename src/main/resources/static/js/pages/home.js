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

mountTabBar({ active: 'home' });

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
  const item = element('li');
  const link = element('a', `home-room${complete ? ' home-room--complete' : ''}`);
  link.href = `/pages/picture-book.html?room=${encodeURIComponent(room.id)}`;

  const number = element('span', 'home-room__number', complete ? '' : String(index + 1));
  number.setAttribute('aria-hidden', 'true');

  const text = element('span', 'home-room__text');
  text.append(element('span', 'home-room__name', room.name), element('span', 'home-room__desc', room.description));

  const status = element('span', 'home-room__status');
  const count = element('span', `home-room__count${filled > 0 ? ' is-active' : ''}`, complete ? '완성' : `${filled} / ${total}`);
  count.setAttribute('aria-hidden', 'true');
  const bar = element('span', 'home-room__bar');
  bar.setAttribute('aria-hidden', 'true');
  const fill = element('span');
  fill.style.width = `${progressPercent(filled, total)}%`;
  bar.append(fill);
  status.append(count, bar);

  const label = complete ? `그림 완성` : `${total}칸 중 ${filled}칸 채움`;
  link.append(number, text, status, element('span', 'visually-hidden', `, ${label}`));
  item.append(link);
  return item;
}

function renderRooms() {
  const list = document.querySelector('#home-room-list');
  list.replaceChildren(...ROOMS.map((room, index) => renderRoom(summarizeRoom(room, acquired), index)));
}

renderProgress();
renderRooms();
