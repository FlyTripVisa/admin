/* =========================================================
   FlyTripVisa Admin – Auth Module
   Handles registration, login, session, validation.
   Pure client-side demo using localStorage + PBKDF2
   keys derivation so nothing is ever stored in plain text.
   ========================================================= */

(function () {
  "use strict";

  const USERS_KEY = "ftv_users";
  const SESSION_KEY = "ftv_session";
  const TOAST_DURATION = 2400;

  /* ==================== STORAGE HELPERS ==================== */
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* ==================== PASSWORD HASHING ==================== */
  /*
   * PBKDF2 via Web Crypto API. We store:
   *   { salt, iterations, hash }
   * This is demonstrably stronger than plaintext and works
   * entirely offline in every modern browser.
   */
  async function deriveKey(password, salt, iterations) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256"
      },
      baseKey,
      256
    );
    return bits;
  }

  async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000;
    const bits = await deriveKey(password, salt, iterations);
    return {
      salt: btoa(String.fromCharCode.apply(null, salt)),
      iterations: iterations,
      hash: btoa(String.fromCharCode.apply(null, new Uint8Array(bits)))
    };
  }

  async function verifyPassword(password, record) {
    const salt = Uint8Array.from(atob(record.salt), c => c.charCodeAt(0));
    const bits = await deriveKey(password, salt, record.iterations);
    const hash = btoa(String.fromCharCode.apply(null, new Uint8Array(bits)));
    return hash === record.hash;
  }

  /* ==================== VALIDATION ==================== */
  const VALIDATION = {
    username: {
      min: 3,
      max: 24,
      regex: /^[a-zA-Z0-9_.]+$/,
      message:
        "Username must be 3–24 characters (letters, numbers, underscore, dot)."
    },
    password: {
      min: 8,
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
      message:
        "Password must be at least 8 characters with uppercase, lowercase, number & symbol."
    }
  };

  function validateUsername(username) {
    const u = (username || "").trim();
    if (!u) return "Username is required.";
    if (u.length < VALIDATION.username.min) {
      return "Username must be at least " + VALIDATION.username.min + " characters.";
    }
    if (u.length > VALIDATION.username.max) {
      return "Username must be at most " + VALIDATION.username.max + " characters.";
    }
    if (!VALIDATION.username.regex.test(u)) {
      return VALIDATION.username.message;
    }
    return "";
  }

  function validateEmail(email) {
    const e = (email || "").trim();
    if (!e) return "Email is required.";
    // RFC 5322-ish
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return "Please enter a valid email address.";
    }
    return "";
  }

  function validatePassword(password) {
    const p = password || "";
    if (!p) return "Password is required.";
    if (p.length < VALIDATION.password.min) {
      return "Password must be at least " + VALIDATION.password.min + " characters.";
    }
    if (!VALIDATION.password.regex.test(p)) {
      return VALIDATION.password.message;
    }
    return "";
  }

  function validateConfirm(password, confirm) {
    if (!confirm) return "Please confirm your password.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  }

  /* ==================== SESSION ==================== */
  function getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!s) return null;
      // 24 hour expiry
      if (Date.now() > s.expiresAt) {
        logout();
        return null;
      }
      return s;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        username: user.username,
        email: user.email,
        role: user.role || "admin",
        avatar: (user.username || "?").slice(0, 1).toUpperCase(),
        createdAt: user.createdAt,
        expiresAt: expiresAt
      })
    );
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    // Clear any app state
    window.dispatchEvent(new CustomEvent("ftv:logout"));
  }

  /* ==================== AUTH API ==================== */
  const Auth = {
    /*
     * Register a new admin user.
     */
    async register({ username, email, password, confirm }) {
      const users = getUsers();

      const uErr = validateUsername(username);
      if (uErr) throw new Error(uErr);

      const eErr = validateEmail(email);
      if (eErr) throw new Error(eErr);

      const pErr = validatePassword(password);
      if (pErr) throw new Error(pErr);

      const cErr = validateConfirm(password, confirm);
      if (cErr) throw new Error(cErr);

      const u = username.trim().toLowerCase();
      const em = email.trim().toLowerCase();

      if (users[u]) throw new Error("Username already exists.");

      // Check email uniqueness
      for (const key in users) {
        if (users[key].email === em) {
          throw new Error("An account with this email already exists.");
        }
      }

      const hashed = await hashPassword(password);

      users[u] = {
        username: u,
        email: em,
        role: "admin",
        pwd: hashed,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      saveUsers(users);
      setSession(users[u]);
      return users[u];
    },

    /*
     * Log in an existing user.
     */
    async login({ username, password, remember }) {
      const users = getUsers();
      const u = (username || "").trim().toLowerCase();

      if (!u) throw new Error("Please enter your username.");
      if (!password) throw new Error("Please enter your password.");

      const user = users[u];
      if (!user) throw new Error("Invalid username or password.");

      const ok = await verifyPassword(password, user.pwd);
      if (!ok) throw new Error("Invalid username or password.");

      user.lastLogin = new Date().toISOString();
      saveUsers(users);
      setSession(user);
      return user;
    },

    /*
     * Returns the current session, or null if not authenticated.
     */
    current() {
      return getSession();
    },

    /*
     * Terminate the session and redirect to login.
     */
    logout: logout,

    /*
     * Require authentication. If not authenticated, redirect
     * to the login page. Call this on protected pages.
     */
    requireAuth(redirectTo) {
      const s = getSession();
      if (!s) {
        const target = redirectTo || "login.html";
        window.location.href = target;
        return null;
      }
      return s;
    },

    /*
     * If already authenticated, bounce to dashboard.
     * Useful on login/signup pages.
     */
    redirectIfAuthed(redirectTo) {
      if (getSession()) {
        window.location.href = redirectTo || "dashboard.html";
      }
    },

    /* Validation helpers for inline use */
    validators: {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      confirm: validateConfirm
    }
  };

  /* ==================== TOAST ==================== */
  function toast(msg, type) {
    let t = document.querySelector(".toast");
    if (t) t.remove();

    t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);

    requestAnimationFrame(() => t.classList.add("show"));

    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, TOAST_DURATION);
  }

  /* ==================== EXPOSE ==================== */
  window.FTV = window.FTV || {};
  window.FTV.Auth = Auth;
  window.FTV.toast = toast;
})();
