export function getRequiredQueryParam(name) {
  const value = new URLSearchParams(window.location.search).get(name);
  if (!value) throw new Error(`필수 주소 정보가 없습니다: ${name}`);
  return value;
}
