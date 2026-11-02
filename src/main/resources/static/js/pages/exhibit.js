import { mountLayout } from '../common/layout.js';
import { getExhibit } from '../api/exhibits-api.js';

mountLayout();

// 1. 주소(?id=goryeo-celadon)에서 전시물 id 꺼내기
const exhibitId = new URLSearchParams(window.location.search).get('id');
const quizLink = document.querySelector('#quiz-link');
if (exhibitId) quizLink.href = `/pages/quiz.html?exhibitId=${encodeURIComponent(exhibitId)}`;

// 2. 데이터를 넣을 자리(HTML 태그) 미리 찾아두기
const nameEl = document.querySelector('#exhibit-name');
const eraEl = document.querySelector('#exhibit-era');
const descriptionEl = document.querySelector('#exhibit-description');
const imageEl = document.querySelector('#exhibit-image');

// 사진 파일이 없거나 깨지면 사진을 숨겨서 갈색 배경 + 안내 문구가 보이게 함
imageEl.addEventListener('error', () => { imageEl.hidden = true; });

// 3. 실패했을 때 화면에 보여줄 내용
function showError(message) {
  nameEl.textContent = '전시물을 불러오지 못했어요';
  descriptionEl.textContent = message;
  eraEl.hidden = true;
  document.querySelector('.mission-box').hidden = true; // 전시물이 없으면 미션도 숨김
  quizLink.hidden = true; // 전시물이 없으면 퀴즈로 못 가게 버튼 숨김
}

// 4. 서버에서 받아서 화면 채우기
async function renderExhibit() {
  if (!exhibitId) {
    showError('주소에 전시물 정보가 없어요. QR 코드를 다시 찍어 주세요.');
    return;
  }

  try {
    const exhibit = await getExhibit(exhibitId);

    document.title = `${exhibit.name} | BU:LOG`;
    nameEl.textContent = exhibit.name;
    descriptionEl.textContent = exhibit.description;

    // 시대: 디자인에는 없어서 값이 있을 때만 태그로 표시 (회의 후 뺄 수도 있음)
    if (exhibit.era) {
      eraEl.textContent = exhibit.era;
      eraEl.hidden = false;
    }

    if (exhibit.imageUrl) {
      imageEl.src = exhibit.imageUrl;
      imageEl.alt = exhibit.name;
      imageEl.hidden = false;
    }

    // TODO(회의 후): 전시실 이름, 카드 번호, 미션 문구를 API 값으로 채우기
  } catch (error) {
    if (error.status === 404) {
      showError('해당 전시물을 찾을 수 없어요. QR 코드를 다시 찍어 주세요.');
    } else {
      showError('잠시 후 다시 시도해 주세요.');
    }
  }
}

renderExhibit();