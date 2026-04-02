# App Store (iOS) — what’s configured and what you do next

## Bundle ID (change if needed)

Default in `app.json`:

- **iOS:** `com.intentionalconnections.app`
- **Android:** `com.intentionalconnections.app`

If you already registered a different ID in [Apple Developer](https://developer.apple.com) or want your own domain (e.g. `com.yourcompany.intentionalconnections`), update **both** `ios.bundleIdentifier` and `android.package` to match before your first production build.

## Already in the repo

- **`app.json`**: iOS `bundleIdentifier`, `buildNumber`, `ITSAppUsesNonExemptEncryption` (standard HTTPS-only apps), display name, Android `package` / `versionCode` for later Play Store.
- **`eas.json`**: `development` (dev client + iOS simulator), `preview` (internal TestFlight-style builds), `production` (store builds with `autoIncrement` for iOS build numbers).
- **`.easignore`**: avoids uploading `.env` and key material.

## Commands (after you finish “What I need from you” below)

```bash
npm install
npx eas login
npx eas init
```

Link the project when prompted (creates `extra.eas.projectId` in `app.json`).

**Production iOS binary**

```bash
npm run build:ios
```

**Upload latest build to App Store Connect (after credentials are set up)**

```bash
npm run submit:ios
```

Or build + submit in one flow from the EAS dashboard.

## App Store Connect (Apple’s website)

1. Create the app record (same bundle ID as `app.json`).
2. Fill **App Privacy** (Supabase, auth, analytics if any).
3. Add **screenshots**, description, **support URL**, **privacy policy URL** (required for most sign-in / data apps).
4. If sign-in is required: add **demo account** notes for reviewers (or explain demo mode clearly).
5. Submit for review.

## Encryption

`ITSAppUsesNonExemptEncryption` is set to **false**, which matches apps that only use standard TLS (e.g. HTTPS to Supabase). If you later add non-exempt encryption, update this with Apple’s guidance.
