// 탐험가 프로필 그림: 수집 유물 24개 중 하나(배경 없는 그림)와 바탕색 번호(0~4).
// 프로필 사진을 고르는 화면이 없어서 이름으로 고른다. 같은 이름은 어느 화면에서나 같은 유물이 나온다.
// 명예의 전당(hall-of-fame-data.js)과 가입 완료·게스트 환영 화면이 함께 쓴다.
import { ROOMS } from './collection-data.js';

const AVATAR_TONES = 5;
const AVATAR_IMAGES = ROOMS.flatMap((room) => room.regions.map((region) => region.imageSrc));

function hashName(name) {
  let hash = 0;
  for (const letter of String(name).trim()) hash = (hash * 31 + letter.codePointAt(0)) >>> 0;
  return hash;
}

export const avatarImage = (name) => AVATAR_IMAGES[hashName(name) % AVATAR_IMAGES.length];
export const avatarTone = (name) => hashName(name) % AVATAR_TONES;
