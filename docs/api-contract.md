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
    "id": "goryeo-celadon",
    "name": "청자 상감운학문 매병",
    "era": "고려",
    "description": "전시물 설명",
    "imageUrl": "/images/exhibits/goryeo-celadon.jpg",
    "museumName": "부천시립박물관",
    "sourceName": "e뮤지엄",
    "sourceUrl": "https://www.emuseum.go.kr/"
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
- `collectible`: 카드 수집 대상 여부
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
        "cardNumber": 1,
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

e뮤지엄에서 가져온 전체 소장품과 실제 카드 수집 대상으로 선정한 소장품을 함께 관리합니다.
`collectible=true` 조건을 사용하면 카드 수집 대상만 조회할 수 있습니다. 전시실·카드 번호·관람
순서는 카드 대상으로 선정할 때 입력합니다.

## 전시물 이미지

`GET /api/exhibits/{exhibitId}/image`

e뮤지엄 이미지 주소에 포함된 접근 정보를 브라우저에 직접 노출하지 않도록 백엔드가 이미지를
대신 조회하여 바이너리로 반환합니다. 정상 응답의 `Content-Type`은 원본 이미지 형식을 따르며,
브라우저 캐시는 7일로 설정됩니다. 이미지가 없는 전시물은 `EXHIBIT_404_002`, e뮤지엄 장애는
`EXHIBIT_503_002`를 반환합니다.

## 전시물 퀴즈

`GET /api/exhibits/{exhibitId}/quiz`

```json
{
  "isSuccess": true,
  "code": "QUIZ_200_001",
  "message": "퀴즈 조회에 성공했습니다.",
  "result": {
    "quizId": 1,
    "question": "이 전시물이 제작된 시대는 언제일까요?",
    "options": [
      { "id": 11, "content": "고려" },
      { "id": 12, "content": "조선" }
    ]
  }
}
```

정답 여부는 조회 응답에 포함하지 않습니다.

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
    "explanation": "정답 해설",
    "card": {
      "cardId": 7,
      "exhibitId": "goryeo-celadon",
      "newlyAcquired": true
    }
  }
}
```

제출한 선택지가 해당 퀴즈에 속하지 않으면 `400 Bad Request`를 반환합니다. 정답인 경우
현재 방문자에게 카드가 발급됩니다. 이미 같은 카드를 가지고 있다면 기존 `cardId`와
`newlyAcquired: false`를 반환합니다. 오답 응답에는 `card` 필드가 포함되지 않습니다.

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
회원가입과 동시에 로그인됩니다. 가입 전 게스트로 획득한 카드는 생성된 회원 계정에
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
카드는 로그인한 회원에게 연결됩니다. 이메일 또는 비밀번호가 올바르지 않으면
`MEMBER_401_001`을 반환합니다.

## 로그아웃

`POST /api/auth/logout`

성공 응답 코드는 `MEMBER_200_002`입니다. 회원 세션을 종료하고 새로운 게스트 방문자
쿠키를 발급하여 이후 기록이 로그아웃한 회원에게 추가되지 않도록 합니다.

## 내 회원 정보

`GET /api/auth/me`

로그인한 회원의 `id`, `email`, `nickname`을 반환합니다. 로그인하지 않은 상태에서는
`MEMBER_401_002`를 반환합니다.

## 나의 아카이브

`GET /api/archive`

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {
    "acquiredCount": 1,
    "totalCount": 10,
    "cards": [
      {
        "cardId": 7,
        "exhibitId": "goryeo-celadon",
        "name": "청자 상감운학문 매병",
        "era": "고려",
        "imageUrl": "/images/exhibits/goryeo-celadon.jpg",
        "acquired": true,
        "acquiredAt": "2026-11-03T10:00:00"
      }
    ]
  }
}
```

게스트는 현재 브라우저 방문자의 카드만 조회합니다. 로그인 회원은 해당 계정에 연결된
여러 브라우저의 방문 기록을 전시물 기준으로 합쳐서 조회합니다. 미획득 전시물도
`acquired: false`로 반환하며 이때 `cardId`, `acquiredAt`은 응답에서 제외됩니다.

## 카드 상세

`GET /api/cards/{cardId}`

```json
{
  "isSuccess": true,
  "code": "CARD_200_002",
  "message": "카드 조회에 성공했습니다.",
  "result": {
    "cardId": 7,
    "exhibitId": "goryeo-celadon",
    "name": "청자 상감운학문 매병",
    "era": "고려",
    "description": "전시물 설명",
    "imageUrl": "/images/exhibits/goryeo-celadon.jpg",
    "acquiredAt": "2026-11-03T10:00:00"
  }
}
```

현재 게스트 또는 로그인 회원이 소유하지 않은 카드에는 `CARD_404_001`을 반환합니다.
