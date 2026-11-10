// 유물 그림: 진열장·유물 상세 화면에서 함께 쓴다.
// 배경 없는(누끼) 유물 이미지(region.imageSrc)를 쓰고, 아직 없으면 항아리 모양 임시 그림을 쓴다.
// silhouette이면 같은 그림을 회색 실루엣으로 보여 준다 (css/components/artifact-figure.css).

const PLACEHOLDER = `
  <svg class="artifact-figure__placeholder" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M16 6h16v4c6 3 9 9 9 16 0 10-7 16-17 16S7 36 7 26c0-7 3-13 9-16z"/>
    <path class="artifact-figure__rim" d="M15 6h18v4H15z"/>
  </svg>`;

export function artifactFigure(region, { silhouette = false } = {}) {
  const figure = document.createElement('span');
  figure.className = `artifact-figure${silhouette ? ' is-silhouette' : ''}`;
  if (region.imageSrc) {
    const image = document.createElement('img');
    image.src = region.imageSrc;
    image.alt = silhouette ? '' : region.artifactName;
    image.loading = 'lazy';
    figure.append(image);
  } else {
    figure.innerHTML = PLACEHOLDER;
  }
  return figure;
}
