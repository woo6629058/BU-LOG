# BU:LOG (부록)

부천시립박물관 전시물의 QR 코드를 통해 정보를 확인하고, 퀴즈를 풀어 디지털 소장품 카드를 수집하는 웹 서비스입니다.

## 프로젝트 구조

```text
BU-LOG/
├── src/main/java/                    # Spring Boot 백엔드
├── src/main/resources/
│   ├── static/                       # HTML, CSS, JavaScript 프론트엔드
│   ├── application.yml
│   └── application-local.yml
├── src/test/                         # 백엔드 테스트
├── docs/                             # 팀 공통 문서와 API 명세
├── build.gradle
└── gradlew
```

Spring Boot 표준 구조를 사용합니다. 프론트엔드는 `src/main/resources/static`, 백엔드는 `src/main/java`에서 담당 영역을 분리하며 하나의 애플리케이션으로 빌드하고 배포합니다.

## 기술 스택

- Frontend: HTML, CSS, JavaScript (ES Modules)
- Backend: Java 21, Spring Boot 4.1.2, Gradle Groovy
- Database: MySQL, Spring Data JPA
- Collaboration: GitHub, Figma

## 로컬 실행

프로젝트 최상위 폴더에서 실행합니다.

```bash
./gradlew bootRun
```

실행 후 <http://localhost:8080>에서 확인합니다. 기본 `local` 프로필은 DB/JPA 연결을 비활성화하므로 MySQL 없이도 프론트 화면을 확인할 수 있습니다.

## 개발 담당 영역

- Frontend A: `exhibit.html`, `quiz.html` 및 대응하는 CSS/JS
- Frontend B: 메인, 카드 획득, 아카이브, 카드 상세 및 대응하는 CSS/JS
- Backend: 전시물·퀴즈·카드·익명 방문자 도메인, REST API, MySQL/JPA, 퀴즈 검증, 카드 발급, 방문자 기록, EC2 배포
- Design: Figma UI/UX, 디지털 카드 템플릿, 로고와 컬러, QR 안내판, 전시물 이미지 및 콘텐츠

공통 프론트엔드 파일은 `src/main/resources/static/css/common.css`, `src/main/resources/static/js/common`, `src/main/resources/static/js/api`에서 관리합니다. 백엔드 코드는 `src/main/java/com/bulog` 아래에서 도메인별로 관리합니다.

페이지별 JavaScript는 ES Module로 작성합니다. 백엔드 호출은 `src/main/resources/static/js/api`에 모아 화면 코드에서 URL과 `fetch` 옵션이 중복되지 않게 합니다.

API 요청·응답 명세는 [`docs/api-contract.md`](docs/api-contract.md)에 있습니다.

## MySQL 및 EC2

`.env.example`을 참고해 EC2 환경변수를 등록하고 `prod` 프로필로 실행합니다. `.env`와 프로필별 비밀 설정 파일은 Git에서 제외됩니다.

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

초기 개발 단계의 `JPA_DDL_AUTO` 기본값은 `update`입니다. 실제 데이터와 스키마가 안정되면 `validate`로 전환하고 마이그레이션 도구 도입을 검토합니다.
