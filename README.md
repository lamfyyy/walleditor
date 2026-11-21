# walleditor

`walleditor` is a personal, non-commercial Expo/React Native editor prototype for layered animated wallpapers. It includes Telegram-style bottom navigation (`Главная`, `Проекты`, `Настройки`), a local demo project built from the supplied assets, a Liquid Glass-inspired editor surface, three themes, a looping preview with animated Kawarp texture motion, local autosave, duplicate-before-experimenting, layer visibility controls, and an export validation panel. Settings includes an `О приложении / Логи` sub-tab with persistent local activity and error messages.

## Build locally or from a GitHub checkout

Use Node.js 20+ and pnpm 9. Clone the repository, install dependencies, then run the checks:

```bash
git clone <your-github-repository-url>
cd walleditor
pnpm install
pnpm check
pnpm lint
pnpm test
```

For an Expo Web development preview:

```bash
pnpm dev:metro
```

For native development, install the current Expo tooling and use the generated app configuration. Keep the bundle identifier `com.yxwwx.walleditor`; do not commit personal signing certificates, Apple credentials, Expo tokens, or `.env` files. Copy `.env.example` to `.env` only when a future backend or build service requires local values.

## Build an iOS IPA from GitHub

The repository includes `eas.json` and a manually triggered workflow at `.github/workflows/build-ios.yml`. In your own GitHub repository, add an `EXPO_TOKEN` Actions secret, connect the project to your own Expo account, and configure Apple signing when EAS asks for it. Then open **Actions → Build iOS IPA → Run workflow**. The workflow starts an EAS internal-distribution build; the resulting IPA download URL is provided by EAS after the build completes. A testable iPhone IPA cannot be produced without your Apple/Expo signing credentials.

You can also build locally from the repository:

```bash
npm install --global eas-cli
eas login
eas build --platform ios --profile preview
```

## Expo/EAS handoff

The repository is intentionally source-first. A user with their own Expo/EAS account can connect the GitHub repository, configure iOS signing in their own account, and run the appropriate EAS build command from their CI or local machine. The exact native artifact is not included in this repository and must be produced and verified by the user’s own build environment.

Before a real device handoff, verify the app on the target iPhone and record the tested iOS, Nugget, and Pocket Poster versions. A Web Preview confirms UI and JavaScript behavior only; it does not prove iOS Files integration, CAML/PosterBoard application, safe-area clock overlap, or SideStore installation.

## Manual `.tendies` flow

The app does not call Pocket Poster, upload archives automatically, or control the import process. Save a validated `.tendies` file through Files/Share Sheet, open Pocket Poster manually, and import the file there. The export screen intentionally shows an unverified warning until the PosterBoard structure is validated on a real target setup.

## Included supplied assets

The original `background.png`, `asset1.png`, `asset2.png`, and the complete `AppIcon.appiconset` are preserved under `assets/walleditor/`. Native branding copies are placed under `assets/images/`; the original source files remain unchanged.
