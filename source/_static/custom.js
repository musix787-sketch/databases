(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  var resetScroll = function () {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  };
  resetScroll();
  window.addEventListener("pageshow", resetScroll);
})();
(function () {
  var STORAGE_KEY = "_globaltocScrollTop";
  var scrollEl = document.querySelector("#lside .sy-scrollbar");
  if (!scrollEl) return;
  var saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    scrollEl.scrollTop = parseInt(saved, 10) || 0;
  }

  var persist = function () {
    sessionStorage.setItem(STORAGE_KEY, String(scrollEl.scrollTop));
  };
  scrollEl.addEventListener("scroll", persist, { passive: true });
  window.addEventListener("pagehide", persist);
})();

(function () {
  var hasQuery = /(?:^|[?&])q=/.test(window.location.search);
  if (!hasQuery) return;
  var resultsRoot = document.getElementById("search-results");
  if (!resultsRoot) return;
  var MIN_SKELETON_MS = 3000;
  var startTime = Date.now();
  var revealed = false;
  resultsRoot.classList.add("is-skeletal");
  var skeleton = document.createElement("div");
  skeleton.className = "search-skeleton";
  for (var i = 0; i < 3; i++) {
    var card = document.createElement("div");
    card.className = "search-skeleton-card";
    for (var j = 0; j < 3; j++) {
      card.appendChild(document.createElement("div")).className = "skeleton-line";
    }
    skeleton.appendChild(card);
  }
  resultsRoot.appendChild(skeleton);

  var reveal = function () {
    if (revealed) return;
    revealed = true;
    resultsRoot.classList.remove("is-skeletal");
    skeleton.remove();
  };

  var showError = function () {
    if (revealed) return;
    revealed = true;
    resultsRoot.classList.remove("is-skeletal");
    skeleton.remove();
    var err = document.createElement("p");
    err.className = "search-error";
    err.textContent =
      "Something went wrong loading search results. Try reloading the page.";
    resultsRoot.appendChild(err);
  };

  var contentReady = false;
  var observer = new MutationObserver(function () {
    if (contentReady || resultsRoot.children.length <= 1) return;
    contentReady = true;
    observer.disconnect();
    var elapsed = Date.now() - startTime;
    var remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
    setTimeout(reveal, remaining);
  });
  observer.observe(resultsRoot, { childList: true });

  setTimeout(function () {
    if (!contentReady) showError();
  }, MIN_SKELETON_MS);
})();

document.addEventListener("DOMContentLoaded", function () {
  var toc = document.querySelector(".globaltoc");
  if (toc) {
    toc.querySelectorAll("li.toctree-l1").forEach(function (li) {
      if (li.classList.contains("current")) return;
      li.classList.remove("_expand");
      li.classList.add("_collapse");
      var btn = li.querySelector(":scope > button");
      var label = li.querySelector(":scope > a");
      if (btn && label) {
        btn.setAttribute("aria-label", "Expand " + label.textContent);
      }
    });
    toc.addEventListener("click", function (e) {
      var btn = e.target.closest("li > button");
      if (!btn) return;
      var li = btn.parentNode;
      var isExpanding = li.classList.contains("_collapse");
      if (!isExpanding) return;
      var parentUl = li.parentNode;
      Array.prototype.forEach.call(parentUl.children, function (sibling) {
        if (sibling !== li && sibling.classList && sibling.classList.contains("_expand")) {
          sibling.classList.remove("_expand");
          sibling.classList.add("_collapse");
          var sibBtn = sibling.querySelector(":scope > button");
          if (sibBtn) {
            var label = sibling.querySelector(":scope > a");
            if (sibBtn.setAttribute && label) {
              sibBtn.setAttribute("aria-label", "Expand " + label.textContent);
            }
          }
        }
      });
    }, true);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.documentElement.classList.add("js-lside-ready");
    });
  });

  var lsideToggle = document.querySelector(".js-lside-toggle");
  if (lsideToggle) {
    var syncLsideToggleLabel = function () {
      var collapsed = document.documentElement.classList.contains("sidebar-collapsed");
      lsideToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      lsideToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };
    syncLsideToggleLabel();
    lsideToggle.addEventListener("click", function () {
      var collapsed = document.documentElement.classList.toggle("sidebar-collapsed");
      localStorage._lsideCollapsed = collapsed ? "1" : "0";
      syncLsideToggleLabel();
    });
  }

  var lside = document.getElementById("lside");
  var resizeHandle = document.querySelector(".js-lside-resize");
  if (lside && resizeHandle) {
    var MIN_WIDTH = 200;
    var MAX_WIDTH = 480;
    var FLOOR_WIDTH = 72;
    var DEFAULT_WIDTH = 288;

    var startX = 0;
    var startWidth = 0;
    var dragWidth = 0;
    var dragging = false;

    var onPointerMove = function (e) {
      if (!dragging) return;
      var delta = e.clientX - startX;
      dragWidth = Math.max(FLOOR_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
      document.documentElement.style.setProperty("--lside-width", dragWidth + "px");
    };

    var onPointerUp = function () {
      if (!dragging) return;
      dragging = false;
      resizeHandle.classList.remove("is-dragging");
      document.body.classList.remove("is-resizing-lside");
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseup", onPointerUp);

      if (dragWidth < MIN_WIDTH) {

        document.documentElement.classList.add("sidebar-collapsed");
        localStorage._lsideCollapsed = "1";
        document.documentElement.style.setProperty("--lside-width", DEFAULT_WIDTH + "px");
        localStorage.removeItem("_lsideWidth");
        if (lsideToggle) syncLsideToggleLabel();
      } else {
        localStorage._lsideWidth = String(Math.round(dragWidth));
      }
    };

    resizeHandle.addEventListener("mousedown", function (e) {
      if (document.documentElement.classList.contains("sidebar-collapsed")) return;
      dragging = true;
      startX = e.clientX;
      startWidth = lside.getBoundingClientRect().width;
      dragWidth = startWidth;
      resizeHandle.classList.add("is-dragging");
      document.body.classList.add("is-resizing-lside");
      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("mouseup", onPointerUp);
      e.preventDefault();
    });

    resizeHandle.addEventListener("dblclick", function () {
      document.documentElement.style.setProperty("--lside-width", DEFAULT_WIDTH + "px");
      localStorage.removeItem("_lsideWidth");
    });
  }

  document.querySelectorAll("form.searchbox, form.searchform").forEach(function (form) {
    var input = form.querySelector('input[name="q"]');
    if (!input) return;

    var computedPosition = window.getComputedStyle(form).position;
    if (computedPosition === "static") {
      form.style.position = "relative";
    }

    var hint = document.createElement("div");
    hint.className = "search-empty-hint";
    hint.setAttribute("role", "alert");
    hint.innerHTML =
      '<svg class="search-empty-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<line x1="12" y1="8" x2="12" y2="13"></line>' +
      '<line x1="12" y1="16.5" x2="12" y2="16.51"></line>' +
      "</svg>" +
      '<span>Type something to search for, then press Enter.</span>';
    hint.hidden = true;
    form.appendChild(hint);

    var hideTimer = null;
    var showHint = function () {
      hint.hidden = false;
      input.classList.remove("input-shake");
      void input.offsetWidth;
      input.classList.add("input-shake");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { hint.hidden = true; }, 4000);
    };
    var hideHint = function () {
      hint.hidden = true;
      clearTimeout(hideTimer);
    };

    form.addEventListener("submit", function (e) {
      if (input.value.trim() === "") {
        e.preventDefault();
        showHint();
        input.focus();
      }
    });

    input.addEventListener("input", function () {
      if (input.value.trim() !== "") hideHint();
    });
  });

  var COPY_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  document.querySelectorAll("div.highlight").forEach(function (block) {
    if (block.querySelector(".custom-copybtn")) return;
    var pre = block.querySelector("pre");
    if (!pre) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "custom-copybtn";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = COPY_ICON;
    btn.addEventListener("click", function () {
      var clone = pre.cloneNode(true);
      clone.querySelectorAll(".linenos").forEach(function (n) { n.remove(); });
      var text = clone.textContent.replace(/\n$/, "");
      navigator.clipboard.writeText(text).then(function () {
        btn.innerHTML = CHECK_ICON;
        setTimeout(function () { btn.innerHTML = COPY_ICON; }, 1200);
      });
    });

    block.appendChild(btn);
  });

  var copyPageContent = document.getElementById("copy-page-content");
  if (copyPageContent) {
    copyPageContent.addEventListener("click", function () {
      var trigger = document.querySelector(
        '[aria-controls="copy-page-content"]'
      );
      copyPageContent.setAttribute("aria-hidden", "true");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      var expanded = (document.body.getAttribute("data-expanded") || "")
        .split(/\s+/)
        .filter(function (id) {
          return id && id !== "copy-page-content";
        });
      document.body.setAttribute("data-expanded", expanded.join(" "));
    });
  }

  var TABLE_BADGE_MAP = {
    "Strong": "green",
    "Tunable": "blue",
    "Eventual": "amber"
  };
  document.querySelectorAll(".yue table.docutils tbody td").forEach(function (td) {
    var el = td.querySelector(":scope > p") || td;
    if (el.children.length > 0) return;
    var text = el.textContent.trim();
    if (!Object.prototype.hasOwnProperty.call(TABLE_BADGE_MAP, text)) return;
    var span = document.createElement("span");
    span.className = "table-badge table-badge-" + TABLE_BADGE_MAP[text];
    span.textContent = text;
    el.textContent = "";
    el.appendChild(span);
  });

  var MODEL_ICONS = {
    "Relational": '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
    "Document": '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
    "Graph": '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 7l10-.5M6.5 8l4.7 8.3M17.5 8l-4.7 8.3"/></svg>',
    "Key-value": '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="15" r="4"/><path d="M10.2 11.8 20 2m0 0v4m0-4h-4"/><path d="m15.5 6.5 2.5 2.5"/></svg>',
    "Columnar": '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>'
  };
  document.querySelectorAll(".yue table.docutils tbody td").forEach(function (td) {
    var el = td.querySelector(":scope > p") || td;
    if (el.children.length > 0) return;
    var text = el.textContent.trim();
    if (!Object.prototype.hasOwnProperty.call(MODEL_ICONS, text)) return;
    var span = document.createElement("span");
    span.className = "table-model";
    span.innerHTML = MODEL_ICONS[text] + "<span>" + text + "</span>";
    el.textContent = "";
    el.appendChild(span);
  });

  document.querySelectorAll(".js-copy").forEach(function (btn) {
    if (btn.closest("div.highlight")) return;

    btn.addEventListener("click", function () {
      var icon = btn.querySelector("i");
      var article = document.querySelector("article.yue");
      if (!article) return;

      var clone = article.cloneNode(true);
      clone.querySelectorAll(".headerlink, .copybtn, .custom-copybtn, span.linenos, #copy-page-content")
        .forEach(function (n) { n.remove(); });

      var text = clone.innerText.replace(/\n{3,}/g, "\n\n").trim();

      navigator.clipboard.writeText(text).then(function () {
        if (icon) {
          icon.setAttribute("data-icon", "check");
          setTimeout(function () { icon.setAttribute("data-icon", "copy"); }, 1200);
        }
      }).catch(function (err) {
        console.error("Copy page failed:", err);
      });
    });
  });

  var jumpParams = new URLSearchParams(window.location.search);
  var jumpRaw = jumpParams.get("jump");
  if (jumpRaw !== null) {
    var target = jumpRaw.trim();

    var cleanJumpParam = function () {
      var url = new URL(window.location.href);
      url.searchParams.delete("jump");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    };

    var scrollToTextFragment = function () {
      if (!target) return;
      var root = document.querySelector('[role="main"]') || document.body;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

      var nodeEntries = [];
      var rawConcat = "";
      var node;
      while ((node = walker.nextNode())) {
        nodeEntries.push({ node: node, start: rawConcat.length });
        rawConcat += node.textContent;
      }

      var normalized = "";
      var rawIndexAt = [];
      var inWhitespace = false;
      for (var i = 0; i < rawConcat.length; i++) {
        var ch = rawConcat[i];
        if (/\s/.test(ch)) {
          if (!inWhitespace) {
            normalized += " ";
            rawIndexAt.push(i);
            inWhitespace = true;
          }
        } else {
          normalized += ch;
          rawIndexAt.push(i);
          inWhitespace = false;
        }
      }

      var needle = target.replace(/\s+/g, " ").trim().toLowerCase();
      var pos = normalized.toLowerCase().indexOf(needle);
      if (pos === -1 || needle.length === 0) return;

      var rawStart = rawIndexAt[pos];
      var rawEnd = rawIndexAt[pos + needle.length - 1] + 1;

      var startEntry, endEntry;
      for (var j = 0; j < nodeEntries.length; j++) {
        var entry = nodeEntries[j];
        var entryEnd = entry.start + entry.node.textContent.length;
        if (!startEntry && rawStart < entryEnd) startEntry = entry;
        if (rawEnd <= entryEnd) {
          endEntry = entry;
          break;
        }
      }
      if (!startEntry || !endEntry) return;

      var range = document.createRange();
      range.setStart(startEntry.node, rawStart - startEntry.start);
      range.setEnd(endEntry.node, rawEnd - endEntry.start);

      var rect = range.getBoundingClientRect();
      if (rect && (rect.top !== 0 || rect.bottom !== 0)) {
        window.scrollTo({
          top: window.scrollY + rect.top - window.innerHeight * 0.3,
          behavior: "smooth",
        });
      }

      try {
        var mark = document.createElement("mark");
        mark.className = "custom-text-fragment-highlight";
        range.surroundContents(mark);
      } catch (e) {

      }
    };

    if (document.readyState === "complete") {
      setTimeout(function () {
        scrollToTextFragment();
        cleanJumpParam();
      }, 80);
    } else {
      window.addEventListener("load", function () {
        setTimeout(function () {
          scrollToTextFragment();
          cleanJumpParam();
        }, 80);
      });
    }
  }

  var localtoc = document.querySelector(".localtoc");
  if (localtoc) {
    var setLocalTocActiveFromHash = function () {
      var hash = window.location.hash;
      if (!hash) return;

      var id = hash.replace(/^#/, "").split(":~:")[0];
      if (!id) return;
      var link;
      try {
        link = localtoc.querySelector('a[href="#' + CSS.escape(id) + '"]');
      } catch (e) {
        link = null;
      }
      if (!link) return;
      localtoc.querySelectorAll("li.active").forEach(function (li) {
        li.classList.remove("active");
      });
      link.parentNode.classList.add("active");
    };

    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      setTimeout(setLocalTocActiveFromHash, 0);
    });

    window.addEventListener("hashchange", setLocalTocActiveFromHash);

    if (window.location.hash) {
      setTimeout(setLocalTocActiveFromHash, 0);
    }
  }

});

(function () {
  var wrappers = Array.prototype.slice.call(
    document.querySelectorAll(".copy-page-wrapper")
  );
  if (!wrappers.length) return;

  wrappers.forEach(function (wrapper) {

    wrapper._cpOrigParent = wrapper.parentNode;
    wrapper._cpOrigNext = wrapper.nextElementSibling;
  });

  var mql = window.matchMedia("(max-width: 63.9375rem)");
  function unwrapHeaderRow(wrapper) {
    var row = wrapper._cpHeaderRow;
    if (!row) return;
    var h1 = row.querySelector("h1");
    if (h1) row.parentNode.insertBefore(h1, row);
    row.remove();
    wrapper._cpHeaderRow = null;
    if (wrapper._cpOrigNext && wrapper._cpOrigNext.parentNode) {
      wrapper._cpOrigParent.insertBefore(wrapper, wrapper._cpOrigNext);
    } else {
      wrapper._cpOrigParent.appendChild(wrapper);
    }
  }

  function place() {
    wrappers.forEach(function (wrapper) {
      var article = wrapper._cpOrigNext;
      if (!article) return;
      var section = article.querySelector("section");

      if (mql.matches) {
        unwrapHeaderRow(wrapper);
        var h1m = section && section.querySelector("h1");
        var descm = h1m && h1m.nextElementSibling;
        var canGoBelow = descm && descm.tagName === "P";
        var desc = descm;
        if (canGoBelow) {
          if (wrapper.previousElementSibling !== desc) {
            desc.insertAdjacentElement("afterend", wrapper);
            wrapper.classList.add("copy-page-wrapper--below-header");
          }
        } else if (wrapper.nextElementSibling !== article) {
          wrapper._cpOrigParent.insertBefore(wrapper, article);
          wrapper.classList.remove("copy-page-wrapper--below-header");
        }
      } else {
        var h1d = section && section.querySelector("h1");
        if (h1d) {
          wrapper.classList.remove("copy-page-wrapper--below-header");
          if (!wrapper._cpHeaderRow) {
            var row = document.createElement("div");
            row.className = "copy-page-header-row";
            h1d.parentNode.insertBefore(row, h1d);
            row.appendChild(h1d);
            row.appendChild(wrapper);
            wrapper._cpHeaderRow = row;
          }
        }
      }
    });
  }

  place();
  if (mql.addEventListener) {
    mql.addEventListener("change", place);
  } else if (mql.addListener) {
    mql.addListener(place);
  }
})();
(function () {
  var openScrollY = null;
  var THRESHOLD = 10;

  var closeOpenMenus = function () {
    var expanded = document.body.getAttribute("data-expanded") || "";
    var ids = expanded.trim() ? expanded.trim().split(/\s+/) : [];
    if (!ids.length) {
      openScrollY = null;
      return;
    }
    if (openScrollY === null) {
      openScrollY = window.scrollY;
      return;
    }
    if (Math.abs(window.scrollY - openScrollY) < THRESHOLD) return;
    document.body.setAttribute("data-expanded", "");
    ids.forEach(function (id) {
      var target = document.getElementById(id);
      if (target) target.setAttribute("aria-hidden", "true");
      var triggers = document.querySelectorAll('[aria-controls="' + id + '"]');
      for (var i = 0; i < triggers.length; i++) {
        triggers[i].setAttribute("aria-expanded", "false");
      }
    });
    openScrollY = null;
  };
  window.addEventListener("scroll", closeOpenMenus, { passive: true });
})();

(function () {
  var mq = window.matchMedia("(max-width: 767px)");

  var measure = function () {
    if (!mq.matches) {
      document.documentElement.style.removeProperty(
        "--sy-mobile-header-total-height"
      );
      return;
    }
    var head = document.querySelector(".sy-head");
    var crumbs = document.querySelector(".sy-breadcrumbs");
    var total = (head ? head.offsetHeight : 0) + (crumbs ? crumbs.offsetHeight : 0);
    if (total > 0) {
      document.documentElement.style.setProperty(
        "--sy-mobile-header-total-height",
        total + "px"
      );
    }
  };

  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
  if (mq.addEventListener) {
    mq.addEventListener("change", measure);
  } else if (mq.addListener) {
    mq.addListener(measure);
  }
})();