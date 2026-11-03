import { getExhibit } from '../api/exhibits-api.js';

// QR을 몇 ms마다 읽을지 (너무 짧으면 폰이 뜨거워짐)
const SCAN_INTERVAL_MS = 200;
// 잘못된 QR 안내를 띄운 뒤 다시 읽기까지 쉬는 시간
const ERROR_COOLDOWN_MS = 2000;

// 1. 화면 자리(HTML 태그) 미리 찾아두기
const els = {
  video: document.querySelector('#qr-video'),
  canvas: document.querySelector('#qr-canvas'),
  torch: document.querySelector('#qr-torch'),
  torchPlaceholder: document.querySelector('#qr-torch-placeholder'),
  frame: document.querySelector('#qr-frame'),
  guide: document.querySelector('#qr-guide'),
  guideTitle: document.querySelector('#qr-guide-title'),
  guideSub: document.querySelector('#qr-guide-sub'),
  manualOpen: document.querySelector('#qr-manual-open'),
  manualForm: document.querySelector('#qr-manual'),
  manualInput: document.querySelector('#qr-manual-input'),
  manualCancel: document.querySelector('#qr-manual-cancel'),
  result: document.querySelector('#qr-result'),
  resultBox: document.querySelector('.qr-result'),
  resultImage: document.querySelector('#qr-result-image'),
  resultMeta: document.querySelector('#qr-result-meta'),
  resultTitle: document.querySelector('#qr-result-title'),
  resultDesc: document.querySelector('#qr-result-desc'),
  resultAction: document.querySelector('#qr-result-action'),
};

// 2. 지금 상태
const state = {
  stream: null,     // 카메라
  timer: null,      // 반복해서 QR 읽는 타이머
  paused: false,    // 시트가 열려 있거나 서버에 물어보는 중이면 읽기 멈춤
  torchOn: false,
};

const GUIDE_DEFAULT = ['전시물 옆 QR 코드를 네모 안에 맞춰 주세요', '자동으로 인식돼요'];

// 서버 응답은 { isSuccess, code, message, result } 형태라 result만 꺼냄
const unwrap = (response) => response?.result ?? response;

// 유물 소개 화면 주소
// TODO(조장과 확인): 서버에 /exhibits/{id} 주소가 생기면 그 주소로 바꾸기
const exhibitPageUrl = (id) => `/pages/exhibit.html?id=${encodeURIComponent(id)}`;

// 받침이 있으면 "을", 없으면 "를" (예: 소줏고리를, 매병을)
function withObjectParticle(word) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}을(를)`; // 한글이 아니면 둘 다 표시
  return `${word}${code % 28 === 0 ? '를' : '을'}`;
}

// ---------------------------------------------------------
// QR 글자에서 전시물 id 꺼내기
// 아래 형식을 모두 받음
//   https://(사이트)/exhibits/goryeo-celadon
//   https://(사이트)/pages/exhibit.html?id=goryeo-celadon
//   goryeo-celadon (id만)
// ---------------------------------------------------------
export function parseExhibitId(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;

  if (/^[a-z0-9][a-z0-9-]*$/i.test(value)) return value; // id만 적힌 경우

  let url;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return null;
  }

  const pathMatch = url.pathname.match(/^\/exhibits\/([^/]+)\/?$/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  if (url.pathname.endsWith('/exhibit.html')) {
    return url.searchParams.get('id') || url.searchParams.get('exhibitId');
  }
  return null;
}

// ---------------------------------------------------------
// 안내 문구
// ---------------------------------------------------------
function showGuide(title, sub = '', isError = false) {
  els.guideTitle.textContent = title;
  els.guideSub.textContent = sub;
  els.guide.classList.toggle('qr-guide--error', isError);
}

function resetGuide() {
  showGuide(...GUIDE_DEFAULT);
}

// 잠깐 에러를 보여주고 다시 스캔 상태로
function flashError(title, sub) {
  showGuide(title, sub, true);
  els.frame.dataset.state = 'scanning';
  window.setTimeout(() => {
    if (els.result.hidden && els.manualForm.hidden) {
      resetGuide();
      state.paused = false;
    }
  }, ERROR_COOLDOWN_MS);
}

// ---------------------------------------------------------
// 카메라
// ---------------------------------------------------------
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showGuide('이 브라우저에서는 카메라를 쓸 수 없어요', '아래 "번호로 입력"을 눌러 주세요', true);
    return;
  }
  if (!window.isSecureContext) {
    showGuide('보안 연결(https)에서만 카메라를 쓸 수 있어요', '아래 "번호로 입력"을 눌러 주세요', true);
    return;
  }

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }, // 뒤쪽 카메라
      audio: false,
    });
    els.video.srcObject = state.stream;
    await els.video.play();
    setupTorch();
    scheduleScan();
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      showGuide('카메라 권한이 필요해요', '브라우저 설정에서 카메라를 허용하거나 "번호로 입력"을 눌러 주세요', true);
    } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      showGuide('카메라를 찾을 수 없어요', '아래 "번호로 입력"을 눌러 주세요', true);
    } else {
      showGuide('카메라를 켜지 못했어요', '아래 "번호로 입력"을 눌러 주세요', true);
    }
  }
}

function stopCamera() {
  window.clearTimeout(state.timer);
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
}

// 플래시: 지원하는 폰(주로 안드로이드)에서만 버튼을 보여줌
function setupTorch() {
  const track = state.stream?.getVideoTracks()[0];
  const canTorch = Boolean(track?.getCapabilities?.().torch);
  els.torch.hidden = !canTorch;
  els.torchPlaceholder.hidden = canTorch;
}

els.torch.addEventListener('click', async () => {
  const track = state.stream?.getVideoTracks()[0];
  if (!track) return;
  try {
    state.torchOn = !state.torchOn;
    await track.applyConstraints({ advanced: [{ torch: state.torchOn }] });
    els.torch.setAttribute('aria-pressed', String(state.torchOn));
    els.torch.setAttribute('aria-label', state.torchOn ? '플래시 끄기' : '플래시 켜기');
  } catch {
    state.torchOn = false;
  }
});

// ---------------------------------------------------------
// QR 읽기: 카메라 화면을 그림으로 찍어서 jsQR에게 보여줌
// ---------------------------------------------------------
function scheduleScan() {
  window.clearTimeout(state.timer);
  state.timer = window.setTimeout(scanOnce, SCAN_INTERVAL_MS);
}

function scanOnce() {
  const { video, canvas } = els;
  if (!state.paused && video.readyState >= video.HAVE_ENOUGH_DATA && typeof window.jsQR === 'function') {
    // 빠르게 읽으려고 작게 줄여서 읽음
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) handleScannedText(code.data);
  }
  if (state.stream) scheduleScan();
}

function handleScannedText(text) {
  const exhibitId = parseExhibitId(text);
  state.paused = true;
  if (!exhibitId) {
    flashError('BU:LOG QR 코드가 아니에요', '전시물 옆에 있는 QR 코드를 찍어 주세요');
    return;
  }
  lookUpExhibit(exhibitId);
}

// ---------------------------------------------------------
// 서버에 유물 정보를 물어보고 결과 시트 보여주기
// ---------------------------------------------------------
async function lookUpExhibit(exhibitId) {
  state.paused = true;
  els.frame.dataset.state = 'checking';
  showGuide('유물을 찾고 있어요', '');

  try {
    const exhibit = unwrap(await getExhibit(exhibitId));
    navigator.vibrate?.(60); // 지원하는 폰에서만 짧게 진동

    // TODO(조장과 확인): 서버가 잠금 여부(locked)와 해제 조건(unlockHint)을 보내주면 그대로 동작
    if (exhibit.locked) {
      showLocked(exhibit);
    } else {
      showFound(exhibitId, exhibit);
    }
  } catch (error) {
    if (error.status === 404) {
      flashError('등록되지 않은 유물이에요', 'QR 코드를 다시 확인해 주세요');
    } else {
      flashError('유물 정보를 불러오지 못했어요', '잠시 후 다시 시도해 주세요');
    }
  }
}

// 결과 시트 위쪽 작은 글자: "옹기2전시실 · No.08"
// TODO(조장과 확인): 전시실 이름·카드 번호가 API에 생기면 이름 맞추기 (지금은 박물관 이름만 있음)
function buildMeta(exhibit) {
  const place = exhibit.galleryName ?? exhibit.roomName ?? exhibit.museumName;
  const number = exhibit.cardNumber ?? exhibit.cardNo;
  const numberText = number !== undefined && number !== null ? `No.${String(number).padStart(2, '0')}` : null;
  return [place, numberText].filter(Boolean).join(' · ');
}

function fillThumbnail(exhibit, showImage) {
  els.resultImage.hidden = true;
  els.resultImage.removeAttribute('src');
  if (showImage && exhibit.imageUrl) {
    els.resultImage.onload = () => { els.resultImage.hidden = false; };
    els.resultImage.onerror = () => { els.resultImage.hidden = true; };
    els.resultImage.src = exhibit.imageUrl;
  }
}

// 시트가 열리면 안내 문구와 하단 버튼은 숨김 (피그마 01-2, 01-3)
const qrRoot = document.querySelector('#qr-content');

function openResultSheet() {
  els.result.hidden = false;
  qrRoot.classList.add('qr--sheet-open');
}

// 01-2 인식 완료
function showFound(exhibitId, exhibit) {
  els.frame.dataset.state = 'found';
  resetGuide();
  els.resultBox.classList.remove('qr-result--locked');
  fillThumbnail(exhibit, true);

  els.resultMeta.textContent = buildMeta(exhibit);
  els.resultTitle.textContent = `${withObjectParticle(exhibit.name ?? '유물')} 찾았어요!`;
  els.resultDesc.textContent = '미션을 성공하면 카드를 얻을 수 있어요';
  els.resultAction.textContent = '미션 보러 가기';
  els.resultAction.onclick = () => {
    stopCamera();
    window.location.href = exhibitPageUrl(exhibitId);
  };
  openResultSheet();
}

// 01-3 잠긴 유물
function showLocked(exhibit) {
  els.frame.dataset.state = 'locked';
  resetGuide();
  els.resultBox.classList.add('qr-result--locked');
  fillThumbnail(exhibit, false);

  els.resultMeta.textContent = buildMeta(exhibit);
  els.resultTitle.textContent = '아직 열리지 않은 유물이에요';
  els.resultDesc.textContent = exhibit.unlockHint ?? '앞 전시실의 유물을 먼저 모으면 열려요';
  els.resultAction.textContent = '다시 스캔하기';
  els.resultAction.onclick = backToScanning;
  openResultSheet();
}

function backToScanning() {
  qrRoot.classList.remove('qr--sheet-open');
  els.result.hidden = true;
  els.manualForm.hidden = true;
  els.frame.dataset.state = 'scanning';
  resetGuide();
  state.paused = false;
}

// ---------------------------------------------------------
// 번호로 입력
// ---------------------------------------------------------
els.manualOpen.addEventListener('click', () => {
  state.paused = true;
  els.result.hidden = true;
  els.manualForm.hidden = false;
  els.manualInput.value = '';
  els.manualInput.focus();
});

els.manualCancel.addEventListener('click', backToScanning);

els.manualForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const exhibitId = parseExhibitId(els.manualInput.value);
  els.manualForm.hidden = true;
  if (!exhibitId) {
    flashError('번호를 다시 확인해 주세요', 'QR 코드 아래에 적힌 번호를 입력해 주세요');
    return;
  }
  lookUpExhibit(exhibitId);
});

// 다른 화면으로 가거나 탭을 숨기면 카메라 끄기 (배터리 절약)
window.addEventListener('pagehide', stopCamera);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCamera();
  } else if (!state.stream) {
    startCamera();
  }
});

// jsQR 라이브러리가 다 불러와진 뒤 카메라 켜기
if (document.readyState === 'complete') {
  startCamera();
} else {
  window.addEventListener('load', startCamera, { once: true });
}