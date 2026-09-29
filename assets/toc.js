(function () {
  var STORAGE_KEY = "post-toc-open";
  var content = document.querySelector(".post-content");
  var nav = document.getElementById("post-toc-nav");
  var panel = document.getElementById("post-toc");
  var toggle = document.getElementById("post-toc-toggle");
  var closeBtn = document.getElementById("post-toc-close");

  if (!content || !nav || !panel || !toggle) return;

  var headings = Array.prototype.slice.call(
    content.querySelectorAll("h2, h3")
  );
  if (!headings.length) {
    toggle.hidden = true;
    return;
  }

  function slugify(text, index) {
    var base = text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u4e00-\u9fff\-]/g, "");
    return base || "section-" + (index + 1);
  }

  function ensureId(heading, index) {
    if (heading.id) return heading.id;
    var id = slugify(heading.textContent || "", index);
    var unique = id;
    var n = 2;
    while (document.getElementById(unique)) {
      unique = id + "-" + n;
      n += 1;
    }
    heading.id = unique;
    return unique;
  }

  var tree = [];
  var current = null;

  headings.forEach(function (heading, index) {
    var level = heading.tagName === "H2" ? 2 : 3;
    var item = {
      id: ensureId(heading, index),
      text: (heading.textContent || "").trim(),
      level: level,
      children: [],
    };

    if (level === 2) {
      tree.push(item);
      current = item;
      return;
    }

    if (!current) {
      tree.push(item);
      return;
    }

    current.children.push(item);
  });

  function renderItem(item) {
    var li = document.createElement("li");
    li.className = "post-toc__item post-toc__item--h" + item.level;

    var row = document.createElement("div");
    row.className = "post-toc__row";

    if (item.children.length) {
      var expander = document.createElement("button");
      expander.type = "button";
      expander.className = "post-toc__expander";
      expander.setAttribute("aria-expanded", "true");
      expander.setAttribute("aria-label", "展开或收起子目录");
      expander.textContent = "▾";
      expander.addEventListener("click", function (event) {
        event.preventDefault();
        var open = expander.getAttribute("aria-expanded") === "true";
        expander.setAttribute("aria-expanded", open ? "false" : "true");
        expander.textContent = open ? "▸" : "▾";
        li.classList.toggle("is-collapsed", open);
      });
      row.appendChild(expander);
    } else {
      var spacer = document.createElement("span");
      spacer.className = "post-toc__expander-spacer";
      row.appendChild(spacer);
    }

    var link = document.createElement("a");
    link.className = "post-toc__link";
    link.href = "#" + item.id;
    link.textContent = item.text;
    link.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 1100px)").matches) {
        setOpen(false);
      }
    });
    row.appendChild(link);
    li.appendChild(row);

    if (item.children.length) {
      var childList = document.createElement("ul");
      childList.className = "post-toc__list post-toc__list--nested";
      item.children.forEach(function (child) {
        childList.appendChild(renderItem(child));
      });
      li.appendChild(childList);
    }

    return li;
  }

  var root = document.createElement("ul");
  root.className = "post-toc__list";
  tree.forEach(function (item) {
    root.appendChild(renderItem(item));
  });
  nav.appendChild(root);

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("toc-open", open);
    try {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch (error) {}
  }

  function preferredOpen() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") return true;
      if (saved === "0") return false;
    } catch (error) {}
    return window.matchMedia("(min-width: 1101px)").matches;
  }

  toggle.addEventListener("click", function () {
    setOpen(!panel.classList.contains("is-open"));
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      setOpen(false);
    });
  }

  setOpen(preferredOpen());

  var links = Array.prototype.slice.call(nav.querySelectorAll(".post-toc__link"));
  var headingEls = headings;

  function syncActive() {
    var offset = 96;
    var currentId = headingEls[0] && headingEls[0].id;
    for (var i = 0; i < headingEls.length; i += 1) {
      var top = headingEls[i].getBoundingClientRect().top;
      if (top <= offset) currentId = headingEls[i].id;
      else break;
    }
    links.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + currentId;
      link.classList.toggle("is-active", active);
    });
  }

  window.addEventListener("scroll", syncActive, { passive: true });
  syncActive();
})();
