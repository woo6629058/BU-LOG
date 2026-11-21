// 명예의 전당·완주자 프로필이 함께 쓰는 완주자 명단과 실시간 기록.
// 완주자: 6개 전시실의 그림 24칸을 모두 채운 사람. 채운 순서대로 완주 번호(No.1, No.2 …)를 받는다.
// 순위는 매기지 않고, 가장 최근에 완주한 사람이 맨 위에 온다.
// 서버(GET /api/hall-of-fame, docs/api-contract.md)는 시각만 주고, 화면에 보이는 문구는 여기서 만든다.
import { getFinisher, getHallOfFame } from '../api/hall-of-fame-api.js';
import { ROOMS } from './collection-data.js';
import { avatarImage, avatarTone } from './explorer-avatar.js';

const pad = (value) => String(value).padStart(2, '0');
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// 서버 시각("2026-11-18T16:27:00")은 한국 시각이라 그대로 읽는다.
const toDate = (value) => new Date(value);
const clock = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// 목록에 보이는 완주 시각: 오늘 16:27 / 어제 16:27 / 11.16 16:27
function shortWhen(date, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return `오늘 ${clock(date)}`;
  if (sameDay(date, yesterday)) return `어제 ${clock(date)}`;
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${clock(date)}`;
}

// 프로필에 보이는 완주 일시: 2026.11.18 16:27
const fullWhen = (date) => `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${clock(date)}`;

// 탐험 시간: 11분 48초 / 1시간 5분
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds ?? 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분 ${pad(seconds % 60)}초`;
}

// 실시간 기록 시각: 방금 / 3분 전 / 2시간 전 / 어제 / 11월 16일
function relativeTime(date, now = new Date()) {
  const minutes = Math.floor((now - date) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (sameDay(date, now)) return `${Math.floor(minutes / 60)}시간 전`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 받침에 따라 조사를 고른다. 마지막 한글 글자를 본다 (예: 추상석(관통석) → 석).
function lastHangul(word) {
  const letters = [...String(word)].filter((letter) => letter >= '가' && letter <= '힣');
  return letters.at(-1) ?? null;
}

function batchim(word) {
  const letter = lastHangul(word);
  return letter ? (letter.charCodeAt(0) - 0xac00) % 28 : 0;
}

const RIEUL = 8;
// 으로/로 (받침 없음·ㄹ받침은 '로'), 을/를
const roParticle = (word) => ([0, RIEUL].includes(batchim(word)) ? '로' : '으로');
const eulParticle = (word) => (batchim(word) === 0 ? '를' : '을');

function toFinisher(item) {
  const finishedAt = toDate(item.finishedAt);
  return {
    no: item.no,
    name: item.name,
    when: shortWhen(finishedAt),
    finishedAt: fullWhen(finishedAt),
    duration: formatDuration(item.durationSeconds),
    message: null, // 한마디: 아직 입력하는 곳이 없다
  };
}

const RECORD_TYPES = { FILL: 'fill', ROOM_DONE: 'done', FINISH: 'finish' };
// 「유물」과 조사(으로) 사이에서 줄이 바뀌지 않게 단어 연결 문자(\u2060)를 넣는다.

// 기록 아이콘 그림: 유물은 배경 없는 유물 그림, 전시실은 홈 전시실 목록의 대표 그림
const artifactImage = (exhibitId) => (exhibitId ? `/images/artifacts/${encodeURIComponent(exhibitId)}.webp` : null);
function roomThumb(roomName) {
  const room = ROOMS.find((item) => item.name === roomName);
  return room ? `/images/home/thumb-${room.id}.webp` : null;
}

function toRecord(item) {
  const type = RECORD_TYPES[item.type] ?? 'fill';
  const name = `${item.name}님이`;
  const room = item.exhibitionRoom ?? '전시실';
  const time = relativeTime(toDate(item.occurredAt));
  if (type === 'finish') {
    return { id: item.id, type, text: `${name} 모든 전시실을 완주했어요`, detail: `No.${item.finisherNo} 완주 · ${formatDuration(item.durationSeconds)}`, time };
  }
  if (type === 'done') {
    return { id: item.id, type, iconSrc: roomThumb(item.exhibitionRoom), text: `${name} ${room}${eulParticle(room)} 완료했어요`, detail: '그림 완성', time };
  }
  const exhibit = item.exhibitName ?? '유물';
  return { id: item.id, type, iconSrc: artifactImage(item.exhibitId), text: `${name} 「${exhibit}」\u2060${roParticle(exhibit)} 그림을 채웠어요`, detail: room, time };
}

// total: 전체 완주자 수, today: 오늘 완주한 수, myNo: 내 완주 번호(완주 전이면 null), myName: 명단에 보이는 내 이름
// finishers: 최근 완주한 순서, records: 최근 기록 순서
// 응답이 오래 걸리면 8초 뒤 끊는다 (본문 받기까지 포함). 끊기면 오류로 처리돼 다음 갱신 때 다시 시도한다.
const HALL_TIMEOUT_MS = 8000;

export async function loadHallOfFame() {
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(HALL_TIMEOUT_MS) : undefined;
  const { result } = await getHallOfFame({ signal });
  return {
    total: result.total,
    today: result.today,
    myNo: result.myNo ?? null,
    myName: result.myName ?? null,
    finishers: (result.finishers ?? []).map(toFinisher),
    records: (result.records ?? []).map(toRecord),
  };
}

// 완주 번호로 완주자 한 명. 번호가 잘못됐거나 없는 번호(404)면 null, 그 밖의 오류는 그대로 던진다.
export async function loadFinisher(no) {
  if (!Number.isInteger(no) || no < 1) return null;
  try {
    const { result } = await getFinisher(no);
    return toFinisher(result);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// 프로필 동그라미(.art-avatar, art-theme.css): 이름으로 고른 유물 그림과 바탕색 (explorer-avatar.js)
export function avatar(name) {
  const node = document.createElement('span');
  node.className = 'art-avatar art-avatar--artifact';
  node.dataset.tone = String(avatarTone(name));
  node.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = avatarImage(name);
  image.alt = '';
  image.decoding = 'async';
  // 그림을 못 불러오면 이름 첫 글자로 보여 준다.
  image.addEventListener('error', () => { node.replaceChildren(name.trim().charAt(0)); }, { once: true });
  node.append(image);
  return node;
}

// 실시간 기록 아이콘 (24×24, 선 색은 글자색을 따른다). finish는 색이 있는 트로피 그림을 쓴다.
const TROPHY_SRC = '/images/home/trophy-color.webp';
const RECORD_ICONS = {
  fill: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M4 16.5l4.5-4.5 4 4 2.5-2.5 5 5"/><circle cx="15.5" cy="9.5" r="1.4"/>',
  done: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

// 그림 채움은 받은 유물 그림, 전시실 완료는 홈의 전시실 그림(iconSrc)을 쓴다.
// 그림이 없거나 못 불러오면 기본 아이콘.
export function recordIcon(type, iconSrc = null) {
  if (iconSrc && type !== 'finish') {
    const image = document.createElement('img');
    image.className = 'is-artifact';
    image.src = iconSrc;
    image.alt = '';
    image.decoding = 'async';
    image.addEventListener('error', () => image.replaceWith(recordIcon(type)), { once: true });
    return image;
  }
  if (type === 'finish') {
    const image = document.createElement('img');
    image.className = 'is-artifact';
    image.src = TROPHY_SRC;
    image.alt = '';
    return image;
  }
  const holder = document.createElement('span');
  holder.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${RECORD_ICONS[type]}</svg>`;
  return holder.firstChild;
}
