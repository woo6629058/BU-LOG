// 유물 그림: 진열장·유물 상세 화면에서 함께 쓴다.
// 배경 없는(누끼) 유물 이미지(region.imageSrc, images/artifacts/{유물 ID}.webp)를 쓴다.
// silhouette이면 같은 그림을 회색 실루엣으로 보여 준다 (css/components/artifact-figure.css).

export function artifactFigure(region, { silhouette = false } = {}) {
  const figure = document.createElement('span');
  figure.className = `artifact-figure${silhouette ? ' is-silhouette' : ''}`;
  const image = document.createElement('img');
  image.src = region.imageSrc;
  image.alt = silhouette ? '' : region.artifactName;
  image.loading = 'lazy';
  figure.append(image);
  return figure;
}
