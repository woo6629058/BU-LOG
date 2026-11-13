import { mountLayout } from '../common/layout.js';
import { getExhibit, getExhibitQuiz } from '../api/exhibits-api.js';

mountLayout();

// 1. 주소(?id=ongi1-faith-jar)에서 전시물 id 꺼내기
const exhibitId = new URLSearchParams(window.location.search).get('id');
const quizLink = document.querySelector('#quiz-link');
if (exhibitId) quizLink.href = `/pages/quiz.html?exhibitId=${encodeURIComponent(exhibitId)}`;

// 2. 데이터를 넣을 자리(HTML 태그) 미리 찾아두기
const nameEl = document.querySelector('#exhibit-name');
const descriptionEl = document.querySelector('#exhibit-description');
const imageEl = document.querySelector('#exhibit-image');
const galleryEl = document.querySelector('#exhibit-gallery');          // 상단 뒤로가기 옆 전시실 이름
const galleryTagEl = document.querySelector('#exhibit-gallery-tag');   // 태그: 옹기2전시실
const cardNoEl = document.querySelector('#exhibit-card-no');           // 태그: 유물 No.08
const missionQuestionEl = document.querySelector('#mission-question'); // 관찰 미션 질문

// 서버 응답은 { isSuccess, code, message, result } 형태라 result만 꺼냄
const unwrap = (response) => response?.result ?? response;

// 사진 파일이 없거나 깨지면 사진을 숨겨서 갈색 배경 + 안내 문구가 보이게 함
imageEl.addEventListener('error', () => { imageEl.hidden = true; });

// 태그에 글자를 넣고, 글자가 없으면 태그를 숨김
function setTag(element, text) {
  element.textContent = text ?? '';
  element.hidden = !text;
}

// 8 → "No.08"
function formatNumber(number) {
  if (number === undefined || number === null) return null;
  return `No.${String(number).padStart(2, '0')}`;
}

// 3. 실패했을 때 화면에 보여줄 내용
function showError(message) {
  nameEl.textContent = '전시물을 불러오지 못했어요';
  descriptionEl.textContent = message;
  setTag(galleryTagEl, null);
  setTag(cardNoEl, null);
  document.querySelector('.mission-box').hidden = true; // 전시물이 없으면 미션도 숨김
  quizLink.hidden = true; // 전시물이 없으면 퀴즈로 못 가게 버튼 숨김
}

// 4. 관찰 미션 질문 채우기 (실패해도 기본 문구가 남아 있어서 화면은 그대로)
async function renderMissionQuestion() {
  try {
    const quiz = unwrap(await getExhibitQuiz(exhibitId));
    if (quiz?.question) missionQuestionEl.textContent = quiz.question;
  } catch {
    // 퀴즈가 아직 없는 유물이면 기본 문구를 그대로 둠
  }
}

// 5. 서버에서 받아서 화면 채우기
async function renderExhibit() {
  if (!exhibitId) {
    showError('주소에 전시물 정보가 없어요. QR 코드를 다시 찍어 주세요.');
    return;
  }

  try {
    const exhibit = unwrap(await getExhibit(exhibitId));

    document.title = `${exhibit.name} | BU:LOG`;
    nameEl.textContent = exhibit.name;
    descriptionEl.textContent = exhibit.description ?? '';

    // 전시실 이름과 유물 번호 (피그마: "옹기2전시실", "유물 No.08")
    if (exhibit.exhibitionRoom) galleryEl.textContent = exhibit.exhibitionRoom;
    setTag(galleryTagEl, exhibit.exhibitionRoom);
    const numberText = formatNumber(exhibit.cardNumber);
    setTag(cardNoEl, numberText ? `유물 ${numberText}` : null);

    if (exhibit.imageUrl) {
      imageEl.src = exhibit.imageUrl;
      imageEl.alt = exhibit.name;
      imageEl.hidden = false;
    }

    renderMissionQuestion();
  } catch (error) {
    if (error.status === 404) {
      showError('해당 전시물을 찾을 수 없어요. QR 코드를 다시 찍어 주세요.');
    } else {
      showError('잠시 후 다시 시도해 주세요.');
    }
  }
}

renderExhibit();