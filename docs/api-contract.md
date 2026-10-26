# BU:LOG API 명세서

모든 API 경로는 `/api`로 시작하며 JSON을 사용합니다.

## 전시물 상세

`GET /api/exhibits/{exhibitId}`

```json
{
  "id": "goryeo-celadon",
  "name": "청자 상감운학문 매병",
  "era": "고려",
  "description": "전시물 설명",
  "imageUrl": "/images/exhibits/goryeo-celadon.jpg"
}
```

## 전시물 퀴즈

`GET /api/exhibits/{exhibitId}/quiz`

```json
{
  "quizId": 1,
  "question": "이 전시물이 제작된 시대는 언제일까요?",
  "options": [
    { "id": 11, "content": "고려" },
    { "id": 12, "content": "조선" }
  ]
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
  "correct": true,
  "explanation": "정답 해설",
  "cardIssued": true,
  "cardId": 7
}
```

## 나의 아카이브

`GET /api/archive`

```json
{
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
}
```

익명 방문자는 백엔드가 발급한 HttpOnly 쿠키로 식별하며 프론트엔드가 토큰을 직접 저장하지 않습니다.
