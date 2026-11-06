const navigation = [
  { key: 'home', label: '홈', href: '/' },
  { key: 'picture-book', label: '그림 도감', href: '/pages/picture-book.html' },
];

export function mountLayout({ active } = {}) {
  const header = document.querySelector('#site-header');
  const footer = document.querySelector('#site-footer');

  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <a class="brand" href="/">BU:<span>LOG</span></a>
      <nav class="site-nav" aria-label="주요 메뉴">
        ${navigation.map((item) => `
          <a href="${item.href}" ${item.key === active ? 'aria-current="page"' : ''}>${item.label}</a>
        `).join('')}
      </nav>
    `;
  }

  if (footer) {
    footer.className = 'site-footer';
    footer.textContent = 'BU:LOG — 관람의 순간을 수집하는 디지털 부록';
  }
}
