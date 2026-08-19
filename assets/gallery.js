/* Neon Landing media gallery: App Store style.
   - inline video autoplays muted only when scrolled into view
   - arrows scroll the strip; click any item to open the lightbox
   - lightbox has prev/next arrows, keyboard nav, and plays the video
     unmuted from the start */
(function () {
  "use strict";
  var gallery = document.querySelector(".neon-gallery");
  var lb = document.getElementById("lightbox");
  if (!gallery || !lb) return;

  var track = gallery.querySelector(".gallery__track");
  var buttons = Array.prototype.slice.call(gallery.querySelectorAll(".media-btn"));
  if (!buttons.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var media = buttons.map(function (b) {
    return { type: b.dataset.type, src: b.dataset.src, poster: b.dataset.poster || "", alt: b.dataset.alt || "" };
  });

  var lbOpen = false;

  // ---------- inline video: muted autoplay when scrolled into view ----------
  var inlineVideo = gallery.querySelector(".gallery__video");
  if (inlineVideo && !reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (lbOpen) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          var p = inlineVideo.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          inlineVideo.pause();
        }
      });
    }, { threshold: [0, 0.5, 1] });
    vio.observe(inlineVideo);
  }

  // ---------- strip arrows ----------
  var prevArrow = gallery.querySelector(".gallery__arrow--prev");
  var nextArrow = gallery.querySelector(".gallery__arrow--next");
  function step() {
    var li = track.querySelector(".gallery__item");
    var gap = parseFloat(getComputedStyle(track).gap) || 16;
    return li ? li.getBoundingClientRect().width + gap : 320;
  }
  function updateArrows() {
    if (!prevArrow || !nextArrow) return;
    var max = track.scrollWidth - track.clientWidth - 2;
    prevArrow.disabled = track.scrollLeft <= 2;
    nextArrow.disabled = track.scrollLeft >= max;
  }
  if (prevArrow) prevArrow.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
  if (nextArrow) nextArrow.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
  track.addEventListener("scroll", function () { window.requestAnimationFrame(updateArrows); }, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();

  // ---------- lightbox ----------
  var stage = document.getElementById("lightbox-stage");
  var closeBtn = lb.querySelector(".lightbox__close");
  var lbPrev = lb.querySelector(".lightbox__arrow--prev");
  var lbNext = lb.querySelector(".lightbox__arrow--next");
  var idxEl = document.getElementById("lb-index");
  var totalEl = document.getElementById("lb-total");
  var current = 0;
  var lastFocus = null;
  if (totalEl) totalEl.textContent = media.length;

  function render() {
    stage.innerHTML = "";
    var m = media[current];
    if (m.type === "video") {
      var v = document.createElement("video");
      v.src = m.src;
      if (m.poster) v.poster = m.poster;
      v.controls = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.preload = "auto";
      v.muted = false;         // unmuted in the lightbox
      stage.appendChild(v);
      v.currentTime = 0;       // start over
      var p = v.play();        // opened by a click, so sound is allowed
      if (p && p.catch) p.catch(function () {});
    } else {
      var img = document.createElement("img");
      img.src = m.src;
      img.alt = m.alt;
      stage.appendChild(img);
    }
    if (idxEl) idxEl.textContent = current + 1;
  }

  function open(i) {
    current = i;
    lbOpen = true;
    lastFocus = document.activeElement;
    if (inlineVideo) inlineVideo.pause();
    lb.hidden = false;
    document.body.classList.add("lightbox-open");
    render();
    if (closeBtn) closeBtn.focus();
    document.addEventListener("keydown", onKey);
  }
  function close() {
    lbOpen = false;
    var v = stage.querySelector("video");
    if (v) v.pause();
    stage.innerHTML = "";
    lb.hidden = true;
    document.body.classList.remove("lightbox-open");
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    // the inline video's observer resumes muted playback when it is in view
  }
  function go(delta) {
    current = (current + delta + media.length) % media.length;
    render();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  }

  buttons.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (lbPrev) lbPrev.addEventListener("click", function () { go(-1); });
  if (lbNext) lbNext.addEventListener("click", function () { go(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
})();
