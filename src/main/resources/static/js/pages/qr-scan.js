import { getExhibit } from '../api/exhibits-api.js';
import { apiRequest } from '../api/api-client.js';

// QR을 몇 ms마다 읽을지 (너무 짧으면 폰이 뜨거워짐)
const SCAN_INTERVAL_MS = 200;
// 잘못된 QR 안내를 띄운 뒤 다시 읽기까지 쉬는 시간
const ERROR_COOLDOWN_MS = 2000;
// 시트를 닫은 직후, 카메라에 아직 비치는 같은 QR을 다시 읽지 않는 시간
const SAME_QR_IGNORE_MS = 1500;
// 시트를 이만큼(px) 아래로 끌면 닫힘
const SWIPE_CLOSE_PX = 80;

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
  resultRescan: document.querySelector('#qr-result-rescan'),
  backdrop: document.querySelector('#qr-backdrop'),
};

// 2. 지금 상태
const state = {
  stream: null,     // 카메라
  timer: null,      // 반복해서 QR 읽는 타이머
  paused: false,    // 시트가 열려 있거나 서버에 물어보는 중이면 읽기 멈춤
  torchOn: false,
  lastText: '',     // 마지막으로 읽은 QR 글자
  ignoreUntil: 0,   // 이 시각 전까지는 같은 QR을 다시 읽지 않음
};

const GUIDE_DEFAULT = ['전시물 옆 QR 코드를 네모 안에 맞춰 주세요', '자동으로 인식돼요'];

// 서버 응답은 { isSuccess, code, message, result } 형태라 result만 꺼냄
const unwrap = (response) => response?.result ?? response;

// 유물 소개 화면 주소
// QR에 들어 있는 /exhibits/{id}는 서버가 이 화면으로 보내 준다(휴대폰 기본 카메라용).
// 앱 안에서는 이미 id를 읽었으니 한 번 더 거치지 않고 바로 이 화면으로 간다.
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
//   https://(사이트)/exhibits/ongi1-faith-jar
//   https://(사이트)/pages/exhibit.html?id=ongi1-faith-jar
//   ongi1-faith-jar (id만)
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
  // 시트를 막 닫았는데 같은 QR이 아직 화면에 있으면 바로 다시 열리지 않게 잠깐 무시
  if (text === state.lastText && Date.now() < state.ignoreUntil) return;
  state.lastText = text;
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
// 전시실이 없으면 박물관 이름으로 대신 표시
function buildMeta(exhibit) {
  const place = exhibit.exhibitionRoom ?? exhibit.museumName;
  const number = exhibit.cardNumber;
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

// ---------------------------------------------------------
// 시트 열기·닫기
// 시트가 열리면 안내 문구와 하단 버튼은 숨김 (피그마 01-2, 01-3)
// 닫는 방법: 아래로 끌어내리기 / 어두운 배경 누르기 / "다시 찍기"·"취소" / Esc
// ---------------------------------------------------------
const qrRoot = document.querySelector('#qr-content');

function openSheet(sheet) {
  els.result.hidden = sheet !== els.result;
  els.manualForm.hidden = sheet !== els.manualForm;
  sheet.style.transform = '';
  els.backdrop.hidden = false;
  qrRoot.classList.add('qr--sheet-open');
}

// 시트만 닫음 (스캔을 다시 시작하지는 않음)
function hideSheets() {
  els.result.hidden = true;
  els.manualForm.hidden = true;
  els.backdrop.hidden = true;
  qrRoot.classList.remove('qr--sheet-open');
}

function openResultSheet() {
  openSheet(els.result);
}

// 01-2 인식 완료
function showFound(exhibitId, exhibit) {
  els.frame.dataset.state = 'found';
  resetGuide();
  els.resultBox.classList.remove('qr-result--locked');
  fillThumbnail(exhibit, true);

  els.resultMeta.textContent = buildMeta(exhibit);
  els.resultTitle.textContent = `${withObjectParticle(exhibit.name ?? '유물')} 찾았어요!`;
  els.resultDesc.textContent = '미션을 성공하면 그림 속 빈자리가 채워져요';
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
  hideSheets();
  els.frame.dataset.state = 'scanning';
  resetGuide();
  state.ignoreUntil = Date.now() + SAME_QR_IGNORE_MS;
  state.paused = false;
}

els.resultRescan.addEventListener('click', backToScanning);
els.backdrop.addEventListener('click', backToScanning);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.backdrop.hidden) backToScanning();
});

// 아래로 끌어내려서 닫기 (손가락·마우스 모두)
function enableSwipeDown(sheet) {
  let startY = null;
  let dy = 0;

  sheet.addEventListener('pointerdown', (event) => {
    // 입력칸·버튼을 누를 때는 끌기로 보지 않음
    if (event.target.closest('input, button, a')) return;
    startY = event.clientY;
    dy = 0;
    sheet.classList.add('is-dragging');
    sheet.setPointerCapture?.(event.pointerId);
  });

  sheet.addEventListener('pointermove', (event) => {
    if (startY === null) return;
    dy = Math.max(0, event.clientY - startY); // 위로는 안 끌림
    sheet.style.transform = `translateY(${dy}px)`;
  });

  const finish = () => {
    if (startY === null) return;
    startY = null;
    sheet.classList.remove('is-dragging');
    if (dy > SWIPE_CLOSE_PX) {
      backToScanning();
    } else {
      sheet.style.transform = ''; // 조금만 끌었으면 제자리로
    }
  };
  sheet.addEventListener('pointerup', finish);
  sheet.addEventListener('pointercancel', finish);
}

enableSwipeDown(els.result);
enableSwipeDown(els.manualForm);

// ---------------------------------------------------------
// 번호로 입력
// ---------------------------------------------------------
els.manualOpen.addEventListener('click', () => {
  state.paused = true;
  openSheet(els.manualForm);
  els.manualInput.value = '';
  els.manualInput.focus();
});

els.manualCancel.addEventListener('click', backToScanning);

// "8", "08", "No.08", "no 8" → 8 / 숫자가 아니면 null
export function parseCardNumber(text) {
  const match = String(text ?? '').trim().match(/^(?:no\.?\s*)?(\d{1,3})$/i);
  return match ? Number(match[1]) : null;
}

// 수집 대상 유물 목록에서 번호가 같은 유물의 id 찾기 (수집 대상은 24개라 한 번에 받아도 충분)
async function findExhibitIdByNumber(cardNumber) {
  const list = unwrap(await apiRequest('/exhibits?collectible=true&size=100'));
  const exhibit = (list?.exhibits ?? []).find((item) => item.cardNumber === cardNumber);
  return exhibit?.id ?? null;
}

els.manualForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = els.manualInput.value;
  hideSheets(); // 찾는 동안 안내 문구가 보이도록 시트를 닫음

  const cardNumber = parseCardNumber(value);
  if (cardNumber !== null) {
    showGuide('유물을 찾고 있어요', '');
    try {
      const exhibitId = await findExhibitIdByNumber(cardNumber);
      if (exhibitId) {
        lookUpExhibit(exhibitId);
      } else {
        flashError(`No.${String(cardNumber).padStart(2, '0')} 유물을 찾을 수 없어요`, 'QR 코드에 적힌 번호를 확인해 주세요');
      }
    } catch {
      flashError('유물 정보를 불러오지 못했어요', '잠시 후 다시 시도해 주세요');
    }
    return;
  }

  // 숫자가 아니면 전시물 id나 주소로 보고 찾음 (개발 중 테스트용)
  const exhibitId = parseExhibitId(value);
  if (!exhibitId) {
    flashError('번호를 다시 확인해 주세요', 'QR 코드에 적힌 번호를 입력해 주세요');
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