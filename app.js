import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const app = document.querySelector("#app");
const genres = [
  "All",
  "Technology",
  "Business",
  "Education",
  "Spiritual",
  "Religious",
  "Motivation",
  "Fiction",
];

const defaultSettings = {
  libraryName: "Leo Mohan Reader Library",
  authorName: "Leo Mohan",
  authorEmail: "hello@leomohan.net",
  registrationApprovalEmail: "leomohan@yahoo.com",
  website: "https://www.leomohan.net",
  about:
    "Leo Mohan writes across technology, business, education, spirituality, religion, motivation, and fiction. This reader space helps approved members discover new releases, revisit timeless titles, and stay close to the ideas behind each book.",
  latestRelease: "Latest release coming soon",
  latestReleaseNote:
    "Publish your first Supabase-backed news item or latest release note from the admin panel.",
};

const isConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

let installPrompt = null;
let db = {
  settings: { ...defaultSettings },
  news: [],
  books: [],
  comments: [],
  ratings: [],
  pendingRequests: [],
};

let ui = {
  loading: true,
  selectedGenre: "All",
  selectedBookId: loadSelectedBookId(),
  adminEditingBookId: null,
  profile: null,
  session: null,
  authNotice: "",
};

function loadSelectedBookId() {
  const hash = window.location.hash.replace("#book/", "");
  return hash || null;
}

function setSelectedBookId(bookId) {
  ui.selectedBookId = bookId;
  if (bookId) {
    window.location.hash = `book/${bookId}`;
  } else {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initials(title) {
  return String(title || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderStars(value) {
  const rounded = Math.round(value || 0);
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
}

function isImageThumbnail(thumbnail) {
  const value = String(thumbnail || "").trim();
  return (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("/")
  );
}

function getCoverStyle(book) {
  if (isImageThumbnail(book.thumbnail)) {
    return `background-image:url('${escapeHtml(book.thumbnail)}'); background-size:cover; background-position:center; color:transparent;`;
  }

  return `background:${escapeHtml(
    book.thumbnail || "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7dd3fc 100%)"
  )}; color:${escapeHtml(book.coverAccent || "#e0f2fe")};`;
}

function renderCoverInner(book) {
  return isImageThumbnail(book.thumbnail) ? "" : `<span>${escapeHtml(initials(book.title))}</span>`;
}

function currentProfile() {
  return ui.profile;
}

function isAdmin() {
  return currentProfile()?.role === "admin";
}

function isApprovedReader() {
  return currentProfile()?.role === "reader" && currentProfile()?.approval_status === "approved";
}

function readerLocked() {
  return !isApprovedReader();
}

function displayName(profile) {
  if (!profile) return "";
  return profile.display_username || profile.full_name || profile.email || "Reader";
}

function profileStatusLabel(profile) {
  if (!profile) return "Guest";
  if (profile.role === "admin") return "Admin";
  return profile.approval_status === "approved"
    ? "Approved reader"
    : profile.approval_status === "rejected"
      ? "Registration not approved"
      : "Pending approval";
}

function normalizeSettings(row) {
  if (!row) return { ...defaultSettings };
  return {
    libraryName: row.library_name || defaultSettings.libraryName,
    authorName: row.author_name || defaultSettings.authorName,
    authorEmail: row.author_email || defaultSettings.authorEmail,
    registrationApprovalEmail:
      row.registration_approval_email || defaultSettings.registrationApprovalEmail,
    website: row.website || defaultSettings.website,
    about: row.about || defaultSettings.about,
    latestRelease: row.latest_release || defaultSettings.latestRelease,
    latestReleaseNote: row.latest_release_note || defaultSettings.latestReleaseNote,
  };
}

function normalizeBook(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    status: row.status || "active",
    isFree: Boolean(row.is_free),
    summary: row.summary || "",
    description: row.description || "",
    thumbnail:
      row.thumbnail_url ||
      "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7dd3fc 100%)",
    coverAccent: row.cover_accent || "#e0f2fe",
    freeContent: row.free_content || "",
    storeLinks: {
      amazon: row.amazon_url || "",
      smashwords: row.smashwords_url || "",
    },
  };
}

function normalizeNews(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: row.published_on || row.created_at?.slice(0, 10) || "",
  };
}

function normalizeComment(row) {
  return {
    id: row.id,
    bookId: row.book_id,
    userId: row.user_id,
    userName: row.user_name || "Reader",
    message: row.message,
    createdAt: row.created_at,
  };
}

function normalizeRating(row) {
  return {
    id: row.id,
    bookId: row.book_id,
    userId: row.user_id,
    value: row.value,
  };
}

function normalizeProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name || "",
    email: row.email || "",
    role: row.role || "reader",
    approval_status: row.approval_status || "pending",
    interests: row.interests || "",
    request_message: row.request_message || "",
    display_username: row.display_username || "",
    approved_at: row.approved_at || null,
  };
}

function getVisibleBooks() {
  return db.books.filter((book) => {
    const genreMatch = ui.selectedGenre === "All" || book.genre === ui.selectedGenre;
    const statusMatch = isAdmin() ? true : book.status === "active";
    return genreMatch && statusMatch;
  });
}

function getSelectedBook() {
  return db.books.find((book) => book.id === ui.selectedBookId) || null;
}

function getBookRatings(bookId) {
  const values = db.ratings.filter((rating) => rating.bookId === bookId).map((rating) => rating.value);
  if (!values.length) {
    return { average: 0, count: 0 };
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return { average, count: values.length };
}

function getBookComments(bookId) {
  return db.comments
    .filter((comment) => comment.bookId === bookId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function myRatingForBook(bookId) {
  if (!currentProfile()) return 0;
  return (
    db.ratings.find((rating) => rating.bookId === bookId && rating.userId === currentProfile().id)
      ?.value || 0
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

async function initializeApp() {
  buildApp();

  if (!isConfigured) {
    ui.loading = false;
    buildApp();
    return;
  }

  await refreshSession();
  await refreshData();
  ui.loading = false;
  buildApp();

  supabase.auth.onAuthStateChange(async () => {
    await refreshSession();
    await refreshData();
    buildApp();
  });
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error(error);
    ui.session = null;
    ui.profile = null;
    return;
  }

  ui.session = data.session;

  if (!data.session?.user) {
    ui.profile = null;
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    ui.profile = null;
    return;
  }

  ui.profile = normalizeProfile(profile);
}

async function refreshData() {
  if (!supabase) return;

  const settingsQuery = supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
  const booksQuery = supabase.from("books").select("*").order("created_at", { ascending: false });
  const newsQuery = supabase
    .from("news_items")
    .select("*")
    .order("published_on", { ascending: false })
    .order("created_at", { ascending: false });
  const commentsQuery = supabase.from("comments").select("*").order("created_at", { ascending: false });
  const ratingsQuery = supabase.from("ratings").select("*");

  const queries = [settingsQuery, booksQuery, newsQuery, commentsQuery, ratingsQuery];

  if (isAdmin()) {
    queries.push(
      supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "pending")
        .eq("role", "reader")
        .order("created_at", { ascending: false })
    );
  }

  const results = await Promise.all(queries);
  const [settingsResult, booksResult, newsResult, commentsResult, ratingsResult, pendingResult] =
    results;

  if (settingsResult.error) console.error(settingsResult.error);
  if (booksResult.error) console.error(booksResult.error);
  if (newsResult.error) console.error(newsResult.error);
  if (commentsResult.error) console.error(commentsResult.error);
  if (ratingsResult.error) console.error(ratingsResult.error);
  if (pendingResult?.error) console.error(pendingResult.error);

  db = {
    settings: normalizeSettings(settingsResult.data),
    books: (booksResult.data || []).map(normalizeBook),
    news: (newsResult.data || []).map(normalizeNews),
    comments: (commentsResult.data || []).map(normalizeComment),
    ratings: (ratingsResult.data || []).map(normalizeRating),
    pendingRequests: (pendingResult?.data || []).map(normalizeProfile),
  };
}

function renderSetupMessage() {
  return `
    <section class="panel warning-panel">
      <p class="eyebrow">Supabase Setup Required</p>
      <h3>Connect the app to your project</h3>
      <p>Open <strong>supabase-config.js</strong> and paste your Supabase project URL and anon public key. The frontend is already refactored to use Supabase Auth, Database, and Storage once those values are in place.</p>
      <p class="form-note">You also need to run the SQL in <strong>supabase/step8-supabase-setup.sql</strong> and create the public <strong>book-covers</strong> bucket if you have not already done so.</p>
    </section>
  `;
}

function renderAccessNotice(profile) {
  if (!profile || profile.role === "admin" || profile.approval_status === "approved") return "";

  const message =
    profile.approval_status === "rejected"
      ? "Your registration has not been approved yet. You can still sign in, but the library remains locked until approval."
      : "Your account has been created and is waiting for admin approval. You can sign in now, and the library will unlock once approved.";

  return `
    <section class="panel warning-panel">
      <p class="eyebrow">Account Status</p>
      <h3>${escapeHtml(profileStatusLabel(profile))}</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function buildApp() {
  const selectedBook = getSelectedBook();
  const visibleBooks = getVisibleBooks();
  const profile = currentProfile();

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Progressive Web App</p>
          <h1>${escapeHtml(db.settings.libraryName)}</h1>
        </div>
        <div class="topbar-actions">
          <a class="ghost-button" href="${escapeHtml(db.settings.website)}" target="_blank" rel="noreferrer">Official Website</a>
          <button class="primary-button" id="install-button" ${installPrompt ? "" : "disabled"}>
            ${installPrompt ? "Install App" : "Install Ready on Supported Browsers"}
          </button>
        </div>
      </header>

      <main class="layout">
        ${!isConfigured ? renderSetupMessage() : ""}

        <section class="hero-panel">
          <div class="hero-copy">
            <span class="pill">Latest release</span>
            <h2>${escapeHtml(db.settings.latestRelease)}</h2>
            <p>${escapeHtml(db.settings.latestReleaseNote)}</p>
            <div class="hero-meta">
              <span>${db.books.filter((book) => book.status === "active").length} books</span>
              <span>${genres.length - 1} genres</span>
              <span>Reader registration required</span>
            </div>
          </div>
          <div class="hero-card">
            <p class="card-label">About the author</p>
            <p>${escapeHtml(db.settings.about)}</p>
            <a href="${escapeHtml(db.settings.website)}" target="_blank" rel="noreferrer">Visit www.leomohan.net</a>
          </div>
        </section>

        ${renderAccessNotice(profile)}

        <section class="news-auth-grid">
          <div class="news-panel panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Updates</p>
                <h3>Latest news</h3>
              </div>
            </div>
            <div class="news-list">
              ${
                db.news.length
                  ? db.news
                      .map(
                        (item) => `
                          <article class="news-item">
                            <p class="news-date">${escapeHtml(item.date)}</p>
                            <h4>${escapeHtml(item.title)}</h4>
                            <p>${escapeHtml(item.body)}</p>
                          </article>
                        `
                      )
                      .join("")
                  : `<p class="hint">No news yet. Use the admin panel to publish your first update.</p>`
              }
            </div>
          </div>

          <div class="auth-panel panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Access</p>
                <h3>${profile ? `Welcome, ${escapeHtml(displayName(profile))}` : "Reader access"}</h3>
              </div>
            </div>
            ${
              profile
                ? `
                  <div class="signed-in-card">
                    <p>You are signed in as <strong>${escapeHtml(profile.email)}</strong>.</p>
                    <p class="hint">${escapeHtml(profileStatusLabel(profile))}</p>
                    <div class="inline-actions">
                      ${
                        isAdmin()
                          ? `<button class="primary-button" data-action="jump-admin">Open Admin</button>`
                          : `<button class="primary-button" data-action="jump-library">Open Library</button>`
                      }
                      <button class="ghost-button" data-action="logout">Sign out</button>
                    </div>
                  </div>
                `
                : `
                  <form id="login-form" class="stack-form">
                    <h4>Login</h4>
                    <label>
                      Email
                      <input name="email" type="email" placeholder="Enter email" required />
                    </label>
                    <label>
                      Password
                      <input name="password" type="password" placeholder="Enter password" required />
                    </label>
                    <button class="primary-button" type="submit" ${!isConfigured ? "disabled" : ""}>Sign in</button>
                  </form>

                  <form id="register-form" class="stack-form">
                    <h4>Request reader access</h4>
                    <label>
                      Full name
                      <input name="fullName" type="text" placeholder="Your name" required />
                    </label>
                    <label>
                      Email
                      <input name="email" type="email" placeholder="you@example.com" required />
                    </label>
                    <label>
                      Password
                      <input name="password" type="password" placeholder="Create password" required />
                    </label>
                    <label>
                      Genres of interest
                      <input name="interests" type="text" placeholder="Technology, Business, Fiction" required />
                    </label>
                    <label>
                      Short note
                      <textarea name="message" rows="4" placeholder="Why would you like access?"></textarea>
                    </label>
                    <button class="primary-button" type="submit" ${!isConfigured ? "disabled" : ""}>Create account</button>
                    <p class="form-note">Users choose their own email and password. Admin approval still controls access to the protected reader features, and an approval email draft opens for ${escapeHtml(db.settings.registrationApprovalEmail)} after signup.</p>
                  </form>
                `
            }
          </div>
        </section>

        <section class="library-section panel" id="library-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Library</p>
              <h3>Books by genre</h3>
            </div>
            ${readerLocked() ? `<p class="hint">Approved reader accounts can open free book content, rate titles, and leave comments.</p>` : ""}
          </div>

          <div class="genre-strip">
            ${genres
              .map(
                (genre) => `
                  <button class="${genre === ui.selectedGenre ? "genre-chip active" : "genre-chip"}" data-genre="${escapeHtml(genre)}">
                    ${escapeHtml(genre)}
                  </button>
                `
              )
              .join("")}
          </div>

          <div class="${readerLocked() ? "library-grid locked" : "library-grid"}">
            ${
              visibleBooks.length
                ? visibleBooks
                    .map((book) => {
                      const rating = getBookRatings(book.id);
                      return `
                        <article class="book-card" data-book-id="${escapeHtml(book.id)}">
                          <div class="book-cover" style="${getCoverStyle(book)}">${renderCoverInner(book)}</div>
                          <div class="book-body">
                            <div class="book-topline">
                              <span class="badge">${escapeHtml(book.genre)}</span>
                              <span class="badge ${book.isFree ? "success" : "warning"}">${book.isFree ? "Free read" : "Store links"}</span>
                              ${book.status === "retired" ? `<span class="badge muted">Retired</span>` : ""}
                            </div>
                            <h4>${escapeHtml(book.title)}</h4>
                            <p>${escapeHtml(book.summary)}</p>
                            <div class="book-footer">
                              <span>${renderStars(rating.average)} ${rating.count ? `${rating.average.toFixed(1)} (${rating.count})` : "No ratings yet"}</span>
                              <button class="ghost-button" data-action="open-book" data-book-id="${escapeHtml(book.id)}">View book</button>
                            </div>
                          </div>
                        </article>
                      `;
                    })
                    .join("")
                : `<div class="empty-card"><p>No books yet. Add your first title from the admin panel once your Supabase data is ready.</p></div>`
            }
          </div>
        </section>

        ${selectedBook ? renderBookDetail(selectedBook, profile) : ""}
        ${isAdmin() ? renderAdminPanel() : ""}
      </main>
    </div>
  `;

  bindEvents();
}

function renderBookDetail(book, profile) {
  const rating = getBookRatings(book.id);
  const comments = getBookComments(book.id);
  const myRating = myRatingForBook(book.id);

  return `
    <section class="detail-section panel" id="book-detail">
      <div class="detail-header">
        <div class="detail-cover" style="${getCoverStyle(book)}">${renderCoverInner(book)}</div>
        <div class="detail-copy">
          <div class="book-topline">
            <span class="badge">${escapeHtml(book.genre)}</span>
            <span class="badge ${book.isFree ? "success" : "warning"}">${book.isFree ? "Free to read" : "Available via stores"}</span>
          </div>
          <h3>${escapeHtml(book.title)}</h3>
          <p>${escapeHtml(book.description)}</p>
          <p class="rating-line">${renderStars(rating.average)} ${rating.count ? `${rating.average.toFixed(1)} from ${rating.count} reader ratings` : "No reader ratings yet"}</p>
          <div class="inline-actions">
            ${
              book.isFree && isApprovedReader()
                ? `<button class="primary-button" data-action="read-book" data-book-id="${escapeHtml(book.id)}">Read now</button>`
                : `
                    <a class="primary-button link-button" href="${escapeHtml(book.storeLinks.amazon || "#")}" target="_blank" rel="noreferrer">Amazon</a>
                    <a class="ghost-button link-button" href="${escapeHtml(book.storeLinks.smashwords || "#")}" target="_blank" rel="noreferrer">Smashwords</a>
                  `
            }
            <button class="ghost-button" data-action="share-book" data-book-id="${escapeHtml(book.id)}">Share</button>
            <button class="ghost-button" data-action="close-book">Close</button>
          </div>
        </div>
      </div>

      ${
        book.isFree
          ? isApprovedReader()
            ? `
                <div class="reader-pane">
                  <p class="eyebrow">Reader view</p>
                  <pre>${escapeHtml(book.freeContent)}</pre>
                </div>
              `
            : `
                <div class="reader-pane">
                  <p class="eyebrow">Protected free read</p>
                  <p>Free reading is available to approved readers after sign-in and admin approval.</p>
                </div>
              `
          : `
              <div class="reader-pane">
                <p class="eyebrow">Purchase options</p>
                <p>This title is currently offered through external stores. Use the buttons above to continue to Amazon or Smashwords.</p>
              </div>
            `
      }

      ${
        isApprovedReader()
          ? `
            <div class="feedback-grid">
              <form id="rating-form" class="panel feedback-card">
                <h4>Your rating</h4>
                <input type="hidden" name="bookId" value="${escapeHtml(book.id)}" />
                <div class="star-picker">
                  ${[1, 2, 3, 4, 5]
                    .map(
                      (value) => `
                        <label class="${value <= myRating ? "star active" : "star"}">
                          <input type="radio" name="value" value="${value}" ${value === myRating ? "checked" : ""} />
                          <span>★</span>
                        </label>
                      `
                    )
                    .join("")}
                </div>
                <button class="primary-button" type="submit">Save rating</button>
              </form>

              <form id="comment-form" class="panel feedback-card">
                <h4>Leave a comment</h4>
                <input type="hidden" name="bookId" value="${escapeHtml(book.id)}" />
                <label>
                  Your comment
                  <textarea name="message" rows="5" placeholder="Share what stood out to you" required></textarea>
                </label>
                <button class="primary-button" type="submit">Post comment</button>
                <p class="form-note">The app also opens an email draft to ${escapeHtml(db.settings.authorEmail)} so your feedback reaches the author directly.</p>
              </form>
            </div>
          `
          : `
            <div class="panel feedback-card">
              <h4>Reader feedback</h4>
              <p>Approved reader accounts can rate books and send comments to the author from inside the app.</p>
            </div>
          `
      }

      <div class="comment-list">
        <h4>Reader comments</h4>
        ${
          comments.length
            ? comments
                .map(
                  (comment) => `
                    <article class="comment-card">
                      <div class="comment-topline">
                        <strong>${escapeHtml(comment.userName)}</strong>
                        <span>${escapeHtml(formatDate(comment.createdAt))}</span>
                      </div>
                      <p>${escapeHtml(comment.message)}</p>
                    </article>
                  `
                )
                .join("")
            : `<p class="hint">No comments yet. Be the first approved reader to share your thoughts.</p>`
        }
      </div>
    </section>
  `;
}

function renderAdminPanel() {
  const editingBook =
    db.books.find((book) => book.id === ui.adminEditingBookId) || {
      id: "",
      title: "",
      genre: "Technology",
      status: "active",
      isFree: true,
      summary: "",
      description: "",
      thumbnail: "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7dd3fc 100%)",
      coverAccent: "#e0f2fe",
      freeContent: "",
      storeLinks: { amazon: "", smashwords: "" },
    };

  return `
    <section class="admin-section panel" id="admin-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Admin</p>
          <h3>Author control panel</h3>
        </div>
        <p class="hint">Admin users can approve readers, edit library content, and upload book covers into Supabase Storage.</p>
      </div>

      <div class="admin-grid">
        <div class="panel admin-card">
          <h4>Pending registrations</h4>
          ${
            db.pendingRequests.length
              ? db.pendingRequests
                  .map(
                    (request) => `
                      <form class="approval-card" data-request-id="${escapeHtml(request.id)}">
                        <p><strong>${escapeHtml(request.full_name || "Unnamed reader")}</strong> • ${escapeHtml(request.email)}</p>
                        <p>${escapeHtml(request.interests || "No interests listed")}</p>
                        <p class="hint">${escapeHtml(request.request_message || "No message supplied.")}</p>
                        <label>
                          Reader username
                          <input name="displayUsername" type="text" placeholder="optional display username" value="${escapeHtml(request.display_username || "")}" />
                        </label>
                        <div class="inline-actions">
                          <button class="primary-button" type="submit">Approve</button>
                          <button class="ghost-button" type="button" data-action="reject-request" data-request-id="${escapeHtml(request.id)}">Reject</button>
                        </div>
                      </form>
                    `
                  )
                  .join("")
              : `<p class="hint">No pending registration requests.</p>`
          }
        </div>

        <div class="panel admin-card">
          <h4>Latest news and author profile</h4>
          <form id="settings-form" class="stack-form">
            <label>
              Library name
              <input name="libraryName" type="text" value="${escapeHtml(db.settings.libraryName)}" required />
            </label>
            <label>
              About the author
              <textarea name="about" rows="5" required>${escapeHtml(db.settings.about)}</textarea>
            </label>
            <label>
              Latest release title
              <input name="latestRelease" type="text" value="${escapeHtml(db.settings.latestRelease)}" required />
            </label>
            <label>
              Latest release note
              <textarea name="latestReleaseNote" rows="4" required>${escapeHtml(db.settings.latestReleaseNote)}</textarea>
            </label>
            <label>
              Author name
              <input name="authorName" type="text" value="${escapeHtml(db.settings.authorName)}" required />
            </label>
            <label>
              Reader comment email
              <input name="authorEmail" type="email" value="${escapeHtml(db.settings.authorEmail)}" required />
            </label>
            <label>
              Registration approval email
              <input name="registrationApprovalEmail" type="email" value="${escapeHtml(db.settings.registrationApprovalEmail)}" required />
            </label>
            <label>
              Official website
              <input name="website" type="url" value="${escapeHtml(db.settings.website)}" required />
            </label>
            <button class="primary-button" type="submit">Save author settings</button>
          </form>

          <form id="news-form" class="stack-form">
            <h5>Add news item</h5>
            <label>
              Headline
              <input name="title" type="text" required />
            </label>
            <label>
              Date
              <input name="date" type="date" required />
            </label>
            <label>
              News copy
              <textarea name="body" rows="4" required></textarea>
            </label>
            <button class="primary-button" type="submit">Publish update</button>
          </form>
        </div>
      </div>

      <div class="admin-books">
        <div class="panel admin-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Catalog</p>
              <h4>Manage books</h4>
            </div>
          </div>
          <div class="admin-book-list">
            ${
              db.books.length
                ? db.books
                    .map(
                      (book) => `
                        <article class="mini-book-row">
                          <div>
                            <strong>${escapeHtml(book.title)}</strong>
                            <p>${escapeHtml(book.genre)} • ${book.isFree ? "Free" : "Store linked"} • ${escapeHtml(book.status)}</p>
                          </div>
                          <div class="inline-actions">
                            <button class="ghost-button" data-action="edit-book" data-book-id="${escapeHtml(book.id)}">Edit</button>
                            <button class="ghost-button" data-action="toggle-retire" data-book-id="${escapeHtml(book.id)}">
                              ${book.status === "retired" ? "Restore" : "Retire"}
                            </button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : `<p class="hint">No books yet. Add your first book using the form on the right.</p>`
            }
          </div>
        </div>

        <form id="book-form" class="panel admin-card stack-form">
          <h4>${ui.adminEditingBookId ? "Edit book" : "Add new book"}</h4>
          <input type="hidden" name="id" value="${escapeHtml(editingBook.id)}" />
          <label>
            Title
            <input name="title" type="text" value="${escapeHtml(editingBook.title)}" required />
          </label>
          <label>
            Genre
            <select name="genre">
              ${genres
                .filter((genre) => genre !== "All")
                .map(
                  (genre) => `<option value="${escapeHtml(genre)}" ${editingBook.genre === genre ? "selected" : ""}>${escapeHtml(genre)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            Summary
            <textarea name="summary" rows="3" required>${escapeHtml(editingBook.summary)}</textarea>
          </label>
          <label>
            Description
            <textarea name="description" rows="5" required>${escapeHtml(editingBook.description)}</textarea>
          </label>
          <label>
            Thumbnail background or image URL
            <input name="thumbnail" type="text" value="${escapeHtml(editingBook.thumbnail)}" required />
          </label>
          <label>
            Upload book cover image
            <input name="thumbnailFile" type="file" accept="image/*" />
          </label>
          <p class="form-note">Uploading a file stores it in the Supabase <strong>book-covers</strong> bucket and uses that public image as the thumbnail.</p>
          <label>
            Cover accent text color
            <input name="coverAccent" type="text" value="${escapeHtml(editingBook.coverAccent)}" required />
          </label>
          <label class="checkbox-row">
            <input name="isFree" type="checkbox" ${editingBook.isFree ? "checked" : ""} />
            Free to read inside the app
          </label>
          <label>
            Free reader content
            <textarea name="freeContent" rows="8">${escapeHtml(editingBook.freeContent)}</textarea>
          </label>
          <label>
            Amazon link
            <input name="amazon" type="url" value="${escapeHtml(editingBook.storeLinks.amazon)}" />
          </label>
          <label>
            Smashwords link
            <input name="smashwords" type="url" value="${escapeHtml(editingBook.storeLinks.smashwords)}" />
          </label>
          <div class="inline-actions">
            <button class="primary-button" type="submit">${ui.adminEditingBookId ? "Save changes" : "Add book"}</button>
            ${
              ui.adminEditingBookId
                ? `<button class="ghost-button" type="button" data-action="clear-book-form">Cancel edit</button>`
                : ""
            }
          </div>
          <div class="thumbnail-preview-card">
            <p class="eyebrow">Thumbnail preview</p>
            <div class="book-cover preview-cover" style="${getCoverStyle(editingBook)}">${renderCoverInner(editingBook)}</div>
          </div>
        </form>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-genre]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.selectedGenre = button.dataset.genre;
      buildApp();
    });
  });

  document.querySelectorAll("[data-action='open-book']").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedBookId(button.dataset.bookId);
      buildApp();
      document.querySelector("#book-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-book-id]").forEach((card) => {
    if (!card.classList.contains("book-card")) return;
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      setSelectedBookId(card.dataset.bookId);
      buildApp();
    });
  });

  document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
  document.querySelector("#register-form")?.addEventListener("submit", handleRegistrationRequest);
  document.querySelector("#comment-form")?.addEventListener("submit", handleCommentSubmit);
  document.querySelector("#rating-form")?.addEventListener("submit", handleRatingSubmit);
  document.querySelector("#settings-form")?.addEventListener("submit", handleSettingsSave);
  document.querySelector("#news-form")?.addEventListener("submit", handleNewsSubmit);
  document.querySelector("#book-form")?.addEventListener("submit", handleBookSave);

  document.querySelector("[data-action='logout']")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });

  document.querySelector("[data-action='jump-admin']")?.addEventListener("click", () => {
    document.querySelector("#admin-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-action='jump-library']")?.addEventListener("click", () => {
    document.querySelector("#library-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-action='close-book']")?.addEventListener("click", () => {
    setSelectedBookId(null);
    buildApp();
  });

  document.querySelector("[data-action='share-book']")?.addEventListener("click", handleShareBook);

  document.querySelector("[data-action='read-book']")?.addEventListener("click", () => {
    document.querySelector(".reader-pane")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll(".approval-card").forEach((form) => {
    form.addEventListener("submit", handleApprovalSubmit);
  });

  document.querySelectorAll("[data-action='reject-request']").forEach((button) => {
    button.addEventListener("click", async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("id", button.dataset.requestId);

      if (error) {
        alert(error.message);
        return;
      }

      await refreshData();
      buildApp();
    });
  });

  document.querySelectorAll("[data-action='edit-book']").forEach((button) => {
    button.addEventListener("click", () => {
      ui.adminEditingBookId = button.dataset.bookId;
      buildApp();
      document.querySelector("#book-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-action='toggle-retire']").forEach((button) => {
    button.addEventListener("click", async () => {
      const book = db.books.find((item) => item.id === button.dataset.bookId);
      if (!book) return;

      const { error } = await supabase
        .from("books")
        .update({ status: book.status === "retired" ? "active" : "retired" })
        .eq("id", book.id);

      if (error) {
        alert(error.message);
        return;
      }

      await refreshData();
      buildApp();
    });
  });

  document.querySelector("[data-action='clear-book-form']")?.addEventListener("click", () => {
    ui.adminEditingBookId = null;
    buildApp();
  });

  document.querySelector("#install-button")?.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    buildApp();
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email").trim(),
    password: formData.get("password").trim(),
  });

  if (error) {
    alert(error.message);
    return;
  }

  event.currentTarget.reset();
}

async function handleRegistrationRequest(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const payload = {
    email: formData.get("email").trim(),
    password: formData.get("password").trim(),
    options: {
      data: {
        full_name: formData.get("fullName").trim(),
        interests: formData.get("interests").trim(),
        request_message: formData.get("message").trim(),
      },
    },
  };

  const { error } = await supabase.auth.signUp(payload);
  if (error) {
    alert(error.message);
    return;
  }

  const registrationTarget = db.settings.registrationApprovalEmail || "leomohan@yahoo.com";
  const registrationBody = encodeURIComponent(
    `New reader registration request\n\nName: ${formData.get("fullName").trim()}\nEmail: ${formData.get(
      "email"
    ).trim()}\nInterests: ${formData.get("interests").trim()}\n\nMessage:\n${
      formData.get("message").trim() || "No message supplied."
    }`
  );

  window.location.href = `mailto:${encodeURIComponent(
    registrationTarget
  )}?subject=${encodeURIComponent(
    `New registration request from ${formData.get("fullName").trim()}`
  )}&body=${registrationBody}`;

  event.currentTarget.reset();
  alert("Account created. An approval email draft has been opened, and the account will unlock after admin approval.");
}

async function handleApprovalSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const requestId = event.currentTarget.dataset.requestId;

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "approved",
      display_username: formData.get("displayUsername").trim() || null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  buildApp();
}

async function handleSettingsSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const payload = {
    id: true,
    library_name: formData.get("libraryName").trim(),
    author_name: formData.get("authorName").trim(),
    author_email: formData.get("authorEmail").trim(),
    registration_approval_email: formData.get("registrationApprovalEmail").trim(),
    website: formData.get("website").trim(),
    about: formData.get("about").trim(),
    latest_release: formData.get("latestRelease").trim(),
    latest_release_note: formData.get("latestReleaseNote").trim(),
  };

  const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "id" });
  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  alert("Author settings saved.");
  buildApp();
}

async function handleNewsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const { error } = await supabase.from("news_items").insert({
    title: formData.get("title").trim(),
    body: formData.get("body").trim(),
    published_on: formData.get("date"),
  });

  if (error) {
    alert(error.message);
    return;
  }

  event.currentTarget.reset();
  await refreshData();
  buildApp();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadBookCover(file, title) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `covers/${Date.now()}-${slugify(title || "book-cover")}.${extension}`;
  const { error } = await supabase.storage.from("book-covers").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
  return data.publicUrl;
}

async function handleBookSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const existingId = formData.get("id").trim();
  const existingBook = db.books.find((book) => book.id === existingId);
  const uploadedFile = formData.get("thumbnailFile");
  let thumbnailUrl = formData.get("thumbnail").trim();

  try {
    if (uploadedFile && uploadedFile.size > 0) {
      thumbnailUrl = await uploadBookCover(uploadedFile, formData.get("title").trim());
    }
  } catch (error) {
    alert(error.message || "Unable to upload the book cover.");
    return;
  }

  if (!thumbnailUrl) {
    thumbnailUrl = "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7dd3fc 100%)";
  }

  const payload = {
    title: formData.get("title").trim(),
    genre: formData.get("genre"),
    summary: formData.get("summary").trim(),
    description: formData.get("description").trim(),
    thumbnail_url: thumbnailUrl,
    cover_accent: formData.get("coverAccent").trim(),
    is_free: formData.get("isFree") === "on",
    free_content: formData.get("freeContent").trim(),
    amazon_url: formData.get("amazon").trim(),
    smashwords_url: formData.get("smashwords").trim(),
    status: existingBook?.status || "active",
  };

  let error = null;

  if (existingId) {
    const response = await supabase.from("books").update(payload).eq("id", existingId);
    error = response.error;
  } else {
    const response = await supabase.from("books").insert(payload);
    error = response.error;
  }

  if (error) {
    alert(error.message);
    return;
  }

  ui.adminEditingBookId = null;
  event.currentTarget.reset();
  await refreshData();
  buildApp();
}

async function handleRatingSubmit(event) {
  event.preventDefault();
  if (!isApprovedReader()) return;

  const formData = new FormData(event.currentTarget);
  const value = Number(formData.get("value"));
  if (!value) {
    alert("Please choose a star rating first.");
    return;
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      book_id: formData.get("bookId"),
      user_id: currentProfile().id,
      value,
    },
    { onConflict: "book_id,user_id" }
  );

  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  buildApp();
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  if (!isApprovedReader()) return;

  const formData = new FormData(event.currentTarget);
  const bookId = formData.get("bookId");
  const message = formData.get("message").trim();
  const book = db.books.find((item) => item.id === bookId);

  if (!message || !book) return;

  const { error } = await supabase.from("comments").insert({
    book_id: bookId,
    user_id: currentProfile().id,
    user_name: displayName(currentProfile()),
    message,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const emailBody = encodeURIComponent(
    `Book: ${book.title}\nReader: ${displayName(currentProfile())} (${currentProfile().email})\n\nComment:\n${message}`
  );

  window.location.href = `mailto:${encodeURIComponent(db.settings.authorEmail)}?subject=${encodeURIComponent(
    `Reader comment for ${book.title}`
  )}&body=${emailBody}`;

  event.currentTarget.reset();
  await refreshData();
  buildApp();
}

async function handleShareBook(event) {
  const book = db.books.find((item) => item.id === event.currentTarget.dataset.bookId);
  if (!book) return;

  const shareUrl = `${location.origin}${location.pathname}#book/${book.id}`;
  const text = `${book.title} by ${db.settings.authorName} — ${book.summary}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: book.title,
        text,
        url: shareUrl,
      });
      return;
    } catch {
      return;
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    alert("Share text copied to your clipboard.");
  } catch {
    window.prompt("Copy this share text:", `${text}\n${shareUrl}`);
  }
}

window.addEventListener("hashchange", () => {
  ui.selectedBookId = loadSelectedBookId();
  buildApp();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  buildApp();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

initializeApp();
