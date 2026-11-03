import { mountLayout } from '../common/layout.js';
import { bindArtifactCardImages, renderArtifactCard } from '../common/artifact-card.js';

mountLayout();

// Figma 시안 문구 기반 샘플. API 연결 시 발급된 카드 정보로 교체한다.
const sampleCard = {
  acquired: true,
  number: 5,
  grade: 'gold',
  name: '소줏고리',
  roomName: '옹기2전시실',
};

const cardResult = document.querySelector('#card-result');
cardResult.innerHTML = renderArtifactCard(sampleCard, { headingLevel: 2 });
bindArtifactCardImages(cardResult);

// TODO(Frontend B): cardId로 발급된 카드 정보를 조회하고 획득 애니메이션을 적용한다.
