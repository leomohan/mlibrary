# Leo Mohan Reader Library

A standalone progressive web app prototype for approved readers to browse books by genre, read free titles, follow new releases, and leave feedback for the author.

## What is included

- Reader registration request form with manual admin approval flow
- Login for approved readers and a protected admin interface
- Genre-based catalog with cover thumbnails, summaries, and detail views
- Free-reader mode for selected books
- External Amazon and Smashwords links for paid titles
- Reader comments and star ratings stored locally in the app
- Share action using the Web Share API with a clipboard fallback
- Author news, latest release, about section, and official website link
- PWA install manifest and offline cache service worker

## Default admin access

- Username: `admin`
- Password: `change-me-now`

Change those credentials before using the app beyond local prototyping.

## Run locally

This app is dependency-free and can be served as static files:

```bash
cd /Users/user/Documents/Playground/author-books-pwa
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Important prototype notes

- Data persistence currently uses `localStorage`, so content is stored per browser on the current device.
- Reader comments are saved inside the app and also open a `mailto:` draft to the configured author email.
- Registration requests are saved inside the app and also open a `mailto:` draft to `leomohan@yahoo.com` by default for approval.
- Social networks will only show rich thumbnail previews after deployment on a real domain with proper Open Graph tags.
- For production use, the next step is to replace local storage with a backend or Firebase setup for real authentication, approvals, email delivery, and centralized book management.
