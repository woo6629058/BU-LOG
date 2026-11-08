import { mountLayout } from '../common/layout.js';
import { getExhibit, getExhibitQuiz } from '../api/exhibits-api.js';
import { submitQuizAnswer } from '../api/quiz-api.js';

mountLayout();

// 디자인 규칙: 기회는 2번 (서버가 남은 기회를 보내주게 되면 그 값으로 바꾸기)
const MAX_CHANCES = 2;

// 1. 주소에서 정보 꺼내기
//   ?exhibitId=PS01...  → 서버의 진짜 퀴즈
//   ?demo=choice | count | lock → 서버 없이 체험해 보는 가짜 문제 (회의·시연용)
const params = new URLSearchParams(window.location.search);
const exhibitId = params.get('exhibitId');
const demoKey = params.get('demo');
const exhibitPageUrl = exhibitId ? `/pages/exhibit.html?id=${encodeURIComponent(exhibitId)}` : '/';

// 정답이면 진영 님의 04 그림 채우기 화면으로 감 (이미 채운 유물이면 &new=0)
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
const DEMO_FILL_ID = 'ongi2-1'; // 진영 님 그림 도감 샘플의 소줏고리 자리

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
//   보기가 전부 1~2자리 숫자          → 숫자 세기 (예: "5")
//   그 밖                             → 객관식
// 서버 쪽은 지금 구조(질문 + 보기 + 고른 보기 id 제출) 그대로라 변경 없음
// ---------------------------------------------------------
function detectGameType(quiz) {
  if (quiz.type) return quiz.type;
  const contents = (quiz.options ?? []).map((option) => String(option.content).trim());
  if (contents.length === 0) return 'MULTIPLE_CHOICE';
  const length = contents[0].length;
  if (length >= 3 && contents.every((text) => /^\d+$/.test(text) && text.length === length)) return 'LOCK';
  if (contents.every((text) => /^\d{1,2}$/.test(text))) return 'COUNT';
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
  COUNT: renderCount,
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

// B. 숫자 세기: − / + 로 숫자를 골라 제출
// 보기 범위를 그대로 보여주면 답이 좁혀지니까, 범위를 넉넉하게 잡음
function renderCount(quiz, container, onChange) {
  const numbers = quiz.options.map((option) => Number(option.content));
  const max = Math.max(9, Math.ceil(Math.max(...numbers) * 1.5));
  const tried = new Set(); // 이미 틀린 숫자
  let value = 0;
  let touched = false;

  const box = element('div', 'quiz-counter');
  const minus = element('button', 'quiz-counter__button', '−');
  const plus = element('button', 'quiz-counter__button', '+');
  minus.type = 'button';
  plus.type = 'button';
  minus.setAttribute('aria-label', '하나 빼기');
  plus.setAttribute('aria-label', '하나 더하기');

  const display = element('div', 'quiz-counter__display');
  const valueEl = element('span', 'quiz-counter__value', '0');
  valueEl.setAttribute('aria-live', 'polite');
  display.append(valueEl, element('span', 'quiz-counter__unit', quiz.unit ?? '개'));
  box.append(minus, display, plus);

  const note = element('p', 'quiz-counter__note', '실물을 보며 하나씩 세어 보세요');
  container.replaceChildren(box, note);

  function setValue(next, direction) {
    value = Math.min(max, Math.max(0, next));
    touched = true;
    valueEl.textContent = String(value);
    minus.disabled = value === 0;
    plus.disabled = value === max;
    if (!prefersReducedMotion) {
      valueEl.classList.remove('is-rolling-up', 'is-rolling-down');
      void valueEl.offsetWidth;
      valueEl.classList.add(direction > 0 ? 'is-rolling-up' : 'is-rolling-down');
    }
    note.textContent = tried.has(value) ? `${value}${quiz.unit ?? '개'}는 이미 틀렸어요` : '실물을 보며 하나씩 세어 보세요';
    onChange();
  }

  minus.disabled = true;
  minus.addEventListener('click', () => setValue(value - 1, -1));
  plus.addEventListener('click', () => setValue(value + 1, 1));

  return {
    getAnswer: () => ({
      ready: touched && !tried.has(value),
      optionId: quiz.options[numbers.indexOf(value)]?.id ?? null,
    }),
    markWrong() {
      tried.add(value);
      note.textContent = `${value}${quiz.unit ?? '개'}는 아니에요. 다시 세어 보세요`;
      shake(box);
    },
    markCorrect() { box.classList.add('is-correct'); },
    disable() { minus.disabled = true; plus.disabled = true; },
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
  // TODO(조장과 확인): 이 경우도 서버에 시도 기록을 남길지
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
// TODO(조장과 확인): 힌트를 썼다는 사실을 서버에 어떻게 알릴지
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
    renderLabel(exhibitResponse ? unwrap(exhibitResponse) : null);
    startGame(unwrap(quizResponse));
  } catch (error) {
    if (error.status === 404) {
      showLoadError('이 전시물의 퀴즈를 찾을 수 없어요.');
    } else {
      showLoadError('잠시 후 다시 시도해 주세요.');
    }
  }
}

renderQuiz();