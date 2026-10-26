import { mountLayout } from '../common/layout.js';

mountLayout({ active: 'archive' });

document.querySelector('#card-detail').innerHTML = `
  <div class="empty-state">
    <strong>카드 상세 정보를 불러오는 영역</strong>
    <p>URL의 cardId와 카드 조회 API를 연결해 주세요.</p>
  </div>
`;

// TODO(Frontend B): cardId로 카드 상세를 조회하고 앞면·뒷면 정보를 렌더링한다.
