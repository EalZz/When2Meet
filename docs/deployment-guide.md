# When2Meet Deployment Guide

## Before the first build

1. Log in to Expo:
   - `npx eas login`
2. Configure the project:
   - `npx eas init`
3. Make sure production Supabase values are set in `.env`
4. Apply the latest SQL in Supabase:
   - `supabase/schema.sql`
   - `supabase/policies.sql`

## Android APK for direct sharing

Build:

```bash
npx eas build -p android --profile preview
```

This creates an APK that can be shared directly with testers.

## iOS TestFlight

Build:

```bash
npx eas build -p ios --profile production
```

Submit:

```bash
npx eas submit -p ios --profile production
```

After submission, open App Store Connect and release the build through TestFlight.

## Notes

- Current identifiers:
  - iOS bundle identifier: `com.when2meet.mobile`
  - Android package: `com.when2meet.mobile`
- If either store rejects these identifiers because they are already taken, update them before the first store build.
- If you later connect this project to an Expo organization, add the real Expo `owner` field to `app.json`.
