(function () {
  const config = window.BEHRING_WORKBENCH_CONFIG || {};
  const caseId = config.referenceCaseId || "LAB-001";
  const patientId = config.referencePatientId || "PAT-001";
  const helpTipsKey = "behring.helpTipsVisible";
  const identityBaseUrl = String(config.noderedUrl || "").replace(/\/$/, "");

  function readHelpTipsVisible() {
    try {
      return window.localStorage.getItem(helpTipsKey) === "true";
    } catch (error) {
      return false;
    }
  }

  function applyHelpTipsState(visible) {
    document.body.classList.toggle("help-tips-visible", visible);
    document.body.classList.toggle("hide-help-tips", !visible);
    var toggle = document.getElementById("help-toggle");
    if (toggle) {
      toggle.textContent = visible ? "Hide help tips" : "Show help tips";
      toggle.setAttribute("aria-pressed", visible ? "true" : "false");
    }
  }

  function wireHelpToggle() {
    var toggle = document.getElementById("help-toggle");
    if (!toggle) { return; }
    applyHelpTipsState(readHelpTipsVisible());
    toggle.addEventListener("click", function () {
      var next = !document.body.classList.contains("help-tips-visible");
      try {
        window.localStorage.setItem(helpTipsKey, next ? "true" : "false");
      } catch (error) {}
      applyHelpTipsState(next);
    });
  }

  function isInternalWorkbenchRoute(href) {
    if (!href) { return false; }
    return [
      config.noderedUrl || "",
      config.labelPrintAgentUrl || "",
      config.baserowUrl || "",
      config.softwareHubUrl || ""
    ].some(function (base) {
      return base && String(href).indexOf(base) === 0;
    });
  }

  function createAction(label, href, primary, newWindow) {
    const a = document.createElement("a");
    a.className = primary ? "action action-primary" : "action action-secondary";
    a.href = href;
    if (newWindow === true) {
      a.target = "_blank";
      a.rel = "noreferrer";
    } else if (isInternalWorkbenchRoute(href)) {
      a.target = "_self";
    } else {
      a.target = "_blank";
      a.rel = "noreferrer";
    }
    a.textContent = label;
    return a;
  }

  function createActionDetail(label, description, href, primary, newWindow) {
    const wrap = document.createElement("div");
    wrap.className = "action-detail";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "detail-label";
    title.textContent = label;
    const body = document.createElement("div");
    body.className = "detail-value detail-value-left";
    body.textContent = description;
    left.appendChild(title);
    left.appendChild(body);

    wrap.appendChild(left);
    wrap.appendChild(createAction(label, href, primary, newWindow));
    return wrap;
  }

  function createSummary(kicker, value, note) {
    const card = document.createElement("div");
    card.className = "summary-card help-copy-block";
    card.innerHTML = `
      <span class="summary-kicker">${kicker}</span>
      <div class="summary-value">${value}</div>
      <div class="summary-note">${note}</div>
    `;
    return card;
  }

  function createDetail(label, value, copyable) {
    const row = document.createElement("div");
    row.className = "detail";

    const left = document.createElement("div");
    left.innerHTML = `<div class="detail-label">${label}</div><div class="detail-value detail-value-left">${value}</div>`;
    row.appendChild(left);

    if (copyable) {
      const button = document.createElement("button");
      button.className = "mini-btn";
      button.textContent = "Copy";
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(String(value)).catch(function () {});
      });
      const right = document.createElement("div");
      right.className = "copy-row";
      right.appendChild(button);
      row.appendChild(right);
    }

    return row;
  }

  function createService(name, url, note) {
    const node = document.createElement("div");
    node.className = "service";
    node.innerHTML = `<strong>${name}</strong><code>${url}</code><div class="pill">${note}</div>`;
    return node;
  }

  function appendLinks(target, items) {
    items.forEach(function (item) {
      target.appendChild(createActionDetail(item.label, item.description, item.href, false, item.newWindow === true));
    });
  }

  function normalizeCaseLookup(rawValue) {
    let value = String(rawValue || "").trim().toUpperCase();
    if (!value) { return ""; }
    if (value.indexOf("REPORT-") === 0) {
      value = value.slice(7);
    } else if (value.indexOf("LABREC-") === 0) {
      value = value.slice(7);
    } else if (value.indexOf("SLIDE-") === 0) {
      value = value.slice(6).replace(/-S\d+$/i, "");
    }
    if (/^[A-Z0-9]+-[A-Z0-9]+$/i.test(value) && !/^(LAB|PAT)-/i.test(value)) {
      return "LAB-" + value;
    }
    return value;
  }

  function buildCaseSearchRoutes(rawValue) {
    const normalized = normalizeCaseLookup(rawValue);
    if (!normalized) { return null; }
    const encoded = encodeURIComponent(normalized);
    return {
      rawValue: String(rawValue || "").trim(),
      normalized,
      progressRoute: `${config.noderedUrl}/tech/cases/${encoded}`,
      caseRoute: `${config.noderedUrl}/cases/${encoded}`,
      assignmentRoute: `${config.noderedUrl}/cases/${encoded}/assignment`,
      reportRoute: `${config.noderedUrl}/reports/${encoded}`,
      reportPreviewRoute: `${config.noderedUrl}/reporting/download-report/${encoded}?inline=1`,
      crosscheckRoute: `${config.noderedUrl}/reports/${encoded}/crosscheck`,
      downloadRoute: `${config.noderedUrl}/reporting/download-report/${encoded}`,
      labelRoute: `${config.noderedUrl}/labels/set/${encoded}`,
      scanRoute: `${config.noderedUrl}/scan/tech/${encodeURIComponent(String(rawValue || "").trim())}`
    };
  }

  function wireCaseSearch() {
    const form = document.getElementById("case-search-form");
    const input = document.getElementById("case-search-input");
    const status = document.getElementById("case-search-status");
    const result = document.getElementById("case-search-result");
    const clear = document.getElementById("case-search-clear");
    if (!form || !input || !status || !result || !clear) {
      return;
    }

    function renderResult(routes) {
      if (!routes) {
        result.classList.remove("is-visible");
        result.innerHTML = "";
        return;
      }
      result.classList.add("is-visible");
      result.innerHTML = `
        <div class="case-search-result-grid">
          <div>
            <div class="detail-label">Resolved accession</div>
            <div class="detail-value detail-value-left"><a href="${routes.caseRoute}" class="case-link">${routes.normalized}</a></div>
          </div>
          <div class="case-search-links"></div>
          <div class="case-search-preview">
            <iframe src="${routes.progressRoute}" title="Case progress preview for ${routes.normalized}" loading="lazy"></iframe>
          </div>
        </div>
      `;
      const links = result.querySelector(".case-search-links");
      links.appendChild(createAction("Open Progress", routes.progressRoute, true, false));
      links.appendChild(createAction("Open Case", routes.caseRoute, false, false));
      links.appendChild(createAction("Open Assignment", routes.assignmentRoute, false, false));
      links.appendChild(createAction("Open Report Template", routes.reportRoute, false, false));
      links.appendChild(createAction("Preview Final Report", routes.reportPreviewRoute, false, false));
      links.appendChild(createAction("Crosscheck", routes.crosscheckRoute, false, false));
      links.appendChild(createAction("Download Report PDF", routes.downloadRoute, false, true));
      links.appendChild(createAction("Print Labels", routes.labelRoute, false, false));
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const routes = buildCaseSearchRoutes(input.value);
      if (!routes) {
        status.textContent = "Enter a LAB number or case barcode.";
        renderResult(null);
        return;
      }
      status.textContent = `Opening ${routes.normalized} with the progress-first workbench.`;
      renderResult(routes);
    });

    clear.addEventListener("click", function () {
      input.value = "";
      status.textContent = "";
      renderResult(null);
      input.focus();
    });
  }

  function readSession() {
    try {
      return JSON.parse(window.sessionStorage.getItem("behring.session") || "null");
    } catch (error) {
      return null;
    }
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options || {});
    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = { ok: false, error: text.slice(0, 300) };
      }
    }
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || ("HTTP " + response.status));
    }
    return data;
  }

  function readAdminSession() {
    const session = readSession();
    if (!session || session.mode !== "admin" || !session.admin_token) {
      return null;
    }
    return session;
  }

  function setProvisioningVisibility() {
    const adminSession = readAdminSession();
    const panel = document.getElementById("access-provisioning-panel");
    const registryCard = document.getElementById("access-registry-panel");
    const status = document.getElementById("provision-status");
    const adminOnly = document.getElementById("access-admin-only-note");
    const visible = Boolean(adminSession);
    if (panel) {
      panel.hidden = !visible;
    }
    if (registryCard) {
      registryCard.hidden = !visible;
    }
    if (adminOnly) {
      adminOnly.hidden = visible;
    }
    if (!visible && status) {
      status.textContent = "";
    }
  }

  async function loadRegistry() {
    const session = readAdminSession();
    if (!identityBaseUrl || !session) {
      return [];
    }
    const data = await fetchJson(identityBaseUrl + "/identity/registry", {
      headers: {
        "X-Admin-Token": session.admin_token
      }
    });
    return Array.isArray(data.employees) ? data.employees : [];
  }

  async function renderRegistry() {
    const mount = document.getElementById("employee-registry");
    mount.innerHTML = "";
    if (!readAdminSession()) {
      mount.appendChild(createDetail("Registry", "Administrator sign-in is required to view the provisioned access register.", false));
      return;
    }
    let items = [];
    try {
      items = await loadRegistry();
    } catch (error) {
      mount.appendChild(createDetail("Registry", String(error.message || error), false));
      return;
    }
    if (!items.length) {
      mount.appendChild(createDetail("Registry", "No provisioned employees yet.", false));
      return;
    }
    items.forEach(function (item) {
      const note = [
        item.role,
        item.email || "no personal email",
        item.officialEmail || "no official email",
        item.rfidNote || "RFID note pending"
      ].join(" · ");
      mount.appendChild(createDetail(item.employeeId, `${item.fullName} · ${note}`, true));
    });
  }

  async function provisionEmployee() {
    const form = document.getElementById("employee-form");
    const status = document.getElementById("provision-status");
    const data = new FormData(form);
    const fullName = String(data.get("fullName") || "").trim();
    const role = String(data.get("role") || "").trim();
    if (!fullName || !role) {
      status.textContent = "Full name and role are required before provisioning.";
      return;
    }
    const session = readAdminSession();
    if (!session) {
      status.textContent = "Sign in with the administrator account first to provision staff access.";
      return;
    }
    try {
      const response = await fetchJson(identityBaseUrl + "/identity/provision-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken: session.admin_token,
          fullName: fullName,
          role: role,
          email: String(data.get("email") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
          officialEmail: String(data.get("officialEmail") || "").trim() || "behringihcls@gmail.com",
          rfidNote: String(data.get("rfidNote") || "").trim()
        })
      });
      await renderRegistry();
      form.reset();
      form.elements.officialEmail.value = "behringihcls@gmail.com";
      status.textContent =
        "Provisioned " + response.record.employeeId + ". The user can enter just that username at sign-in to create a password.";
    } catch (error) {
      status.textContent = String(error.message || error);
      return;
    }
  }

  const heroSummary = document.getElementById("hero-summary");
  heroSummary.appendChild(createSummary("New arrivals", "Case intake and assignment", "Take PAT-number referrals, complete missing details, assign tests, and move them into processing."));
  heroSummary.appendChild(createSummary("Clinical desk", "Pathologist workbench", "Reporting, crosscheck, final review, and completed reports stay together."));
  heroSummary.appendChild(createSummary("Bench flow", "Technician workbench", "Scan handoff, progress ticks, and tray-side work stay together."));
  heroSummary.appendChild(createSummary("Stock room", "Supplies workbench", "Handle supply intake, stock levels, and bench replenishment as its own workspace."));

  const heroActions = document.getElementById("hero-actions");
  const signOut = document.createElement("button");
  signOut.type = "button";
  signOut.className = "action action-secondary";
  signOut.textContent = "Sign out";
  signOut.hidden = true;
  signOut.addEventListener("click", function () {
    try {
      window.sessionStorage.removeItem("behring.session");
    } catch (error) {}
    window.location.reload();
  });
  heroActions.appendChild(signOut);
  function syncSignOut() {
    try {
      signOut.hidden = !window.sessionStorage.getItem("behring.session");
    } catch (error) {
      signOut.hidden = true;
    }
  }
  syncSignOut();
  heroActions.appendChild(createAction("Open New Cases", `${config.noderedUrl}/queue/new-cases/view`, true));
  heroActions.appendChild(createAction("Open Pathologist Workbench", `${config.noderedUrl}/reporting/completed-reports/view#reports-to-sign`, false, true));
  heroActions.appendChild(createAction("Open Technician Workbench", `${config.noderedUrl}/lab/tech-portal`, false, true));
  heroActions.appendChild(createAction("Open Audit Workbench", `${config.noderedUrl}/audit/view`, false, true));
  heroActions.appendChild(createAction("Open Supplies Workbench", `${config.noderedUrl}/supplies/view`, false));
  heroActions.appendChild(createAction("Add Referral Manually", `${config.noderedUrl}/orders/manual/view`, false));
  heroActions.appendChild(createAction("Open Label Templates", `${config.noderedUrl}/labels/set/${encodeURIComponent(caseId)}`, false));
  heroActions.appendChild(createAction("Software Hub", config.softwareHubUrl || `${config.noderedUrl}/software`, false));

  appendLinks(document.getElementById("common-actions"), [
    {
      label: "New Cases",
      description: "Open the unassigned queue where PAT-number referrals become LAB-numbered active cases.",
      href: `${config.noderedUrl}/queue/new-cases/view`
    },
    {
      label: "Pathologist workbench",
      description: "Open reporting, crosscheck, final review, and completed reports together.",
      href: `${config.noderedUrl}/reporting/completed-reports/view#reports-to-sign`,
      newWindow: true
    },
    {
      label: "Technician workbench",
      description: "Open the bench progress portal, scan-safe routing, and tray-side workflow.",
      href: `${config.noderedUrl}/lab/tech-portal`,
      newWindow: true
    },
    {
      label: "Audit workbench",
      description: "Filter cases by age, gender, report status, and report dates, then export CSV lists.",
      href: `${config.noderedUrl}/audit/view`,
      newWindow: true
    },
    {
      label: "Supplies workbench",
      description: "Open the standalone stock workspace for purchases, quantities, expiry dates, and bench-use tracking.",
      href: `${config.noderedUrl}/supplies/view`
    },
    {
      label: "Add referral manually",
      description: "Open the referral form directly inside the workbench for a manual intake.",
      href: `${config.noderedUrl}/orders/manual/view`
    },
  ]);
  document.getElementById("common-actions").appendChild(
    createActionDetail(
      "Label templates",
      "Search with a LAB number and open the VPS-hosted Brother/browser label station.",
      `${config.noderedUrl}/labels/set/${encodeURIComponent(caseId)}`,
      false,
      false
    )
  );

  appendLinks(document.getElementById("common-links"), [
    {
      label: "Shared case queue",
      description: "Open the active unassigned queue for fresh intake before workbench-specific steps begin.",
      href: `${config.noderedUrl}/queue/new-cases/view`
    },
    {
      label: "Report register",
      description: "Open the completed-report register for review, download, and signoff-ready work.",
      href: `${config.noderedUrl}/reporting/completed-reports/view`
    },
    {
      label: "Manual intake",
      description: "Open the direct referral form for adding a case outside the live feed.",
      href: `${config.noderedUrl}/orders/manual/view`
    }
  ]);

  appendLinks(document.getElementById("pathologist-links"), [
    {
      label: "Reports to be signed",
      description: "Open signature-ready reports and capture a mouse, pen-tablet, or typed audited e-signature.",
      href: `${config.noderedUrl}/reporting/completed-reports/view#reports-to-sign`,
      newWindow: true
    },
    {
      label: "Completed reports",
      description: "Open the pathologist-facing completed register that is responding cleanly right now.",
      href: `${config.noderedUrl}/reporting/completed-reports/view`,
      newWindow: true
    },
    {
      label: "Pathologist desk",
      description: "Open the workflow portal for case review and reporting work.",
      href: `${config.noderedUrl}/reporting/completed-reports/view`,
      newWindow: true
    }
  ]);

  const referenceCases = document.getElementById("reference-cases");
  referenceCases.appendChild(createDetail("Reference accession", caseId, true));
  referenceCases.appendChild(createDetail("Reference patient", patientId, true));
  referenceCases.appendChild(createDetail("Scanner handoff", `LABREC-${caseId}`, true));
  referenceCases.appendChild(createDetail("Route note", "Use the shared queue, reporting register, and label station as the current working routes.", false));

  appendLinks(document.getElementById("technician-links"), [
    {
      label: "Tech portal",
      description: "Open the technician landing portal first; it is responding cleanly.",
      href: `${config.noderedUrl}/lab/tech-portal`,
      newWindow: true
    },
    {
      label: "Scanner route",
      description: "Use the scanner-safe redirect route from LABREC, REPORT, or SLIDE labels.",
      href: `${config.noderedUrl}/scan/tech/${encodeURIComponent(`LABREC-${caseId}`)}`
    },
    {
      label: "Supplies workbench",
      description: "Open the separate stock workspace without using the intake queue.",
      href: `${config.noderedUrl}/supplies/view`
    }
  ]);

  appendLinks(document.getElementById("audit-links"), [
    {
      label: "Open audit workbench",
      description: "Review filtered case lists by demographics, progress, report state, and report dates.",
      href: `${config.noderedUrl}/audit/view`,
      newWindow: true
    }
  ]);

  const softwareServices = document.getElementById("software-services");
  softwareServices.appendChild(createService("VPS label templates", `${config.noderedUrl}/labels/set/:caseId`, config.labelPrinterName || "Brother_QL_800"));
  softwareServices.appendChild(createService("Software hub", config.softwareHubUrl || `${config.noderedUrl}/software`, "Installers, update feed, and browser fallback"));
  softwareServices.appendChild(createService("Referral intake adapter", config.baserowUrl, "Referral intake via secure server tunnel"));

  const authStack = document.getElementById("auth-stack");
  authStack.appendChild(createDetail("Official lab email", "behringihcls@gmail.com", true));
  authStack.appendChild(createDetail("Login model", "Staff username, password, and verification code access.", false));
  authStack.appendChild(createDetail("Provisioning outcome", "Each provisioned user receives a lab login record, employee ID, and badge-ready identity record.", false));
  authStack.appendChild(createDetail("Current state", "Access records can be prepared here and connected to the login service when released.", false));

  document.getElementById("provision-user").addEventListener("click", provisionEmployee);
  document.getElementById("clear-provisioning").textContent = "Refresh Registry";
  document.getElementById("clear-provisioning").addEventListener("click", function () {
    renderRegistry();
    document.getElementById("provision-status").textContent = "Provisioned access registry refreshed from the VPS.";
  });
  window.addEventListener("behring:session-changed", function () {
    syncSignOut();
    setProvisioningVisibility();
    renderRegistry();
  });
  setProvisioningVisibility();
  renderRegistry();
  wireCaseSearch();
  wireHelpToggle();
})();
