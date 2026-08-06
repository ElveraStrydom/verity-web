/* Verity website — waitlist + nav. No dependencies, progressive-enhancement. */
(function () {
  "use strict";

  // --- Config: where the waitlist posts. ----------------------------------
  // Cloudflare Worker (Resend): stores in KV + sends branded confirmation from
  // hello@veritywomen.com. Team notify also goes to hello@ (Email Routing → Gmail).
  var WAITLIST_ENDPOINT = "https://waitlist.veritywomen.com/signup";
  var FALLBACK_EMAIL = "hello@veritywomen.com";

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
    var defaultBtnLabel = "Join the waitlist";

    function say(text, state) {
      if (!msg) return;
      msg.textContent = text;
      msg.setAttribute("data-state", state || "");
      // Scroll status into view so it isn't missed below the fold / keyboard
      try {
        msg.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) { /* ignore */ }
    }

    function setButton(btn, label, disabled) {
      if (!btn) return;
      btn.textContent = label;
      btn.disabled = !!disabled;
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
      setButton(btn, "Adding you…", true);
      say("Adding you to the list…", "pending");

      if (!WAITLIST_ENDPOINT) {
        say("Almost there — your email app will open to confirm. Thank you!", "ok");
        window.location.href =
          "mailto:" + FALLBACK_EMAIL +
          "?subject=" + encodeURIComponent("Join the Verity waitlist") +
          "&body=" + encodeURIComponent("Please add me to the Verity waitlist: " + email);
        setButton(btn, defaultBtnLabel, false);
        return;
      }

      fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ email: email, source: "website" })
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error((data && data.error) || "bad status " + r.status);
            return data;
          });
        })
        .then(function (data) {
          if (data && data.already) {
            say(
              "You're already on the waitlist — we'll email you at launch. No need to join again.",
              "ok"
            );
            setButton(btn, "Already on the list", false);
          } else if (data && data.confirmationFailed) {
            say(
              "You're on the list — we saved your email. The confirmation email may be delayed; check spam or write to " +
                FALLBACK_EMAIL +
                " if you need a hand.",
              "ok"
            );
            setButton(btn, "You're on the list ✓", false);
          } else {
            say(
              "You're on the list. Check your inbox for a note from hello@veritywomen.com (and spam, just in case).",
              "ok"
            );
            setButton(btn, "You're on the list ✓", false);
          }
          // Keep the email in the field so she can see what was captured
          input.value = email;
          input.readOnly = true;
        })
        .catch(function () {
          say(
            "Something went wrong. Please email " + FALLBACK_EMAIL + " and we'll add you.",
            "err"
          );
          setButton(btn, defaultBtnLabel, false);
          input.readOnly = false;
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
