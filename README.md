# When2Meet

같은 방(세션)에 있는 사용자끼리 **30분 단위**로 가능/불가능 시간을 체크해서, 겹치는 약속 후보 시간을 빠르게 찾는 앱입니다.

![When2Meet icon](assets/icon.png)

## 주요 기능

- 회원가입/로그인 (아이디/비밀번호/이름)
- 방 생성, 초대코드로 참여
- 달력에서 날짜 선택 -> 타임라인으로 일정 추가/수정/삭제
- 2명 기준으로 겹치는 **가능 시간**을 약속 후보로 표시
- 개인 일정은 방 참여 여부와 무관하게 저장되고, 방 안에서 수정하면 개인 일정에도 반영

## 기술 스택

- Expo + React Native (Android / iOS / Web)
- Supabase (Auth + Postgres + RLS)

## 로컬 실행

1. 의존성 설치

```bash
npm install
```

2. 환경변수 설정

`.env`에 아래 값을 넣습니다.

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

3. Supabase SQL 적용

Supabase SQL Editor에서 아래 파일 내용을 실행합니다.

- `supabase/schema.sql`
- `supabase/policies.sql`

4. 실행

```bash
npm run start
```

웹으로만 확인하려면:

```bash
npm run web
```

## UI 스크린샷

스크린샷은 `docs/screenshots/`에 넣고, 아래 파일명으로 관리합니다.

- `docs/screenshots/01-login.png`
- `docs/screenshots/02-rooms.png`
- `docs/screenshots/03-room-calendar.png`
- `docs/screenshots/04-room-day.png`

현재 리포지토리에는 폴더만 준비되어 있습니다.

## Vercel 자동 배포(예정)

이 프로젝트는 Web 빌드 산출물이 `dist/`로 나오도록 배포하는 방식을 권장합니다.

- Build Command: `npx expo export -p web`
- Output Directory: `dist`

Supabase 키는 Vercel Environment Variables로 설정합니다.

