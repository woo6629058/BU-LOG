// 그림 도감·진열장·홈이 함께 쓰는 수집 데이터와 계산 함수. 계산 함수는 DOM에 의존하지 않는다.
// 전시실마다 그림 한 장이 있고, 구역 하나가 QR 유물 하나·퀴즈 하나와 짝을 이룬다.
//
// 데이터는 두 가지를 이어 붙인다.
// - 그림 정보(이 파일): 전시실 순서, 그림 파일, 구역 모양. 그림이 완성되면 이 파일의 그림·구역 모양만 바꾼다.
// - 유물 정보(서버 GET /api/archive): 유물 24개의 이름·설명·사진·카드 번호와 내가 모은 기록.
//   전시실(exhibitionRoom)과 카드 번호 순서로 구역 1~4번에 차례대로 들어간다.
// 이 파일의 유물 ID·이름은 서버 응답을 받기 전이나 받지 못했을 때 쓰는 기본값이다.
import { getArchive } from '../api/archive-api.js';

// 구역 하나를 만든다. shape는 그림 속 구역 모양이다.
// reveal 그림은 { path }: 그림 픽셀 좌표의 SVG 경로(그림의 점선을 따라 그림, 이웃 구역과 경계 공유).
// cover 그림은 { box: { x, y, w, h } }: 그림 픽셀 좌표의 물음표 덮개 자리(Figma 「전시실 그림」 가림 레이어).
const region = (order, exhibitId, artifactName, shape) => ({
  order,
  title: artifactName,
  exhibitId,
  artifactName,
  description: '',
  era: null,
  photoUrl: null, // 서버의 유물 사진(배경 있음). 화면 그림에는 아직 쓰지 않는다.
  imageSrc: null, // TODO: 배경 없는(누끼) 유물 이미지를 받으면 경로를 넣는다.
  ...shape,
});

// cover 그림 전시실의 구역: [유물 ID, 유물 이름, 덮개 자리]
const coverRegions = (items) =>
  items.map(([exhibitId, name, [x, y, w, h]], index) =>
    region(index + 1, exhibitId, name, { box: { x, y, w, h } }));

export const ROOMS = [
  {
    id: 'ongi1',
    name: '옹기1전시실',
    shortName: '옹기1',
    description: '점말 가마터와 옹기가 쓰이던 모습',
    sceneTitle: '여월동 점말 옹기가마터',
    scene: {
      type: 'reveal',
      width: 850,
      height: 793,
      lockedSrc: '/images/scenes/ongi1-locked.webp',
      colorSrc: '/images/scenes/ongi1-color.webp',
    },
    // 그림은 아직 6구역이라 이웃한 구역을 둘씩 합쳐 4구역으로 쓴다 (위·왼쪽·가운데·오른쪽 아래). 새 그림이 오면 경로만 바꾼다.
    regions: [
      region(1, 'ongi1-faith-jar', '신앙항아리', { path: 'M0 0 L850 0 L850 197 L809 202 L769 206 L730 202 L677 196 L631 199 L565 209 L499 219 L453 230 L426 248 L400 280 L369 291 L340 298 L323 281 L310 258 L307 232 L307 199 L300 173 L277 153 L231 143 L165 136 L99 133 L40 134 L13 149 L0 150 Z M340 298 L369 291 L400 280 L426 248 L453 230 L499 219 L565 209 L631 199 L677 196 L730 202 L769 206 L809 202 L850 197 L850 403 L835 403 L809 410 L769 407 L730 410 L703 423 L684 456 L664 476 L618 489 L593 496 L585 476 L565 450 L532 430 L486 410 L462 393 L429 387 L396 390 L369 384 L369 364 L360 337 L343 311 Z' }),
      region(2, 'ongi1-jubyeong', '주병', { path: 'M0 150 L13 149 L40 134 L99 133 L165 136 L231 143 L277 153 L300 173 L307 199 L307 232 L310 258 L323 281 L340 298 L343 311 L360 337 L369 364 L369 384 L336 403 L290 430 L270 456 L262 493 L218 506 L165 496 L86 499 L40 509 L13 529 L0 530 Z M0 530 L13 529 L40 509 L86 499 L165 496 L218 506 L262 493 L259 516 L272 549 L285 582 L298 615 L315 648 L348 687 L387 720 L434 740 L480 757 L500 793 L0 793 Z' }),
      region(3, 'ongi1-seongju-danji', '성주단지', { path: 'M369 384 L396 390 L429 387 L462 393 L486 410 L532 430 L565 450 L585 476 L593 496 L590 509 L589 549 L585 582 L582 615 L572 648 L559 681 L539 714 L523 740 L510 767 L500 793 L480 757 L434 740 L387 720 L348 687 L315 648 L298 615 L285 582 L272 549 L259 516 L262 493 L270 456 L290 430 L336 403 Z' }),
      region(4, 'ongi1-flower-jar', '화초문항아리', { path: 'M593 496 L618 489 L664 476 L684 456 L703 423 L730 410 L769 407 L809 410 L835 403 L850 403 L850 793 L500 793 L510 767 L523 740 L539 714 L559 681 L572 648 L582 615 L585 582 L589 549 L590 509 Z' }),
    ],
  },
  {
    id: 'ongi2',
    name: '옹기2전시실',
    shortName: '옹기2',
    description: '생활 속 옹기와 발효 과학',
    sceneTitle: '옹기 부엌과 장독대',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/ongi2.png' },
    regions: coverRegions([
      ['ongi2-kongnamul-siru', '콩나물시루', [36, 92, 66, 88]],
      ['ongi2-pattern-jar', '문양항아리', [110, 120, 72, 66]],
      ['ongi2-sojutgori', '소줏고리', [94, 232, 104, 60]],
      ['ongi2-janggun', '장군', [208, 144, 134, 106]],
    ]),
  },
  {
    id: 'local',
    name: '부천향토역사관',
    shortName: '향토역사관',
    description: '고강동 선사유물 · 화유옹주 묘 유물',
    sceneTitle: '선사마을과 옹주의 방',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/local.png' },
    regions: coverRegions([
      ['local-half-moon-knife', '반달돌칼', [14, 222, 76, 44]],
      ['local-spindle-whorl', '가락바퀴', [96, 192, 60, 70]],
      ['local-inhwamun-togibyeong', '인화문 토기병', [208, 152, 68, 66]],
      ['local-cheonghwa-hap', '청화백자연화문합', [268, 124, 72, 42]],
    ]),
  },
  {
    id: 'europe',
    name: '유럽자기전시실',
    shortName: '유럽자기',
    description: '독일 · 프랑스 · 영국의 자기',
    sceneTitle: '유럽 다이닝 룸',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/europe.png' },
    regions: coverRegions([
      ['europe-meissen-plate', '마이센 마크가 있는 접시 액자', [208, 34, 56, 82]],
      ['europe-sevres-vase', '세브르 평화의 화병', [32, 122, 66, 52]],
      ['europe-worcester-vase', '우스터 \'물안개 피는 호수\' 화병', [62, 208, 222, 52]],
      ['europe-flora-danica', '로열 코펜하겐 플로라다니카 디너서비스', [286, 174, 48, 82]],
    ]),
  },
  {
    id: 'education',
    name: '교육전시실',
    shortName: '교육',
    description: '서당부터 7차 교육과정까지',
    sceneTitle: '추억의 교실',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/education.png' },
    regions: coverRegions([
      ['edu-gwageo-answer', '과거시험답안지', [20, 120, 50, 60]],
      ['edu-high-korean', '고등국어', [144, 128, 66, 54]],
      ['edu-school-bell', '학교종', [246, 158, 70, 40]],
      ['edu-diploma', '졸업장', [26, 166, 82, 86]],
    ]),
  },
  {
    id: 'stone',
    name: '수석전시실',
    shortName: '수석',
    description: '자연이 빚은 돌의 아름다움',
    sceneTitle: '산수경 정원',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/stone.png' },
    regions: coverRegions([
      ['stone-gwantong', '추상석(관통석)', [16, 88, 92, 150]],
      ['stone-dohyeong-sansu', '도형산수경석', [114, 188, 120, 66]],
      ['stone-sansu-munyang', '산수문양석', [242, 202, 88, 58]],
      ['stone-sunflower', '해바라기문양석', [250, 114, 68, 70]],
    ]),
  },
];

// 서버 카드 하나로 구역의 유물 정보를 바꾼다. 그림 모양(path·box)과 순서는 그대로 둔다.
const fillRegion = (item, card) => ({
  ...item,
  exhibitId: card.exhibitId,
  title: card.name,
  artifactName: card.name,
  description: card.description ?? '',
  era: card.era ?? null,
  photoUrl: card.imageUrl ?? null,
});

// 서버 카드 목록을 전시실 그림에 이어 붙인다. 전시실 이름이 같은 카드를 카드 번호 순서로 구역 1번부터 채운다.
export function mergeCards(rooms, cards) {
  return rooms.map((room) => {
    const roomCards = cards
      .filter((card) => card.exhibitionRoom === room.name)
      .sort((a, b) => (a.cardNumber ?? 0) - (b.cardNumber ?? 0));
    return {
      ...room,
      regions: room.regions.map((item, index) => (roomCards[index] ? fillRegion(item, roomCards[index]) : item)),
    };
  });
}

// 모은 카드만 내 기록으로 바꾼다: { exhibitId, cardId, acquiredAt }
export const toRecords = (cards) =>
  cards
    .filter((card) => card.acquired)
    .map(({ exhibitId, cardId, acquiredAt }) => ({ exhibitId, cardId, acquiredAt }));

// 화면이 쓰는 전시실 그림과 내 기록을 서버에서 받아 온다.
// 받지 못하면 이 파일의 기본 유물로 그리고, 기록은 비운다.
export async function loadCollection() {
  try {
    const response = await getArchive();
    const cards = (response?.result ?? response)?.cards ?? [];
    return { rooms: mergeCards(ROOMS, cards), records: toRecords(cards) };
  } catch (error) {
    console.warn('[BU:LOG] 수집 기록을 불러오지 못해 기본 유물로 그립니다.', error);
    return { rooms: ROOMS, records: [] };
  }
}

export const acquiredSet = (records) => new Set(records.map((record) => record.exhibitId));

export const findRoom = (rooms, roomId) => rooms.find((room) => room.id === roomId) ?? null;

export function findRegion(rooms, exhibitId) {
  for (const room of rooms) {
    const found = room.regions.find((item) => item.exhibitId === exhibitId);
    if (found) return { room, region: found };
  }
  return null;
}

export const findRecord = (records, exhibitId) => records.find((record) => record.exhibitId === exhibitId) ?? null;

export function summarizeRoom(room, acquired) {
  const total = room.regions.length;
  const filled = room.regions.filter((item) => acquired.has(item.exhibitId)).length;
  return { room, filled, total, complete: total > 0 && filled === total };
}

export function summarizeAll(rooms, acquired) {
  return rooms.reduce(
    (sum, room) => {
      const { filled, total } = summarizeRoom(room, acquired);
      return { filled: sum.filled + filled, total: sum.total + total };
    },
    { filled: 0, total: 0 },
  );
}

// 남은 칸이 가장 적은 미완성 전시실. 동률이면 전시실 순서가 앞선 쪽. 모두 완성이면 null.
export function findClosestRoom(rooms, acquired) {
  let closest = null;
  for (const room of rooms) {
    const { filled, total } = summarizeRoom(room, acquired);
    const remaining = total - filled;
    if (remaining === 0) continue;
    if (!closest || remaining < closest.remaining) closest = { room, remaining };
  }
  return closest;
}

// 홈 진행 카드의 안내 문구.
export function describeNextGoal(rooms, acquired) {
  const closest = findClosestRoom(rooms, acquired);
  return closest ? `${closest.room.shortName} 그림이 ${closest.remaining}칸 남았어요` : '모든 그림을 완성했어요';
}

// 진행률(%)을 0~100 사이로 계산한다. 전체가 0이면 0.
export function progressPercent(filled, total) {
  return total > 0 ? Math.min(100, Math.max(0, (filled / total) * 100)) : 0;
}
