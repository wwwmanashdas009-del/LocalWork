# LocalWork V4 Pro

A polished Firebase-powered local client ↔ freelancer marketplace.

## Included
- Modern responsive UI with animations
- Mobile navigation and touch-friendly cards
- LocalWork app icon + PWA manifest
- Firebase Email/Password authentication
- Firestore jobs and profiles
- Apply button + client application view
- Private client ↔ freelancer chat
- My Chats dashboard
- GitHub Pages compatible static hosting

## Firebase
Use the same Firebase project/config already connected to LocalWork.
Before testing chat/applications, update Firestore Rules using `firestore.rules`.

### Important chat index
If Firestore reports a missing composite index for the My Chats query, click the link in the Firebase error message to create the suggested index, then retry.

### Production note
This is an MVP. Before a public launch, add moderation/report/block, stronger privacy rules, validation, rate limits, secure contact handling, and proper age/identity/payment compliance.

## Deploy
Upload `index.html`, `script.js`, `style.css`, `icon.svg`, `manifest.webmanifest`, and `firestore.rules` to the GitHub repo root. GitHub Pages: Settings → Pages → Deploy from branch → `main` → `/(root)`.

After deployment, add your GitHub Pages hostname (for example `username.github.io`) to Firebase Authentication → Settings → Authorized domains if login fails on the live site.
