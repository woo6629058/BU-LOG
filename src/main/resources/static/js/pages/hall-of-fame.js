import { getMe } from '../api/auth-api.js';
import { mountTabBar } from '../common/tab-bar.js';
import { countUp, rise } from '../common/motion.js';
import { acquiredSet, loadCollection, summarizeAll } from '../common/collection-data.js';
import { avatar, loadHallOfFame, recordIcon } from '../common/hall-of-fame-data.js';

mountTabBar({ active: 'ranking' });

// 명예의 전당(완주자·실시간 기록)과 내 수집 기록·닉네임을 서버에서 받는다.
// 처음 온 방문자는 첫 요청에서 방문자 쿠키를 받으므로, 수집 기록을 먼저 받은 뒤 나머지를 함께 부른다
// (동시에 부르면 요청마다 다른 방문자가 만들어질 수 있다).
// 명예의 전당을 못 받으면 0명·빈 기록 대신 '불러오지 못했어요'를 보여 주고, 다음 갱신 때 다시 시도한다.
const EMPTY_HALL = { total: 0, today: 0, myNo: null, myName: null, finishers: [], records: [] };
const { rooms, records } = await loadCollection();
const [member, loadedHall] = await Promise.all([
  getMe().catch(() => null),
  loadHallOfFame().catch(() => null),
]);
let hall = loadedHall ?? EMPTY_HALL;
let loadFailed = loadedHall === null;
// 실시간 기록을 다시 받아 오는 간격 (알약이 3.2초마다 흘러가서 10초면 끊김 없이 이어져 보임)
const REFRESH_MS = 10000;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* 완주자 요약과 명단 */

function renderSummary({ animate = true } = {}) {
  const total = document.querySelector('#hof-total');
  if (loadFailed) total.textContent = '-';
  else if (animate) countUp(total, hall.total);
  else total.textContent = hall.total;
  document.querySelector('#hof-total-label').textContent = loadFailed ? '완주자 수를 불러오지 못했어요' : `${hall.total}명`;
  document.querySelector('#hof-today').textContent = hall.today > 0 ? `오늘 +${hall.today}명` : '';
}

// 완주자가 없거나 못 받아 왔을 때 목록 자리에 보이는 문구
// 아직 아무도 완주하지 않았으면 트로피 그림과 QR 스캔으로 가는 버튼을 함께 보여 준다.
function renderEmptyList() {
  const li = element('li', 'hof__empty');
  if (!loadFailed) {
    const trophy = element('img', 'hof__empty-trophy');
    trophy.src = '/images/home/trophy-color.webp';
    trophy.alt = '';
    li.append(trophy);
  }
  li.append(
    element('p', 'hof__empty-title', loadFailed ? '명단을 불러오지 못했어요' : '아직 완주한 탐험가가 없어요'),
    element('p', 'hof__empty-text', loadFailed ? '잠시 뒤 다시 열어 주세요' : '여섯 전시실 그림을 모두 채우고 첫 번째 완주자가 되어 보세요!'),
  );
  if (!loadFailed) {
    const scan = element('a', 'hof__empty-action art-button', 'QR 스캔하러 가기');
    scan.href = '/pages/qr-scan.html';
    li.append(scan);
  }
  return li;
}

// 완주자가 없으면 '완주한 탐험가들이에요'·'누르면 프로필' 문구가 맞지 않아 바꾸거나 숨긴다.
function renderListText() {
  const empty = hall.finishers.length === 0;
  document.querySelector('#hof-intro').textContent = empty && !loadFailed
    ? '전시실 그림을 모두 완성하면 이곳에 이름이 올라가요'
    : '전시실 그림을 모두 완성한 탐험가들이에요';
  document.querySelector('#hof-list-meta').hidden = empty;
}

// 지금 보이는 명단 (같으면 다시 그리지 않아 떠오르는 움직임이 되풀이되지 않게 한다)
let shownFinisherKey = null;

function renderList() {
  const key = `${loadFailed}:${hall.finishers.map((finisher) => finisher.no).join(',')}`;
  if (key === shownFinisherKey) return;
  shownFinisherKey = key;
  renderListText();
  const list = document.querySelector('#hof-list');
  if (hall.finishers.length === 0) list.replaceChildren(renderEmptyList());
  else list.replaceChildren(...hall.finishers.map(renderFinisher));
}

// 맨 위(가장 최근) 완주자에게만 NEW 배지를 붙인다.
function renderFinisher(finisher, index) {
  const link = element('a', 'hof-finisher art-pressable');
  link.href = `/pages/finisher.html?no=${finisher.no}`;

  const nameRow = element('span', 'hof-finisher__name-row');
  nameRow.append(element('span', 'hof-finisher__name', finisher.name));
  if (index === 0) {
    link.classList.add('is-new');
    nameRow.append(element('span', 'hof-finisher__new', 'NEW'));
  }
  const text = element('span', 'hof-finisher__text');
  text.append(nameRow, element('span', 'hof-finisher__when', `${finisher.when} 완주`));

  const chevron = element('span', 'hof-finisher__chevron');
  chevron.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg>';

  link.append(element('span', 'hof-finisher__no art-badge', `No.${finisher.no}`), avatar(finisher.name), text, chevron);
  const li = element('li');
  li.append(link);
  return rise(li, index);
}

/* 내 기록: 아직 완주 전이면 남은 칸 수와 완주했을 때 받을 번호를 보여 준다. */

function renderMe() {
  const { filled, total } = summarizeAll(rooms, acquiredSet(records));
  const remaining = total - filled;
  // 명단과 같은 이름(게스트는 '게스트 0000')을 써서 프로필 그림도 같게 나온다.
  const name = hall.myName ?? member?.nickname ?? '게스트';

  document.querySelector('#hof-me-filled').textContent = filled;
  document.querySelector('#hof-me-total').textContent = total;
  document.querySelector('#hof-me-count-label').textContent = `${total}개 중 ${filled}개 채움`;
  // 다시 그릴 때도 찾을 수 있게 같은 id를 붙여 바꾼다.
  const photo = avatar(name);
  photo.id = 'hof-me-avatar';
  document.querySelector('#hof-me-avatar').replaceWith(photo);
  document.querySelector('#hof-me-name').textContent = name;
  document.querySelector('#hof-me-hint').textContent = remaining > 0 ? `완주까지 ${remaining}개 남았어요` : '모든 그림을 완성했어요';

  renderMeNext(remaining);
}

// 완주했으면 내 완주 번호, 아직이면 지금 완주했을 때 받을 번호
function renderMeNext(remaining) {
  // 내 기록 막대: 완주했으면 내 프로필, 아직이면 내 프로필 미리보기로 간다.
  document.querySelector('#hof-me-link').href = hall.myNo ? `/pages/finisher.html?no=${hall.myNo}` : '/pages/finisher.html?me';
  const next = document.querySelector('#hof-me-next');
  if (loadFailed && !hall.myNo) {
    next.hidden = true;
    return;
  }
  if (hall.myNo) next.textContent = `No.${hall.myNo} 완주`;
  else if (remaining > 0) next.textContent = `완주하면 No.${hall.total + 1}`;
  next.hidden = !hall.myNo && remaining <= 0;
}

/* 실시간 기록 시트 */

const sheet = document.querySelector('#hof-sheet');
const recordList = document.querySelector('#hof-records');
const recordStatus = document.querySelector('#hof-records-status');

// 완주 기록은 전시실 완료에도 함께 보인다.
const FILTERS = [
  { label: '전체', match: () => true },
  { label: '그림 채움', match: (record) => record.type === 'fill' },
  { label: '전시실 완료', match: (record) => record.type === 'done' || record.type === 'finish' },
];

function renderRecord(record) {
  const icon = element('span', 'hof-record__icon');
  icon.append(recordIcon(record.type, record.iconSrc));
  const body = element('div', 'hof-record__body');
  body.append(element('p', 'hof-record__text', record.text), element('p', 'hof-record__detail', record.detail));
  const li = element('li', `hof-record hof-record--${record.type}`);
  li.append(icon, body, element('p', 'hof-record__time', record.time));
  return li;
}

let currentFilter = FILTERS[0];

function showRecords(filter = currentFilter, { keepScroll = false } = {}) {
  currentFilter = filter;
  const shown = hall.records.filter(filter.match);
  if (shown.length === 0) recordList.replaceChildren(element('li', 'hof-sheet__empty', loadFailed ? '기록을 불러오지 못했어요' : '아직 기록이 없어요'));
  else recordList.replaceChildren(...shown.map(renderRecord));
  if (!keepScroll) recordList.scrollTop = 0;
  recordStatus.textContent = `${filter.label} 기록 ${shown.length}개`;
}

function renderFilters() {
  const buttons = FILTERS.map((filter, index) => {
    const button = element('button', 'art-chip', filter.label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      showRecords(filter);
    });
    return button;
  });
  document.querySelector('#hof-filters').replaceChildren(...buttons.map((button) => {
    const li = element('li');
    li.append(button);
    return li;
  }));
}

document.querySelector('#hof-ticker').addEventListener('click', () => sheet.showModal());
document.querySelector('#hof-sheet-close').addEventListener('click', () => sheet.close());
// 시트 바깥(어두운 배경)을 누르면 닫는다. 배경을 누르면 클릭 대상이 dialog 자신이다.
sheet.addEventListener('click', (event) => {
  if (event.target === sheet) sheet.close();
});

/* 떠오르는 실시간 기록: 알약을 2개 보여 준다. 새 기록이 맨 아래 칸에 떠오르면 나머지는 한 칸씩 위로 밀리며 흐려진다.
   칸 번호(data-slot): -1 떠오르기 전 / 0·1 보이는 칸 / 2 사라지는 중. 움직임은 hall-of-fame.css 에 있다. */

const TICKER_SLOTS = 2;
const TICKER_STEP_MS = 3200;
const tickerItems = document.querySelector('#hof-ticker-items');
// 되풀이해 흘려보낼 기록(오래된 것부터)과, 새로 받아 와서 먼저 보여 줄 기록
let tickerCycle = [];
let tickerPending = [];
let tickerCursor = 0;
let lastRecordId = 0;

function setTickerRecords(list, { announceNew = false } = {}) {
  const newest = list.reduce((max, record) => Math.max(max, record.id), 0);
  if (announceNew) tickerPending.push(...list.filter((record) => record.id > lastRecordId).reverse());
  lastRecordId = Math.max(lastRecordId, newest);
  tickerCycle = [...list].reverse();
  // 기록이 칸 수 이하면 새 기록은 대기열로 한 번만 보여 주고, 되풀이 목록에서 다시 고르지 않는다.
  if (announceNew && tickerCycle.length <= TICKER_SLOTS) tickerCursor = tickerCycle.length;
  // 보이는 알약 수(기록이 없으면 안내 알약 1개)에 맞춰 바탕 높이를 바꾼다 (hall-of-fame.css 의 data-ticker-pills).
  document.body.dataset.tickerPills = String(Math.min(Math.max(list.length, 1), TICKER_SLOTS));
}

function nextTickerRecord() {
  if (tickerPending.length > 0) return tickerPending.shift();
  // 기록이 칸 수보다 적으면 같은 기록이 두 번 보이지 않게 돌리지 않는다.
  if (tickerCycle.length <= TICKER_SLOTS && tickerCursor >= tickerCycle.length) return null;
  const record = tickerCycle[tickerCursor % tickerCycle.length];
  tickerCursor += 1;
  return record;
}

function tickerPill(icon, text) {
  const pill = element('span', 'hof-ticker__pill');
  pill.append(icon, element('span', 'hof-ticker__text', text), element('span', 'hof-ticker__more', '전체 보기'));
  return pill;
}

function pushTickerRecord() {
  const record = nextTickerRecord();
  if (!record) return;
  tickerItems.querySelector('.is-placeholder')?.remove();

  for (const pill of [...tickerItems.children]) {
    const slot = Number(pill.dataset.slot) + 1;
    if (slot > TICKER_SLOTS) pill.remove();
    else pill.dataset.slot = String(slot);
  }

  const pill = tickerPill(recordIcon(record.type, record.iconSrc), record.text);
  pill.dataset.slot = '-1';
  tickerItems.append(pill);
  // 떠오르기 전 위치를 먼저 그리게 해서 올라오는 움직임이 보이게 한다.
  pill.getBoundingClientRect();
  pill.dataset.slot = '0';
}

// 기록이 하나도 없을 때 멈춰 있는 안내 알약
function showTickerPlaceholder() {
  const pill = tickerPill(recordIcon('fill'), loadFailed ? '기록을 불러오지 못했어요' : '아직 기록이 없어요. 첫 그림을 채워 보세요');
  pill.classList.add('is-placeholder');
  pill.dataset.slot = '0';
  tickerItems.replaceChildren(pill);
}

function startTicker() {
  setTickerRecords(hall.records);
  // 처음에는 가장 최근 기록 3개부터 보여 주고, 그다음 오래된 것부터 되풀이한다.
  tickerCursor = Math.max(0, tickerCycle.length - TICKER_SLOTS);
  if (hall.records.length === 0) showTickerPlaceholder();
  for (let count = 0; count < TICKER_SLOTS; count += 1) pushTickerRecord();
  // 화면을 보고 있지 않거나 시트가 열려 있는 동안에는 멈춘다.
  setInterval(() => {
    if (!document.hidden && !sheet.open) pushTickerRecord();
  }, TICKER_STEP_MS);
}

// 10초마다 새로 받아 온다. 새 기록은 실시간 기록 알약에 먼저 떠오른다.
// 앞 요청이 아직 안 끝났으면 겹쳐 부르지 않는다 (탭 복귀와 주기 갱신이 겹칠 때).
let refreshing = false;

async function refresh() {
  if (document.hidden || refreshing) return;
  refreshing = true;
  let next = null;
  try {
    next = await loadHallOfFame();
  } catch {
    next = null;
  } finally {
    refreshing = false;
  }
  if (!next) return;
  const recovered = loadFailed;
  loadFailed = false;
  hall = next;
  // 처음에 못 받았다가 이번에 받았으면 기록이 없을 때의 안내 알약도 정상 문구로 바꾼다.
  if (recovered && hall.records.length === 0) showTickerPlaceholder();
  renderSummary({ animate: false });
  renderList();
  // 처음에 못 받았다가 받았으면 내 이름(게스트 번호)과 그림도 새 응답으로 다시 그린다.
  if (recovered) renderMe();
  else {
    const { filled, total } = summarizeAll(rooms, acquiredSet(records));
    renderMeNext(total - filled);
  }
  showRecords(currentFilter, { keepScroll: true });
  setTickerRecords(hall.records, { announceNew: true });
}

renderSummary();
renderList();
renderMe();
renderFilters();
showRecords(FILTERS[0]);
startTicker();
setInterval(refresh, REFRESH_MS);
// 다른 탭에 있다가 돌아오면 10초를 기다리지 않고 바로 새로 받아 온다.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});
