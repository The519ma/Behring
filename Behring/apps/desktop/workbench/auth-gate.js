(function () {
  const SESSION_KEY = "behring.session";
  const cfg = window.BEHRING_WORKBENCH_CONFIG || {};
  const requireAuth =
    cfg.requireWorkbenchAuth === true ||
    (cfg.desktopShell === true && cfg.requireWorkbenchAuth !== false);
  const keycloakUrl = String(cfg.keycloakUrl || "").trim();
  const keycloakRealm = String(cfg.keycloakRealm || "").trim();
  const keycloakClientId = String(cfg.keycloakClientId || "").trim();
  const keycloakClientSecret = String(cfg.keycloakClientSecret || "").trim();
  const keycloakReady = Boolean(keycloakUrl && keycloakRealm && keycloakClientId);
  const identityBaseUrl = String(cfg.noderedUrl || "").replace(/\/$/, "");

  function readJsonResponse(response) {
    return response.text().then(function (text) {
      if (!text) {
        return {};
      }
      try {
        return JSON.parse(text);
      } catch (error) {
        return { ok: false, error: text.slice(0, 300) };
      }
    });
  }

  async function postIdentity(path, payload) {
    if (!identityBaseUrl) {
      return { ok: false, error: "Identity service is not configured." };
    }
    try {
      const response = await fetch(identityBaseUrl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
      });
      const data = await readJsonResponse(response);
      if (!response.ok || !data || data.ok === false) {
        return { ok: false, error: (data && data.error) || ("HTTP " + response.status) };
      }
      return data;
    } catch (error) {
      return { ok: false, error: String(error.message || error) };
    }
  }

  function readSession() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function saveSession(obj) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
  }

  function notifyAuthChange(session) {
    try {
      window.dispatchEvent(new CustomEvent("behring:session-changed", {
        detail: session || null
      }));
    } catch (error) {}
  }

  function sessionIsValid(session) {
    if (!session || !session.mode) {
      return false;
    }
    if (session.mode === "admin") {
      return Boolean(session.username && session.expires_at && session.expires_at > Date.now());
    }
    if (session.mode === "keycloak") {
      return Boolean(session.access_token && session.expires_at && session.expires_at > Date.now() + 15_000);
    }
    return false;
  }

  function markAuthenticated() {
    document.documentElement.classList.add("behring-authenticated");
  }

  function desktopHasAdminIpc() {
    return window.behringDesktop && typeof window.behringDesktop.workbenchAdminLogin === "function";
  }

  async function tryAdminLogin(username, password) {
    return postIdentity("/identity/admin/login", { username: username, password: password });
  }

  async function tryEmployeeLogin(username, password) {
    if (!keycloakReady) {
      return { ok: false, error: "Keycloak is not configured (set KEYCLOAK_URL, KEYCLOAK_REALM, and KEYCLOAK_CLIENT_ID)." };
    }
    if (!window.behringDesktop || typeof window.behringDesktop.keycloakLogin !== "function") {
      return {
        ok: false,
        error: "Employee sign-in requires the Behring Desktop app (Keycloak token exchange runs in the desktop shell)."
      };
    }
    const result = await window.behringDesktop.keycloakLogin({
      baseUrl: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
      clientSecret: keycloakClientSecret || undefined,
      username: username,
      password: password
    });
    if (!result || !result.ok) {
      return { ok: false, error: (result && result.error) || "Keycloak sign-in failed." };
    }
    const expiresIn = Number(result.expires_in) || 300;
    saveSession({
      mode: "keycloak",
      username: username,
      access_token: result.access_token,
      refresh_token: result.refresh_token || "",
      expires_at: Date.now() + Math.max(60, expiresIn - 30) * 1000
    });
    return { ok: true };
  }

  function wireLoginForm() {
    const form = document.getElementById("auth-gate-form");
    const userEl = document.getElementById("auth-username");
    const passEl = document.getElementById("auth-password");
    const errEl = document.getElementById("auth-error");
    const submitBtn = document.getElementById("auth-submit");
    const setupCard = document.getElementById("auth-password-setup");
    const setupForm = document.getElementById("auth-password-setup-form");
    const setupNote = document.getElementById("auth-password-setup-note");
    const setupError = document.getElementById("auth-password-setup-error");
    const setupPasswordEl = document.getElementById("setup-password");
    const setupPasswordConfirmEl = document.getElementById("setup-password-confirm");
    const setupCancel = document.getElementById("auth-password-setup-cancel");
    let pendingSetup = null;
    const kindInputs = form.querySelectorAll('input[name="auth-kind"]');
    const hintEl = document.getElementById("auth-config-hint");
    if (hintEl) {
      if (!keycloakReady && !desktopHasAdminIpc()) {
        hintEl.textContent =
          "Configure Keycloak for employees and the VPS-side identity service for administrator sign-in.";
      } else if (!keycloakReady) {
        hintEl.textContent = "Keycloak is not configured; only Administrator (workbench) sign-in is available.";
      }
    }

    function showPasswordSetup(details) {
      pendingSetup = details;
      setupForm.reset();
      setupError.textContent = "";
      setupNote.textContent = "Set the first password for " + details.username + " (" + (details.full_name || details.username) + ").";
      setupCard.hidden = false;
      setupPasswordEl.focus();
    }

    function hidePasswordSetup() {
      pendingSetup = null;
      setupForm.reset();
      setupError.textContent = "";
      setupCard.hidden = true;
    }

    if (setupCancel) {
      setupCancel.addEventListener("click", function () {
        hidePasswordSetup();
      });
    }

    if (setupForm) {
      setupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!pendingSetup) {
          return;
        }
        setupError.textContent = "";
        const password = String(setupPasswordEl.value || "");
        const confirmPassword = String(setupPasswordConfirmEl.value || "");
        const result = await postIdentity("/identity/complete-password-setup", {
          setupToken: pendingSetup.setup_token,
          password: password,
          confirmPassword: confirmPassword
        });
        if (!result.ok) {
          setupError.textContent = result.error || "Could not save the password.";
          return;
        }
        hidePasswordSetup();
        passEl.value = password;
        const loginOutcome = await tryEmployeeLogin(pendingSetup.username, password);
        if (!loginOutcome.ok) {
          errEl.textContent = loginOutcome.error || "Password saved, but automatic sign-in failed.";
          submitBtn.disabled = false;
          return;
        }
        notifyAuthChange(readSession());
        markAuthenticated();
      });
    }

    function selectedKind() {
      const hit = form.querySelector('input[name="auth-kind"]:checked');
      return hit ? hit.value : "employee";
    }

    function syncKindUi() {
      const adminOnly = !keycloakReady;
      form.querySelectorAll('[data-require="keycloak"]').forEach(function (node) {
        node.style.display = adminOnly ? "none" : "";
      });
      if (adminOnly) {
        const adminRadio = form.querySelector('input[name="auth-kind"][value="admin"]');
        if (adminRadio) {
          adminRadio.checked = true;
        }
      }
    }

    kindInputs.forEach(function (input) {
      input.addEventListener("change", syncKindUi);
    });
    syncKindUi();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      errEl.textContent = "";
      submitBtn.disabled = true;
      const username = String(userEl.value || "").trim();
      const password = String(passEl.value || "");
      const kind = selectedKind();
      if (!username) {
        errEl.textContent = "Enter a username.";
        submitBtn.disabled = false;
        return;
      }
      if (kind === "admin" && !password) {
        errEl.textContent = "Enter the administrator password.";
        submitBtn.disabled = false;
        return;
      }
      let outcome;
      if (kind === "admin") {
        outcome = await tryAdminLogin(username, password);
        if (outcome.ok) {
          const ttlMs = 8 * 60 * 60 * 1000;
          saveSession({
            mode: "admin",
            username: username,
            admin_token: outcome.admin_token || "",
            expires_at: Date.now() + ttlMs
          });
        }
      } else {
        if (!password) {
          outcome = await postIdentity("/identity/begin-password-setup", { username: username });
          if (outcome.ok && outcome.setup_required) {
            showPasswordSetup(outcome);
            submitBtn.disabled = false;
            return;
          }
        } else {
          outcome = await tryEmployeeLogin(username, password);
        }
      }
      if (!outcome.ok) {
        errEl.textContent = outcome.error || "Sign-in failed.";
        submitBtn.disabled = false;
        return;
      }
      notifyAuthChange(readSession());
      markAuthenticated();
    });
  }

  if (!requireAuth) {
    markAuthenticated();
    return;
  }

  const existing = readSession();
  if (sessionIsValid(existing)) {
    markAuthenticated();
    return;
  }

  window.sessionStorage.removeItem(SESSION_KEY);
  wireLoginForm();
})();
