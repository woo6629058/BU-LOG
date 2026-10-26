# BU:LOG Agent Guide

이 문서는 BU:LOG 저장소에서 작업하는 에이전트가 따라야 하는 규칙입니다.
저장소의 일반 협업 규칙은 `.github/CONTRIBUTING.md`를 함께 참고합니다.

## 1. 사용자와의 협업

- 코드나 설정 파일을 수정하기 전에 변경 목적, 대상 파일, 수정 범위를 먼저 알립니다.
- 사용자가 승인한 범위만 수정하고, 범위 밖 변경이 필요하면 다시 설명하고 확인받습니다.
- 기존 작업과 무관한 수정, 스테이징된 파일, untracked 파일은 사용자 작업으로 간주하고 보존합니다.
- 작업 완료 시 변경한 파일, 확인한 항목, 사용자가 직접 검증할 항목을 구분해 안내합니다.

## 2. 프로젝트 환경

- Java 21
- Spring Boot 4.1.2
- Gradle Wrapper (Groovy DSL)
- Spring Web MVC, Spring Data JPA, Validation
- MySQL
- Lombok, Spring Boot DevTools
- HTML, CSS, JavaScript (ES Modules)
- AWS EC2 단일 Spring Boot 서버
- GitHub, Figma

## 3. 저장소 구조

```text
BU-LOG/
├── src/main/java/com/bulog/       Spring Boot 백엔드
├── src/main/resources/
│   ├── static/
│   │   ├── pages/                 화면별 HTML
│   │   ├── css/                   공통·컴포넌트·페이지 스타일
│   │   ├── js/api/                API 호출 모듈
│   │   ├── js/common/             공통 JavaScript
│   │   ├── js/pages/              화면별 JavaScript
│   │   └── images/                이미지 리소스
│   └── application*.yml           애플리케이션 설정
├── src/test/java/                 백엔드 테스트
├── docs/                          API 명세와 협업 문서
├── build.gradle                   Spring Boot 빌드
└── gradlew                        Gradle Wrapper
```

- 백엔드 기능은 기존 `src/main/java/com/bulog/<domain>` 구조와 인접 코드의 패턴을 따릅니다.
- 도메인은 `exhibit`, `quiz`, `card`, `visitor`를 기준으로 분리합니다.
- 프론트엔드 화면은 `src/main/resources/static/pages`, 페이지별 스타일은 `static/css/pages`, 페이지별 동작은 `static/js/pages`에 배치합니다.
- 여러 화면에서 사용하는 코드만 `static/js/common` 또는 `static/css/components`에 배치합니다.
- 프론트엔드 소스는 `src/main/resources/static`에서 관리하며 Spring Boot 빌드에 자동 포함합니다.
- `build/` 아래 생성물을 직접 수정하지 않습니다.

## 4. Backend 규칙

- 클래스는 PascalCase, 메서드와 변수는 camelCase, 상수는 UPPER_SNAKE_CASE를 사용합니다.
- 의존성 주입은 생성자 주입을 우선합니다.
- Entity를 API 응답으로 직접 반환하지 않고 요청·응답 DTO를 사용합니다.
- Controller는 HTTP 요청과 응답을 담당하고 핵심 비즈니스 규칙은 Service 또는 Domain 계층에 둡니다.
- 퀴즈 정답은 조회 API 응답에 포함하지 않으며 백엔드에서 검증합니다.
- 카드 발급은 중복 요청에도 같은 방문자에게 같은 카드가 중복 생성되지 않도록 설계합니다.
- 익명 방문자 식별 정보는 예측하기 어려운 값으로 생성하고 HttpOnly 쿠키 사용을 우선합니다.
- API 경로는 `/api`로 시작합니다.
- 예외 응답 형식은 기능마다 다르게 만들지 않고 공통 구조를 사용합니다.
- 트랜잭션과 동시성 변경 시 실패, 재시도, 롤백 경로까지 고려합니다.
- 불필요한 전체 리팩터링이나 포맷 변경을 기능 수정과 섞지 않습니다.

## 5. Frontend 규칙

- React 등 별도 프레임워크를 사용하지 않고 HTML, CSS, JavaScript ES Modules로 개발합니다.
- HTML은 시맨틱 태그를 사용하고 키보드 접근, `alt`, `label`, `aria-live` 등 기본 접근성을 고려합니다.
- 공통 색상, 간격, 글꼴 값은 `src/main/resources/static/css/common.css`의 CSS 변수로 관리합니다.
- 페이지별 스타일과 동작을 공통 파일 하나에 계속 추가하지 않습니다.
- API 요청은 `src/main/resources/static/js/api` 모듈에 모으고 페이지 코드에서 `fetch` URL을 중복 작성하지 않습니다.
- API 기본 경로는 `/api`이며 실제 명세는 `docs/api-contract.md`를 따릅니다.
- HTML에 실제 비밀번호, 토큰, 관리자 정보 또는 퀴즈 정답을 포함하지 않습니다.
- 백엔드 API가 준비되지 않은 경우 임의로 응답 필드를 확정하지 않고 API 명세를 먼저 확인합니다.
- Frontend A와 Frontend B가 함께 수정하는 공통 파일은 작업 전에 담당 범위를 조율합니다.

## 6. 설정 및 보안

- 비밀번호, 토큰, API 키, SSH 키 등 실제 인증 정보를 저장소에 작성하지 않습니다.
- 실제 `.env`와 비밀 설정은 Git에서 제외하고 `.env.example`에는 예시값만 작성합니다.
- 새로운 환경변수를 추가하면 기존 이름 규칙을 따르고 `.env.example`과 문서를 함께 검토합니다.
- DB 접속 정보가 없으면 임의로 추측하지 않고 DB 없이 확인 가능한 local 프로필을 유지합니다.
- 운영 데이터 삭제, Git reset, 강제 푸시 등 복구가 어려운 작업은 사용자 승인 없이 실행하지 않습니다.

## 7. Git 규칙

- 기본 브랜치는 `main`입니다.
- 기능 단위로 짧은 브랜치를 만들고 작업이 끝나면 Pull Request로 `main`에 반영합니다.
- 브랜치 이름은 영문 소문자와 하이픈 사용을 권장합니다.
  - 기능: `feat/기능명`
  - 버그 수정: `fix/버그명`
  - 리팩터링: `refactor/대상명`
  - 문서: `docs/문서명`
  - 설정: `chore/작업명`
- 커밋 메시지는 다음 형식을 사용합니다.
  - 기능: `feat: 기능명`
  - 버그 수정: `fix: 수정 내용`
  - 리팩터링: `refactor: 변경 내용`
  - 문서: `docs: 문서 내용`
  - 설정: `chore: 설정 내용`
- 한 커밋에는 가능한 한 하나의 목적만 포함합니다.

## 8. 검증 및 인계

- 파일 수정 후 가능한 범위에서 문법, 설정 구조, 경로 참조를 확인합니다.
- `git diff --check`는 작업 트리를 변경하지 않는 범위에서 확인할 수 있습니다.
- 실행하지 않은 검증을 성공했다고 표현하지 않습니다.
- 프론트 화면 검증과 백엔드 API 검증을 구분해 보고합니다.
- 최종 안내에는 변경 파일, 예상 영향, 사용자가 실행할 검증 명령, 남은 작업을 포함합니다.
