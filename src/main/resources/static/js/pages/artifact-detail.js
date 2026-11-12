import { artifactFigure } from '../common/artifact-figure.js';
import { ROOMS, SAMPLE_RECORDS, findRecord, findRegion } from '../common/collection-data.js';

const SHOWCASE_URL = '/pages/showcase.html';
const pictureBookUrl = (roomId, focus) =>
  `/pages/picture-book.html?room=${encodeURIComponent(roomId)}${focus ? `&focus=${encodeURIComponent(focus)}` : ''}`;

const exhibitId = new URLSearchParams(window.location.search).get('exhibitId');
const hit = findRegion(ROOMS, exhibitId);
const record = hit ? findRecord(SAMPLE_RECORDS, exhibitId) : null;
const root = document.querySelector('#detail');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkButton(text, href, variant) {
  const link = element('a', `detail__button detail__button--${variant} art-button${variant === 'ghost' ? ' art-button--secondary' : ''}`, text);
  link.href = href;
  return link;
}

// 2026-11-06T10:14:00 → 2026.11.06
const formatDate = (value) => value.slice(0, 10).replaceAll('-', '.');

function closeButton() {
  const button = element('button', 'detail__close art-round-button');
  button.type = 'button';
  button.setAttribute('aria-label', '닫기');
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  button.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = SHOWCASE_URL;
  });
  return button;
}

function renderNotice(title, text, action) {
  const box = element('section', 'detail__notice');
  box.append(element('h1', 'detail__notice-title', title), element('p', 'detail__notice-text', text), action);
  root.replaceChildren(closeButton(), box);
}

function renderDetail({ room, region }) {
  document.title = `${region.artifactName} | BU:LOG`;

  const header = element('header', 'detail__header');
  header.append(element('p', 'detail__room art-badge', room.name), element('h1', 'detail__name', region.artifactName));

  const stage = element('div', 'detail__stage');
  stage.append(artifactFigure(region));

  const place = element('p', 'detail__place', `${room.shortName} 그림 · ${region.title}`);
  const locate = linkButton('그림에서 위치 보기', pictureBookUrl(room.id, region.exhibitId), 'ghost');

  const info = element('section', 'detail__info');
  info.setAttribute('aria-labelledby', 'detail-story');
  const storyTitle = element('h2', 'detail__label art-badge', '유물 이야기');
  storyTitle.id = 'detail-story';
  const facts = element('dl', 'detail__facts');
  facts.append(element('dt', '', '획득일'), element('dd', '', formatDate(record.acquiredAt)));
  info.append(storyTitle, element('p', 'detail__story', region.description), facts, linkButton('진열장으로 가기', SHOWCASE_URL, 'primary'));

  root.replaceChildren(closeButton(), header, stage, place, locate, info);
}

if (!hit) {
  renderNotice('유물을 찾을 수 없어요', '주소가 바르지 않거나 없는 유물이에요.', linkButton('홈으로 가기', '/', 'primary'));
} else if (!record) {
  renderNotice(
    '아직 모으지 않은 유물이에요',
    `${hit.room.name}에서 이 유물의 QR을 찾아 미션을 풀면 볼 수 있어요.`,
    linkButton('그림 도감에서 보기', pictureBookUrl(hit.room.id), 'primary'),
  );
} else {
  renderDetail(hit);
}
