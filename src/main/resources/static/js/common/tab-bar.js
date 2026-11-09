// 하단 탭바: 홈·그림 도감·진열장 등 탭바가 있는 화면에서 사용한다.
// 아이콘은 Figma 원본 SVG를 받기 전까지 쓰는 근사 아이콘이다.

const NOTICE_DURATION = 2000;
const NOTICE_TEXT = '준비 중인 기능이에요';

// 화면 하단 안내가 겹치지 않도록, 안내를 띄울 때 알리고 다른 안내가 뜨면 닫는다.
export const NOTICE_EVENT = 'bulog:notice';

const ICON_ATTRS = 'class="tab-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

const TABS = [
  {
    key: 'home',
    label: '홈',
    href: '/',
    icon: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  },
  {
    key: 'qr',
    label: 'QR 스캔',
    href: null,
    icon: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 19h1M19 14v1"/>',
  },
  {
    key: 'picture-book',
    label: '그림 도감',
    href: '/pages/picture-book.html',
    icon: '<rect x="5" y="3.5" width="11" height="15" rx="2"/><path d="M19 7v12a2 2 0 0 1-2 2H9"/>',
  },
  {
    key: 'showcase',
    label: '진열장',
    href: '/pages/showcase.html',
    icon: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 10h16M4 15.5h16M9 6.5h6"/>',
  },
  {
    key: 'ranking',
    label: '명예의 전당',
    href: null,
    icon: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  },
];

function renderTab(tab, active) {
  const icon = `<svg ${ICON_ATTRS}>${tab.icon}</svg>`;
  if (!tab.href) {
    // 화면이 아직 없는 탭은 이동하지 않는 버튼으로 두고 준비 중임을 알린다.
    return `
      <button type="button" class="tab-bar__link" aria-disabled="true" data-tab="${tab.key}">
        ${icon}<span>${tab.label}</span><span class="tab-bar__hidden"> (준비 중)</span>
      </button>
    `;
  }
  const current = tab.key === active ? ' aria-current="page"' : '';
  return `
    <a class="tab-bar__link" href="${tab.href}" data-tab="${tab.key}"${current}>
      ${icon}<span>${tab.label}</span>
    </a>
  `;
}

export function mountTabBar({ active } = {}) {
  const nav = document.createElement('nav');
  nav.className = 'tab-bar';
  nav.setAttribute('aria-label', '주요 메뉴');
  nav.innerHTML = `
    <p class="tab-bar__notice" aria-hidden="true"></p>
    <p class="tab-bar__hidden" role="status"></p>
    <ul class="tab-bar__list">
      ${TABS.map((tab) => `<li>${renderTab(tab, active)}</li>`).join('')}
    </ul>
  `;
  document.body.append(nav);
  document.body.classList.add('has-tab-bar');

  const notice = nav.querySelector('.tab-bar__notice');
  const status = nav.querySelector('[role="status"]');
  let noticeTimer = null;
  let statusTimer = null;

  document.addEventListener(NOTICE_EVENT, (event) => {
    if (event.detail?.source === 'tab-bar') return;
    clearTimeout(noticeTimer);
    notice.classList.remove('is-shown');
  });

  function showNotice() {
    document.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { source: 'tab-bar' } }));
    notice.textContent = NOTICE_TEXT;
    notice.classList.add('is-shown');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove('is-shown'), NOTICE_DURATION);

    // 같은 문구도 다시 읽히도록 비운 뒤 다음 틱에 넣는다.
    clearTimeout(statusTimer);
    status.textContent = '';
    statusTimer = setTimeout(() => { status.textContent = NOTICE_TEXT; }, 50);
  }

  nav.addEventListener('click', (event) => {
    if (event.target.closest('[aria-disabled="true"]')) showNotice();
  });

  // 탭바 밖의 준비 중 버튼(홈의 로그인 등)도 같은 안내를 띄울 수 있게 돌려준다.
  return showNotice;
}
