/**
 * Footer + home "Stay in the Loop" newsletter signup (demo).
 * Saves email to localStorage and shows a confirmation — no backend.
 * Works with footer injected later (event delegation on document).
 */
(function () {
  var STORAGE_KEY = "ll-studio-newsletter-emails-v1";

  function normalizeEmail(v) {
    return String(v || "").trim().toLowerCase();
  }

  function loadList() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = JSON.parse(raw || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveEmail(email) {
    var norm = normalizeEmail(email);
    if (!norm) return { duplicate: false, added: false };
    var list = loadList();
    if (list.indexOf(norm) !== -1) return { duplicate: true, added: false };
    list.push(norm);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* quota or private mode */
    }
    return { duplicate: false, added: true };
  }

  function clearFooterStatus(form) {
    form.querySelectorAll(".jc-footer-newsletter-status").forEach(function (n) {
      n.remove();
    });
  }

  function showFooterSuccess(form, duplicate) {
    clearFooterStatus(form);
    var row = form.querySelector(".jc-footer-newsletter-row");
    var p = document.createElement("p");
    p.className = "jc-footer-newsletter-status";
    p.setAttribute("role", "status");
    p.textContent = duplicate
      ? "You're already on the list. Thanks for being here."
      : "Thanks — you're on the list. We'll email you when there's news. (Demo: stored in this browser only.)";
    form.appendChild(p);
    if (row) row.style.display = "none";
  }

  function showRxSignupSuccess(form, duplicate) {
    var p = document.createElement("p");
    p.className = "rx-signup-status";
    p.setAttribute("role", "status");
    p.textContent = duplicate
      ? "You're already subscribed with that address."
      : "Thanks for subscribing. Check your inbox soon. (Demo: stored in this browser only.)";
    form.replaceWith(p);
  }

  document.addEventListener("submit", function (ev) {
    var form = ev.target;
    if (!form || form.tagName !== "FORM") return;

    if (form.classList.contains("jc-footer-newsletter")) {
      ev.preventDefault();
      var input =
        form.querySelector('input[type="email"]') ||
        form.querySelector('input[name="email"]');
      if (!input) return;
      if (!form.reportValidity()) return;
      var email = input.value;
      var res = saveEmail(email);
      showFooterSuccess(form, res.duplicate);
      return;
    }

    if (form.classList.contains("rx-signup-form")) {
      ev.preventDefault();
      var inp = form.querySelector('input[type="email"]');
      if (!inp) return;
      if (!form.reportValidity()) return;
      var em = inp.value;
      var r = saveEmail(em);
      showRxSignupSuccess(form, r.duplicate);
    }
  });
})();
