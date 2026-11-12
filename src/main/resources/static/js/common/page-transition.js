// 화면 전환 방향 정하기: 홈·그림 도감·진열장·유물 상세·그림 채우기 결과에서 쓴다.
// 화면 사이를 이동할 때 브라우저의 화면 전환(View Transitions)이 쓸 방향을 정한다.
//   push(더 깊은 화면으로) / pop(뒤로) / tab-next·tab-prev(탭 사이) / 그 밖은 부드럽게 겹쳐 바뀜
// 애니메이션 모양은 css/components/art-theme.css 에 있다.
// 새 화면이 그려지기 전에 실행돼야 해서 type="module" 이 아닌 일반 스크립트로 <head> 에서 불러온다.
// 화면 전환을 지원하지 않는 브라우저에서는 아무것도 하지 않고 평소처럼 이동한다.
(function () {
  if (!('onpagereveal' in window)) return;

  var FROM_KEY = 'bulog.page.from';
  // 하단 탭 순서 (탭바와 같음). QR 스캔 화면은 화면 전환을 쓰지 않지만 순서 계산에는 넣는다.
  var TABS = ['/', '/pages/qr-scan.html', '/pages/picture-book.html', '/pages/showcase.html'];

  // 화면의 깊이: 탭 화면 0, 전시실 그림 1, 유물 상세·그림 채우기 결과 2
  function place(href) {
    var url = new URL(href, window.location.href);
    var path = url.pathname === '/index.html' ? '/' : url.pathname;
    if (path === '/pages/picture-book.html' && url.searchParams.get('room')) return { depth: 1, tab: -1 };
    var tab = TABS.indexOf(path);
    return tab >= 0 ? { depth: 0, tab: tab } : { depth: 2, tab: -1 };
  }

  function direction(fromHref, toHref) {
    var from = place(fromHref);
    var to = place(toHref);
    if (to.depth > from.depth) return 'push';
    if (to.depth < from.depth) return 'pop';
    if (to.tab >= 0 && from.tab >= 0 && to.tab !== from.tab) return to.tab > from.tab ? 'tab-next' : 'tab-prev';
    return 'fade';
  }

  // 두 화면에 함께 있어 이어 보일 그림의 이름. 한쪽 화면에만 있는 그림에 이름을 붙이면
  // 그 그림이 화면과 따로 떨어져 제자리에 남은 채 사라지므로, 짝이 맞는 그림 하나에만 붙인다.
  //   그림 도감 전체 보기 ↔ 전시실 보기: scene-<전시실>
  //   진열장 ↔ 유물 상세: artifact-<유물>
  //   그림 채우기 결과 → 그 전시실 보기: scene-<전시실>
  function pairName(list, detail) {
    var room = detail.searchParams.get('room');
    var exhibitId = detail.searchParams.get('exhibitId');
    var isBook = function (url) { return url.pathname === '/pages/picture-book.html'; };
    if (isBook(list) && !list.searchParams.get('room') && isBook(detail) && room) return 'scene-' + room;
    if (list.pathname === '/pages/showcase.html' && detail.pathname === '/pages/artifact-detail.html' && exhibitId) {
      return 'artifact-' + exhibitId;
    }
    if (list.pathname === '/pages/fill-result.html' && isBook(detail) && room) return 'scene-' + room;
    return null;
  }

  function sharedNames(aHref, bHref) {
    var a = new URL(aHref, window.location.href);
    var b = new URL(bHref, window.location.href);
    var name = pairName(a, b) || pairName(b, a);
    return name ? [name] : [];
  }

  // data-vt-name 을 단 그림 가운데 이번 이동에서 짝이 맞는 것만 이름을 붙이고 나머지는 뗀다.
  function nameShared(names) {
    var nodes = document.querySelectorAll('[data-vt-name]');
    for (var i = 0; i < nodes.length; i += 1) {
      var name = nodes[i].getAttribute('data-vt-name');
      nodes[i].style.viewTransitionName = names.indexOf(name) >= 0 ? name : 'none';
    }
  }

  // 떠나는 화면의 주소를 남긴다 (navigation.activation 을 모르는 브라우저용).
  window.addEventListener('pagehide', function () {
    try { window.sessionStorage.setItem(FROM_KEY, window.location.href); } catch (error) { /* 저장 불가: 기본 전환 */ }
  });

  // 떠나는 화면: 화면을 찍기 직전에 갈 곳과 짝이 맞는 그림에만 이름을 붙인다.
  window.addEventListener('pageswap', function (event) {
    if (!event.viewTransition) return;
    var toHref = event.activation && event.activation.entry ? event.activation.entry.url : null;
    nameShared(toHref ? sharedNames(window.location.href, toHref) : []);
  });

  window.addEventListener('pagereveal', function (event) {
    var transition = event.viewTransition;
    if (!transition) return;

    var fromHref = window.navigation && window.navigation.activation && window.navigation.activation.from
      ? window.navigation.activation.from.url
      : null;
    if (!fromHref) {
      try { fromHref = window.sessionStorage.getItem(FROM_KEY); } catch (error) { fromHref = null; }
    }
    if (!fromHref) {
      nameShared([]);
      return;
    }

    nameShared(sharedNames(fromHref, window.location.href));
    if (transition.types) transition.types.add(direction(fromHref, window.location.href));
    // 전환으로 들어온 화면은 목록 등장 애니메이션을 건너뛴다 (전환 자체가 등장).
    // 전환이 끝난 뒤에 지우면 그때 등장 애니메이션이 다시 시작되므로 그대로 둔다.
    document.documentElement.classList.add('is-vt');
  });
})();
