# BU:LOG API 명세서

모든 API 경로는 `/api`로 시작하며 JSON을 사용합니다.

## 공통 응답

성공 응답은 다음 구조를 사용합니다.

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {},
  "errorDetail": null
}
```

실패 응답에서는 `result`가 `null`이며 입력값 등 추가 정보가 있으면 `errorDetail`에 포함됩니다.

```json
{
  "isSuccess": false,
  "code": "COMMON_400_002",
  "message": "입력값 검증에 실패했습니다.",
  "result": null,
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
  },
  "errorDetail": null
}
```

존재하지 않는 전시물을 조회하면 `404 Not Found`를 반환합니다.

```json
{
  "isSuccess": false,
  "code": "EXHIBIT_404_001",
  "message": "전시물을 찾을 수 없습니다.",
  "result": null,
  "errorDetail": {
    "exhibitId": "unknown"
  }
}
```

## 전시물 퀴즈

`GET /api/exhibits/{exhibitId}/quiz`

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {
    "quizId": 1,
    "question": "이 전시물이 제작된 시대는 언제일까요?",
    "options": [
      { "id": 11, "content": "고려" },
      { "id": 12, "content": "조선" }
    ]
  },
  "errorDetail": null
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
  "code": "COMMON_200",
  "message": "요청에 성공했습니다.",
  "result": {
    "correct": true,
    "explanation": "정답 해설",
    "cardIssued": true,
    "cardId": 7
  },
  "errorDetail": null
}
```

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
        "id": 7,
        "name": "고려청자 카드",
        "imageUrl": "/images/cards/goryeo-celadon.jpg",
        "acquired": true,
        "acquiredAt": "2026-10-26T18:00:00+09:00"
      }
    ]
  },
  "errorDetail": null
}
```

익명 방문자는 백엔드가 발급한 HttpOnly 쿠키로 식별하며 프론트엔드가 토큰을 직접 저장하지 않습니다.
