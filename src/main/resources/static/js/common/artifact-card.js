// 유물 카드 공통 렌더러: 카드북, 카드 획득, 카드 상세 화면에서 사용한다.
// card는 화면 표시용 형식이며 API 응답 형식이 아니다. API 응답은 각 페이지에서 이 형식으로 변환한다.
// { acquired, number?, grade?: 'gold' | 'normal', name?, roomName?, imageUrl?, imageAlt? }
// 옵션: headingLevel(2~6), interactive(미획득 카드를 버튼으로 렌더)

const GRADE_LABELS = { gold: 'GOLD', normal: 'NORMAL' };
const GRADE_NAMES = { gold: '골드', normal: '일반' };
const FALLBACK_NAME = '이름 정보 없음';
const LOCKED_TEXT = '아직 만나지 못한 유물';
const MAX_CARD_NUMBER = 999;

const IMAGE_ICON = `
  <svg class="artifact-card__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="6" y="9" width="36" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="17" cy="19" r="3.5" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M8 35l11-11 8 8 5-5 9 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
  </svg>
`;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeGrade(grade) {
  return grade === 'gold' ? 'gold' : 'normal';
}

function normalizeNumber(number) {
  return Number.isInteger(number) && number >= 1 && number <= MAX_CARD_NUMBER ? number : null;
}

function normalizeHeadingLevel(level) {
  return Number.isInteger(level) && level >= 2 && level <= 6 ? level : 3;
}

// 같은 출처 경로 또는 https 주소만 허용하고, 그 밖의 값은 플레이스홀더로 대체한다.
function safeImageUrl(url) {
  const value = text(url);
  if (!value) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin === window.location.origin || parsed.protocol === 'https:') return parsed.href;
  } catch {
    // 해석할 수 없는 주소는 플레이스홀더로 처리한다.
  }
  return null;
}

function renderPlaceholder() {
  return `
    <div class="artifact-card__placeholder" aria-hidden="true">
      ${IMAGE_ICON}
      <span>유물 사진</span>
    </div>
  `;
}

// interactive이면 누를 수 있는 버튼으로 렌더한다. 버튼 안에는 span만 사용한다.
function renderLockedCard(roomName, interactive) {
  const label = roomName ? `${LOCKED_TEXT}, ${roomName}` : LOCKED_TEXT;
  const tag = interactive ? 'button' : 'article';
  return `
    <${tag}${interactive ? ' type="button"' : ''} class="artifact-card artifact-card--locked" aria-label="${escapeHtml(label)}">
      <span class="artifact-card__frame">
        <span class="artifact-card__mystery" aria-hidden="true">?</span>
        <span class="artifact-card__locked-text" aria-hidden="true">${LOCKED_TEXT}</span>
        ${roomName ? `<span class="artifact-card__locked-room" aria-hidden="true">${escapeHtml(roomName)}</span>` : ''}
      </span>
    </${tag}>
  `;
}

export function renderArtifactCard(card, { headingLevel = 3, interactive = false } = {}) {
  card = card ?? {};
  const roomName = text(card.roomName);
  if (card.acquired !== true) return renderLockedCard(roomName, interactive === true);

  const grade = normalizeGrade(card.grade);
  const number = normalizeNumber(card.number);
  const name = text(card.name) || FALLBACK_NAME;
  const imageUrl = safeImageUrl(card.imageUrl);
  const imageAlt = typeof card.imageAlt === 'string' ? card.imageAlt : `${name} 사진`;
  const heading = `h${normalizeHeadingLevel(headingLevel)}`;
  const numberText = number === null ? '' : `No.${String(number).padStart(2, '0')}`;

  // 등급과 번호는 화면에서 aria-hidden 처리하므로 카드 라벨로 전달한다.
  const label = [name, `${GRADE_NAMES[grade]} 등급`, roomName, number === null ? '' : `카드 번호 ${number}`]
    .filter(Boolean)
    .join(', ');

  return `
    <article class="artifact-card artifact-card--${grade}" aria-label="${escapeHtml(label)}">
      <div class="artifact-card__frame">
        <div class="artifact-card__meta" aria-hidden="true">
          <span class="artifact-card__no">${numberText}</span>
          <span class="artifact-card__grade">${GRADE_LABELS[grade]}</span>
        </div>
        <div class="artifact-card__image">
          ${imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async">`
            : renderPlaceholder()}
        </div>
        <${heading} class="artifact-card__name">${escapeHtml(name)}</${heading}>
        ${roomName ? `<p class="artifact-card__room">${escapeHtml(roomName)}</p>` : ''}
        <p class="artifact-card__brand" aria-hidden="true">BUCHEON CITY MUSEUM</p>
      </div>
    </article>
  `;
}

// 이미지 로딩에 실패하면 플레이스홀더로 한 번만 바꾼다.
// error 이벤트는 버블링되지 않으므로 캡처 단계에서 컨테이너 하나로 처리한다.
export function bindArtifactCardImages(container) {
  container.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest('.artifact-card__image')) return;
    image.parentElement.innerHTML = renderPlaceholder();
  }, true);
}
