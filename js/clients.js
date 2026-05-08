(function () {
  var CLIENT_PREFIX = "__client__:";
  var listEl = document.getElementById("client-cards");
  if (!listEl) return;
  var countEl = document.getElementById("clients-count");
  var labelEl = document.getElementById("clients-label");
  var clientsCache = 0;

  function isClientTitle(title) {
    return typeof title === "string" && title.indexOf(CLIENT_PREFIX) === 0;
  }

  function decodeClientTitle(title) {
    return isClientTitle(title) ? title.slice(CLIENT_PREFIX.length) : title;
  }

  function currentLang() {
    try {
      var v = localStorage.getItem("site_lang");
      return v === "en" ? "en" : "ru";
    } catch (e) {
      return "ru";
    }
  }

  function clientsLabel(lang, count) {
    if (lang === "en") return count === 1 ? "client" : "clients";
    if (count % 10 === 1 && count % 100 !== 11) return "клиент";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14))
      return "клиента";
    return "клиентов";
  }

  function refreshCountLabel() {
    if (labelEl) labelEl.textContent = clientsLabel(currentLang(), clientsCache);
  }

  function animateNumber(el, from, to, duration) {
    if (!el) return;
    if (from === to) {
      el.textContent = String(to);
      return;
    }
    var start = 0;
    var diff = to - from;
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min(1, (ts - start) / duration);
      var value = Math.round(from + diff * easeOutCubic(progress));
      el.textContent = String(value);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function showHint(text, isError) {
    listEl.innerHTML =
      '<p class="state-msg' + (isError ? " state-msg--error" : "") + '">' +
      text +
      "</p>";
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderCard(item, idx) {
    var rawTitle = decodeClientTitle(item.title) || "";
    var title = rawTitle || "Клиент";
    var img = (item.work_images || [])[0];
    if (!img || !img.public_url) return null;

    var card = document.createElement("article");
    card.className = "client-card";
    card.style.setProperty("--i", String(Math.min(idx, 12)));

    var media = document.createElement("div");
    media.className = "client-card__media";

    var image = document.createElement("img");
    image.src = img.public_url;
    image.alt = title;
    image.loading = "lazy";
    media.appendChild(image);

    var overlay = document.createElement("div");
    overlay.className = "client-card__overlay";
    overlay.innerHTML =
      '<h3 class="client-card__title">' +
      escapeHtml(title) +
      "</h3>";
    media.appendChild(overlay);

    card.appendChild(media);
    return card;
  }

  async function load() {
    var client = window.portfolioSupabase && window.portfolioSupabase.getClient();
    if (!client) {
      showHint("Добавьте js/config.js для загрузки клиентов.", true);
      return;
    }

    showHint("Загрузка клиентов…", false);

    var res = await client
      .from("works")
      .select("id,title,display_order,created_at,work_images(public_url,sort_order)")
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (res.error) {
      showHint("Ошибка загрузки: " + res.error.message, true);
      return;
    }

    var rows = (res.data || []).filter(function (row) {
      return isClientTitle(row.title || "");
    });

    clientsCache = rows.length;
    refreshCountLabel();
    if (countEl) {
      countEl.textContent = "0";
      setTimeout(function () {
        animateNumber(countEl, 0, clientsCache, 1400);
      }, 700);
    }

    listEl.innerHTML = "";

    if (!rows.length) {
      var empty = document.createElement("p");
      empty.className = "clients-empty";
      empty.textContent = "Пока пусто. Добавь первого клиента в админ-панели.";
      listEl.appendChild(empty);
      return;
    }

    rows.forEach(function (row, idx) {
      row.work_images = (row.work_images || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      var card = renderCard(row, idx);
      if (card) listEl.appendChild(card);
    });
  }

  load();
  window.addEventListener("site-lang-changed", refreshCountLabel);
})();
