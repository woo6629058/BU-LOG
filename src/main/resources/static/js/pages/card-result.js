import { mountLayout } from '../common/layout.js';

mountLayout();

document.querySelector('#card-result').innerHTML = `
  <article class="collectible-card">
    <div class="collectible-card__image" role="img" aria-label="획득 카드 이미지 영역"></div>
    <div class="collectible-card__body">
      <strong>카드 이름</strong>
      <p>백엔드 API 연결 후 획득한 카드가 표시됩니다.</p>
    </div>
  </article>
`;

// TODO(Frontend B): cardId로 발급된 카드 정보를 조회하고 획득 애니메이션을 적용한다.
