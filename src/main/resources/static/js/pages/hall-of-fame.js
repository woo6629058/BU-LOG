import { getMe } from '../api/auth-api.js';
import { mountTabBar } from '../common/tab-bar.js';
import { countUp, rise } from '../common/motion.js';
import { acquiredSet, loadCollection, summarizeAll } from '../common/collection-data.js';
import { FINISHERS, LIVE_RECORDS, SUMMARY, avatar, recordIcon } from '../common/hall-of-fame-data.js';

mountTabBar({ active: 'ranking' });

// 내 기록 막대에 쓸 수집 기록과 닉네임만 서버에서 받는다. 완주자 명단·실시간 기록은 아직 예시 데이터다 (hall-of-fame-data.js).
const [{ rooms, records }, member] = await Promise.all([loadCollection(), getMe().catch(() => null)]);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* 완주자 요약과 명단 */

function renderSummary() {
  countUp(document.querySelector('#hof-total'), SUMMARY.total);
  document.querySelector('#hof-total-label').textContent = `${SUMMARY.total}명`;
  document.querySelector('#hof-today').textContent = `오늘 +${SUMMARY.today}명`;
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

  link.append(element('span', 'hof-finisher__no art-badge', `No.${finisher.no}`), avatar(finisher.name, finisher.no), text, chevron);
  const li = element('li');
  li.append(link);
  return rise(li, index);
}

/* 내 기록: 아직 완주 전이면 남은 칸 수와 완주했을 때 받을 번호를 보여 준다. */

function renderMe() {
  const { filled, total } = summarizeAll(rooms, acquiredSet(records));
  const remaining = total - filled;
  const name = member?.nickname ?? '게스트';

  document.querySelector('#hof-me-filled').textContent = filled;
  document.querySelector('#hof-me-total').textContent = total;
  document.querySelector('#hof-me-count-label').textContent = `${total}개 중 ${filled}개 채움`;
  document.querySelector('#hof-me-avatar').replaceWith(avatar(name));
  document.querySelector('#hof-me-name').textContent = name;
  document.querySelector('#hof-me-hint').textContent = remaining > 0 ? `완주까지 ${remaining}개 남았어요` : '모든 그림을 완성했어요';

  if (remaining > 0) {
    const next = document.querySelector('#hof-me-next');
    next.textContent = `완주하면 No.${SUMMARY.total + 1}`;
    next.hidden = false;
  }
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
  icon.append(recordIcon(record.type));
  const body = element('div', 'hof-record__body');
  body.append(element('p', 'hof-record__text', record.text), element('p', 'hof-record__detail', record.detail));
  const li = element('li', `hof-record hof-record--${record.type}`);
  li.append(icon, body, element('p', 'hof-record__time', record.time));
  return li;
}

function showRecords(filter) {
  const shown = LIVE_RECORDS.filter(filter.match);
  recordList.replaceChildren(...shown.map(renderRecord));
  recordList.scrollTop = 0;
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
// 예시 기록을 오래된 것부터 차례로 되풀이해 흘려보낸다. 서버가 생기면 새로 들어온 기록을 넣는다.
const tickerQueue = [...LIVE_RECORDS].reverse();
let tickerCursor = 0;

function pushTickerRecord() {
  const record = tickerQueue[tickerCursor % tickerQueue.length];
  tickerCursor += 1;

  for (const pill of [...tickerItems.children]) {
    const slot = Number(pill.dataset.slot) + 1;
    if (slot > TICKER_SLOTS) pill.remove();
    else pill.dataset.slot = String(slot);
  }

  const pill = element('span', 'hof-ticker__pill');
  const more = element('span', 'hof-ticker__more', '전체 보기');
  pill.append(recordIcon(record.type), element('span', 'hof-ticker__text', record.text), more);
  pill.dataset.slot = '-1';
  tickerItems.append(pill);
  // 떠오르기 전 위치를 먼저 그리게 해서 올라오는 움직임이 보이게 한다.
  pill.getBoundingClientRect();
  pill.dataset.slot = '0';
}

function startTicker() {
  for (let count = 0; count < TICKER_SLOTS; count += 1) pushTickerRecord();
  // 화면을 보고 있지 않거나 시트가 열려 있는 동안에는 멈춘다.
  setInterval(() => {
    if (!document.hidden && !sheet.open) pushTickerRecord();
  }, TICKER_STEP_MS);
}

renderSummary();
document.querySelector('#hof-list').replaceChildren(...FINISHERS.map(renderFinisher));
renderMe();
renderFilters();
showRecords(FILTERS[0]);
startTicker();
