# BU:LOG API 명세서

모든 API 경로는 `/api`로 시작하며 JSON을 사용합니다.

게스트 방문자는 서버가 발급하는 `BU_LOG_VISITOR` HttpOnly 쿠키로 식별합니다. 프론트엔드는
이 쿠키 값을 직접 읽거나 저장하지 않으며, 같은 출처로 요청하면 브라우저가 자동으로 전송합니다.
회원 인증은 세션 쿠키를 사용합니다.

## CSRF 토큰

상태를 변경하는 `POST`, `PUT`, `PATCH`, `DELETE` 요청 전에는 다음 API로 CSRF 토큰을
조회합니다.

`GET /api/auth/csrf`

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {
    "headerName": "X-XSRF-TOKEN",
    "parameterName": "_csrf",
    "token": "발급된 토큰"
  }
}
```

이후 상태 변경 요청의 `X-XSRF-TOKEN` 헤더에 응답의 `token` 값을 포함합니다. 브라우저
요청에서는 세션과 게스트 쿠키가 전송되도록 동일 출처 요청을 사용합니다.

## 공통 응답

성공 응답은 다음 구조를 사용합니다.

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {}
}
```

값이 `null`인 필드는 응답에서 제외됩니다. 실패 응답의 추가 정보는 `errorDetail`에 포함됩니다.

```json
{
  "isSuccess": false,
  "code": "COMMON_400_002",
  "message": "입력값 검증에 실패했습니다.",
  "errorDetail": {
    "field": "오류 내용"
  }
}
```

## 전시물 상세

`GET /api/exhibits/{exhibitId}`

```json
{
  "isSuccess": true,
  "code": "EXHIBIT_200_001",
  "message": "전시물 조회에 성공했습니다.",
  "result": {
    "id": "ongi1-faith-jar",
    "name": "신앙항아리",
    "era": "근대",
    "description": "부천의 '점말'은 병인박해를 피해 천주교인들이 모여살면서 옹기를 만들던 곳이다. ...",
    "imageUrl": "/images/exhibits/ongi1-faith-jar.jpg",
    "museumName": "부천시립박물관",
    "sourceName": "부천시박물관 3D 전시실, 부천시박물관 누리집",
    "sourceUrl": "https://my.matterport.com/show/?m=ckQy8JMv3Xj",
    "exhibitionRoom": "옹기1전시실",
    "exhibitNumber": 1,
    "visitOrder": 1,
    "collectible": true
  }
}
```

존재하지 않는 전시물을 조회하면 `404 Not Found`를 반환합니다.

```json
{
  "isSuccess": false,
  "code": "EXHIBIT_404_001",
  "message": "전시물을 찾을 수 없습니다.",
  "errorDetail": {
    "exhibitId": "unknown"
  }
}
```

## 전시물 목록

`GET /api/exhibits`

조회 조건은 모두 선택 사항입니다.

- `keyword`: 전시물 이름 검색
- `exhibitionRoom`: 전시실 이름 필터
- `collectible`: 수집 대상 여부
- `page`: 0부터 시작하는 페이지 번호, 기본값 `0`
- `size`: 페이지당 개수, 기본값 `20`, 최대 `100`

```json
{
  "isSuccess": true,
  "code": "EXHIBIT_200_002",
  "message": "전시물 목록 조회에 성공했습니다.",
  "result": {
    "exhibits": [
      {
        "id": "PS0100346400100000100000",
        "name": "지세약해",
        "era": null,
        "imageUrl": "/api/exhibits/PS0100346400100000100000/image",
        "museumName": "부천시립박물관",
        "exhibitionRoom": "교육박물관",
        "exhibitNumber": 1,
        "visitOrder": 1,
        "collectible": true
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 3687,
    "totalPages": 185
  }
}
```

e뮤지엄에서 가져온 전체 소장품과 실제 수집 대상으로 선정한 소장품을 함께 관리합니다.
`collectible=true` 조건을 사용하면 수집 대상만 조회할 수 있습니다. 전시실·유물 번호·관람
순서는 수집 대상으로 선정할 때 입력합니다.

## 전시물 이미지

`GET /api/exhibits/{exhibitId}/image`

e뮤지엄 이미지 주소에 포함된 접근 정보를 브라우저에 직접 노출하지 않도록 백엔드가 이미지를
대신 조회하여 바이너리로 반환합니다. 정상 응답의 `Content-Type`은 원본 이미지 형식을 따르며,
브라우저 캐시는 7일로 설정됩니다. 이미지가 없는 전시물은 `EXHIBIT_404_002`, e뮤지엄 장애는
`EXHIBIT_503_002`를 반환합니다.

## 전시실 QR 주소

`GET /exhibits/{exhibitId}` (API가 아닌 화면 주소)

전시실 QR에는 `https://bulog.tech/exhibits/{유물 ID}`가 들어갑니다. 예: `https://bulog.tech/exhibits/ongi1-faith-jar`

- 있는 유물이면 `302`로 `/pages/exhibit.html?id={유물 ID}`(유물 소개 화면)로 보냅니다.
- 없는 유물이거나 ID 형식(영문 소문자·숫자·`-`)이 아니면 홈(`/`)으로 보냅니다.
- 휴대폰 기본 카메라로 찍어도 열리게 하려는 주소입니다. 앱 QR 스캔 화면은 ID를 직접 읽어 유물 소개 화면으로 바로 갑니다.
- 인쇄용 QR 24개: `docs/qr/bulog-qr-24.pdf`(BU-LOG 디자인), `docs/qr/bulog-qr-24-plain.pdf`(흑백 기본형), 낱장 이미지 `docs/qr/png/`

## 전시물 퀴즈

`GET /api/exhibits/{exhibitId}/quiz`

```json
{
  "isSuccess": true,
  "code": "QUIZ_200_001",
  "message": "퀴즈 조회에 성공했습니다.",
  "result": {
    "quizId": 1,
    "question": "신앙항아리를 관찰해서 자물쇠를 열어 보세요",
    "hint": "앞에서 보이는 십자가, 어깨의 물결무늬 줄, 뚜껑 손잡이를 차례로 세어 보세요.",
    "dialLabels": ["십자가", "물결띠", "뚜껑 손잡이"],
    "options": [
      { "id": 1001, "content": "221" },
      { "id": 1002, "content": "212" },
      { "id": 1003, "content": "121" },
      { "id": 1004, "content": "222" }
    ]
  }
}
```

- 정답 여부는 조회 응답에 포함하지 않습니다.
- `hint`(힌트 문구)와 `dialLabels`(자물쇠 다이얼 이름)는 없으면 응답에서 빠집니다.
- 게임 종류는 보기 모양으로 화면이 정합니다: 같은 길이의 세 자리 이상 숫자는 자물쇠, 한두 자리 숫자는 도장 찍기(숫자 세기), `spot:가로%,세로%,반지름%`는 찾아 누르기, `order:가>나>다`는 순서대로 놓기, 그 밖은 객관식입니다.
- 미션 24개는 `CuratedQuizzes`에 있고, 서버가 켜질 때 `CuratedQuizRunner`가 DB에 넣거나 갱신합니다(local 프로필은 메모리, 퀴즈 ID 1~24).

## 퀴즈 답안 제출

`POST /api/quizzes/{quizId}/attempts`

```json
{ "selectedOptionId": 11 }
```

```json
{
  "isSuccess": true,
  "code": "QUIZ_200_002",
  "message": "퀴즈 채점에 성공했습니다.",
  "result": {
    "correct": true,
    "explanation": "십자가 2개, 물결무늬 2줄, 뚜껑 손잡이 1개예요. ...",
    "collection": {
      "recordId": 7,
      "exhibitId": "ongi1-faith-jar",
      "newlyAcquired": true
    }
  }
}
```

제출한 선택지가 해당 퀴즈에 속하지 않으면 `400 Bad Request`를 반환합니다. 정답인 경우
현재 방문자의 수집 기록이 생깁니다. 이미 같은 유물을 모았다면 기존 `recordId`와
`newlyAcquired: false`를 반환합니다. 오답 응답에는 `explanation`과 `collection`이 포함되지 않습니다(해설에 정답이 들어 있어서 맞혔을 때만 보냅니다).
틀려도 시도 횟수 제한은 없습니다.

## 닉네임 사용 가능 여부

`GET /api/auth/nickname-availability?nickname=부록이`

```json
{
  "isSuccess": true,
  "code": "MEMBER_200_004",
  "message": "닉네임 사용 가능 여부 조회에 성공했습니다.",
  "result": {
    "nickname": "부록이",
    "available": false
  }
}
```

닉네임은 앞뒤 공백을 뺀 한글·영문·숫자 2~10자이며 회원끼리 겹칠 수 없습니다(영문 대소문자
구분 없음). 규칙에 맞지 않으면 `MEMBER_400_001`을 반환합니다. 회원가입 화면의 `중복확인`
버튼에서 사용합니다.

## 회원가입

`POST /api/auth/signup`

```json
{
  "email": "member@example.com",
  "password": "password123!",
  "nickname": "부록이",
  "termsAgreed": true,
  "privacyAgreed": true,
  "marketingAgreed": false
}
```

```json
{
  "isSuccess": true,
  "code": "MEMBER_201_001",
  "message": "회원가입에 성공했습니다.",
  "result": {
    "id": 1,
    "email": "member@example.com",
    "nickname": "부록이"
  }
}
```

| 필드 | 규칙 |
| --- | --- |
| `email` | 필수, 이메일 형식, 회원끼리 중복 불가 |
| `password` | 필수, 8~64자 |
| `nickname` | 필수, 한글·영문·숫자 2~10자, 회원끼리 중복 불가 |
| `termsAgreed` | 필수 동의(서비스 이용약관), `true`여야 함 |
| `privacyAgreed` | 필수 동의(개인정보 수집·이용), `true`여야 함 |
| `marketingAgreed` | 선택 동의(마케팅 정보 수신), 생략하면 `false` |

동의 시각은 회원 정보에 저장되며 응답에는 포함하지 않습니다.
회원가입과 동시에 로그인됩니다. 가입 전 게스트로 모은 유물은 생성된 회원 계정에
연결됩니다.

| 오류 코드 | 상황 |
| --- | --- |
| `COMMON_400_002` | 입력값 검증 실패. `errorDetail`에 `{ 필드: 메시지 }` 형태로 담김 |
| `MEMBER_400_002` | 필수 약관에 동의하지 않음 |
| `MEMBER_409_001` | 이미 사용 중인 이메일 |
| `MEMBER_409_002` | 이미 사용 중인 닉네임 |
| `MEMBER_409_003` | 동시에 같은 이메일·닉네임으로 가입해 저장 단계에서 충돌함 |

## 로그인

`POST /api/auth/login`

```json
{
  "email": "member@example.com",
  "password": "password123!"
}
```

성공 응답 코드는 `MEMBER_200_001`입니다. 로그인 전 현재 브라우저에서 게스트로 획득한
유물은 로그인한 회원에게 연결됩니다. 이메일 또는 비밀번호가 올바르지 않으면
`MEMBER_401_001`을 반환합니다.

가입·로그인에 성공하면 세션 쿠키와 함께 로그인 상태 유지 쿠키(`bulog_remember`, 2주, HttpOnly)를 발급합니다.
세션이 끝나도 이 쿠키가 있으면 다음 요청에서 자동으로 다시 로그인됩니다.

## 로그아웃

`POST /api/auth/logout`

성공 응답 코드는 `MEMBER_200_002`입니다. 회원 세션을 종료하고 새로운 게스트 방문자
쿠키를 발급하여 이후 기록이 로그아웃한 회원에게 추가되지 않도록 합니다.
로그인 상태 유지 쿠키(`bulog_remember`)도 함께 지웁니다.

로그인이 풀렸을 때(로그인 상태 유지 쿠키까지 만료·삭제)도 같습니다. 계정에 이어진 방문자 쿠키로 로그인 없이 요청하면
새 게스트 방문자 쿠키를 발급합니다. 다시 로그인하면 두 기록이 계정으로 합쳐집니다.

## 내 회원 정보

`GET /api/auth/me`

로그인한 회원의 `id`, `email`, `nickname`을 반환합니다. 로그인하지 않은 상태에서는
`MEMBER_401_002`를 반환합니다.

## 나의 아카이브

`GET /api/archive`

```json
{
  "isSuccess": true,
  "code": "COLLECTION_200_001",
  "message": "아카이브 조회에 성공했습니다.",
  "result": {
    "acquiredCount": 1,
    "totalCount": 24,
    "items": [
      {
        "recordId": 7,
        "exhibitId": "ongi1-faith-jar",
        "name": "신앙항아리",
        "era": "근대",
        "description": "부천의 '점말'은 병인박해를 피해 천주교인들이 모여살면서 옹기를 만들던 곳이다. ...",
        "imageUrl": "/images/exhibits/ongi1-faith-jar.jpg",
        "exhibitionRoom": "옹기1전시실",
        "exhibitNumber": 1,
        "acquired": true,
        "acquiredAt": "2026-11-03T10:00:00"
      }
    ]
  }
}
```

게스트는 현재 브라우저 방문자의 수집 기록만 조회합니다. 로그인 회원은 해당 계정에 연결된
여러 브라우저의 방문 기록을 전시물 기준으로 합쳐서 조회합니다. 미획득 전시물도
`acquired: false`로 반환하며 이때 `recordId`, `acquiredAt`은 응답에서 제외됩니다.
`items`는 수집 대상 유물 24개가 `exhibitNumber`(유물 번호 = 관람 순서) 순서로 옵니다. 화면은 `exhibitionRoom`으로 전시실을 나눕니다.

## 수집 기록 상세

`GET /api/collections/{recordId}`

```json
{
  "isSuccess": true,
  "code": "COLLECTION_200_002",
  "message": "수집 기록 조회에 성공했습니다.",
  "result": {
    "recordId": 7,
    "exhibitId": "ongi1-faith-jar",
    "name": "신앙항아리",
    "era": "근대",
    "description": "부천의 '점말'은 병인박해를 피해 천주교인들이 모여살면서 옹기를 만들던 곳이다. ...",
    "imageUrl": "/images/exhibits/ongi1-faith-jar.jpg",
    "acquiredAt": "2026-11-03T10:00:00"
  }
}
```

현재 게스트 또는 로그인 회원이 소유하지 않은 수집 기록에는 `COLLECTION_404_001`을 반환합니다.

## 명예의 전당

`GET /api/hall-of-fame`

```json
{
  "isSuccess": true,
  "code": "HALL_200_001",
  "message": "명예의 전당 조회에 성공했습니다.",
  "result": {
    "total": 2,
    "today": 1,
    "myNo": null,
    "myName": "게스트 7919",
    "finishers": [
      { "no": 2, "name": "게스트 5838", "finishedAt": "2026-11-18T16:27:00", "durationSeconds": 708 },
      { "no": 1, "name": "부록이", "finishedAt": "2026-11-17T15:10:00", "durationSeconds": 1088 }
    ],
    "records": [
      { "id": 41, "type": "FINISH", "name": "게스트 5838", "finisherNo": 2, "durationSeconds": 708, "occurredAt": "2026-11-18T16:27:00" },
      { "id": 40, "type": "ROOM_DONE", "name": "게스트 5838", "exhibitionRoom": "수석전시실", "occurredAt": "2026-11-18T16:27:00" },
      { "id": 39, "type": "FILL", "name": "게스트 5838", "exhibitId": "stone-sunflower", "exhibitName": "해바라기문양석", "exhibitionRoom": "수석전시실", "occurredAt": "2026-11-18T16:27:00" }
    ]
  }
}
```

- 완주: 수집 대상 유물을 모두 모은 것. 마지막 유물을 모으는 순간 완주 번호(`no`)가 붙고 바뀌지 않습니다.
- `total`: 전체 완주자 수, `today`: 오늘(서버 기준 한국 시각) 완주한 수, `myNo`: 내 완주 번호(완주 전이면 `null`), `myName`: 명단에 보이는 내 이름.
- `finishers`: 최근에 완주한 순서로 20명. `durationSeconds`는 첫 유물부터 마지막 유물까지 걸린 시간(초)입니다.
- `records`: 최근 기록 30개(최근 순서). `type`은 `FILL`(유물을 모아 그림 한 칸 채움), `ROOM_DONE`(한 전시실 유물을 모두 모음), `FINISH`(완주). 종류에 없는 칸은 응답에서 빠집니다.
- `name`: 로그인한 회원은 닉네임, 게스트는 `게스트 0000`(방문자마다 같은 네 자리 번호).
- "오늘 16:27", "3분 전" 같은 문구는 화면이 만듭니다. 화면은 10초마다, 그리고 다른 탭에서 돌아왔을 때 다시 불러옵니다.

## 완주자 프로필

`GET /api/hall-of-fame/finishers/{no}`

```json
{
  "isSuccess": true,
  "code": "HALL_200_002",
  "message": "완주자 조회에 성공했습니다.",
  "result": { "no": 2, "name": "게스트 5838", "finishedAt": "2026-11-18T16:27:00", "durationSeconds": 708 }
}
```

없는 완주 번호에는 `HALL_404_001`을 반환합니다.
