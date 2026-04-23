# Leo Mohan Reader Library

A standalone progressive web app for approved readers to browse books by genre, read free titles, follow new releases, and leave feedback for the author. The app is now wired for Supabase Auth, Database, and Storage.

## What is included

- Reader registration with Supabase Auth and manual admin approval flow
- Email/password login plus a protected admin interface
- Genre-based catalog backed by Supabase tables
- Free-reader mode for approved accounts
- External Amazon and Smashwords links for paid titles
- Reader comments and star ratings stored centrally in Supabase
- Share action using the Web Share API with a clipboard fallback
- Author news, latest release, about section, and official website link
- Supabase Storage upload flow for book cover thumbnails
- PWA install manifest and offline cache service worker

## Supabase setup

1. Open [supabase-config.js](/Users/user/Documents/Playground/author-books-pwa/supabase-config.js) and paste:
   - your `Project URL`
   - your `anon public key`
2. Run [step8-supabase-setup.sql](/Users/user/Documents/Playground/author-books-pwa/supabase/step8-supabase-setup.sql) in the Supabase SQL editor.
3. In Supabase Auth, add your local and production URLs to the allowed redirect/site URLs.
4. Sign up once with your own email, then promote yourself to admin:

```sql
update public.profiles
set role = 'admin', approval_status = 'approved'
where email = 'YOUR-EMAIL@example.com';
```

5. Optional but recommended: disable mandatory email confirmation while testing, so reader sign-up is smoother on localhost.

## Run locally

This app is a static browser app and can be served as plain files:

```bash
cd /Users/user/Documents/Playground/author-books-pwa
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Important notes

- Users sign in with email and password through Supabase Auth.
- Admin approval is handled through `profiles.approval_status`.
- Reader comments still open a `mailto:` draft to the configured author email after being saved.
- Registration requests still open a `mailto:` draft to `leomohan@yahoo.com` by default after signup.
- The frontend uses the Supabase anon key, which is expected for browser apps.
- Social networks will only show rich thumbnail previews after deployment on a real domain with proper Open Graph tags.
- For production use, you may still want an external email service for fully automatic approval notifications instead of `mailto:` drafts.
