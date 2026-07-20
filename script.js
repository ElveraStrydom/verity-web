/* Verity website — waitlist + nav. No dependencies, progressive-enhancement. */
(function () {
  "use strict";

  // --- Config: where the waitlist posts. ----------------------------------
  // Mirrors the livo-web pattern (a tiny email-capture endpoint on our own
  // VPS). Until Pierre wires the live URL, leave WAITLIST_ENDPOINT empty and
  // the form falls back to a mailto: so no signup is ever lost.
  var WAITLIST_ENDPOINT = ""; // e.g. "https://api.verity.app/signup"
  var FALLBACK_EMAIL = "hello@verity.app";

  // --- Year in footer -----------------------------------------------------
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // --- Mobile nav toggle --------------------------------------------------
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- Waitlist forms -----------------------------------------------------
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function wireForm(formId, inputId, msgId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var input = document.getElementById(inputId);
    var msg = document.getElementById(msgId);

    function say(text, state) {
      if (!msg) return;
      msg.textContent = text;
      msg.setAttribute("data-state", state);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();

      if (!isEmail(email)) {
        say("Please enter a valid email address.", "err");
        input.focus();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say("Adding you to the list…", "");

      if (!WAITLIST_ENDPOINT) {
        // No backend yet — hand off to the user's mail client so the signup
        // still reaches us. Remove once WAITLIST_ENDPOINT is set.
        say("Almost there — your email app will open to confirm. Thank you!", "ok");
        window.location.href =
          "mailto:" + FALLBACK_EMAIL +
          "?subject=" + encodeURIComponent("Join the Verity waitlist") +
          "&body=" + encodeURIComponent("Please add me to the Verity waitlist: " + email);
        if (btn) btn.disabled = false;
        form.reset();
        return;
      }

      fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: "website" })
      })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status " + r.status);
          say("You're on the list — we'll be in touch. 🌿", "ok");
          form.reset();
        })
        .catch(function () {
          say(
            "Something went wrong. Please email " + FALLBACK_EMAIL + " and we'll add you.",
            "err"
          );
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  wireForm("waitlistTop", "emailTop", "msgTop");
  wireForm("waitlistBottom", "emailBottom", "msgBottom");

  // --- "Coming soon" store badges -----------------------------------------
  // The apps aren't published yet, so the App Store / Google Play badges send
  // the user to the nearest waitlist form (the hero one) and focus the email
  // field, converting store intent into a signup with minimal travel. The
  // href="#waitlistTop" is the no-JS fallback. Swap these for real store URLs
  // once the apps ship (WS13/WS14) and remove this handler.
  var badges = document.querySelectorAll("[data-waitlist]");
  var emailTop = document.getElementById("emailTop");
  Array.prototype.forEach.call(badges, function (badge) {
    badge.addEventListener("click", function (e) {
      if (!emailTop) return; // fall back to the anchor jump
      e.preventDefault();
      emailTop.scrollIntoView({ behavior: "smooth", block: "center" });
      emailTop.focus({ preventScroll: true });
      emailTop.classList.add("field--pulse");
      setTimeout(function () { emailTop.classList.remove("field--pulse"); }, 1200);
    });
  });
})();
