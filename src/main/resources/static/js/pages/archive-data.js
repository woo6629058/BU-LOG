// 카드북 화면용 샘플 데이터와 계산 함수. DOM에 의존하지 않는다.
// 샘플은 Figma 시안 수치를 재현한 화면 표시용 형식이며 API 응답 형식이 아니다.
// TODO(Frontend B): API 명세 확정 후 getArchive() 응답을 이 형식으로 변환해 샘플을 대체한다.

export const ALL_ROOMS = 'all';
const CARDS_PER_ROOM = 4;

export const SAMPLE_ROOMS = [
  { id: 'ongi1', name: '옹기1전시실', shortName: '옹기1' },
  { id: 'ongi2', name: '옹기2전시실', shortName: '옹기2' },
  { id: 'local', name: '부천향토역사관', shortName: '향토역사관' },
  { id: 'europe', name: '유럽자기전시실', shortName: '유럽자기' },
  { id: 'education', name: '교육전시실', shortName: '교육' },
  { id: 'stone', name: '수석전시실', shortName: '수석' },
];

// 카드 번호별 획득 카드. 번호는 전시실 순서대로 4장씩 배정한다 (옹기1 1–4, 옹기2 5–8, ...).
const SAMPLE_ACQUIRED = {
  5: { name: '소줏고리', grade: 'gold' },
  6: { name: '양념단지', grade: 'normal' },
  7: { name: '시루', grade: 'gold' },
  8: { name: '장군', grade: 'normal' },
  9: { name: '반달돌칼', grade: 'gold' },
  10: { name: '구멍무늬토기', grade: 'normal' },
  13: { name: '명화의 화병', grade: 'gold' },
};

export const SAMPLE_CARDS = SAMPLE_ROOMS.flatMap((room, roomIndex) =>
  Array.from({ length: CARDS_PER_ROOM }, (_, index) => {
    const number = roomIndex * CARDS_PER_ROOM + index + 1;
    const acquired = SAMPLE_ACQUIRED[number];
    return {
      acquired: Boolean(acquired),
      number,
      roomId: room.id,
      roomName: room.name,
      ...acquired,
    };
  }),
);

export function filterCards(cards, roomId) {
  return roomId === ALL_ROOMS ? cards : cards.filter((card) => card.roomId === roomId);
}

export function summarize(cards) {
  return {
    acquired: cards.filter((card) => card.acquired).length,
    total: cards.length,
  };
}

// 세트 완성까지 남은 장 수가 가장 적은 전시실을 고른다. 동률이면 전시실 순서가 앞선 쪽.
// 모든 세트가 완성되었거나 카드가 없으면 null.
export function findClosestRoom(rooms, cards) {
  let closest = null;
  for (const room of rooms) {
    const { acquired, total } = summarize(filterCards(cards, room.id));
    const remaining = total - acquired;
    if (total === 0 || remaining === 0) continue;
    if (!closest || remaining < closest.remaining) closest = { room, remaining };
  }
  return closest;
}

// 전체 필터는 완성에 가장 가까운 전시실을, 전시실 필터는 해당 전시실을 안내한다.
// 이미 완성했거나 카드가 없는 전시실은 null.
export function findBannerRoom(rooms, cards, selectedRoomId) {
  if (selectedRoomId === ALL_ROOMS) return findClosestRoom(rooms, cards);

  const room = rooms.find((item) => item.id === selectedRoomId);
  if (!room) return null;
  const { acquired, total } = summarize(filterCards(cards, room.id));
  const remaining = total - acquired;
  return total > 0 && remaining > 0 ? { room, remaining } : null;
}
