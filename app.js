import { seedData, SESSION_KEY, STORAGE_KEY } from "./data.js";

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

let installPrompt = null;
let ui = {
  currentUser: loadSession(),
  selectedGenre: "All",
  selectedBookId: loadSelectedBookId(),
  adminEditingBookId: null,
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedData));
}

function persistData(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const fresh = cloneSeed();
    persistData(fresh);
    return fresh;
  }

  try {
    return {
      ...cloneSeed(),
      ...JSON.parse(stored),
    };
  } catch {
    const fresh = cloneSeed();
    persistData(fresh);
    return fresh;
  }
}

let db = loadData();

function saveData(next) {
  db = next;
  persistData(next);
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(user) {
  ui.currentUser = user;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

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

function getCurrentUserRecord() {
  if (!ui.currentUser) return null;
  return db.users.find((user) => user.id === ui.currentUser.id) || null;
}

function isAdmin() {
  return getCurrentUserRecord()?.role === "admin";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initials(title) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderStars(value) {
  const rounded = Math.round(value);
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

  return `background:${escapeHtml(book.thumbnail)}; color:${escapeHtml(book.coverAccent)};`;
}

function renderCoverInner(book) {
  return isImageThumbnail(book.thumbnail) ? "" : `<span>${escapeHtml(initials(book.title))}</span>`;
}

function readerLocked() {
  return !ui.currentUser || isAdmin();
}

function buildApp() {
  const selectedBook = getSelectedBook();
  const visibleBooks = getVisibleBooks();
  const currentUser = getCurrentUserRecord();
  const pendingRequests = db.registrationRequests.filter((item) => item.status === "pending");

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

        <section class="news-auth-grid">
          <div class="news-panel panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Updates</p>
                <h3>Latest news</h3>
              </div>
            </div>
            <div class="news-list">
              ${db.news
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(
                  (item) => `
                    <article class="news-item">
                      <p class="news-date">${escapeHtml(item.date)}</p>
                      <h4>${escapeHtml(item.title)}</h4>
                      <p>${escapeHtml(item.body)}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>

          <div class="auth-panel panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Access</p>
                <h3>${currentUser ? `Welcome, ${escapeHtml(currentUser.name)}` : "Reader access"}</h3>
              </div>
            </div>
            ${
              currentUser
                ? `
                  <div class="signed-in-card">
                    <p>You are signed in as <strong>${escapeHtml(currentUser.username)}</strong> (${escapeHtml(currentUser.role)}).</p>
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
                      Username
                      <input name="username" type="text" placeholder="Enter username" required />
                    </label>
                    <label>
                      Password
                      <input name="password" type="password" placeholder="Enter password" required />
                    </label>
                    <button class="primary-button" type="submit">Sign in</button>
                  </form>

                  <form id="register-form" class="stack-form">
                    <h4>Request reader access</h4>
                    <label>
                      Full name
                      <input name="name" type="text" placeholder="Your name" required />
                    </label>
                    <label>
                      Email
                      <input name="email" type="email" placeholder="you@example.com" required />
                    </label>
                    <label>
                      Genres of interest
                      <input name="interests" type="text" placeholder="Technology, Business, Fiction" required />
                    </label>
                    <label>
                      Short note
                      <textarea name="message" rows="4" placeholder="Why would you like access?"></textarea>
                    </label>
                    <button class="primary-button" type="submit">Send registration request</button>
                    <p class="form-note">Admin approval is manual. A registration email draft will open for ${escapeHtml(db.settings.registrationApprovalEmail)} after submission.</p>
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
            ${readerLocked() ? `<p class="hint">Sign in with an approved reader account to open titles and leave feedback.</p>` : ""}
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
            ${visibleBooks
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
              .join("")}
          </div>
        </section>

        ${selectedBook ? renderBookDetail(selectedBook, currentUser) : ""}

        ${isAdmin() ? renderAdminPanel(pendingRequests) : ""}
      </main>
    </div>
  `;

  bindEvents();
}

function renderBookDetail(book, currentUser) {
  const rating = getBookRatings(book.id);
  const comments = getBookComments(book.id);
  const myRating = currentUser
    ? db.ratings.find((item) => item.bookId === book.id && item.userId === currentUser.id)?.value || 0
    : 0;

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
              book.isFree
                ? `<button class="primary-button" data-action="read-book" data-book-id="${escapeHtml(book.id)}">Read now</button>`
                : `
                    <a class="primary-button link-button" href="${escapeHtml(book.storeLinks.amazon)}" target="_blank" rel="noreferrer">Amazon</a>
                    <a class="ghost-button link-button" href="${escapeHtml(book.storeLinks.smashwords)}" target="_blank" rel="noreferrer">Smashwords</a>
                  `
            }
            <button class="ghost-button" data-action="share-book" data-book-id="${escapeHtml(book.id)}">Share</button>
            <button class="ghost-button" data-action="close-book">Close</button>
          </div>
        </div>
      </div>

      ${
        book.isFree
          ? `
            <div class="reader-pane">
              <p class="eyebrow">Reader view</p>
              <pre>${escapeHtml(book.freeContent)}</pre>
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
        currentUser && currentUser.role === "reader"
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
                        <span>${escapeHtml(new Date(comment.createdAt).toLocaleDateString())}</span>
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

function renderAdminPanel(pendingRequests) {
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
        <p class="hint">Default admin login is <strong>admin</strong> / <strong>change-me-now</strong>. Change it before production use.</p>
      </div>

      <div class="admin-grid">
        <div class="panel admin-card">
          <h4>Pending registrations</h4>
          ${
            pendingRequests.length
              ? pendingRequests
                  .map(
                    (request) => `
                      <form class="approval-card" data-request-id="${escapeHtml(request.id)}">
                        <p><strong>${escapeHtml(request.name)}</strong> • ${escapeHtml(request.email)}</p>
                        <p>${escapeHtml(request.interests)}</p>
                        <p class="hint">${escapeHtml(request.message || "No message supplied.")}</p>
                        <label>
                          Issue username
                          <input name="username" type="text" required placeholder="reader username" />
                        </label>
                        <label>
                          Issue password
                          <input name="password" type="text" required placeholder="temporary password" />
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
              Reader comment email
              <input name="authorEmail" type="email" value="${escapeHtml(db.settings.authorEmail)}" required />
            </label>
            <label>
              Registration approval email
              <input name="registrationApprovalEmail" type="email" value="${escapeHtml(db.settings.registrationApprovalEmail || "leomohan@yahoo.com")}" required />
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
            ${db.books
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
              .join("")}
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
          <p class="form-note">Upload an image to use the actual book cover as the thumbnail. If left empty, the app uses the text/gradient thumbnail field above.</p>
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

  document.querySelector("[data-action='logout']")?.addEventListener("click", () => {
    saveSession(null);
    buildApp();
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
    button.addEventListener("click", () => {
      const next = cloneSeed();
      Object.assign(next, db);
      next.registrationRequests = db.registrationRequests.map((request) =>
        request.id === button.dataset.requestId ? { ...request, status: "rejected" } : request
      );
      saveData(next);
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
    button.addEventListener("click", () => {
      const next = cloneSeed();
      Object.assign(next, db);
      next.books = db.books.map((book) =>
        book.id === button.dataset.bookId
          ? { ...book, status: book.status === "retired" ? "active" : "retired" }
          : book
      );
      saveData(next);
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

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const username = formData.get("username").trim();
  const password = formData.get("password").trim();
  const user = db.users.find((item) => item.username === username && item.password === password);

  if (!user) {
    alert("Login failed. Please check your username and password.");
    return;
  }

  saveSession({ id: user.id, username: user.username, role: user.role, name: user.name });
  buildApp();
}

function handleRegistrationRequest(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const request = {
    id: `req-${crypto.randomUUID()}`,
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    interests: formData.get("interests").trim(),
    message: formData.get("message").trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const next = cloneSeed();
  Object.assign(next, db);
  next.registrationRequests = [request, ...db.registrationRequests];
  saveData(next);
  const registrationTarget = db.settings.registrationApprovalEmail || "leomohan@yahoo.com";
  const registrationBody = encodeURIComponent(
    `New reader registration request\n\nName: ${request.name}\nEmail: ${request.email}\nInterests: ${request.interests}\n\nMessage:\n${request.message || "No message supplied."}`
  );
  window.location.href = `mailto:${encodeURIComponent(
    registrationTarget
  )}?subject=${encodeURIComponent(`New registration request from ${request.name}`)}&body=${registrationBody}`;
  event.currentTarget.reset();
  alert("Registration request saved. An approval email draft has been opened.");
  buildApp();
}

function handleApprovalSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const requestId = form.dataset.requestId;
  const request = db.registrationRequests.find((item) => item.id === requestId);

  if (!request) return;

  const username = formData.get("username").trim();
  const password = formData.get("password").trim();

  if (db.users.some((user) => user.username === username)) {
    alert("That username is already in use. Please choose another one.");
    return;
  }

  const next = cloneSeed();
  Object.assign(next, db);
  next.users = [
    ...db.users,
    {
      id: `user-${crypto.randomUUID()}`,
      role: "reader",
      name: request.name,
      email: request.email,
      username,
      password,
      approvedAt: new Date().toISOString(),
    },
  ];
  next.registrationRequests = db.registrationRequests.map((item) =>
    item.id === requestId ? { ...item, status: "approved", approvedUsername: username } : item
  );
  saveData(next);
  buildApp();
}

function handleSettingsSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const next = cloneSeed();
  Object.assign(next, db);
  next.settings = {
    ...db.settings,
    about: formData.get("about").trim(),
    latestRelease: formData.get("latestRelease").trim(),
    latestReleaseNote: formData.get("latestReleaseNote").trim(),
    authorEmail: formData.get("authorEmail").trim(),
    registrationApprovalEmail: formData.get("registrationApprovalEmail").trim(),
  };
  saveData(next);
  alert("Author settings saved.");
  buildApp();
}

function handleNewsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const item = {
    id: `news-${crypto.randomUUID()}`,
    title: formData.get("title").trim(),
    date: formData.get("date"),
    body: formData.get("body").trim(),
  };
  const next = cloneSeed();
  Object.assign(next, db);
  next.news = [item, ...db.news];
  saveData(next);
  event.currentTarget.reset();
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

async function handleBookSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get("id").trim() || `book-${crypto.randomUUID()}`;
  const existing = db.books.find((item) => item.id === id);
  const uploadedFile = formData.get("thumbnailFile");
  let thumbnail = formData.get("thumbnail").trim();

  if (uploadedFile && uploadedFile.size > 0) {
    thumbnail = await readFileAsDataUrl(uploadedFile);
  }

  const book = {
    id,
    title: formData.get("title").trim(),
    genre: formData.get("genre"),
    status: existing?.status || "active",
    isFree: formData.get("isFree") === "on",
    summary: formData.get("summary").trim(),
    description: formData.get("description").trim(),
    thumbnail,
    coverAccent: formData.get("coverAccent").trim(),
    freeContent: formData.get("freeContent").trim(),
    storeLinks: {
      amazon: formData.get("amazon").trim(),
      smashwords: formData.get("smashwords").trim(),
    },
  };

  const next = cloneSeed();
  Object.assign(next, db);
  next.books = existing ? db.books.map((item) => (item.id === id ? { ...existing, ...book } : item)) : [book, ...db.books];
  saveData(next);
  ui.adminEditingBookId = null;
  event.currentTarget.reset();
  buildApp();
}

function handleRatingSubmit(event) {
  event.preventDefault();
  const user = getCurrentUserRecord();
  if (!user || user.role !== "reader") return;

  const formData = new FormData(event.currentTarget);
  const bookId = formData.get("bookId");
  const value = Number(formData.get("value"));

  if (!value) {
    alert("Please choose a star rating first.");
    return;
  }

  const existing = db.ratings.find((rating) => rating.bookId === bookId && rating.userId === user.id);
  const next = cloneSeed();
  Object.assign(next, db);
  next.ratings = existing
    ? db.ratings.map((rating) => (rating.id === existing.id ? { ...rating, value } : rating))
    : [...db.ratings, { id: `rating-${crypto.randomUUID()}`, bookId, userId: user.id, value }];
  saveData(next);
  buildApp();
}

function handleCommentSubmit(event) {
  event.preventDefault();
  const user = getCurrentUserRecord();
  if (!user || user.role !== "reader") return;

  const formData = new FormData(event.currentTarget);
  const bookId = formData.get("bookId");
  const message = formData.get("message").trim();
  const book = db.books.find((item) => item.id === bookId);

  if (!message || !book) return;

  const comment = {
    id: `comment-${crypto.randomUUID()}`,
    bookId,
    userId: user.id,
    userName: user.name,
    message,
    createdAt: new Date().toISOString(),
  };

  const next = cloneSeed();
  Object.assign(next, db);
  next.comments = [comment, ...db.comments];
  saveData(next);

  const emailBody = encodeURIComponent(
    `Book: ${book.title}\nReader: ${user.name} (${user.email})\n\nComment:\n${message}`
  );
  window.location.href = `mailto:${encodeURIComponent(db.settings.authorEmail)}?subject=${encodeURIComponent(
    `Reader comment for ${book.title}`
  )}&body=${emailBody}`;

  event.currentTarget.reset();
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
    } catch {
      return;
    }
    return;
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

buildApp();
