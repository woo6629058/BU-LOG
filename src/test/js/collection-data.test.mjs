// 그림 도감 샘플 데이터와 계산 함수 테스트. 실행: node --test src/test/js/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOMS,
  SAMPLE_RECORDS,
  acquiredSet,
  describeNextGoal,
  findClosestRoom,
  findRecord,
  findRegion,
  findRoom,
  progressPercent,
  summarizeAll,
  summarizeRoom,
} from '../../main/resources/static/js/common/collection-data.js';

const allIds = () => new Set(ROOMS.flatMap((room) => room.regions.map((region) => region.exhibitId)));

test('전체 구역은 26개다', () => {
  assert.equal(summarizeAll(ROOMS, new Set()).total, 26);
});

test('옹기1은 6구역이고 순서가 1~6이다', () => {
  assert.deepEqual(findRoom(ROOMS, 'ongi1').regions.map((region) => region.order), [1, 2, 3, 4, 5, 6]);
});

test('exhibitId는 모두 다르다', () => {
  const ids = ROOMS.flatMap((room) => room.regions.map((region) => region.exhibitId));
  assert.equal(new Set(ids).size, ids.length);
});

test('샘플 기록 기준 진행', () => {
  const acquired = acquiredSet(SAMPLE_RECORDS);
  assert.deepEqual(summarizeAll(ROOMS, acquired), { filled: 7, total: 26 });
  assert.equal(summarizeRoom(findRoom(ROOMS, 'ongi1'), acquired).filled, 3);
});

test('가장 완성에 가까운 전시실', () => {
  assert.deepEqual(findClosestRoom(ROOMS, acquiredSet(SAMPLE_RECORDS)), { room: findRoom(ROOMS, 'ongi2'), remaining: 1 });
});

test('안내 문구', () => {
  assert.equal(describeNextGoal(ROOMS, acquiredSet(SAMPLE_RECORDS)), '옹기2 그림이 1칸 남았어요');
  assert.equal(describeNextGoal(ROOMS, allIds()), '모든 그림을 완성했어요');
  assert.equal(describeNextGoal(ROOMS, new Set()), '옹기2 그림이 4칸 남았어요');
});

test('모르는 값은 null', () => {
  assert.equal(findRoom(ROOMS, 'nope'), null);
  assert.equal(findRoom(ROOMS, null), null);
  assert.equal(findRegion(ROOMS, 'nope'), null);
  assert.equal(findRegion(ROOMS, undefined), null);
  assert.equal(findRecord(SAMPLE_RECORDS, 'ongi1-siru'), null);
});

test('findRegion은 전시실과 구역을 함께 준다', () => {
  const hit = findRegion(ROOMS, 'ongi1-sojutgori');
  assert.equal(hit.room.id, 'ongi1');
  assert.equal(hit.region.order, 5);
});

test('구역 모양: reveal 그림은 경로, cover 그림은 그림 안쪽 덮개 상자', () => {
  for (const room of ROOMS) {
    for (const item of room.regions) {
      if (room.scene.type === 'reveal') {
        assert.match(item.path, /^M[\d .L]+Z$/, `${item.exhibitId} path`);
      } else {
        const { x, y, w, h } = item.box;
        assert.ok(w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= room.scene.width && y + h <= room.scene.height, `${item.exhibitId} box`);
      }
    }
  }
});

test('progressPercent 경계', () => {
  assert.equal(progressPercent(0, 0), 0);
  assert.equal(progressPercent(3, 6), 50);
  assert.equal(progressPercent(9, 6), 100);
});
