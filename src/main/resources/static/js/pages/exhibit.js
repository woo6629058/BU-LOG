import { mountLayout } from '../common/layout.js';

mountLayout();

const exhibitId = new URLSearchParams(window.location.search).get('id');
const quizLink = document.querySelector('#quiz-link');
if (exhibitId) quizLink.href = `/pages/quiz.html?exhibitId=${encodeURIComponent(exhibitId)}`;

// TODO(Frontend A): getExhibit(exhibitId) 응답으로 전시물 정보를 렌더링한다.
