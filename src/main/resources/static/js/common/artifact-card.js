// 유물 카드 공통 컴포넌트: 획득 카드(전설·일반, 앞면·뒷면)와 미획득 카드(다음 유물·잠긴 카드).
// Figma 유물 카드(2:33, 2:48), 뒷면(49:170), 다음 유물 카드(2:64), 잠긴 카드(87:311) 기준.
//
// 사용법: 면 요소의 크기는 가장 가까운 inline-size 컨테이너의 너비를 기준으로 비율대로 정해진다(기본 260×364).
//   - 한 장만 놓을 때: <div class="artifact-card"> 안에 면 하나를 넣는다(이 그릇이 컨테이너와 비율을 맡는다).
//   - 앞뒤로 뒤집을 때: 컨테이너 역할 요소 안에 높이 100%인 회전 요소를 두고, 앞·뒷면을 겹쳐 배치한다(카드 상세 참고).
//
// card는 화면 표시용 형식이며 API 응답 형식이 아니다.
// { name, number?, grade?: 'legend' | 'normal', roomName?, tagline?, story?, category?, acquiredAt?, imageUrl?, imageAlt? }

const TOTAL_STARS = 3;
const MAX_CARD_NUMBER = 999;
const GRADES = {
  legend: { label: '전설 카드', stars: 3, sparkle: '/images/cards/sparkle-legend.svg' },
  normal: { label: '일반 카드', stars: 1, sparkle: '/images/cards/sparkle-normal.svg' },
};
const FALLBACK_NAME = '이름 정보 없음';
const EMPTY_STORY = '유물 이야기를 준비하고 있어요.';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeHeadingLevel(level) {
  return Number.isInteger(level) && level >= 2 && level <= 6 ? level : 2;
}

// https 주소, 또는 같은 사이트의 http(s) 주소만 허용한다. 그 밖의 값(javascript:, data:, blob: 등)은 null.
function safeImageUrl(url) {
  const value = text(url);
  if (!value) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    const sameOrigin = parsed.origin === window.location.origin && ['http:', 'https:'].includes(parsed.protocol);
    if (parsed.protocol === 'https:' || sameOrigin) return parsed.href;
  } catch {
    // 해석할 수 없는 주소는 자리 표시로 처리한다.
  }
  return null;
}

// 표시용으로 값을 정리한다. 없는 정보는 null로 두고 화면에서 생략한다.
function normalizeArtifactCard(card) {
  const source = card ?? {};
  const number = Number.isInteger(source.number) && source.number >= 1 && source.number <= MAX_CARD_NUMBER
    ? source.number
    : null;
  const name = text(source.name) || FALLBACK_NAME;
  return {
    name,
    number,
    grade: source.grade === 'legend' ? 'legend' : 'normal',
    roomName: text(source.roomName) || null,
    tagline: text(source.tagline) || null,
    story: text(source.story) || EMPTY_STORY,
    category: text(source.category) || null,
    acquiredAt: text(source.acquiredAt) || null,
    imageUrl: safeImageUrl(source.imageUrl),
    imageAlt: typeof source.imageAlt === 'string' ? source.imageAlt : `${name} 사진`,
  };
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

// 장식용 그림. 브라우저 기본 이미지 드래그가 카드 회전을 방해하지 않게 막는다.
function decoration(src, className) {
  const image = element('img', className);
  image.src = src;
  image.alt = '';
  image.draggable = false;
  return image;
}

function createFace(card, side) {
  const face = element('article', `artifact-face artifact-face--${side} artifact-face--${card.grade}`);
  const inner = element('div', `artifact-face__inner artifact-face__inner--${side}`);
  face.append(inner);
  return { face, inner };
}

function createNameRow(card, headingLevel, nameClass) {
  const row = element('div', 'artifact-face__name-row');
  row.append(element(`h${normalizeHeadingLevel(headingLevel)}`, `artifact-face__name ${nameClass}`, card.name));
  if (card.number !== null) {
    row.append(element('span', 'artifact-face__number', `No.${String(card.number).padStart(2, '0')}`));
  }
  return row;
}

// 별 개수는 등급 문구로 전달하므로 별 그림은 장식으로 둔다.
function createRarityRow(card) {
  const grade = GRADES[card.grade];
  const row = element('div', 'artifact-face__rarity');

  const group = element('div', 'artifact-face__grade-group');
  const stars = element('span', 'artifact-face__stars');
  for (let index = 0; index < TOTAL_STARS; index += 1) {
    stars.append(decoration(index < grade.stars ? '/images/cards/star-on.svg' : '/images/cards/star-off.svg', 'artifact-face__star'));
  }
  group.append(stars, element('span', 'artifact-face__grade', grade.label));
  row.append(group);

  if (card.roomName) {
    const room = element('span', 'artifact-face__room');
    room.append(decoration('/images/cards/icon-room.svg', 'artifact-face__room-icon'), element('span', '', card.roomName));
    row.append(room);
  }
  return row;
}

function createFooter() {
  const footer = element('div', 'artifact-face__footer');
  footer.setAttribute('aria-hidden', 'true');
  const brand = element('span', 'artifact-face__brand', 'BU');
  brand.append(element('span', 'artifact-face__brand-dash', '-'), 'LOG');
  footer.append(brand, element('span', 'artifact-face__museum', 'BUCHEON CITY MUSEUM'));
  return footer;
}

// 실제 사진이 없거나 불러오지 못했을 때 쓰는 장식용 자리 표시.
function fillPlaceholder(art, grade) {
  art.replaceChildren(decoration(GRADES[grade].sparkle, 'artifact-face__sparkle'));
  if (grade === 'legend') art.append(element('span', 'artifact-face__holo'));
  art.append(decoration('/images/cards/icon-image.svg', 'artifact-face__art-icon'), element('span', 'artifact-face__art-label', '유물 사진'));
  art.setAttribute('aria-hidden', 'true');
}

function createArt(card) {
  const art = element('div', 'artifact-face__art');
  if (!card.imageUrl) {
    fillPlaceholder(art, card.grade);
    return art;
  }
  const photo = element('img', 'artifact-face__photo');
  photo.src = card.imageUrl;
  photo.alt = card.imageAlt;
  photo.draggable = false;
  photo.addEventListener('error', () => fillPlaceholder(art, card.grade), { once: true });
  art.append(photo);
  return art;
}

export function createArtifactCardFront(card, { headingLevel = 2 } = {}) {
  const data = normalizeArtifactCard(card);
  const { face, inner } = createFace(data, 'front');
  inner.append(createNameRow(data, headingLevel, 'artifact-face__name--display'), createArt(data), createRarityRow(data));
  if (data.tagline) {
    const feature = element('div', 'artifact-face__feature');
    feature.append(element('p', '', data.tagline));
    inner.append(feature);
  }
  inner.append(createFooter());
  return face;
}

export function createArtifactCardBack(card, { headingLevel = 2 } = {}) {
  const data = normalizeArtifactCard(card);
  const { face, inner } = createFace(data, 'back');

  const story = element('div', 'artifact-face__story');
  const title = element('p', 'artifact-face__story-title');
  title.append(decoration('/images/cards/icon-story.svg', 'artifact-face__story-icon'), element('span', '', '유물 이야기'));
  story.append(title, element('p', 'artifact-face__story-text', data.story));

  inner.append(createNameRow(data, headingLevel, 'artifact-face__name--serif'), createRarityRow(data), story);

  // 없는 정보는 행을 숨기고, 모두 없으면 상자를 생략한다.
  const rows = [['분류', data.category], ['획득일', data.acquiredAt]].filter(([, value]) => value);
  if (rows.length > 0) {
    const info = element('dl', 'artifact-face__info');
    for (const [label, value] of rows) {
      const row = element('div', 'artifact-face__info-row');
      row.append(element('dt', '', label), element('dd', '', value));
      info.append(row);
    }
    inner.append(info);
  }
  inner.append(createFooter());
  return face;
}

const SLOT_STATES = {
  next: { label: '다음 유물', hint: 'QR을 찾아보세요' },
  locked: { label: '잠긴 유물', hint: '이전 유물을 먼저 모아야 열려요' },
};

// 미획득 카드 자리. state가 'next'면 다음 유물(물음표), 그 밖에는 잠긴 카드(자물쇠).
// interactive이면 누를 수 있는 버튼으로 렌더한다. 버튼 안에는 span만 사용하고, 읽을 내용은 aria-label로 전달한다.
export function createArtifactCardSlot(slot, { interactive = false } = {}) {
  const state = slot?.state === 'next' ? 'next' : 'locked';
  const roomName = text(slot?.roomName);
  const root = element(interactive === true ? 'button' : 'article', `artifact-slot artifact-slot--${state}`);
  if (interactive === true) root.type = 'button';
  root.setAttribute('aria-label', [SLOT_STATES[state].label, roomName, SLOT_STATES[state].hint].filter(Boolean).join(', '));

  const mark = state === 'next'
    ? element('span', 'artifact-slot__mark', '?')
    : decoration('/images/cards/icon-lock.svg', 'artifact-slot__mark');
  const lines = state === 'next'
    ? [element('span', 'artifact-slot__title', '다음 차례 · QR을 찾아보세요')]
    : [element('span', 'artifact-slot__title', '잠긴 유물'), element('span', 'artifact-slot__desc', '이전 유물을 먼저 모아요')];
  if (roomName) lines.push(element('span', 'artifact-slot__room', roomName));

  for (const node of [mark, ...lines]) {
    node.setAttribute('aria-hidden', 'true');
    root.append(node);
  }
  return root;
}
