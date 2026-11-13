import { mountLayout } from '../common/layout.js';
import { getExhibit, getExhibitQuiz } from '../api/exhibits-api.js';
import { submitQuizAnswer } from '../api/quiz-api.js';

mountLayout();

// 디자인 규칙: 기회는 2번 (서버가 남은 기회를 보내주게 되면 그 값으로 바꾸기)
const MAX_CHANCES = 2;

// 1. 주소에서 정보 꺼내기
//   ?exhibitId=ongi2-sojutgori  → 서버의 진짜 퀴즈
//   ?demo=choice | count | handle | lock → 서버 없이 체험해 보는 가짜 문제 (회의·시연용)
const params = new URLSearchParams(window.location.search);
const exhibitId = params.get('exhibitId');
const demoKey = params.get('demo');
const exhibitPageUrl = exhibitId ? `/pages/exhibit.html?id=${encodeURIComponent(exhibitId)}` : '/';

function fillResultUrl(id, newlyAcquired) {
  const again = newlyAcquired === false ? '&new=0' : '';
  return `/pages/fill-result.html?exhibitId=${encodeURIComponent(id)}${again}`;
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
const demo = DEMO_QUIZZES[demoKey] ?? null;
const DEMO_FILL_ID = 'ongi2-sojutgori'; // 그림 도감의 소줏고리 자리

// 2. 화면 자리(HTML 태그) 미리 찾아두기
const els = {
  close: document.querySelector('#quiz-close'),
  topbar: document.querySelector('.quiz-topbar'),
  chancesWrap: document.querySelector('#quiz-chances-wrap'),
  chances: document.querySelector('#quiz-chances'),
  chancesText: document.querySelector('#quiz-chances-text'),
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
  chancesLeft: MAX_CHANCES,
  usedHint: false,        // 힌트를 쓰면 일반 유물 (지금은 화면 표시만, 서버 기록은 조장과 확인 필요)
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
function detectGameType(quiz) {
  if (quiz.type) return quiz.type;
  const contents = (quiz.options ?? []).map((option) => String(option.content).trim());
  if (contents.length === 0) return 'MULTIPLE_CHOICE';
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
};

// A. 객관식: 받은 보기 수만큼 A, B, C... 버튼을 만듦 (피그마 03 그대로)
function renderMultipleChoice(quiz, container, onChange) {
  const letters = 'ABCDEFGH';
  let selectedId = null;
  const list = element('div', 'quiz-options');
  list.setAttribute('role', 'radiogroup');
  list.setAttribute('aria-label', '보기');

  const buttons = quiz.options.map((option, index) => {
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
        const selected = quiz.options[otherIndex].id === option.id;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-checked', String(selected));
      });
      onChange();
    });
    list.append(button);
    return button;
  });

  container.replaceChildren(list);
  const selectedButton = () => buttons[quiz.options.findIndex((option) => option.id === selectedId)];

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
    markCorrect() {
      const button = selectedButton();
      button?.classList.remove('is-selected');
      button?.classList.add('is-correct');
    },
    disable() { buttons.forEach((button) => { button.disabled = true; }); },
  };
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
    words: ['연꽃', '꽃', '국화', '모란'],
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
    markCorrect() { lock.classList.add('is-open'); },
    disable() { dialButtons.forEach((button) => { button.disabled = true; }); },
  };
}

// ---------------------------------------------------------
// 화면 표시 도우미
// ---------------------------------------------------------
function renderChances() {
  const dots = [];
  for (let i = 0; i < MAX_CHANCES; i += 1) {
    dots.push(element('span', i < state.chancesLeft ? 'quiz-chance' : 'quiz-chance quiz-chance--used'));
  }
  els.chances.replaceChildren(...dots);
  els.chancesText.textContent = `${state.chancesLeft}번`;
}

function showFeedback(type, title, message = '') {
  els.feedback.className = `quiz-feedback quiz-feedback--${type}`;
  els.feedbackTitle.textContent = title;
  els.feedbackMessage.textContent = message;
  els.feedback.hidden = false;
}

function hideFeedback() {
  els.feedback.hidden = true;
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
  els.chancesWrap.hidden = true;
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
  state.game.markCorrect();
  navigator.vibrate?.([40, 60, 40]); // 지원하는 폰에서만 짧게 진동

  const golden = state.chancesLeft === MAX_CHANCES && !state.usedHint;
  showFeedback(
    'correct',
    golden ? '한 번에 정답! 황금 유물로 채워요' : '정답이에요! 일반 유물로 채워요',
    result.explanation ?? '',
  );

  const fillId = demo ? DEMO_FILL_ID : exhibitId;
  finishQuiz('그림 채우러 가기', fillResultUrl(fillId, result.card?.newlyAcquired));
}

function handleWrong(result) {
  state.game.markWrong();
  shake(els.game);
  navigator.vibrate?.(120);

  state.chancesLeft -= 1;
  renderChances();

  if (state.chancesLeft > 0) {
    // 아직 기회가 남음: 해설은 정답을 알려줄 수 있어서 보여주지 않음
    showFeedback('wrong', '아쉬워요!', `기회가 ${state.chancesLeft}번 남았어요. 유물을 다시 살펴보세요.`);
    els.submit.textContent = '정답 제출';
    els.submit.disabled = true;
    return;
  }

  // 기회를 다 씀
  showFeedback('wrong', '이번엔 아쉬워요', result.explanation ?? '유물을 다시 살펴보고 도전해 보세요.');
  finishQuiz('유물 소개로 돌아가기', exhibitPageUrl);
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
      handleWrong(result);
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
// 힌트를 쓰면 정답이어도 일반 유물
// ---------------------------------------------------------
els.hint.addEventListener('click', () => {
  if (!state.quiz?.hint) return;
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
  state.game = render(quiz, els.game, updateSubmit);
  els.hint.hidden = !quiz.hint;
  renderChances();
  updateSubmit();
}

function startDemo() {
  const badge = element('span', 'quiz-demo-badge', '체험 모드');
  els.topbar.insertBefore(badge, els.chancesWrap);
  els.close.href = '/';
  renderLabel(demo.exhibit);
  startGame(demo.quiz);
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