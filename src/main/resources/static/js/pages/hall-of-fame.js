import { getMe } from '../api/auth-api.js';
import { mountTabBar } from '../common/tab-bar.js';
import { countUp, rise } from '../common/motion.js';
import { acquiredSet, loadCollection, summarizeAll } from '../common/collection-data.js';
import { avatar, loadHallOfFame, recordIcon } from '../common/hall-of-fame-data.js';

mountTabBar({ active: 'ranking' });

// 명예의 전당(완주자·실시간 기록)과 내 수집 기록·닉네임을 서버에서 받는다.
// 명예의 전당을 못 받으면 빈 화면으로 두고 안내 문구를 보여 준다.
const EMPTY_HALL = { total: 0, today: 0, myNo: null, myName: null, finishers: [], records: [] };
const [{ rooms, records }, member, loadedHall] = await Promise.all([
  loadCollection(),
  getMe().catch(() => null),
  loadHallOfFame().catch(() => null),
]);
let hall = loadedHall ?? EMPTY_HALL;
const loadFailed = loadedHall === null;
// 실시간 기록을 다시 받아 오는 간격
const REFRESH_MS = 30000;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* 완주자 요약과 명단 */

function renderSummary({ animate = true } = {}) {
  const total = document.querySelector('#hof-total');
  if (animate) countUp(total, hall.total);
  else total.textContent = hall.total;
  document.querySelector('#hof-total-label').textContent = `${hall.total}명`;
  document.querySelector('#hof-today').textContent = hall.today > 0 ? `오늘 +${hall.today}명` : '';
}

// 완주자가 없거나 못 받아 왔을 때 목록 자리에 보이는 문구
function renderEmptyList() {
  const li = element('li', 'hof__empty');
  li.append(
    element('p', 'hof__empty-title', loadFailed ? '명단을 불러오지 못했어요' : '아직 완주한 탐험가가 없어요'),
    element('p', 'hof__empty-text', loadFailed ? '잠시 뒤 다시 열어 주세요' : '여섯 전시실 그림을 모두 채우고 첫 번째 완주자가 되어 보세요!'),
  );
  return li;
}

// 지금 보이는 명단 (같으면 다시 그리지 않아 떠오르는 움직임이 되풀이되지 않게 한다)
let shownFinisherKey = null;

function renderList() {
  const key = hall.finishers.map((finisher) => finisher.no).join(',');
  if (key === shownFinisherKey) return;
  shownFinisherKey = key;
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
  document.querySelector('#hof-me-avatar').replaceWith(avatar(name));
  document.querySelector('#hof-me-name').textContent = name;
  document.querySelector('#hof-me-hint').textContent = remaining > 0 ? `완주까지 ${remaining}개 남았어요` : '모든 그림을 완성했어요';

  renderMeNext(remaining);
}

// 완주했으면 내 완주 번호, 아직이면 지금 완주했을 때 받을 번호
function renderMeNext(remaining) {
  const next = document.querySelector('#hof-me-next');
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
  if (shown.length === 0) recordList.replaceChildren(element('li', 'hof-sheet__empty', '아직 기록이 없어요'));
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

/* 떠오르는 실시간 기록: 알약을 최대 3개 보여 준다. 새 기록이 맨 아래 칸에 떠오르면 나머지는 한 칸씩 위로 밀리며 흐려진다.
   칸 번호(data-slot): -1 떠오르기 전 / 0·1·2 보이는 칸 / 3 사라지는 중. 움직임은 hall-of-fame.css 에 있다. */

const TICKER_SLOTS = 3;
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
  const pill = tickerPill(recordIcon('fill'), '아직 기록이 없어요. 첫 그림을 채워 보세요');
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

// 30초마다 새로 받아 온다. 새 기록은 실시간 기록 알약에 먼저 떠오른다.
async function refresh() {
  if (document.hidden) return;
  const next = await loadHallOfFame().catch(() => null);
  if (!next) return;
  hall = next;
  renderSummary({ animate: false });
  renderList();
  const { filled, total } = summarizeAll(rooms, acquiredSet(records));
  renderMeNext(total - filled);
  showRecords(currentFilter, { keepScroll: true });
  setTickerRecords(hall.records, { announceNew: true });
}

renderSummary();
renderList();
renderMe();
renderFilters();
showRecords(FILTERS[0]);
startTicker();
if (!loadFailed) setInterval(refresh, REFRESH_MS);
