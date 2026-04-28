# Dumsor Timetable Ghana

Mobile-first Angular + Firebase web app for checking Ghana 2026 load management schedules by area.

## Stack

- Angular 21 standalone components
- Tailwind CSS 4
- Firebase JS SDK for Firestore and anonymous Auth
- Firebase Hosting

## Local development

```bash
npm install
npm start
```

Open `http://127.0.0.1:4200`.

## Firebase setup

1. Create a Firebase project.
2. Enable Firestore.
3. Enable Anonymous sign-in in Firebase Authentication.
4. Replace the placeholder values in `src/environments/environment.ts` and `src/environments/environment.prod.ts`.
5. Update `.firebaserc` with your Firebase project id.

The app still runs without Firebase credentials. Reports are stored locally until a real Firebase config is provided.

## Data

Seed data lives in `src/app/data/seed-data.ts`.

Firestore collections expected by the app:

- `areas`: `name`, `region`, `group`, `keywords`, `popularScore`
- `schedules`: `date`, `group`, `startTime`, `endTime`, `status`
- `reports`: `areaId`, `areaName`, `group`, `status`, `comment`, `createdAt`, `deviceId`

The area seed is condensed from the uploaded ECG/NEDCo 800MW 2026 load management PDF. The timetable covers Saturday, 25 April 2026 through Friday, 1 May 2026.

## Build and deploy

```bash
npm run build
firebase deploy
```
