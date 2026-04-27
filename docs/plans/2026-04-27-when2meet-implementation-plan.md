# When2Meet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Android/iOS에서 동작하는 일정 공유 MVP를 Expo React Native와 Supabase로 구현한다.

**Architecture:** Expo React Native 앱이 화면, 상태, 사용자 입력을 담당하고 Supabase가 인증, PostgreSQL 데이터 저장, 기본 API, 실시간 동기화를 담당한다. 후보 시간 계산은 MVP에서는 클라이언트에서 수행하되, 데이터 구조는 추후 Supabase RPC 또는 Edge Function으로 옮길 수 있게 30분 슬롯 단위로 설계한다.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, Supabase Auth, Supabase JavaScript Client, PostgreSQL, date-fns

---

## 1. 확정된 MVP 정책

- 시간 범위는 `08:00-23:30`으로 제한한다.
- 시간 단위는 30분 슬롯만 지원한다.
- 후보 기준은 고정값으로 둔다: 같은 날짜에 2명 이상 체크했고, 같은 시간 슬롯에 2명 이상이 가능해야 한다.
- 미체크는 후보 계산에서 불가능으로 취급한다.
- 일정 이름은 슬롯별이 아니라 날짜별 사용자 입력에 1개만 저장한다.
- 초대 방식은 초대 코드 입력을 먼저 구현한다.
- 로그인은 Supabase Auth를 사용한다.
- 이슈/요청은 사용자 등록 화면과 관리자 목록 화면을 모두 MVP에 포함한다.
- 설정 화면에는 프로필 편집, 테마 선택, 로그아웃을 포함한다.
- 기기 캘린더 연동, 푸시 알림, 직접 사용자 초대는 후속 버전으로 둔다.

## 2. 예상 파일 구조

```text
When2Meet/
  app.json
  app/
    _layout.tsx
    index.tsx
    auth/
      login.tsx
      signup.tsx
    rooms/
      index.tsx
      create.tsx
      join.tsx
      [roomId]/
        calendar.tsx
        day.tsx
        issues.tsx
    settings/
      index.tsx
      profile.tsx
    admin/
      issues.tsx
  src/
    components/
      CalendarMonth.tsx
      CandidateList.tsx
      TimeSlotGrid.tsx
      UserDaySummary.tsx
    constants/
      timeSlots.ts
    features/
      auth/
        authApi.ts
        authTypes.ts
      profile/
        profileApi.ts
        profileTypes.ts
      rooms/
        roomApi.ts
        roomTypes.ts
      availability/
        availabilityApi.ts
        availabilityLogic.ts
        availabilityTypes.ts
      issues/
        issueApi.ts
        issueTypes.ts
    lib/
      supabase.ts
    theme/
      colors.ts
      ThemeProvider.tsx
      useTheme.ts
  supabase/
    schema.sql
    policies.sql
```

## 3. 데이터베이스 설계

### profiles

Supabase Auth의 `auth.users`를 기준으로 앱 프로필을 별도 테이블에 둔다.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### rooms

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

### room_members

```sql
create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);
```

### availability_day_notes

날짜별 일정 이름은 사용자와 날짜 단위로 1개만 저장한다.

```sql
create table availability_day_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  title text,
  updated_at timestamptz not null default now(),
  unique(room_id, user_id, date)
);
```

### availability_slots

```sql
create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  slot_time time not null,
  status text not null check (status in ('available', 'unavailable')),
  updated_at timestamptz not null default now(),
  unique(room_id, user_id, date, slot_time)
);
```

### user_issues

```sql
create table user_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  issue_type text not null check (issue_type in ('bug', 'improvement', 'feature')),
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 4. 테마 설계

Expo 설정에서 시스템 테마 자동 전환을 켠다.

```json
{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}
```

React Native의 `useColorScheme()`으로 시스템 테마를 읽고, 사용자 설정값이 `system`이면 시스템 값을 따른다. 사용자 설정값이 `light` 또는 `dark`이면 해당 테마를 강제 적용한다.

```ts
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme | null | undefined,
): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemTheme === "light" ? "light" : "dark";
}
```

색상 토큰은 `src/theme/colors.ts`에 둔다.

```ts
export const colors = {
  dark: {
    background: "#0B0D10",
    surface: "#141820",
    surfaceElevated: "#1B2029",
    textPrimary: "#F4F7FA",
    textSecondary: "#AAB4C0",
    border: "#2A313D",
    primary: "#4F8CFF",
    available: "#2ED47A",
    unavailable: "#FF5C5C",
    partial: "#F5B84B",
  },
  light: {
    background: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceElevated: "#F0F3F7",
    textPrimary: "#111827",
    textSecondary: "#5B6472",
    border: "#D8DEE8",
    primary: "#2563EB",
    available: "#16A34A",
    unavailable: "#DC2626",
    partial: "#D97706",
  },
} as const;
```

## 5. 핵심 로직

### 30분 슬롯 생성

```ts
export function createThirtyMinuteSlots(): string[] {
  const slots: string[] = [];

  for (let hour = 8; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return slots;
}
```

### 후보 시간 계산

입력:

```ts
type AvailabilityStatus = "available" | "unavailable";

type AvailabilitySlot = {
  roomId: string;
  userId: string;
  date: string;
  slotTime: string;
  status: AvailabilityStatus;
  displayName: string;
};
```

규칙:

- 날짜별로 체크한 사용자가 2명 미만이면 후보 없음.
- 같은 날짜와 같은 슬롯에서 `available`인 사용자가 2명 이상이면 후보.
- `unavailable`과 미체크는 후보 계산에서 제외.

```ts
export function findCandidateSlots(slots: AvailabilitySlot[]) {
  const checkedUsersByDate = new Map<string, Set<string>>();
  const availableUsersByDateSlot = new Map<string, Map<string, AvailabilitySlot[]>>();

  for (const slot of slots) {
    if (!checkedUsersByDate.has(slot.date)) {
      checkedUsersByDate.set(slot.date, new Set());
    }
    checkedUsersByDate.get(slot.date)!.add(slot.userId);

    if (slot.status !== "available") {
      continue;
    }

    if (!availableUsersByDateSlot.has(slot.date)) {
      availableUsersByDateSlot.set(slot.date, new Map());
    }

    const slotMap = availableUsersByDateSlot.get(slot.date)!;
    if (!slotMap.has(slot.slotTime)) {
      slotMap.set(slot.slotTime, []);
    }
    slotMap.get(slot.slotTime)!.push(slot);
  }

  const candidates = [];

  for (const [date, slotMap] of availableUsersByDateSlot) {
    const checkedUserCount = checkedUsersByDate.get(date)?.size ?? 0;
    if (checkedUserCount < 2) {
      continue;
    }

    for (const [slotTime, availableSlots] of slotMap) {
      const uniqueUsers = new Map(availableSlots.map((slot) => [slot.userId, slot]));
      if (uniqueUsers.size >= 2) {
        candidates.push({
          date,
          slotTime,
          users: Array.from(uniqueUsers.values()).map((slot) => ({
            userId: slot.userId,
            displayName: slot.displayName,
          })),
        });
      }
    }
  }

  return candidates;
}
```

## 6. 구현 작업 목록

### Task 1: Expo 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `tsconfig.json`

- [ ] Expo TypeScript 템플릿으로 프로젝트를 생성한다.
- [ ] Expo Router를 설치하고 `app/` 라우팅 구조를 사용한다.
- [ ] `app.json`에 `userInterfaceStyle: "automatic"`을 설정한다.
- [ ] `npm run start`, `npm run android`, `npm run ios` 스크립트를 확인한다.
- [ ] 첫 화면에서 로그인 화면으로 이동할 수 있게 한다.
- [ ] Android/iOS 시뮬레이터 또는 Expo Go에서 기본 화면이 뜨는지 확인한다.

### Task 2: Supabase 연결 및 스키마

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.example`
- Create: `supabase/schema.sql`
- Create: `supabase/policies.sql`

- [ ] Supabase 프로젝트를 생성한다.
- [ ] `.env.example`에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`를 정의한다.
- [ ] `src/lib/supabase.ts`에서 Supabase client를 생성한다.
- [ ] `supabase/schema.sql`에 `profiles`, `rooms`, `room_members`, `availability_day_notes`, `availability_slots`, `user_issues` 테이블을 작성한다.
- [ ] `profiles.role`이 `admin`인 사용자만 관리자 이슈 화면에서 전체 이슈를 볼 수 있게 RLS 정책을 설계한다.

### Task 3: Supabase Auth 회원가입/로그인

**Files:**
- Create: `app/auth/login.tsx`
- Create: `app/auth/signup.tsx`
- Create: `src/features/auth/authApi.ts`
- Create: `src/features/auth/authTypes.ts`

- [ ] 회원가입 화면에 아이디, 비밀번호, 이름 입력 필드를 만든다.
- [ ] Supabase Auth의 이메일 기반 가입을 사용하되, MVP에서는 아이디를 내부 이메일 형식으로 매핑하는 방식을 사용한다.
- [ ] 회원가입 성공 후 `profiles`에 username, display_name을 저장한다.
- [ ] 로그인 시 같은 매핑 규칙으로 Supabase Auth에 로그인한다.
- [ ] 로그인 세션을 앱 시작 시 복원한다.
- [ ] 로그아웃 API를 구현한다.

### Task 4: 테마 시스템

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/ThemeProvider.tsx`
- Create: `src/theme/useTheme.ts`
- Modify: `app/_layout.tsx`

- [ ] `colors.ts`에 dark/light 색상 토큰을 정의한다.
- [ ] `resolveTheme` 함수를 작성한다.
- [ ] `ThemeProvider`에서 `useColorScheme()`과 프로필의 `theme_preference`를 조합한다.
- [ ] 앱 전체 배경, 텍스트, 버튼, 입력창이 테마 토큰을 사용하게 한다.
- [ ] 시스템 설정 변경 시 `system` 모드 사용자는 앱 테마가 자동으로 바뀌는지 확인한다.

### Task 5: 설정 및 프로필 편집

**Files:**
- Create: `app/settings/index.tsx`
- Create: `app/settings/profile.tsx`
- Create: `src/features/profile/profileApi.ts`
- Create: `src/features/profile/profileTypes.ts`

- [ ] 설정 화면에 프로필 편집, 테마 선택, 로그아웃 메뉴를 만든다.
- [ ] 프로필 편집 화면에서 이름, 프로필 사진 URL, 한줄소개를 수정할 수 있게 한다.
- [ ] 테마 선택은 `system`, `light`, `dark` 중 하나로 저장한다.
- [ ] 테마 변경 직후 현재 화면에 반영한다.
- [ ] 로그아웃 시 Supabase 세션을 종료하고 로그인 화면으로 이동한다.

### Task 6: 방 생성/초대 코드 참여

**Files:**
- Create: `app/rooms/index.tsx`
- Create: `app/rooms/create.tsx`
- Create: `app/rooms/join.tsx`
- Create: `src/features/rooms/roomApi.ts`
- Create: `src/features/rooms/roomTypes.ts`

- [ ] 방 목록 화면을 만든다.
- [ ] 방 생성 화면에서 방 이름을 입력받는다.
- [ ] 6자리 이상의 초대 코드를 생성한다.
- [ ] 방 생성 시 생성자를 `room_members`에 owner로 추가한다.
- [ ] 초대 코드 입력으로 방에 참여한다.
- [ ] 이미 참여한 방에 중복 참여하지 않게 한다.

### Task 7: 캘린더 화면

**Files:**
- Create: `app/rooms/[roomId]/calendar.tsx`
- Create: `src/components/CalendarMonth.tsx`
- Create: `src/components/CandidateList.tsx`
- Create: `src/components/UserDaySummary.tsx`

- [ ] 월간 캘린더 UI를 만든다.
- [ ] 날짜를 누르면 `app/rooms/[roomId]/day.tsx`로 이동한다.
- [ ] 날짜별 사용자 상태 요약을 표시한다.
- [ ] 후보 시간이 있는 날짜와 시간을 상단에 표시한다.
- [ ] 후보를 누르면 해당 날짜 타임라인으로 이동한다.

### Task 8: 30분 타임라인 입력

**Files:**
- Create: `app/rooms/[roomId]/day.tsx`
- Create: `src/components/TimeSlotGrid.tsx`
- Create: `src/constants/timeSlots.ts`
- Create: `src/features/availability/availabilityApi.ts`
- Create: `src/features/availability/availabilityTypes.ts`

- [ ] `08:00`부터 `23:30`까지 30분 슬롯을 생성한다.
- [ ] 각 슬롯을 미체크, 가능, 불가능 3상태로 표시한다.
- [ ] 슬롯을 누르면 상태가 `미체크 -> 가능 -> 불가능 -> 미체크` 순서로 변경되게 한다.
- [ ] 저장 시 체크된 슬롯만 `availability_slots`에 upsert한다.
- [ ] 미체크로 바뀐 슬롯은 기존 row를 삭제한다.
- [ ] 일정 이름은 `availability_day_notes`에 날짜별 사용자 입력 1개로 저장한다.

### Task 9: 후보 시간 계산

**Files:**
- Create: `src/features/availability/availabilityLogic.ts`
- Test: `src/features/availability/availabilityLogic.test.ts`

- [ ] `findCandidateSlots` 단위 테스트를 먼저 작성한다.
- [ ] 2명 미만 체크한 날짜는 후보가 없는지 테스트한다.
- [ ] 2명이 같은 슬롯을 가능으로 체크하면 후보가 생기는지 테스트한다.
- [ ] 한 명은 가능, 한 명은 불가능이면 후보가 없는지 테스트한다.
- [ ] 미체크 사용자는 후보에 포함되지 않는지 테스트한다.
- [ ] 테스트를 통과하는 최소 구현을 작성한다.

### Task 10: 사용자 이슈/요청 등록

**Files:**
- Create: `app/rooms/[roomId]/issues.tsx`
- Create: `src/features/issues/issueApi.ts`
- Create: `src/features/issues/issueTypes.ts`

- [ ] 방 화면에서 이슈/요청 페이지로 이동할 수 있는 버튼을 추가한다.
- [ ] 요청 종류를 `버그`, `개선 요청`, `기능 요청`으로 선택하게 한다.
- [ ] 제목과 내용을 입력받는다.
- [ ] 현재 방 ID와 사용자 ID를 함께 `user_issues`에 저장한다.
- [ ] 저장 성공 후 접수 완료 메시지를 보여준다.
- [ ] 입력값 검증은 제목 2자 이상, 내용 5자 이상으로 둔다.

### Task 11: 관리자 이슈/요청 목록

**Files:**
- Create: `app/admin/issues.tsx`
- Modify: `src/features/issues/issueApi.ts`
- Modify: `src/features/issues/issueTypes.ts`

- [ ] `profiles.role`이 `admin`인 사용자만 접근할 수 있게 한다.
- [ ] 전체 이슈 목록을 최신순으로 표시한다.
- [ ] 이슈 종류, 제목, 작성자, 방, 상태, 생성일을 표시한다.
- [ ] 상태를 `open`, `reviewing`, `resolved`, `closed` 중 하나로 변경할 수 있게 한다.
- [ ] 일반 사용자가 접근하면 방 목록 화면으로 되돌린다.

### Task 12: 수정 기능

**Files:**
- Modify: `app/rooms/[roomId]/day.tsx`
- Modify: `src/features/availability/availabilityApi.ts`
- Modify: `src/components/TimeSlotGrid.tsx`

- [ ] 날짜 타임라인 진입 시 현재 사용자의 기존 슬롯과 날짜별 일정 이름을 불러온다.
- [ ] 불러온 값을 UI 상태에 반영한다.
- [ ] 사용자가 기존 상태를 변경하면 저장 시 upsert/delete로 반영한다.
- [ ] 다른 사용자의 슬롯은 읽기 전용 요약으로만 보여준다.

### Task 13: 통합 검증

**Files:**
- Modify: 필요 시 관련 화면 파일

- [ ] 사용자 A, 사용자 B를 만든다.
- [ ] 사용자 A가 방을 만들고 초대 코드를 확인한다.
- [ ] 사용자 B가 초대 코드로 방에 참여한다.
- [ ] 같은 날짜 같은 30분 슬롯을 두 사용자가 가능으로 체크한다.
- [ ] 캘린더 상단 후보 목록에 해당 슬롯이 표시되는지 확인한다.
- [ ] 한 사용자가 해당 슬롯을 불가능으로 바꾸면 후보에서 사라지는지 확인한다.
- [ ] 설정 화면에서 이름, 한줄소개, 테마가 변경되는지 확인한다.
- [ ] 다크/라이트/시스템 테마 전환이 반영되는지 확인한다.
- [ ] 이슈/요청 페이지에서 버그 요청이 저장되는지 확인한다.
- [ ] 관리자 계정에서 이슈 상태 변경이 가능한지 확인한다.

## 7. 테스트 전략

- 후보 계산 로직은 단위 테스트로 검증한다.
- 테마 결정 로직인 `resolveTheme`은 단위 테스트로 검증한다.
- Supabase API 함수는 성공/실패 케이스를 분리해 수동 통합 테스트한다.
- MVP 단계에서는 E2E 자동화보다 실제 기기/시뮬레이터 수동 시나리오 검증을 우선한다.
- 후보 계산 로직과 권한 로직은 버그 가능성이 높으므로 구현 초기에 테스트를 작성한다.

## 8. 후속 개선 항목

- 기기 캘린더 연동
- 푸시 알림
- 방장 권한 세분화
- 사용자 직접 초대
- 반복 일정
- 후보 기준 설정: 최소 가능 인원, 전체 가능, 과반 가능
- 프로필 사진 파일 업로드를 Supabase Storage로 전환
