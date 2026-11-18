import { mountLayout } from '../common/layout.js';
import { getExhibit, getExhibitQuiz } from '../api/exhibits-api.js';
import { submitQuizAnswer } from '../api/quiz-api.js';

mountLayout();

// 디자인 규칙: 틀려도 기회 제한 없이 다시 도전한다

// 1. 주소에서 정보 꺼내기
//   ?exhibitId=ongi2-sojutgori  → 서버의 진짜 퀴즈
//   ?demo=choice | count | handle | lock → 예전 예시 문제
const params = new URLSearchParams(window.location.search);
const exhibitId = params.get('exhibitId');
const demoKey = params.get('demo');
const exhibitPageUrl = exhibitId ? `/pages/exhibit.html?id=${encodeURIComponent(exhibitId)}` : '/';

// 체험 모드는 카드를 받지 않으므로 preview=1을 붙여 채우기 화면을 미리 보기로 연다.
function fillResultUrl(id, newlyAcquired, preview = false) {
  const again = newlyAcquired === false ? '&new=0' : '';
  return `/pages/fill-result.html?exhibitId=${encodeURIComponent(id)}${again}${preview ? '&preview=1' : ''}`;
}

// ---------------------------------------------------------
// 체험 모드용 가짜 문제 (정답은 모두 예시라 실제 유물과 다를 수 있음)
// 서버에 객관식 샘플만 있어서, 숫자 세기·자물쇠를 보여주려고 만든 것
// 진짜 데이터가 생기면 이 부분은 지워도 됨
// ---------------------------------------------------------
const DEMO_QUIZZES = {
  choice: {
    exhibit: { name: '소줏고리', exhibitionRoom: '옹기2전시실' },
    quiz: {
      question: '전시된 소줏고리에서 술이 흘러나오는 꼭지는 몇 개일까요?',
      options: [
        { id: 1, content: '1개' }, { id: 2, content: '2개' },
        { id: 3, content: '3개' }, { id: 4, content: '꼭지가 없다' },
      ],
      hint: '아래위 두 동이가 맞붙은 곳 옆을 살펴보세요.',
    },
    answerOptionId: 1,
    explanation: '체험용 예시 정답이에요. 실제 문제와 정답은 현장에서 관찰해서 정해요.',
  },
  count: {
    exhibit: { name: '학 무늬 항아리', exhibitionRoom: '체험 전시실' },
    quiz: {
      question: '항아리에 그려진 학은 모두 몇 마리일까요?',
      unit: '마리',
      options: [
        { id: 11, content: '4' }, { id: 12, content: '5' },
        { id: 13, content: '6' }, { id: 14, content: '7' },
      ],
      hint: '앞면만 보지 말고 뒤쪽으로 돌아가서도 세어 보세요.',
    },
    answerOptionId: 13,
    explanation: '체험용 예시 정답이에요. 실제 문제와 정답은 현장에서 관찰해서 정해요.',
  },
  handle: {
    exhibit: { name: '소줏고리', exhibitionRoom: '옹기2전시실' },
    quiz: {
      question: '소줏고리에 달린 손잡이는 모두 몇 개일까요?',
      options: [
        { id: 31, content: '1' }, { id: 32, content: '2' },
        { id: 33, content: '3' }, { id: 34, content: '4' },
      ],
      hint: '앞뒤로 돌아가며 옆면을 살펴보세요.',
    },
    answerOptionId: 32,
    explanation: '체험용 예시 정답(2개)이에요. 실제 문제와 정답은 현장에서 관찰해서 정해요.',
  },
  lock: {
    exhibit: { name: '소줏고리', exhibitionRoom: '옹기2전시실' },
    quiz: {
      question: '소줏고리를 관찰해서 자물쇠를 열어 보세요',
      dialLabels: ['꼭지', '손잡이', '동이'],
      options: [
        { id: 21, content: '122' }, { id: 22, content: '212' },
        { id: 23, content: '112' }, { id: 24, content: '221' },
      ],
      hint: '꼭지 수, 손잡이 수, 맞붙은 동이 수를 차례대로 세어 보세요.',
    },
    answerOptionId: 21,
    explanation: '체험용 예시 정답(1-2-2)이에요. 실제 문제와 정답은 현장에서 관찰해서 정해요.',
  },
};

// 관찰 미션 24개는 서버에 있음 (CuratedQuizzes.java). 주소: quiz.html?exhibitId=유물id
const demo = DEMO_QUIZZES[demoKey] ?? null;
const DEMO_FILL_ID = 'ongi2-sojutgori'; // 그림 도감의 소줏고리 자리

// 2. 화면 자리(HTML 태그) 미리 찾아두기
const els = {
  close: document.querySelector('#quiz-close'),
  topbar: document.querySelector('.quiz-topbar'),
  exhibitName: document.querySelector('#quiz-exhibit-name'),
  gallery: document.querySelector('#quiz-gallery'),
  galleryWrap: document.querySelector('#quiz-gallery-wrap'),
  question: document.querySelector('#quiz-question'),
  game: document.querySelector('#quiz-game'),
  hint: document.querySelector('#quiz-hint'),
  feedback: document.querySelector('#quiz-feedback'),
  feedbackTitle: document.querySelector('#quiz-feedback-title'),
  feedbackMessage: document.querySelector('#quiz-feedback-message'),
  submit: document.querySelector('#submit-answer'),
};

els.close.href = exhibitPageUrl;

// 3. 지금 퀴즈 상태
const state = {
  quiz: null,             // 서버(또는 체험 모드)에서 받은 퀴즈
  game: null,             // 지금 화면에 그린 게임 (아래 GAME_RENDERERS가 만든 것)
  wrongCount: 0,          // 틀린 횟수 (기회 제한은 없음, '한 번에 정답' 문구에만 씀)
  usedHint: false,        // 힌트를 봤는지 (지금은 기록만)
  submitting: false,      // 채점 중이면 버튼 두 번 못 누르게
  nextUrl: null,          // 끝나면 버튼을 눌렀을 때 갈 주소
};

// 서버 응답은 { isSuccess, code, message, result } 형태라 result만 꺼냄
const unwrap = (response) => response?.result ?? response;

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 흔들기 연출 (오답)
function shake(target) {
  if (prefersReducedMotion) return;
  target.classList.remove('is-shaking');
  void target.offsetWidth; // 애니메이션을 처음부터 다시 틀기 위한 한 줄
  target.classList.add('is-shaking');
}

// ---------------------------------------------------------
// 게임 종류 고르기
// 서버가 type을 보내주면 그대로 쓰고, 아직 안 보내면 보기 모양으로 짐작함
//   보기가 전부 3자리 이상 같은 길이 숫자 → 자물쇠 (예: "122")
//   보기가 전부 1~2자리 숫자          → 도장 찍기 (예: "5")
//   그 밖                             → 객관식
// 서버 쪽은 지금 구조(질문 + 보기 + 고른 보기 id 제출) 그대로라 변경 없음
// ---------------------------------------------------------
// 순서 맞추기: 보기가 "order:입구>목>몸통" 모양 (정답 순서 1 + 틀린 순서들). 카드 순서를 이어 붙여 같은 보기를 찾아 채점
const ORDER_PREFIX = 'order:';
const ORDER_SEPARATOR = '>';
const SPOT_PATTERN = /^spot:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)$/;

function detectGameType(quiz) {
  if (quiz.type) return quiz.type;
  const contents = (quiz.options ?? []).map((option) => String(option.content).trim());
  if (contents.length === 0) return 'MULTIPLE_CHOICE';
  // 찾아 누르기: 보기가 "spot:가로%,세로%,반지름%" 모양 (정답 자리 1개 + 헷갈리는 자리)
  if (contents.every((text) => SPOT_PATTERN.test(text))) return 'FIND';
  if (contents.every((text) => text.startsWith(ORDER_PREFIX))) return 'ORDER';
  const length = contents[0].length;
  if (length >= 3 && contents.every((text) => /^\d+$/.test(text) && text.length === length)) return 'LOCK';
  if (contents.every((text) => /^\d{1,2}$/.test(text))) return 'COUNT'; // 도장 찍기
  return 'MULTIPLE_CHOICE';
}

// ---------------------------------------------------------
// 게임 종류별 화면
// 새 게임을 만들면 함수를 하나 만들고 여기에 추가하면 됨
// 각 함수는 아래 4가지를 가진 물건을 돌려줌
//   getAnswer()  → { ready: 제출할 수 있는지, optionId: 고른 보기 id (보기에 없는 답이면 null) }
//   markWrong()  → 틀렸을 때 표시
//   markCorrect() → 맞혔을 때 표시
//   disable()    → 끝났을 때 잠그기
// onChange()를 부르면 제출 버튼이 다시 계산됨
// ---------------------------------------------------------
const GAME_RENDERERS = {
  MULTIPLE_CHOICE: renderMultipleChoice,
  COUNT: renderStamp, // 숫자 세기 = 도장 찍기
  LOCK: renderLock,
  FIND: renderFind,
  ORDER: renderOrder,
};

// 배열을 무작위 순서로 섞은 새 배열 (원래 배열은 그대로)
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 객관식·자물쇠 위에 띄우는 유물 사진 카드
// 스티커 게임은 이미 사진 위에서 하니까 여기서는 안 씀
// 누르면 크게 보기 ↔ 원래 크기
function renderPhotoCard(quiz) {
  if (!quiz.imageUrl) return null;
  const card = element('figure', 'quiz-photo');
  const tapes = [element('span', 'quiz-photo__tape quiz-photo__tape--left'), element('span', 'quiz-photo__tape quiz-photo__tape--right')];
  tapes.forEach((tape) => tape.setAttribute('aria-hidden', 'true'));
  const frame = element('button', 'quiz-photo__frame');
  frame.type = 'button';
  frame.setAttribute('aria-label', '유물 사진 크게 보기');
  frame.setAttribute('aria-expanded', 'false');
  const img = element('img', 'quiz-photo__img');
  img.src = quiz.imageUrl;
  img.alt = els.exhibitName.textContent ? `${els.exhibitName.textContent} 사진` : '유물 사진';
  img.addEventListener('error', () => card.remove(), { once: true }); // 사진이 없으면 카드째 숨김
  const caption = element('figcaption', 'quiz-photo__caption', '눈앞의 실물과 비교해 보세요');
  frame.append(img);
  frame.addEventListener('click', () => {
    const open = card.classList.toggle('is-zoomed');
    frame.setAttribute('aria-expanded', String(open));
    frame.setAttribute('aria-label', open ? '유물 사진 작게 보기' : '유물 사진 크게 보기');
  });
  card.append(...tapes, frame, caption);
  return card;
}

// A. 객관식: 받은 보기 수만큼 A, B, C... 버튼을 만듦 (피그마 03 그대로)
function renderMultipleChoice(quiz, container, onChange) {
  const letters = 'ABCDEFGH';
  let selectedId = null;
  const list = element('div', 'quiz-options');
  list.setAttribute('role', 'radiogroup');
  list.setAttribute('aria-label', '보기');

  // 들어올 때마다 보기 순서를 섞음. 채점은 보기 id로 하니까 순서와 상관없음
  const ordered = shuffle(quiz.options); // 화면에 보이는 순서. 아래에서 버튼을 찾을 때도 이 순서를 씀
  const buttons = ordered.map((option, index) => {
    const button = element('button', 'quiz-option');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.append(
      element('span', 'quiz-option__letter', letters[index] ?? String(index + 1)),
      element('span', 'quiz-option__text', option.content),
    );
    button.addEventListener('click', () => {
      selectedId = option.id;
      buttons.forEach((other, otherIndex) => {
        const selected = ordered[otherIndex].id === option.id;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-checked', String(selected));
      });
      onChange();
    });
    list.append(button);
    return button;
  });

  container.replaceChildren(list);
  const selectedButton = () => buttons[ordered.findIndex((option) => option.id === selectedId)];

  return {
    getAnswer: () => ({ ready: selectedId !== null, optionId: selectedId }),
    markWrong() {
      const button = selectedButton();
      if (button) {
        button.classList.remove('is-selected');
        button.classList.add('is-wrong');
        button.disabled = true; // 틀린 보기는 다시 못 고름
        button.setAttribute('aria-checked', 'false');
      }
      selectedId = null;
    },
    // 정답 보기: 왼쪽에서 빛이 쓸고 지나가고, 알파벳이 ✓로 바뀌며 통통 튐
    markCorrect() {
      const button = selectedButton();
      if (!button) return;
      button.classList.remove('is-selected');
      button.classList.add('is-correct', 'is-celebrate');
      const letter = button.querySelector('.quiz-option__letter');
      if (letter) letter.textContent = '✓';
      addSparks(button, { count: 5, radius: 30, x: '30px', y: '50%' });
    },
    disable() { buttons.forEach((button) => { button.disabled = true; }); },
  };
}

// 정답 연출에 쓰는 작은 반짝임 (game: 붙일 곳, count: 개수, radius: 퍼지는 거리 px)
// 움직임 줄이기 설정이면 안 만듦
function addSparks(target, { count = 6, radius = 44, x = '50%', y = '50%' } = {}) {
  if (prefersReducedMotion) return;
  for (let i = 0; i < count; i += 1) {
    const spark = element('span', 'quiz-spark');
    const angle = (Math.PI * 2 * i) / count + 0.4;
    spark.style.left = x;
    spark.style.top = y;
    spark.style.setProperty('--sx', `${Math.cos(angle) * radius}px`);
    spark.style.setProperty('--sy', `${Math.sin(angle) * radius}px`);
    spark.style.animationDelay = `${(i % 3) * 40}ms`;
    target.append(spark);
  }
}

// B. 도장 찍기 (숫자 세기): 유물 그림 위를 누를 때마다 그 자리에 스티커(또는 도장)가 붙음
// 질문이 "학"이면 학, "손잡이"면 손잡이 스티커. 붙인 개수가 답. 붙인 걸 다시 누르면 떼어짐
// 서버는 그대로: 보기가 "4", "5"처럼 숫자면 찍은 개수와 같은 보기를 골라 제출
const STAMP_SIZE = 34; // 도장 크기(px)

// 사진이 없을 때 쓰는 기본 그림: 항아리 + 학 여섯 마리 (체험 모드용 예시)
const SAMPLE_PICTURE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
  <rect width="320" height="240" fill="#F6EADB"/>
  <path d="M135 30h50v14c38 18 62 52 62 92 0 50-38 84-87 84s-87-34-87-84c0-40 24-74 62-92z" fill="#C9D7C3" stroke="#8FA58A" stroke-width="3"/>
  <g fill="none" stroke="#56684F" stroke-width="4" stroke-linecap="round">
    <path d="M100 90q11-12 22 0q11-12 22 0"/>
    <path d="M168 72q11-12 22 0q11-12 22 0"/>
    <path d="M198 128q11-12 22 0q11-12 22 0"/>
    <path d="M86 146q11-12 22 0q11-12 22 0"/>
    <path d="M140 184q11-12 22 0q11-12 22 0"/>
    <path d="M140 120q11-12 22 0q11-12 22 0"/>
  </g>
</svg>`)}`;


// 스티커: 질문 글자에서 낱말을 찾아 무엇을 붙일지 정함 (서버가 sticker를 보내주면 그걸 먼저 씀)
const svgUrl = (body) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${body}</svg>`)}`;
const STICKERS = {
  crane: {
    words: ['학', '두루미'],
    label: '학',
    image: svgUrl(`
      <path d="M9 30c6-1 11-5 15-11l3 10c-6 6-12 6-18 1z" fill="#2B211A"/>
      <path d="M8 31c4-14 15-20 26-17-3 9-11 16-26 17z" fill="#fff" stroke="#2B211A" stroke-width="2" stroke-linejoin="round"/>
      <path d="M30 15c2-4 5-7 9-7" fill="none" stroke="#2B211A" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="40" cy="8" r="3" fill="#2B211A"/><circle cx="40.5" cy="6.6" r="1.6" fill="#D9412B"/>
      <path d="M43 8.5l4 1.5" stroke="#8A7B6E" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 31l-2 9M24 30l1 9" stroke="#8A7B6E" stroke-width="2" stroke-linecap="round"/>`),
  },
  handle: {
    words: ['손잡이', '귀때', '고리'],
    label: '손잡이',
    image: svgUrl(`
      <path d="M12 34V22a12 12 0 0 1 24 0v12" fill="none" stroke="#7A4A2E" stroke-width="7" stroke-linecap="round"/>
      <path d="M12 34V22a12 12 0 0 1 24 0v12" fill="none" stroke="#B9774F" stroke-width="2.5" stroke-linecap="round"/>`),
  },
  spout: {
    words: ['꼭지', '주둥이'],
    label: '꼭지',
    image: svgUrl(`
      <path d="M8 30h22l10-12 3 3-9 13H8z" fill="#9C603E" stroke="#5C3B21" stroke-width="2" stroke-linejoin="round"/>
      <path d="M41 24c0 3 2 5 2 7a2 2 0 0 1-4 0c0-2 2-4 2-7z" fill="#7FB3D5"/>`),
  },
  flower: {
    words: ['연꽃', '꽃', '국화', '모란', '해바라기'],
    label: '꽃',
    image: svgUrl(`
      <g fill="#F4A6A0" stroke="#C0603A" stroke-width="1.5">
        <ellipse cx="24" cy="12" rx="6" ry="10"/><ellipse cx="24" cy="12" rx="6" ry="10" transform="rotate(72 24 24)"/>
        <ellipse cx="24" cy="12" rx="6" ry="10" transform="rotate(144 24 24)"/><ellipse cx="24" cy="12" rx="6" ry="10" transform="rotate(216 24 24)"/>
        <ellipse cx="24" cy="12" rx="6" ry="10" transform="rotate(288 24 24)"/>
      </g><circle cx="24" cy="24" r="5" fill="#E0AF39"/>`),
  },
  fish: {
    words: ['물고기', '고기'],
    label: '물고기',
    image: svgUrl(`
      <path d="M6 24c6-9 20-11 30 0-10 11-24 9-30 0z" fill="#6C9BC2" stroke="#2F5B80" stroke-width="2"/>
      <path d="M36 24l8-7v14z" fill="#6C9BC2" stroke="#2F5B80" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="14" cy="22" r="2" fill="#1F2D3A"/>`),
  },
  hole: {
    words: ['구멍'],
    label: '구멍',
    image: svgUrl(`<circle cx="24" cy="24" r="13" fill="#3A2A20" stroke="#B9A48C" stroke-width="4"/>`),
  },
  note: {
    words: ['악보'],
    label: '음표',
    image: svgUrl(`<circle cx="24" cy="24" r="20" fill="#FFF5E4" stroke="#C0603A" stroke-width="2"/><path d="M20 32V13l13-3v18" fill="none" stroke="#2B211A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="17" cy="32" rx="4.5" ry="3.5" fill="#2B211A"/><ellipse cx="30" cy="28" rx="4.5" ry="3.5" fill="#2B211A"/>`),
  },
  cross: {
    words: ['십자가'],
    label: '십자가',
    image: svgUrl(`<path d="M20 6h8v12h12v8H28v16h-8V26H8v-8h12z" fill="#C0603A" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`),
  },
  sword: {
    words: ['칼'],
    label: '칼 마크',
    image: svgUrl(`<g stroke="#2F5B80" stroke-width="3.5" stroke-linecap="round"><path d="M12 8l24 30M36 8L12 38"/><path d="M8 34l8-2M40 34l-8-2"/></g>`),
  },
};

function pickSticker(quiz) {
  if (quiz.sticker && STICKERS[quiz.sticker]) return STICKERS[quiz.sticker];
  const question = quiz.question ?? '';
  return Object.values(STICKERS).find((sticker) => sticker.words.some((word) => question.includes(word))) ?? null;
}

function renderStamp(quiz, container, onChange) {
  const numbers = quiz.options.map((option) => Number(option.content));
  const max = Math.max(9, Math.ceil(Math.max(...numbers) * 1.5)); // 너무 많이 찍지 않게
  const unit = quiz.unit ?? '개';
  const tried = new Set(); // 이미 틀린 개수
  let stamps = []; // { x, y, node } (x, y는 그림 안의 % 위치)
  let locked = false;
  const sticker = pickSticker(quiz); // null이면 빨간 "관" 도장

  // 그림 판: 키보드로도 쓸 수 있게 tabindex를 줌 (Enter/Space 찍기, Backspace 떼기)
  const board = element('div', 'quiz-stamp');
  board.tabIndex = 0;
  board.setAttribute('role', 'button');
  board.setAttribute('aria-label', `유물 그림. 누를 때마다 도장이 찍혀요. 지금 0${unit}`);
  const picture = element('img', 'quiz-stamp__picture');
  picture.alt = '';
  picture.src = quiz.imageUrl || SAMPLE_PICTURE;
  picture.draggable = false;
  picture.addEventListener('error', () => { picture.src = SAMPLE_PICTURE; }, { once: true });
  board.append(picture);

  const footer = element('div', 'quiz-stamp__footer');
  const countEl = element('p', 'quiz-stamp__count');
  countEl.setAttribute('aria-live', 'polite');
  const clear = element('button', 'quiz-stamp__clear', '모두 지우기');
  clear.type = 'button';
  footer.append(countEl, clear);

  const guide = sticker
    ? `실물을 보며 ${sticker.label}${/[가-힣]/.test(sticker.label) && (sticker.label.charCodeAt(sticker.label.length - 1) - 0xac00) % 28 ? '을' : '를'} 찾은 자리마다 붙여 보세요`
    : '실물을 보며 찾은 자리를 콕콕 눌러 도장을 찍어 보세요';
  const note = element('p', 'quiz-stamp__note', guide);
  container.replaceChildren(board, footer, note);

  function update() {
    countEl.textContent = '';
    countEl.append(element('strong', null, String(stamps.length)), `${unit} ${sticker ? '붙였어요' : '찍었어요'}`);
    board.setAttribute('aria-label', `유물 그림. 누를 때마다 도장이 찍혀요. 지금 ${stamps.length}${unit}`);
    clear.disabled = locked || stamps.length === 0;
    note.textContent = tried.has(stamps.length)
      ? `${stamps.length}${unit}는 이미 틀렸어요. 다시 찾아보세요`
      : guide;
    onChange();
  }

  function addStamp(x, y) {
    if (locked) return;
    if (stamps.length >= max) {
      shake(board);
      return;
    }
    const node = sticker
      ? element('span', 'quiz-stamp__seal quiz-stamp__seal--sticker')
      : element('span', 'quiz-stamp__seal', '관');
    if (sticker) node.style.backgroundImage = `url("${sticker.image}")`;
    node.setAttribute('aria-hidden', 'true');
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
    node.style.setProperty('--tilt', `${Math.round(Math.random() * 24 - 12)}deg`);
    const stamp = { x, y, node };
    node.addEventListener('pointerdown', (event) => {
      event.stopPropagation(); // 판에 또 찍히지 않게
      if (locked) return;
      removeStamp(stamp);
    });
    board.append(node);
    stamps.push(stamp);
    navigator.vibrate?.(15);
    update();
  }

  function removeStamp(stamp) {
    stamp.node.remove();
    stamps = stamps.filter((item) => item !== stamp);
    update();
  }

  // 누른 자리(%)에 도장 찍기
  board.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = board.getBoundingClientRect();
    const half = (STAMP_SIZE / 2 / rect.width) * 100;
    const halfY = (STAMP_SIZE / 2 / rect.height) * 100;
    const x = Math.min(100 - half, Math.max(half, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100 - halfY, Math.max(halfY, ((event.clientY - rect.top) / rect.height) * 100));
    addStamp(x, y);
  });

  // 키보드: Enter/Space는 줄 맞춰 찍고, Backspace/Delete는 마지막 도장을 뗌
  board.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const index = stamps.length;
      addStamp(15 + (index % 5) * 17.5, 22 + Math.floor(index / 5) * 28);
    } else if ((event.key === 'Backspace' || event.key === 'Delete') && stamps.length > 0) {
      event.preventDefault();
      if (!locked) removeStamp(stamps[stamps.length - 1]);
    }
  });

  clear.addEventListener('click', () => {
    stamps.forEach((stamp) => stamp.node.remove());
    stamps = [];
    update();
  });

  update();

  return {
    getAnswer: () => ({
      ready: stamps.length > 0 && !tried.has(stamps.length),
      optionId: quiz.options[numbers.indexOf(stamps.length)]?.id ?? null,
    }),
    markWrong() {
      tried.add(stamps.length);
      note.textContent = `${stamps.length}${unit}는 아니에요. 다시 찾아보세요`;
      shake(board);
    },
    markCorrect() { board.classList.add('is-correct'); },
    disable() {
      locked = true;
      board.classList.add('is-locked');
      board.tabIndex = -1;
      clear.disabled = true;
    },
  };
}

// D. 찾아 누르기: 사진에서 한 곳을 찾아 누름
// 보기 = "spot:가로%,세로%,반지름%". 반지름은 사진 가로 길이 기준 %
// 정답 자리를 누르면 정답 보기 id, 헷갈리는 자리를 누르면 그 보기 id, 아무 데나 누르면 null(오답)
function renderFind(quiz, container, onChange) {
  const spots = quiz.options.map((option) => {
    const [, x, y, r] = String(option.content).trim().match(SPOT_PATTERN);
    return { id: option.id, x: Number(x), y: Number(y), r: Number(r) };
  });
  let picked = null; // { x, y, optionId }
  let locked = false;

  const board = element('div', 'quiz-find');
  board.tabIndex = 0;
  board.setAttribute('role', 'button');
  board.setAttribute('aria-label', '유물 사진. 찾은 자리를 눌러 표시하세요');
  const picture = element('img', 'quiz-find__picture');
  picture.alt = '';
  picture.src = quiz.imageUrl || SAMPLE_PICTURE;
  picture.draggable = false;
  picture.addEventListener('error', () => { picture.src = SAMPLE_PICTURE; }, { once: true });
  const marker = element('span', 'quiz-find__marker');
  marker.hidden = true;
  marker.setAttribute('aria-hidden', 'true');
  marker.append(element('span', 'quiz-find__dot'));
  board.append(picture, marker);

  const note = element('p', 'quiz-stamp__note', '실물에서 찾은 자리를 사진에서도 한 번 눌러 보세요. 다시 누르면 옮겨져요');

  function hitTest(xPercent, yPercent) {
    const ratio = picture.naturalHeight && picture.naturalWidth ? picture.naturalHeight / picture.naturalWidth : 1;
    // 반지름이 가로 기준이라, 세로 거리는 사진 비율로 맞춰서 잼
    const hit = spots
      .map((spot) => ({ spot, d: Math.hypot(xPercent - spot.x, (yPercent - spot.y) * ratio) }))
      .filter(({ spot, d }) => d <= spot.r)
      .sort((a, b) => a.d - b.d)[0];
    return hit ? hit.spot.id : null;
  }

  function place(xPercent, yPercent) {
    if (locked) return;
    picked = { x: xPercent, y: yPercent, optionId: hitTest(xPercent, yPercent) };
    marker.hidden = false;
    marker.style.left = `${xPercent}%`;
    marker.style.top = `${yPercent}%`;
    marker.classList.remove('is-popping');
    void marker.offsetWidth;
    marker.classList.add('is-popping');
    board.classList.remove('is-wrong');
    navigator.vibrate?.(15);
    onChange();
  }

  board.addEventListener('pointerdown', (event) => {
    const rect = picture.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    place(x, y);
  });
  // 키보드: Enter/Space는 가운데에 표시, 방향키로 옮기기
  board.addEventListener('keydown', (event) => {
    const step = 4;
    const current = picked ?? { x: 50, y: 50 };
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step], Enter: [0, 0], ' ': [0, 0] };
    if (!moves[event.key]) return;
    event.preventDefault();
    const [dx, dy] = moves[event.key];
    place(Math.min(100, Math.max(0, current.x + dx)), Math.min(100, Math.max(0, current.y + dy)));
  });

  container.replaceChildren(board, note);

  return {
    getAnswer: () => ({ ready: picked !== null, optionId: picked?.optionId ?? null }),
    markWrong() {
      board.classList.add('is-wrong');
      shake(board);
    },
    // 누른 자리에서 동그라미 물결이 퍼짐 (가운데는 비워서 누른 곳이 가려지지 않음)
    markCorrect() {
      board.classList.add('is-correct');
      if (!picked || prefersReducedMotion) return;
      for (let i = 0; i < 3; i += 1) {
        const ripple = element('span', 'quiz-find__ripple');
        ripple.style.left = `${picked.x}%`;
        ripple.style.top = `${picked.y}%`;
        ripple.style.animationDelay = `${i * 180}ms`;
        board.append(ripple);
      }
      addSparks(board, { count: 8, radius: 62, x: `${picked.x}%`, y: `${picked.y}%` });
    },
    disable() {
      locked = true;
      board.tabIndex = -1;
    },
  };
}

// F. 순서 맞추기: 카드를 끌어서 순서대로 놓음
// 실물을 위에서 아래로 훑어봐야 풀 수 있음. 끌기가 어려우면 ▲▼ 버튼으로도 옮김
function renderOrder(quiz, container, onChange) {
  const parse = (text) => String(text).trim().slice(ORDER_PREFIX.length).split(ORDER_SEPARATOR).map((part) => part.trim());
  const sequences = quiz.options.map((option) => ({ id: option.id, key: parse(option.content).join(ORDER_SEPARATOR) }));
  const labels = parse(quiz.options[0].content);
  // 처음 순서는 섞되, 보기 중 어느 것과도 같지 않게 (우연히 정답으로 시작하지 않게)
  let items = shuffle(labels);
  for (let tries = 0; tries < 20 && sequences.some((sequence) => sequence.key === items.join(ORDER_SEPARATOR)); tries += 1) {
    items = shuffle(labels);
  }
  let moved = false;
  let locked = false;

  const wrap = element('div', 'quiz-order');
  const ends = [element('p', 'quiz-order__end', '▲ 위'), element('p', 'quiz-order__end', '▼ 아래')];
  const list = element('ol', 'quiz-order__list');
  wrap.append(ends[0], list, ends[1]);

  function render(focusIndex = null) {
    list.replaceChildren(...items.map((label, index) => {
      const card = element('li', 'quiz-order__card');
      card.dataset.index = String(index);
      const grip = element('span', 'quiz-order__grip');
      grip.setAttribute('aria-hidden', 'true');
      const text = element('span', 'quiz-order__label', label);
      const up = element('button', 'quiz-order__move', '▲');
      up.type = 'button';
      up.disabled = locked || index === 0;
      up.setAttribute('aria-label', `${label} 위로`);
      up.addEventListener('click', () => move(index, index - 1, true));
      const down = element('button', 'quiz-order__move', '▼');
      down.type = 'button';
      down.disabled = locked || index === items.length - 1;
      down.setAttribute('aria-label', `${label} 아래로`);
      down.addEventListener('click', () => move(index, index + 1, true));
      card.append(element('span', 'quiz-order__no', String(index + 1)), grip, text, up, down);
      enableDrag(card, index);
      return card;
    }));
    if (focusIndex !== null) list.children[focusIndex]?.querySelector('.quiz-order__move:not(:disabled)')?.focus();
  }

  function move(from, to, keepFocus = false) {
    if (locked || to < 0 || to >= items.length || from === to) return;
    const [picked] = items.splice(from, 1);
    items.splice(to, 0, picked);
    moved = true;
    wrap.classList.remove('is-wrong');
    navigator.vibrate?.(10);
    render(keepFocus ? to : null);
    onChange();
  }

  // 손가락·마우스로 끌기: 카드를 들어 올려 다른 카드 위치를 지나가면 자리 바꿈
  function enableDrag(card, index) {
    card.addEventListener('pointerdown', (event) => {
      if (locked || event.target.closest('button')) return;
      event.preventDefault();
      const startY = event.clientY;
      const height = card.getBoundingClientRect().height + 8;
      let target = index;
      card.classList.add('is-dragging');
      card.setPointerCapture?.(event.pointerId);
      const onMove = (moveEvent) => {
        const dy = moveEvent.clientY - startY;
        card.style.transform = `translateY(${dy}px)`;
        target = Math.max(0, Math.min(items.length - 1, index + Math.round(dy / height)));
        [...list.children].forEach((other, otherIndex) => {
          if (otherIndex === index) return;
          let shift = 0;
          if (target > index && otherIndex > index && otherIndex <= target) shift = -height;
          if (target < index && otherIndex < index && otherIndex >= target) shift = height;
          other.style.transform = shift ? `translateY(${shift}px)` : '';
        });
      };
      const onUp = () => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerup', onUp);
        card.removeEventListener('pointercancel', onUp);
        if (target !== index) move(index, target);
        else render();
      };
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', onUp);
      card.addEventListener('pointercancel', onUp);
    });
  }

  render();
  const note = element('p', 'quiz-stamp__note', '카드를 길게 끌거나 ▲▼를 눌러 순서를 바꿔요');
  container.replaceChildren(wrap, note);

  return {
    getAnswer: () => ({
      ready: moved,
      optionId: sequences.find((sequence) => sequence.key === items.join(ORDER_SEPARATOR))?.id ?? null,
    }),
    markWrong() {
      wrap.classList.add('is-wrong');
      shake(wrap);
    },
    // 위에서 아래로 카드가 하나씩 차례로 빛나며 번호가 ✓로 바뀜
    markCorrect() {
      wrap.classList.add('is-correct', 'is-celebrate');
    },
    disable() {
      locked = true;
      render();
    },
  };
}

// E. 자물쇠: 관찰한 숫자 여러 개로 비밀번호를 맞춰 여는 게임
// 보기 내용("122" 등)이 비밀번호 후보. 후보에 없는 번호는 서버에 안 보내고 바로 오답 처리
function renderLock(quiz, container, onChange) {
  const length = String(quiz.options[0].content).length;
  const labels = quiz.dialLabels ?? Array.from({ length }, (_, index) => `${index + 1}번`);
  const digits = Array(length).fill(0);
  const tried = new Set();
  let touched = false;

  const lock = element('div', 'quiz-lock');
  const shackle = element('div', 'quiz-lock__shackle');
  shackle.setAttribute('aria-hidden', 'true');
  const body = element('div', 'quiz-lock__body');
  const dials = element('div', 'quiz-lock__dials');

  const dialButtons = [];
  digits.forEach((_, index) => {
    const dial = element('div', 'quiz-lock__dial');
    const up = element('button', 'quiz-lock__step', '▲');
    const down = element('button', 'quiz-lock__step', '▼');
    up.type = 'button';
    down.type = 'button';
    up.setAttribute('aria-label', `${labels[index]} 숫자 올리기`);
    down.setAttribute('aria-label', `${labels[index]} 숫자 내리기`);
    const number = element('span', 'quiz-lock__number', '0');
    number.setAttribute('aria-live', 'polite');

    const turn = (delta) => {
      digits[index] = (digits[index] + delta + 10) % 10; // 9 다음은 0
      number.textContent = String(digits[index]);
      touched = true;
      if (!prefersReducedMotion) {
        number.classList.remove('is-rolling-up', 'is-rolling-down');
        void number.offsetWidth;
        number.classList.add(delta > 0 ? 'is-rolling-up' : 'is-rolling-down');
      }
      onChange();
    };
    up.addEventListener('click', () => turn(1));
    down.addEventListener('click', () => turn(-1));

    dial.append(up, number, down, element('span', 'quiz-lock__label', labels[index]));
    dials.append(dial);
    dialButtons.push(up, down);
  });

  body.append(dials);
  lock.append(shackle, body);
  container.replaceChildren(lock);

  const code = () => digits.join('');

  return {
    getAnswer: () => ({
      ready: touched && !tried.has(code()),
      optionId: quiz.options.find((option) => String(option.content) === code())?.id ?? null,
    }),
    markWrong() {
      tried.add(code());
      shake(lock);
    },
    // 숫자가 하나씩 초록으로 맞춰지고 → 고리가 튕겨 열리며 반짝임
    markCorrect() {
      lock.classList.add('is-open', 'is-celebrate');
      addSparks(lock, { count: 7, radius: 58, x: '50%', y: '42px' });
    },
    disable() { dialButtons.forEach((button) => { button.disabled = true; }); },
  };
}

// ---------------------------------------------------------
// 화면 표시 도우미
// ---------------------------------------------------------
function showFeedback(type, title, message = '') {
  els.feedback.className = `quiz-feedback quiz-feedback--${type}`;
  els.feedbackTitle.textContent = title;
  els.feedbackMessage.textContent = message;
  els.feedback.hidden = false;
  syncHintButton();
}

function hideFeedback() {
  els.feedback.hidden = true;
  syncHintButton();
}

// 힌트가 열려 있으면 버튼이 "힌트 닫기"가 됨
function isHintOpen() {
  return !els.feedback.hidden && els.feedback.classList.contains('quiz-feedback--hint');
}

function syncHintButton() {
  const open = isHintOpen();
  els.hint.textContent = open ? '힌트 닫기' : '힌트 보기';
  els.hint.setAttribute('aria-expanded', String(open));
}

// 게임에서 무언가 바뀌면 제출 버튼을 켜거나 끔
function updateSubmit() {
  if (state.nextUrl || state.submitting) return;
  els.submit.disabled = !state.game?.getAnswer().ready;
  if (els.feedback.classList.contains('quiz-feedback--wrong')) hideFeedback();
}

// 퀴즈가 끝났을 때: 게임을 잠그고 버튼을 "다음으로" 버튼으로 바꿈
function finishQuiz(buttonText, nextUrl) {
  state.game?.disable();
  els.hint.hidden = true;
  state.nextUrl = nextUrl;
  els.submit.textContent = buttonText;
  els.submit.disabled = false;
}

// 퀴즈를 못 불러왔을 때
function showLoadError(message) {
  els.question.textContent = '퀴즈를 불러오지 못했어요';
  els.game.replaceChildren();
  showFeedback('error', '다시 확인해 주세요', message);
  finishQuiz('유물 소개로 돌아가기', exhibitPageUrl);
}

// 유물 이름 · 전시실 (피그마: "소줏고리 · 옹기2전시실")
function renderLabel(exhibit) {
  if (exhibit?.name) {
    els.exhibitName.textContent = exhibit.name;
    document.title = `${exhibit.name} 관찰 미션 | BU:LOG`;
  }
  els.gallery.textContent = exhibit?.exhibitionRoom ?? '';
  els.galleryWrap.hidden = !exhibit?.exhibitionRoom;
}

// ---------------------------------------------------------
// 채점
// ---------------------------------------------------------
function handleCorrect(result) {
  // 정답 연출은 게임마다 맞힌 자리에서 (화면 전체 꽃가루는 그림 채우기 화면에서만)
  const firstTry = state.wrongCount === 0;
  state.game.markCorrect();
  navigator.vibrate?.([40, 60, 40]); // 지원하는 폰에서만 짧게 진동

  showFeedback(
    'correct',
    firstTry ? '한 번에 정답! 그림을 채우러 가요' : '정답이에요! 그림을 채우러 가요',
    result.explanation ?? '',
  );

  const fillId = demo ? (demo.fillId ?? DEMO_FILL_ID) : exhibitId;
  finishQuiz('그림 채우러 가기', fillResultUrl(fillId, result.card?.newlyAcquired, Boolean(demo)));
}

// 틀려도 기회 제한 없이 다시 도전한다.
// 해설은 정답을 알려 주므로 맞혔을 때만 보여 준다.
function handleWrong() {
  state.game.markWrong();
  shake(els.game);
  navigator.vibrate?.(120);

  state.wrongCount += 1;
  const hintTip = state.quiz?.hint ? ' 막히면 힌트를 확인해 보세요.' : '';
  showFeedback('wrong', '아쉬워요!', `유물을 다시 살펴보고 도전해 보세요.${hintTip}`);
  els.submit.textContent = '정답 제출';
  els.submit.disabled = true;
}

// 답을 채점함: 체험 모드는 화면에서, 진짜는 서버에서
async function grade(optionId) {
  if (demo) {
    const correct = optionId === demo.answerOptionId;
    return { correct, explanation: demo.explanation };
  }
  // 숫자 세기·자물쇠에서 보기에 없는 답을 고르면 서버에 보낼 id가 없어서 바로 오답
  if (optionId === null) return { correct: false };
  return unwrap(await submitQuizAnswer(state.quiz.quizId, optionId));
}

async function handleSubmit() {
  // 퀴즈가 끝났으면 버튼은 "다음 화면으로 가기" 역할
  if (state.nextUrl) {
    window.location.href = state.nextUrl;
    return;
  }
  const answer = state.game?.getAnswer();
  if (!answer?.ready || state.submitting) return;

  state.submitting = true;
  els.submit.disabled = true;
  els.submit.textContent = '채점 중...';

  try {
    const result = await grade(answer.optionId);
    if (result.correct) {
      handleCorrect(result);
    } else {
      handleWrong();
    }
  } catch (error) {
    // 403은 보통 보안 토큰(CSRF) 문제
    const message = error.status === 403
      ? '보안 확인에 실패했어요. 새로고침한 뒤 다시 시도해 주세요.'
      : '잠시 후 다시 시도해 주세요.';
    showFeedback('error', '답을 제출하지 못했어요', message);
    els.submit.textContent = '정답 제출';
    els.submit.disabled = false;
  } finally {
    state.submitting = false;
  }
}

els.submit.addEventListener('click', handleSubmit);

// ---------------------------------------------------------
// 힌트 (서버가 hint를 보내줄 때만 보임. 체험 모드에는 있음)
// ---------------------------------------------------------
// 한 번 더 누르면 닫힘
els.hint.addEventListener('click', () => {
  if (!state.quiz?.hint) return;
  if (isHintOpen()) {
    hideFeedback();
    return;
  }
  state.usedHint = true;
  showFeedback('hint', '힌트', state.quiz.hint);
});

// ---------------------------------------------------------
// 4. 퀴즈 받아서 화면 채우기
// ---------------------------------------------------------
function startGame(quiz) {
  state.quiz = quiz;
  els.question.textContent = quiz.question;

  const render = GAME_RENDERERS[detectGameType(quiz)];
  if (!render || !quiz.options?.length) {
    showLoadError('아직 준비 중인 미션이에요.');
    return;
  }
  const type = detectGameType(quiz);
  state.game = render(quiz, els.game, updateSubmit);
  if (type !== 'COUNT' && type !== 'FIND') {
    const photo = renderPhotoCard(quiz);
    if (photo) els.game.prepend(photo);
  }
  els.hint.hidden = !quiz.hint;
  updateSubmit();
}

function startDemo() {
  const badge = element('span', 'quiz-demo-badge', '체험 모드');
  els.topbar.append(badge);
  els.close.href = '/';
  renderLabel(demo.exhibit);
  const fallbackImage = demo.exhibit.name === '소줏고리' ? '/images/exhibits/ongi2-sojutgori.jpg' : null;
  startGame({ imageUrl: fallbackImage, ...demo.quiz });
}

async function renderQuiz() {
  if (demo) {
    startDemo();
    return;
  }
  if (!exhibitId) {
    showLoadError('주소에 전시물 정보가 없어요. QR 코드를 다시 찍어 주세요.');
    return;
  }

  try {
    // 퀴즈와 유물 이름을 동시에 요청 (유물 이름은 실패해도 퀴즈는 보여줌)
    const [quizResponse, exhibitResponse] = await Promise.all([
      getExhibitQuiz(exhibitId),
      getExhibit(exhibitId).catch(() => null),
    ]);
    const exhibit = exhibitResponse ? unwrap(exhibitResponse) : null;
    renderLabel(exhibit);
    // 도장 찍기는 유물 사진 위에 찍음 (사진이 없으면 기본 그림)
    startGame({ ...unwrap(quizResponse), imageUrl: exhibit?.imageUrl });
  } catch (error) {
    if (error.status === 404) {
      showLoadError('이 전시물의 퀴즈를 찾을 수 없어요.');
    } else {
      showLoadError('잠시 후 다시 시도해 주세요.');
    }
  }
}

renderQuiz();