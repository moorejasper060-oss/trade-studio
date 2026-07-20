(() => {
  "use strict";

  const state = { revealObserver: null, scrollFrame: 0, lastFocus: null };
  const body = document.body;
  const progress = document.querySelector(".scroll-meter span");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function animateNumber(element, target) {
    const value = Math.max(0, Number(target) || 0);
    if (reducedMotion.matches) {
      element.textContent = `${value.toLocaleString("en-US")}+`;
      return;
    }
    const started = performance.now();
    const duration = 850;
    function frame(now) {
      const position = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - position, 3);
      element.textContent = `${Math.round(value * eased).toLocaleString("en-US")}+`;
      if (position < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setInstallerCount(count) {
    document.querySelectorAll(".js-users").forEach((element) => animateNumber(element, count));
  }

  function revealItem(item) {
    if (item.classList.contains("in-view")) return;
    item.classList.add("in-view");
  }

  function revealVisibleItems() {
    document.querySelectorAll("[data-reveal]:not(.in-view)").forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < innerHeight * .92 && rect.bottom > 0) revealItem(item);
    });
  }

  function revealFragmentTarget(align = false) {
    const fragment = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    const target = fragment ? document.getElementById(fragment) : null;
    if (!target) return;
    if (target.matches("[data-reveal]")) revealItem(target);
    target.querySelectorAll("[data-reveal]").forEach(revealItem);
    if (align) target.scrollIntoView({ behavior: "auto", block: "start" });
  }

  function setupReveals() {
    const items = [...document.querySelectorAll("[data-reveal]")];
    items.forEach((item) => {
      const siblings = item.parentElement
        ? [...item.parentElement.children].filter((child) => child.hasAttribute("data-reveal"))
        : [];
      item.style.setProperty("--delay", `${Math.min(Math.max(siblings.indexOf(item), 0) * 55, 250)}ms`);
    });

    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      state.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealItem(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -9%", threshold: .11 });
      items.forEach((item) => state.revealObserver.observe(item));
    } else {
      items.forEach(revealItem);
    }

    body.classList.add("motion-ready");
    revealFragmentTarget();
    revealVisibleItems();
  }

  function updateScrollEffects() {
    state.scrollFrame = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${total > 0 ? Math.min(scrollY / total, 1) : 0})`;

    if (!reducedMotion.matches) {
      document.querySelectorAll('[data-art="hero"]').forEach((image, index) => {
        image.style.setProperty("--art-shift", `${Math.min(scrollY * (index ? .025 : .055), 65)}px`);
      });
      document.querySelectorAll('[data-art="detail"]').forEach((image) => {
        image.style.setProperty("--art-shift", `${Math.min(scrollY * .018, 32)}px`);
      });
    }
    revealVisibleItems();
  }

  function queueScrollEffects() {
    if (state.scrollFrame) return;
    state.scrollFrame = requestAnimationFrame(updateScrollEffects);
  }

  function setupNavigation() {
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, { rootMargin: "-26% 0px -62%", threshold: [0, .12, .35] });
    document.querySelectorAll("[data-section][id]").forEach((section) => observer.observe(section));
  }

  function setupFaqs() {
    document.querySelectorAll("[data-faq]").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        document.querySelectorAll("[data-faq][open]").forEach((other) => {
          if (other !== details) other.open = false;
        });
      });
    });
  }

  function setupCopyButtons() {
    document.querySelectorAll("[data-copy-command]").forEach((button) => {
      button.addEventListener("click", async () => {
        const code = button.previousElementSibling;
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = "Copied";
        } catch {
          const selection = getSelection();
          const range = document.createRange();
          range.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = "Selected";
        }
        setTimeout(() => { button.textContent = "Copy"; }, 1700);
      });
    });
  }

  function setupSupportForm() {
    const form = document.getElementById("sup-form");
    if (!form) return;
    const button = document.getElementById("sup-btn");
    const status = document.getElementById("sup-status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      button.disabled = true;
      button.textContent = "Sending…";
      form.setAttribute("aria-busy", "true");
      status.textContent = "";

      try {
        const response = await fetch("https://trade-studio-support.tradestudio.workers.dev/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: document.getElementById("sup-msg").value,
            contact: document.getElementById("sup-contact").value,
            website: document.getElementById("sup-hp").value,
            diag: `via website · ${navigator.userAgent}`
          })
        });
        const data = await response.json();
        if (response.ok && data && data.ok) {
          button.textContent = "Sent — thank you";
          document.getElementById("sup-msg").value = "";
          document.getElementById("sup-contact").value = "";
          status.textContent = "Your report reached the developer.";
        } else {
          throw new Error(data && data.error === "rate_limited" ? "rate_limited" : "send_failed");
        }
      } catch (error) {
        button.disabled = false;
        button.textContent = "Send report";
        status.textContent = error.message === "rate_limited"
          ? "Too many reports from this connection. Try again later."
          : "Could not send. Please use the GitHub option.";
      } finally {
        form.removeAttribute("aria-busy");
      }
    });
  }

  function setupMacModal() {
    const modal = document.getElementById("mac-modal");
    if (!modal) return;
    const closeButton = modal.querySelector(".mac-modal-close");
    const okayButton = modal.querySelector(".mac-modal-ok");

    function openModal() {
      state.lastFocus = document.activeElement;
      modal.hidden = false;
      body.classList.add("modal-open");
      closeButton.focus();
    }

    function closeModal() {
      modal.hidden = true;
      body.classList.remove("modal-open");
      if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
    }

    document.querySelectorAll('a[href$="TradeStudio.dmg"]').forEach((link) => {
      link.addEventListener("click", () => setTimeout(openModal, 320));
    });
    closeButton.addEventListener("click", closeModal);
    okayButton.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
      if (event.key === "Tab" && !modal.hidden) {
        const controls = [...modal.querySelectorAll("button, a, input, [tabindex]:not([tabindex='-1'])")];
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function applyReleaseData(data) {
    if (data.version) {
      document.querySelectorAll(".js-ver").forEach((element) => { element.textContent = data.version; });
    }
    if (data.count > 0) setInstallerCount(data.count);
  }

  async function syncReleaseData() {
    const cacheKey = "trade-studio-release-data";
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached && Date.now() - cached.savedAt < 15 * 60 * 1000) {
        applyReleaseData(cached);
        return;
      }
    } catch {}

    try {
      const response = await fetch("https://api.github.com/repos/moorejasper060-oss/trade-studio/releases?per_page=100", {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!response.ok) return;
      const releases = await response.json();
      const latest = releases.find((release) => !release.draft && !release.prerelease);
      const count = releases.reduce((total, release) => {
        return total + (release.assets || []).reduce((assetTotal, asset) => {
          return /\.(dmg|exe)$/i.test(asset.name || "") ? assetTotal + (asset.download_count || 0) : assetTotal;
        }, 0);
      }, 0);
      const data = {
        version: latest && latest.tag_name ? `v${latest.tag_name.replace(/^v/, "")}` : "",
        count,
        savedAt: Date.now()
      };
      applyReleaseData(data);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch {}
  }

  function init() {
    setupReveals();
    setupNavigation();
    setupFaqs();
    setupCopyButtons();
    setupSupportForm();
    setupMacModal();
    setInstallerCount(168);
    syncReleaseData();
    updateScrollEffects();

    addEventListener("scroll", queueScrollEffects, { passive: true });
    addEventListener("resize", queueScrollEffects);
    addEventListener("pageshow", () => requestAnimationFrame(() => {
      revealFragmentTarget(true);
      revealVisibleItems();
    }));
    addEventListener("hashchange", () => requestAnimationFrame(() => {
      revealFragmentTarget(true);
      revealVisibleItems();
    }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
