import { mountTabBar } from '../common/tab-bar.js';
import { artifactFigure } from '../common/artifact-figure.js';
import {
  ROOMS,
  SAMPLE_RECORDS,
  acquiredSet,
  summarizeAll,
  summarizeRoom,
} from '../common/collection-data.js';

mountTabBar({ active: 'showcase' });

const SHELF_SIZE = 3;
const acquired = acquiredSet(SAMPLE_RECORDS);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTotal() {
  const { filled, total } = summarizeAll(ROOMS, acquired);
  document.querySelector('#showcase-filled').textContent = filled;
  document.querySelector('#showcase-total').textContent = total;
  document.querySelector('#showcase-count-label').textContent = `${total}개 중 ${filled}개 모음`;
}

function renderItem(item) {
  const li = element('li', 'showcase__slot');
  if (acquired.has(item.exhibitId)) {
    const link = element('a', 'showcase__item');
    link.href = `/pages/artifact-detail.html?exhibitId=${encodeURIComponent(item.exhibitId)}`;
    link.append(artifactFigure(item), element('span', 'showcase__name', item.artifactName));
    li.append(link);
  } else {
    const empty = element('div', 'showcase__item is-missing');
    empty.append(artifactFigure(item, { silhouette: true }), element('span', 'showcase__name', '???'));
    empty.lastChild.setAttribute('aria-hidden', 'true');
    empty.append(element('span', 'visually-hidden', '아직 모으지 않은 유물'));
    li.append(empty);
  }
  return li;
}

function renderHall(room) {
  const { filled, total } = summarizeRoom(room, acquired);
  const section = element('section', 'showcase__hall');
  const titleId = `hall-${room.id}`;
  section.setAttribute('aria-labelledby', titleId);

  const header = element('div', 'showcase__hall-header');
  const title = element('h2', 'showcase__hall-title', room.name);
  title.id = titleId;
  const count = element('p', 'showcase__hall-count', `${filled} / ${total}`);
  count.setAttribute('aria-label', `${total}개 중 ${filled}개 모음`);
  header.append(title, count);

  // 선반 한 줄에 3칸씩 놓는다.
  const cabinet = element('div', 'showcase__cabinet');
  for (let start = 0; start < room.regions.length; start += SHELF_SIZE) {
    const shelf = element('ul', 'showcase__shelf');
    shelf.append(...room.regions.slice(start, start + SHELF_SIZE).map(renderItem));
    cabinet.append(shelf);
  }

  section.append(header, cabinet);
  return section;
}

renderTotal();
document.querySelector('#showcase-halls').replaceChildren(...ROOMS.map(renderHall));
