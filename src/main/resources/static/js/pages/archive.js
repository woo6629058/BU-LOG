import { mountLayout } from '../common/layout.js';

mountLayout({ active: 'archive' });

document.querySelector('#archive-grid').innerHTML = `
  <div class="empty-state">
    <strong>아직 수집한 카드가 없어요.</strong>
    <p>전시물의 퀴즈를 풀고 첫 카드를 획득해 보세요.</p>
  </div>
`;

// TODO(Frontend B): getArchive() 응답으로 획득 및 잠금 카드를 함께 렌더링한다.
