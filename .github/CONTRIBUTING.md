# BU:LOG Contribution Guide

BU:LOG는 Spring Boot 표준 구조 안에서 프론트엔드와 백엔드 담당 영역을 나누고 애플리케이션 하나로 배포합니다.

## 1. 작업 시작

최신 `main` 브랜치를 기준으로 작업 브랜치를 만듭니다.

브랜치 이름은 짧고 알아보기 쉽게 작성합니다.

```text
feat/exhibit-detail
feat/quiz
feat/archive
fix/card-duplicate
refactor/api-response
docs/api-spec
chore/project-setting
```

사용하는 접두사는 다음과 같습니다.

- `feat/`: 새로운 기능
- `fix/`: 버그 수정
- `refactor/`: 기능 변화가 없는 코드 개선
- `docs/`: 문서 변경
- `chore/`: 설정과 기타 작업

## 2. 담당 영역

- Frontend A: 전시물 상세, 퀴즈, QR URL 연동
- Frontend B: 메인, 카드 획득, 아카이브, 카드 상세
- Backend: DB, REST API, 퀴즈 검증, 카드 발급, 방문자 기록, 배포
- Design: Figma, 카드 템플릿, 로고, 색상, QR 안내판, 콘텐츠

공통 CSS, 공통 JavaScript, API 명세처럼 여러 사람이 사용하는 파일은 수정 전에 작업 내용을 공유합니다.

## 3. 커밋 메시지

커밋 메시지는 `타입: 작업 내용` 형식을 사용합니다.

```text
feat: 전시물 상세 화면 추가
feat: 퀴즈 정답 검증 API 추가
fix: 카드 중복 발급 방지
refactor: 전시물 응답 DTO 분리
docs: API 명세 수정
chore: 로컬 환경 설정 추가
```

커밋 하나에는 가능한 한 하나의 목적만 포함합니다.

## 4. Pull Request

- Pull Request 대상 브랜치는 `main`입니다.
- 제목은 커밋 메시지와 같은 형식으로 작성합니다.
- 본문에는 변경 내용과 확인 방법을 간단히 작성합니다.
- 프론트 화면 변경은 가능하면 화면 캡처를 첨부합니다.
- API 변경은 `docs/api-contract.md`도 함께 확인합니다.
- 다른 담당자의 공통 파일을 변경했다면 Pull Request 본문에 표시합니다.

## 5. 로컬 확인

프로젝트 최상위 폴더에서 실행합니다.

```bash
./gradlew bootRun
```

브라우저에서 <http://localhost:8080>을 엽니다.

백엔드 테스트가 필요한 경우 다음 명령을 사용합니다.

```bash
./gradlew test
```

프론트엔드 파일은 `src/main/resources/static/`, 백엔드 파일은 `src/main/java/`에서 수정합니다. `build/` 아래 생성 파일은 직접 수정하지 않습니다.

## 6. 보안

- `.env`, 비밀번호, API 키, DB 접속 비밀정보는 커밋하지 않습니다.
- 환경변수 예시는 `.env.example`에 실제 값이 아닌 예시값으로 작성합니다.
- 퀴즈 정답과 방문자 식별 토큰을 HTML이나 공개 API 응답에 포함하지 않습니다.
