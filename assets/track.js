/* Anonymous interaction events for TelemetryDeck (self-hosted, cookie-free).
   The web SDK only auto-sends pageviews; this adds a few click signals.
   Segments are baked into the signal `type` so they always show in the
   dashboard; the same values are also attached as payload for good measure.
   No cookies, no IDs of our own, no personal data. */
(function () {
  "use strict";
  var APP_ID = "4B5CF27B-6DF2-4A83-ACFD-2FA0EE6E2CDA";
  var API = "https://nom.telemetrydeck.com/v2/w/";
  var isDev = location.protocol === "file:" ||
    /^(localhost|127(\.\d+){0,2}\.\d+|\[::1?\])$/.test(location.hostname);

  function send(type, extra) {
    try {
      var body = {
        appID: APP_ID,
        type: type,
        url: location.href,
        referrer: document.referrer,
        telemetryClientVersion: "WebSDK 1.1.0",
        locale: navigator.language
      };
      if (extra) for (var k in extra) if (extra[k] != null) body[k] = String(extra[k]);
      if (isDev) body.isTestMode = true; // keep local clicks out of real data
      // keepalive so the request still sends when a click navigates away
      fetch(API, {
        method: "POST", mode: "cors", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (e) { /* analytics must never break the page */ }
  }

  // Clicks: social links, the App Store badge, and tagged CTAs.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var social = t.closest(".social__link");
    if (social) {
      var platform = (social.getAttribute("aria-label") || "Unknown").replace(/\s+/g, "");
      send("Social.Click." + platform, { platform: platform });
      return;
    }

    if (t.closest(".appstore-badge")) { send("AppStore.Click"); return; }

    var cta = t.closest("[data-track-cta]");
    if (cta) {
      var label = cta.getAttribute("data-track-cta");
      send("CTA." + label, { cta: label });
    }
  }, true);

  // FAQ: which questions people open (fires only on open, not on close).
  var items = document.querySelectorAll("details.faq-item");
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener("toggle", function () {
      if (!this.open) return;
      var s = this.querySelector("summary");
      var q = s ? s.textContent.replace(/\s+/g, " ").trim() : "";
      send("FAQ.Open", { question: q });
    });
  }
})();
