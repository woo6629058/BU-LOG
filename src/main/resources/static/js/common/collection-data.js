// 그림 도감 화면용 샘플 데이터와 계산 함수. DOM에 의존하지 않는다.
// 전시실마다 그림 한 장이 있고, 구역 하나가 QR 유물 하나·퀴즈 하나와 짝을 이룬다.
// 샘플은 화면 표시용 형식이며 API 응답 형식이 아니다.
// TODO(Frontend B): API 명세 확정 후 API 응답을 이 형식으로 변환해 샘플을 대체한다.

// 구역 하나를 만든다. shape는 그림 속 구역 모양이다.
// reveal 그림은 { path }: 그림 픽셀 좌표의 SVG 경로(그림의 점선을 따라 그림, 이웃 구역과 경계 공유).
// cover 그림은 { box: { x, y, w, h } }: 그림 픽셀 좌표의 물음표 덮개 자리(Figma 「전시실 그림」 가림 레이어).
const region = (order, title, exhibitId, artifactName, description, shape) => ({
  order,
  title,
  exhibitId,
  artifactName,
  description,
  imageSrc: null, // TODO: 배경 없는(누끼) 유물 이미지를 받으면 경로를 넣는다.
  ...shape,
});

// cover 그림 전시실의 구역: 전시실 그림의 유물 이름이 곧 구역 이름이다.
const coverRegions = (roomId, items) =>
  items.map(([name, description, [x, y, w, h]], index) =>
    region(index + 1, name, `${roomId}-${index + 1}`, name, description, { box: { x, y, w, h } }));

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
    regions: [
      region(1, '가마터의 역사', 'ongi1-kiln', '옹기 가마', '여월동 점말에는 옹기를 굽던 가마터가 있었어요. 언덕을 따라 길게 이어진 가마에 불을 때 옹기를 구웠어요.',
        { path: 'M0 0 L850 0 L850 197 L809 202 L769 206 L730 202 L677 196 L631 199 L565 209 L499 219 L453 230 L426 248 L400 280 L369 291 L340 298 L323 281 L310 258 L307 232 L307 199 L300 173 L277 153 L231 143 L165 136 L99 133 L40 134 L13 149 L0 150 Z' }),
      region(2, '옹기 만들기', 'ongi1-making', '물레와 옹기', '옹기장은 물레를 돌리며 흙가래를 쌓아 올려 옹기의 모양을 빚었어요.',
        { path: 'M369 384 L396 390 L429 387 L462 393 L486 410 L532 430 L565 450 L585 476 L593 496 L590 509 L589 549 L585 582 L582 615 L572 648 L559 681 L539 714 L523 740 L510 767 L500 793 L480 757 L434 740 L387 720 L348 687 L315 648 L298 615 L285 582 L272 549 L259 516 L262 493 L270 456 L290 430 L336 403 Z' }),
      region(3, '장독에 저장하고 발효하기', 'ongi1-jangdok', '장독', '숨 쉬는 옹기 장독에 된장·간장·김치를 담아 오래 두고 발효시켰어요.',
        { path: 'M0 530 L13 529 L40 509 L86 499 L165 496 L218 506 L262 493 L259 516 L272 549 L285 582 L298 615 L315 648 L348 687 L387 720 L434 740 L480 757 L500 793 L0 793 Z' }),
      region(4, '시루로 요리하기', 'ongi1-siru', '시루', '바닥에 구멍이 뚫린 시루를 솥 위에 얹고 김을 올려 떡을 쪘어요.',
        { path: 'M340 298 L369 291 L400 280 L426 248 L453 230 L499 219 L565 209 L631 199 L677 196 L730 202 L769 206 L809 202 L850 197 L850 403 L835 403 L809 410 L769 407 L730 410 L703 423 L684 456 L664 476 L618 489 L593 496 L585 476 L565 450 L532 430 L486 410 L462 393 L429 387 L396 390 L369 384 L369 364 L360 337 L343 311 Z' }),
      region(5, '술 빚기(소줏고리)', 'ongi1-sojutgori', '소줏고리', '소줏고리는 발효시킨 술을 끓여 맑은 소주를 받아 내던 옹기예요. 위로 올라간 김이 식으면서 맺힌 술방울이 꼭지를 따라 흘러나옵니다.',
        { path: 'M0 150 L13 149 L40 134 L99 133 L165 136 L231 143 L277 153 L300 173 L307 199 L307 232 L310 258 L323 281 L340 298 L343 311 L360 337 L369 364 L369 384 L336 403 L290 430 L270 456 L262 493 L218 506 L165 496 L86 499 L40 509 L13 529 L0 530 Z' }),
      region(6, '크게 저장하기(장군)', 'ongi1-janggun', '장군', '장군은 눕혀 놓고 쓰는 배 불룩한 옹기로, 물이나 술, 거름을 담아 나르고 저장했어요.',
        { path: 'M593 496 L618 489 L664 476 L684 456 L703 423 L730 410 L769 407 L809 410 L835 403 L850 403 L850 793 L500 793 L510 767 L523 740 L539 714 L559 681 L572 648 L582 615 L585 582 L589 549 L590 509 Z' }),
    ],
  },
  {
    id: 'ongi2',
    name: '옹기2전시실',
    shortName: '옹기2',
    description: '생활 속 옹기와 발효 과학',
    sceneTitle: '옹기 부엌과 장독대',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/ongi2.png' },
    regions: coverRegions('ongi2', [
      ['소줏고리', '발효시킨 술을 끓여 맑은 소주를 받아 내던 옹기예요.', [36, 92, 66, 88]],
      ['시루', '김을 올려 떡을 찌던 구멍 뚫린 옹기예요.', [110, 120, 72, 66]],
      ['장군', '물이나 술을 담아 나르던 배 불룩한 옹기예요.', [94, 232, 104, 60]],
      ['장독', '장과 김치를 담아 발효시키던 옹기예요.', [208, 144, 134, 106]],
    ]),
  },
  {
    id: 'local',
    name: '부천향토역사관',
    shortName: '향토역사관',
    description: '고강동 선사유물 · 화유옹주 묘 유물',
    sceneTitle: '선사마을과 옹주의 방',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/local.png' },
    regions: coverRegions('local', [
      ['반달돌칼', '고강동 선사 유적에서 나온 반달 모양 돌칼로, 곡식 이삭을 땄어요.', [14, 222, 76, 44]],
      ['구멍무늬토기', '아가리 아래에 구멍을 줄지어 뚫은 청동기 시대 토기예요.', [96, 192, 60, 70]],
      ['은제과형주전자', '화유옹주 묘에서 나온 과일 모양 은 주전자예요.', [208, 152, 68, 66]],
      ['옥제석류잠', '석류 모양을 새긴 옥 비녀예요.', [268, 124, 72, 42]],
    ]),
  },
  {
    id: 'europe',
    name: '유럽자기전시실',
    shortName: '유럽자기',
    description: '독일 · 프랑스 · 영국의 자기',
    sceneTitle: '유럽 다이닝 룸',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/europe.png' },
    regions: coverRegions('europe', [
      ['평화의 화병', '부천시립박물관이 소장한 유럽 자기 화병이에요.', [208, 34, 56, 82]],
      ['마이센 자기 새', '독일 마이센 가마에서 만든 새 모양 자기예요.', [32, 122, 66, 52]],
      ['디너 서비스', '19세기 유럽 저녁 식탁을 차리던 자기 그릇 한 벌이에요.', [62, 208, 222, 52]],
      ['자기 인형', '유럽 귀족들이 장식으로 즐기던 자기 인형이에요.', [286, 174, 48, 82]],
    ]),
  },
  {
    id: 'education',
    name: '교육전시실',
    shortName: '교육',
    description: '서당부터 7차 교육과정까지',
    sceneTitle: '추억의 교실',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/education.png' },
    regions: coverRegions('education', [
      ['학교종', '수업의 시작과 끝을 알리던 종이에요.', [20, 120, 50, 60]],
      ['양은도시락', '난로 위에 올려 데워 먹던 양은 도시락이에요.', [144, 128, 66, 54]],
      ['동몽선습', '서당에서 아이들이 배우던 교과서예요.', [246, 158, 70, 40]],
      ['교복과 책가방', '옛 학생들이 입고 메던 교복과 책가방이에요.', [26, 166, 82, 86]],
    ]),
  },
  {
    id: 'stone',
    name: '수석전시실',
    shortName: '수석',
    description: '자연이 빚은 돌의 아름다움',
    sceneTitle: '산수경 정원',
    scene: { type: 'cover', width: 342, height: 300, src: '/images/scenes/stone.png' },
    regions: coverRegions('stone', [
      ['대형 수석', '사람 키만 한 큰 수석이에요.', [16, 88, 92, 150]],
      ['도형산수경석', '산과 물이 어우러진 풍경을 닮은 돌이에요.', [114, 188, 120, 66]],
      ['화문구갑석', '거북 등딱지 같은 무늬에 꽃무늬가 든 돌이에요.', [242, 202, 88, 58]],
      ['청송 꽃돌', '단면에 꽃이 핀 듯한 무늬가 보이는 청송의 돌이에요.', [250, 114, 68, 70]],
    ]),
  },
];

// 내 기록 샘플: Figma 시안처럼 일부만 채운 상태 (7 / 26).
export const SAMPLE_RECORDS = [
  { exhibitId: 'ongi1-kiln', acquiredAt: '2026-11-06T10:05:00' },
  { exhibitId: 'ongi1-making', acquiredAt: '2026-11-06T10:09:00' },
  { exhibitId: 'ongi1-sojutgori', acquiredAt: '2026-11-06T10:14:00' },
  { exhibitId: 'ongi2-1', acquiredAt: '2026-11-06T10:21:00' },
  { exhibitId: 'ongi2-2', acquiredAt: '2026-11-06T10:24:00' },
  { exhibitId: 'ongi2-3', acquiredAt: '2026-11-06T10:27:00' },
  { exhibitId: 'local-1', acquiredAt: '2026-11-06T10:40:00' },
];

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
