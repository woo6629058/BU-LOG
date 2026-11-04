# BU:LOG (부록)

부천시립박물관 전시물의 QR 코드를 통해 정보를 확인하고, 퀴즈를 풀어 디지털 소장품 카드를 수집하는 웹 서비스입니다.

## 프로젝트 구조

```text
BU-LOG/
├── src/main/java/com/bulog/           # Spring Boot 백엔드
│   ├── domain/
│   │   ├── exhibit/                   # 전시물 조회와 공공데이터 연동
│   │   ├── quiz/                      # 퀴즈 조회와 정답 검증
│   │   ├── card/                      # 카드 발급과 아카이브
│   │   ├── visitor/                   # 게스트 방문자 식별과 기록
│   │   └── member/                    # 회원가입과 로그인
│   └── global/                        # 공통 응답, 예외, 설정, 보안
├── src/main/resources/
│   ├── static/                        # HTML, CSS, JavaScript 프론트엔드
│   │   ├── pages/                     # 화면별 HTML
│   │   ├── css/                       # 공통·컴포넌트·화면별 스타일
│   │   ├── js/                        # API·공통·화면별 JavaScript
│   │   └── images/                    # 이미지 리소스
│   ├── application.yml
│   └── application-local.yml
├── src/test/java/                     # 백엔드 테스트
├── docs/                              # 팀 공통 문서와 API 명세
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
- Backend: 전시물·퀴즈·카드·게스트 방문자·회원 도메인, REST API, MySQL/JPA, 퀴즈 검증, 카드 발급, 방문자 기록, EC2 배포
- Design: Figma UI/UX, 디지털 카드 템플릿, 로고와 컬러, QR 안내판, 전시물 이미지 및 콘텐츠

공통 프론트엔드 파일은 `src/main/resources/static/css/common.css`, `src/main/resources/static/js/common`, `src/main/resources/static/js/api`에서 관리합니다. 백엔드 코드는 `src/main/java/com/bulog` 아래에서 도메인별로 관리합니다.

페이지별 JavaScript는 ES Module로 작성합니다. 백엔드 호출은 `src/main/resources/static/js/api`에 모아 화면 코드에서 URL과 `fetch` 옵션이 중복되지 않게 합니다.

API 요청·응답 명세는 [`docs/api-contract.md`](docs/api-contract.md)에 있습니다.

## 환경 설정

실제 비밀번호와 API 인증키는 코드나 설정 파일에 작성하지 않고 환경변수로 관리합니다.
필요한 환경변수 이름과 예시값은 `.env.example`에서 확인할 수 있습니다. 실제 `.env`와
프로필별 비밀 설정 파일은 Git에서 제외됩니다.

### MySQL 및 실행 프로필

MySQL을 사용하는 개발·운영 환경에서는 다음 환경변수를 등록합니다.

- `SPRING_PROFILES_ACTIVE`: 로컬 DB 개발은 `dev`, EC2 운영은 `prod`
- `DB_URL`: MySQL JDBC 주소
- `DB_USERNAME`: MySQL 사용자 이름
- `DB_PASSWORD`: MySQL 비밀번호

기본 `local` 프로필은 MySQL 연결 없이 프론트 화면과 로컬 샘플 데이터를 확인할 때 사용합니다.
초기 개발 단계의 `JPA_DDL_AUTO` 기본값은 `update`입니다. 실제 데이터와 스키마가 안정되면
`validate`로 전환하고 마이그레이션 도구 도입을 검토합니다.

### e뮤지엄 Open API

부천시립박물관 소장품 정보를 가져오기 위해 다음 환경변수를 사용합니다.

- `EMUSEUM_API_SERVICE_KEY`: 공공데이터포털에서 발급받은 인증키
- `EMUSEUM_INSTITUTION_CODE`: 부천시립박물관 기관 코드, 기본값 `PS01003464`
- `EMUSEUM_SYNC_PAGE_SIZE`: 동기화 요청당 조회 개수, 기본값 `1000`

인증키는 README, 코드, 커밋 또는 Pull Request에 작성하지 않습니다. e뮤지엄 이미지 주소도
접근 정보가 포함될 수 있으므로 프론트엔드에 직접 전달하지 않고 백엔드 이미지 API를 통해
제공합니다.

### e뮤지엄 소장품 동기화

DB가 연결된 `dev` 또는 `prod` 프로필에서 `EMUSEUM_SYNC_ENABLED=true`로 애플리케이션을
한 번 실행하면 e뮤지엄 소장품 목록을 DB에 저장합니다. 동기화 완료 로그를 확인한 후에는
재시작할 때마다 공공 API를 호출하지 않도록 다시 `false`로 변경합니다.
