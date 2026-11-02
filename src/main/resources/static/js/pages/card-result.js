import { mountLayout } from '../common/layout.js';
import { createArtifactCardFront } from '../common/artifact-card.js';
import { SAMPLE_CARDS } from '../common/collection-data.js';

mountLayout();

// 공통 샘플의 소줏고리를 보여준다. API 연결 시 발급된 카드 정보로 교체한다.
const sampleCard = SAMPLE_CARDS.find((card) => card.id === 'sojugori');

const holder = document.createElement('div');
holder.className = 'artifact-card';
holder.append(createArtifactCardFront(sampleCard, { headingLevel: 2 }));
document.querySelector('#card-result').replaceChildren(holder);

// TODO(Frontend B): cardId로 발급된 카드 정보를 조회하고 획득 애니메이션을 적용한다.
