# Firebase Setup — Multi-Device Sync

Setting up Firebase takes about 10 minutes and is **completely free** (the Spark plan
covers thousands of users with no credit card required).

---

## Step 1 — Create a Firebase project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Enter a name, e.g. `bible-journal`
4. Disable Google Analytics (not needed) → click **"Create project"**
5. Wait ~30 seconds, then click **"Continue"**

---

## Step 2 — Enable Email/Password Authentication

1. In the left sidebar click **"Build" → "Authentication"**
2. Click **"Get started"**
3. Under **Sign-in providers**, click **"Email/Password"**
4. Toggle **"Email/Password"** to **Enabled**
5. Leave "Email link" disabled
6. Click **"Save"**

---

## Step 3 — Create a Firestore database

1. In the left sidebar click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (you'll add security rules next)
4. Select a location close to you (e.g. `us-central1`)
5. Click **"Enable"**

---

## Step 4 — Add security rules

1. In Firestore, click the **"Rules"** tab
2. Replace the default rules with the contents of **`firestore.rules`** in this project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 5 — Register a web app and get the config

1. In the Firebase console, click the **gear icon ⚙** → **"Project settings"**
2. Scroll down to **"Your apps"**
3. Click the **web icon `</>`**
4. Enter a nickname, e.g. `Bible Journal Web`
5. Leave "Firebase Hosting" unchecked → click **"Register app"**
6. You'll see a config block like this:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "bible-journal-xxxx.firebaseapp.com",
  projectId:         "bible-journal-xxxx",
  storageBucket:     "bible-journal-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef",
};
```

7. Copy these values

---

## Step 6 — Add the config to your .env file

Open **`D:\Projects\Bible Journal\.env`** and fill in your values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=bible-journal-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bible-journal-xxxx
VITE_FIREBASE_STORAGE_BUCKET=bible-journal-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Step 7 — Restart the app

Close the dev server and reopen the app with **"Start Bible Journal.bat"**.

You should now see a **Sign In / Create Account** screen. Create an account, and your
journal entries will sync across any device where you sign in.

---

## Free tier limits (Spark plan)

| Feature | Limit |
|---------|-------|
| Authenticated users | Unlimited |
| Firestore reads | 50,000/day |
| Firestore writes | 20,000/day |
| Firestore storage | 1 GB |

A typical Bible Journal user writes/reads fewer than 100 Firestore operations per day.
The free tier is more than enough for personal use.

---

## Data structure in Firestore

```
users/
  {uid}/
    entries/
      2026-05-23-nt    ← NT journal entry for that date
      2026-05-23-psalm ← Psalm journal entry for that date
      ...
```

Each entry document contains the same fields as your local journal:
`selectedVerses`, `verseTexts`, `argument`, `gratitude`, `apply`, `notes`.
