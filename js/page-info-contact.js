/**
 * Contact form demo — shows a thank-you message (no server).
 */
(function () {
  var form = document.getElementById("info-contact-form");
  if (!form || form.getAttribute("data-info-contact-bound") === "1") return;
  form.setAttribute("data-info-contact-bound", "1");

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var status = document.getElementById("info-contact-status");
    if (status) {
      status.hidden = false;
      status.textContent =
        "Thanks — your message was recorded for this demo. In production, connect this form to your email or CRM.";
    }
    form.reset();
  });
})();
