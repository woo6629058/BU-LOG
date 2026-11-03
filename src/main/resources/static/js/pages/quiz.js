import { mountLayout } from '../common/layout.js';
import { getExhibit, getExhibitQuiz } from '../api/exhibits-api.js';
import { submitQuizAnswer } from '../api/quiz-api.js';

mountLayout();

// 디자인 규칙: 기회는 2번 (서버가 남은 기회를 보내주게 되면 그 값으로 바꾸기)
const MAX_CHANCES = 2;

// 1. 주소(?exhibitId=goryeo-celadon)에서 전시물 id 꺼내기
const exhibitId = new URLSearchParams(window.location.search).get('exhibitId');
const exhibitPageUrl = exhibitId ? `/pages/exhibit.html?id=${encodeURIComponent(exhibitId)}` : '/';

// 2. 화면 자리(HTML 태그) 미리 찾아두기
const els = {
  close: document.querySelector('#quiz-close'),
  chancesWrap: document.querySelector('#quiz-chances-wrap'),
  chances: document.querySelector('#quiz-chances'),
  chancesText: document.querySelector('#quiz-chances-text'),
  exhibitName: document.querySelector('#quiz-exhibit-name'),
  question: document.querySelector('#quiz-question'),
  game: document.querySelector('#quiz-game'),
  hint: document.querySelector('#quiz-hint'),
  feedback: document.querySelector('#quiz-feedback'),
  feedbackTitle: document.querySelector('#quiz-feedback-title'),
  feedbackMessage: document.querySelector('#quiz-feedback-message'),
  cta: document.querySelector('#quiz-cta'),
  submit: document.querySelector('#submit-answer'),
};

els.close.href = exhibitPageUrl;

// 3. 지금 퀴즈 상태
const state = {
  quiz: null,             // 서버에서 받은 퀴즈
  selectedOptionId: null, // 지금 고른 보기
  chancesLeft: MAX_CHANCES,
  submitting: false,      // 채점 중이면 버튼 두 번 못 누르게
  nextUrl: null,          // 끝나면 버튼을 눌렀을 때 갈 주소
};

// 서버 응답은 { isSuccess, code, message, result } 형태라 result만 꺼냄
const unwrap = (response) => response?.result ?? response;

// ---------------------------------------------------------
// 게임 종류별 화면
// 새 게임(OX, 사진에서 찾기 등)을 만들면 함수를 하나 만들고 여기에 추가하면 됨
// 서버가 type을 아직 안 보내서, 없으면 객관식(MULTIPLE_CHOICE)으로 봄
// ---------------------------------------------------------
const GAME_RENDERERS = {
  MULTIPLE_CHOICE: renderMultipleChoice,
};

// 객관식: 받은 보기 수만큼 A, B, C... 버튼을 만듦
function renderMultipleChoice(quiz, container) {
  const letters = 'ABCDEFGH';
  const list = document.createElement('div');
  list.className = 'quiz-options';
  list.setAttribute('role', 'radiogroup');
  list.setAttribute('aria-label', '보기');

  quiz.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option';
    button.dataset.optionId = String(option.id);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');

    const letter = document.createElement('span');
    letter.className = 'quiz-option__letter';
    letter.textContent = letters[index] ?? String(index + 1);

    const text = document.createElement('span');
    text.className = 'quiz-option__text';
    text.textContent = option.content;

    button.append(letter, text);
    button.addEventListener('click', () => selectOption(option.id));
    list.append(button);
  });

  container.replaceChildren(list);
}

// 보기 버튼들 찾기
const getOptionButtons = () => [...els.game.querySelectorAll('.quiz-option')];
const findOptionButton = (optionId) =>
  getOptionButtons().find((button) => button.dataset.optionId === String(optionId));

// 보기 고르기
function selectOption(optionId) {
  if (state.submitting || state.nextUrl) return;

  state.selectedOptionId = optionId;
  getOptionButtons().forEach((button) => {
    const selected = button.dataset.optionId === String(optionId);
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-checked', String(selected));
  });

  els.submit.disabled = false;
  hideFeedback();
}

// ---------------------------------------------------------
// 화면 표시 도우미
// ---------------------------------------------------------
function renderChances() {
  const dots = [];
  for (let i = 0; i < MAX_CHANCES; i += 1) {
    const dot = document.createElement('span');
    dot.className = i < state.chancesLeft ? 'quiz-chance' : 'quiz-chance quiz-chance--used';
    dots.push(dot);
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

// 퀴즈가 끝났을 때: 보기를 잠그고 버튼을 "다음으로" 버튼으로 바꿈
function finishQuiz(buttonText, nextUrl) {
  getOptionButtons().forEach((button) => { button.disabled = true; });
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

// ---------------------------------------------------------
// 채점
// ---------------------------------------------------------
function handleCorrect(result) {
  const selected = findOptionButton(state.selectedOptionId);
  selected?.classList.remove('is-selected');
  selected?.classList.add('is-correct');

  const firstTry = state.chancesLeft === MAX_CHANCES;
  showFeedback(
    'correct',
    firstTry ? '한 번에 정답이에요!' : '정답이에요!',
    result.explanation ?? '',
  );

  // 정답이면 서버가 카드를 발급해 줌 → B의 카드 획득 화면으로 이동
  // TODO(B와 확인): card-result.html이 cardId를 어떤 주소 형식으로 받는지
  const cardId = result.card?.cardId;
  if (cardId !== undefined && cardId !== null) {
    finishQuiz('카드 받으러 가기', `/pages/card-result.html?cardId=${encodeURIComponent(cardId)}`);
  } else {
    finishQuiz('유물 소개로 돌아가기', exhibitPageUrl);
  }
}

function handleWrong(result) {
  const selected = findOptionButton(state.selectedOptionId);
  if (selected) {
    selected.classList.remove('is-selected');
    selected.classList.add('is-wrong');
    selected.disabled = true; // 틀린 보기는 다시 못 고름
    selected.setAttribute('aria-checked', 'false');
  }

  state.chancesLeft -= 1;
  state.selectedOptionId = null;
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

async function handleSubmit() {
  // 퀴즈가 끝났으면 버튼은 "다음 화면으로 가기" 역할
  if (state.nextUrl) {
    window.location.href = state.nextUrl;
    return;
  }
  if (state.selectedOptionId === null || state.submitting) return;

  state.submitting = true;
  els.submit.disabled = true;
  els.submit.textContent = '채점 중...';

  try {
    const result = unwrap(await submitQuizAnswer(state.quiz.quizId, state.selectedOptionId));
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
// 힌트 (서버가 hint를 보내줄 때만 보임)
// TODO(조장과 확인): 힌트를 썼다는 사실을 서버에 어떻게 알릴지 (일반 카드 규칙)
// ---------------------------------------------------------
els.hint.addEventListener('click', () => {
  if (!state.quiz?.hint) return;
  showFeedback('hint', '힌트', state.quiz.hint);
});

// ---------------------------------------------------------
// 4. 서버에서 퀴즈 받아서 화면 채우기
// ---------------------------------------------------------
async function renderQuiz() {
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

    const quiz = unwrap(quizResponse);
    const exhibit = exhibitResponse ? unwrap(exhibitResponse) : null;
    state.quiz = quiz;

    if (exhibit?.name) {
      els.exhibitName.textContent = exhibit.name;
      document.title = `${exhibit.name} 관찰 미션 | BU:LOG`;
    }

    els.question.textContent = quiz.question;

    const type = quiz.type ?? 'MULTIPLE_CHOICE';
    const render = GAME_RENDERERS[type];
    if (!render) {
      showLoadError('아직 준비 중인 미션이에요.');
      return;
    }
    render(quiz, els.game);

    els.hint.hidden = !quiz.hint;
    renderChances();
  } catch (error) {
    if (error.status === 404) {
      showLoadError('이 전시물의 퀴즈를 찾을 수 없어요.');
    } else {
      showLoadError('잠시 후 다시 시도해 주세요.');
    }
  }
}

renderQuiz();