# 🏛️ BU:LOG (부록)

> 전시실 그림 속 빈자리를 채우며 유물을 만나는 박물관 탐험 서비스

**서비스 주소** : <https://bulog.tech>

## ✨ 프로젝트 소개

BU:LOG는 부천시립박물관 관람객이 전시물 옆 QR 코드를 찍고 관찰 미션을 풀어, 전시실마다 준비된 그림의 빈자리를 유물로 채워 가는 모바일 웹 서비스입니다.
e뮤지엄 공공데이터로 받은 소장품 정보를 관람 흐름에 맞춘 미션과 그림 도감으로 재구성해, 설명을 읽고 지나치는 관람을 유물을 직접 관찰하는 경험으로 바꾸는 것을 목표로 합니다.

- **기간** : 2026.10.26 ~ 진행 중
- **인원** : Backend 1명, Frontend 2명, Design 1명
- **목표** : 앱 설치 없이 QR만으로 시작하는 참여형 관람 경험을 만들고, 관람객이 유물을 실제로 관찰하도록 유도하는 것
- **핵심 흐름** : 전시물 QR 스캔 → 유물 소개 → 관찰 미션(퀴즈) → 전시실 그림 구역 채우기 → 그림 도감·진열장 → 전체 완성·명예의 전당

---

## 🧑🏻‍💻 팀원 및 역할

|               [허건우](https://github.com/woo6629058)                |                [강진영](https://github.com/tqwuis)                 |                [이진형](https://github.com/jijjin82)                 |                [황민기](https://github.com/mingi-hwang)                 |
|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|
| <img src="https://avatars.githubusercontent.com/u/156512340?v=4" width="160" alt="허건우 프로필"> | <img src="https://avatars.githubusercontent.com/u/109468108?v=4" width="160" alt="강진영 프로필"> | <img src="https://avatars.githubusercontent.com/u/316180442?v=4" width="160" alt="이진형 프로필"> | <img src="https://github.com/mingi-hwang.png?size=160" width="160" alt="황민기 프로필"> |
|                 Backend · 방문자·회원·전시물·퀴즈·카드 API · 인프라                 |                 Frontend · 홈·탭바·그림 도감·진열장·유물 상세                  |                  Frontend · QR 스캔·유물 소개·관찰 미션                  |                  Design · UI·UX 디자인, 전시실 그림                  |

---

## 🚀 주요 기능

| 기능 | 설명 |
| --- | --- |
| 게스트·회원 | 가입 없이 바로 수집하고, 로그인하면 게스트 기록을 계정으로 이어받기 |
| QR 스캔 | 카메라로 전시물 QR을 인식하고, 카메라를 쓸 수 없을 때는 유물 번호로 찾기 |
| 유물 소개 | 전시실·유물 번호와 함께 소장품 이미지와 설명 제공 |
| 관찰 미션 | 유물을 직접 보고 푸는 퀴즈, 정답은 서버에서만 검증 |
| 그림 도감 | 전시실별 그림의 빈 구역을 수집한 유물로 채우는 컬렉션 화면 |
| 진열장 | 모은 유물을 모아 보고 상세 정보 확인 |
| 명예의 전당 | 전체 완성 기록과 순위 |
| 소장품 데이터 | e뮤지엄 Open API로 부천시립박물관 소장품 동기화, 이미지는 서버를 거쳐 제공 |

---

## 🛠 기술 스택

| 구분 | 기술 |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.2, Gradle (Groovy) |
| Data | Spring Data JPA, MySQL 8.4 |
| Security | Spring Security, CSRF 토큰, 세션·HttpOnly 쿠키 |
| Frontend | HTML, CSS, JavaScript (ES Modules), jsQR |
| External | e뮤지엄 Open API (공공데이터포털) |
| Test | JUnit 5, Spring Boot Test |
| Infra | AWS EC2, RDS, Systems Manager, Docker, Nginx, Let's Encrypt (Certbot) |
| CI/CD | GitHub Actions, GitHub Container Registry, AWS OIDC |
| Collaboration | GitHub, Figma |

---

## 📡 API 구성

| 구분 | 주요 경로 | 기능 |
| --- | --- | --- |
| 인증·회원 | `/api/auth/csrf`, `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | CSRF 토큰, 가입, 로그인, 로그아웃, 내 정보 |
| 전시물 | `/api/exhibits`, `/api/exhibits/{exhibitId}`, `/api/exhibits/{exhibitId}/image` | 목록·검색, 상세, 소장품 이미지 |
| 관찰 미션 | `/api/exhibits/{exhibitId}/quiz`, `/api/quizzes/{quizId}/attempts` | 퀴즈 조회, 답안 채점과 수집 |
| 수집 기록 | `/api/archive`, `/api/cards/{cardId}` | 나의 수집 현황, 수집 상세 |

- 요청·응답 명세: [`docs/api-contract.md`](docs/api-contract.md)
- 모든 응답은 `isSuccess`, `code`, `message`, `result` 공통 구조를 사용합니다.

---

## 📁 프로젝트 구성

Spring Boot 표준 구조 안에서 프론트엔드와 백엔드를 나누고, 애플리케이션 하나로 빌드·배포합니다.

```text
src/main/java/com/bulog
├── domain
│   ├── visitor     # 게스트 방문자 식별과 쿠키
│   ├── member      # 회원가입, 로그인, 세션
│   ├── exhibit     # 전시물 조회, e뮤지엄 연동·동기화, 이미지 제공
│   ├── quiz        # 관찰 미션 조회와 채점
│   └── card        # 수집 기록과 아카이브
└── global
    ├── apiPayload  # 공통 응답, 코드, 예외 처리
    ├── config      # 공통 설정
    ├── security    # Spring Security
    └── entity      # 공통 엔티티

src/main/resources/static
├── pages           # 화면별 HTML (qr-scan, exhibit, quiz, picture-book, showcase …)
├── css             # common.css, components, pages
├── js
│   ├── api         # API 호출 모듈
│   ├── common      # 탭바, 그림 렌더링 등 공통 모듈
│   └── pages       # 화면별 스크립트
└── images          # 전시실 그림 등 리소스

deploy              # 배포 스크립트, Nginx 설정
docs                # API 명세
```

---

## 💻 로컬 실행 방법

### 요구 사항

- JDK 21
- (선택) MySQL 8.x — DB 없이 화면만 볼 때는 필요 없습니다.

### 화면만 확인 (DB 없이)

기본 `local` 프로필은 DB·JPA 연결을 끄고 실행합니다.

```bash
./gradlew bootRun
```

<http://localhost:8080>에서 확인합니다.

### DB와 함께 실행 (`dev` 프로필)

```sql
CREATE DATABASE IF NOT EXISTS bulog
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

IDE 실행 설정 또는 터미널 환경변수에 다음 값을 등록합니다. 필요한 전체 목록은 [`.env.example`](.env.example)을 참고합니다.

```dotenv
SPRING_PROFILES_ACTIVE=dev
DB_URL='jdbc:mysql://localhost:3306/bulog?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Seoul'
DB_USERNAME=your_local_user
DB_PASSWORD=your_local_password
```

Spring Boot는 `.env`를 자동으로 읽지 않으므로 IDE 실행 설정에 넣거나 터미널에서 불러옵니다.
`DB_URL`의 `&`가 셸 명령 구분자로 처리되지 않도록 로컬 `.env`에서는 값을 작은따옴표로 감쌉니다. IDE 실행 설정에는 따옴표 없이 넣고, 서버의 `/opt/bulog/.env`(`docker --env-file`)도 따옴표를 값으로 읽으므로 감싸지 않습니다.

```bash
set -a
source .env
set +a
./gradlew bootRun
```

### e뮤지엄 소장품 동기화

`EMUSEUM_API_SERVICE_KEY`(공공데이터포털 인증키)를 설정하고 `EMUSEUM_SYNC_ENABLED=true`로 한 번 실행하면 부천시립박물관 소장품을 DB에 저장합니다.
`e뮤지엄 소장품 동기화 완료` 로그를 확인한 뒤에는 다시 `false`로 바꿉니다. 동기화는 `local` 프로필에서는 실행되지 않습니다.

### 테스트

```bash
./gradlew test
```

---

## 🔄 CI/CD

- `main` 대상 Pull Request: Gradle 테스트와 `bootJar` 빌드
- `main` 반영: Docker 이미지 빌드 → GHCR(`ghcr.io/woo6629058/bu-log`) Push → AWS OIDC 인증 → Systems Manager로 EC2의 `deploy.sh` 실행
- `deploy.sh`가 새 컨테이너를 띄우고 헬스 체크까지 확인합니다.
- 배포 작업은 GitHub `production` 환경(배포 브랜치 `main`만 허용)에서만 실행되며, `AWS_DEPLOY_ROLE_ARN`, `EC2_INSTANCE_ID` Variables를 사용합니다.
- 수동 배포: Actions 탭에서 `CI/CD` 워크플로를 `Run workflow`로 실행합니다.

```text
GitHub Actions : 테스트 → bootJar → Docker 이미지 → GHCR
               → AWS OIDC 로그인 → SSM으로 EC2의 /opt/bulog/deploy.sh 실행
EC2 (Ubuntu)   : Nginx(80 → 443 리다이렉트, 443 HTTPS) → bulog 컨테이너(127.0.0.1:8080) → RDS MySQL
```

---

## ☁️ 운영 환경

- 서비스 주소: <https://bulog.tech> (`www.bulog.tech` 포함, HTTP는 HTTPS로 자동 이동)
- 서버 설정 파일: `/opt/bulog/.env` (예시는 `.env.example`, Git에 올리지 않습니다)
- 배포 스크립트: [`deploy/deploy.sh`](deploy/deploy.sh) → 서버의 `/opt/bulog/deploy.sh`
- Nginx 설정: [`deploy/nginx/bulog.conf`](deploy/nginx/bulog.conf) → 서버의 `/etc/nginx/sites-available/bulog`
- HTTPS 인증서: Let's Encrypt(Certbot). 서버의 `certbot.timer`가 만료 전에 자동 갱신하며, `certbot renew --dry-run`으로 확인합니다.
- 운영 `COOKIE_SECURE`는 `true`입니다. HTTPS가 아닌 주소로 접속하면 방문자·로그인 쿠키가 저장되지 않습니다.
- 서버 접속: AWS 콘솔 → EC2 → 인스턴스 → 연결 → Session Manager

---

## 🤝 협업 규칙

- 기본 흐름: `작업 브랜치 → Pull Request → main`
- 브랜치: `feat/기능명`, `fix/버그명`, `refactor/대상명`, `docs/문서명`, `chore/작업명`
- 커밋: `타입: 작업 내용` (예: `feat: 전시물 상세 화면 추가`)
- PR에 변경 내용과 확인 방법을 적고, 다른 담당자의 공통 파일을 바꿨다면 본문에 표시합니다.
- 공통 CSS·JavaScript·API 명세는 수정 전에 담당자와 조율합니다.
- 비밀번호, 토큰, API 키는 환경변수로 관리하고 저장소에 커밋하지 않습니다.

자세한 규칙은 [`CONTRIBUTING.md`](.github/CONTRIBUTING.md)와 [`AGENTS.md`](AGENTS.md)를 참고합니다.
