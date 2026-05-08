/**
 * Главная: загрузка работ и masonry-отрисовка.
 */
(function () {
  var CLIENT_PREFIX = "__client__:";
  var masonryEl = document.getElementById("masonry");
  if (!masonryEl) return;
  var heroRailEl = document.getElementById("home-hero-rail-track");
  var heroImgEls = [
    document.getElementById("hero-card-1"),
    document.getElementById("hero-card-2"),
    document.getElementById("hero-card-3"),
  ];
  var worksCountEl = document.getElementById("home-works-count");
  var worksLabelEl = document.getElementById("home-works-label");
  var HERO_MIN_RATIO = 1.2;
  var heroTickerRaf = 0;
  var worksCountCache = 0;

  function currentLang() {
    try {
      var v = localStorage.getItem("site_lang");
      return v === "en" ? "en" : "ru";
    } catch (e) {
      return "ru";
    }
  }

  function countLabel(lang, count) {
    if (lang === "en") return count === 1 ? "selected work" : "selected works";
    if (count % 10 === 1 && count % 100 !== 11) return "выбранная работа";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14))
      return "выбранные работы";
    return "выбранных работ";
  }

  function refreshCountLabel() {
    if (!worksLabelEl) return;
    worksLabelEl.textContent = countLabel(currentLang(), worksCountCache);
  }

  function isClientTitle(title) {
    return typeof title === "string" && title.indexOf(CLIENT_PREFIX) === 0;
  }

  function showMessage(text, isError) {
    masonryEl.innerHTML =
      '<p class="state-msg' + (isError ? " state-msg--error" : "") + '">' +
      text +
      "</p>";
    masonryEl.removeAttribute("aria-busy");
    masonryEl.removeAttribute("aria-label");
  }

  /** Плейсхолдеры-серые карточки пока данные с сервера (вместо слова «Загрузка»). */
  function showSkeletonPlaceholders() {
    var heightsPx = [
      200, 148, 272, 186, 320, 160, 234, 255, 170, 290, 138, 210,
    ];
    masonryEl.textContent = "";
    masonryEl.setAttribute("aria-busy", "true");
    masonryEl.setAttribute("aria-label", "Загрузка работ");

    heightsPx.forEach(function (h, idx) {
      var wrap = document.createElement("article");
      wrap.className = "pin-card pin-card--skeleton";
      wrap.setAttribute("aria-hidden", "true");

      var media = document.createElement("div");
      media.className = "pin-card__media";

      var isPack = idx % 5 === 2;
      if (isPack) {
        var pack = document.createElement("div");
        pack.className = "pin-card__pack pin-card__pack--grid pin-skeleton-pack";
        for (var c = 0; c < 4; c++) {
          var cell = document.createElement("div");
          cell.className = "pin-shimmer pin-skeleton-cell";
          pack.appendChild(cell);
        }
        media.appendChild(pack);
      } else {
        var skImg = document.createElement("div");
        skImg.className = "pin-shimmer pin-skeleton-img";
        skImg.style.minHeight = h + "px";
        media.appendChild(skImg);
      }

      var meta = document.createElement("div");
      meta.className = "pin-card__meta pin-card__meta--skeleton";
      meta.innerHTML =
        '<span class="pin-shimmer pin-skeleton-line"></span>' +
        '<span class="pin-shimmer pin-skeleton-line pin-skeleton-line--short"></span>';

      wrap.appendChild(media);
      wrap.appendChild(meta);
      masonryEl.appendChild(wrap);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderCard(work, images) {
    var title = work.title || "Без названия";
    var type = work.item_type || "single";
    var wrap = document.createElement("article");
    wrap.className = "pin-card";

    var media = document.createElement("div");
    media.className = "pin-card__media";

    if (type === "pack" && images.length >= 2) {
      var pack = document.createElement("div");
      pack.className = "pin-card__pack pin-card__pack--grid";
      var n = images.length;
      if (n === 3) pack.classList.add("pack-3");
      images.forEach(function (row) {
        var im = document.createElement("img");
        im.src = row.public_url;
        im.alt = title;
        im.loading = "lazy";
        pack.appendChild(im);
      });
      media.appendChild(pack);
    } else if (images[0]) {
      var single = document.createElement("img");
      single.src = images[0].public_url;
      single.alt = title;
      single.loading = "lazy";
      media.appendChild(single);
    }

    var meta = document.createElement("div");
    meta.className = "pin-card__meta";
    meta.innerHTML =
      '<p class="pin-card__title">' +
      escapeHtml(title) +
      '</p><span class="pin-card__dots" aria-hidden="true">…</span>';

    wrap.appendChild(media);
    wrap.appendChild(meta);
    return wrap;
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
      var eased = easeOutCubic(progress);
      var value = Math.round(from + diff * eased);
      el.textContent = String(value);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupHero(rows) {
    if (!worksCountEl && !worksLabelEl) return;
    worksCountCache = rows.length;
    if (worksCountEl) {
      worksCountEl.textContent = "0";
      // Чип появляется по CSS-анимации только к ~1.4s, отсчёт стартуем уже на видимом чипе.
      setTimeout(function () {
        animateNumber(worksCountEl, 0, worksCountCache, 1700);
      }, 1500);
    }
    refreshCountLabel();
  }

  function shuffle(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i];
      out[i] = out[j];
      out[j] = t;
    }
    return out;
  }

  function getImageRatio(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = "async";
      img.onload = function () {
        if (!img.naturalWidth || !img.naturalHeight) {
          resolve(0);
          return;
        }
        resolve(img.naturalWidth / img.naturalHeight);
      };
      img.onerror = function () {
        resolve(0);
      };
      img.src = src;
    });
  }

  async function fillHeroImages(rows) {
    if (!heroRailEl && !heroImgEls.some(Boolean)) return;
    var urls = [];
    rows.forEach(function (work) {
      var imgs = (work.work_images || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      if (imgs[0] && imgs[0].public_url) {
        urls.push({
          src: imgs[0].public_url,
          title: work.title || "work",
        });
      }
    });
    urls = shuffle(urls);

    var selected = [];
    for (var i = 0; i < urls.length; i++) {
      var ratio = await getImageRatio(urls[i].src);
      if (ratio >= HERO_MIN_RATIO) selected.push(urls[i]);
    }
    if (selected.length < 3) {
      for (var j = 0; j < urls.length && selected.length < 3; j++) {
        if (selected.indexOf(urls[j]) === -1) selected.push(urls[j]);
      }
    }

    if (heroRailEl && selected.length) {
      buildHeroRail(selected);
      return;
    }

    heroImgEls.forEach(function (el, idx) {
      if (!el || !selected[idx]) return;
      el.src = selected[idx].src;
      el.alt = "";
    });
  }

  function buildHeroRail(items) {
    if (!heroRailEl) return;
    if (heroTickerRaf) cancelAnimationFrame(heroTickerRaf);
    heroRailEl.innerHTML = "";

    function createCard(item) {
      var card = document.createElement("div");
      card.className = "home-hero__shot";
      var image = document.createElement("img");
      image.className = "home-hero__shot-img";
      image.src = item.src;
      image.alt = item.title || "";
      image.loading = "lazy";
      card.appendChild(image);
      return card;
    }

    items.forEach(function (item) {
      heroRailEl.appendChild(createCard(item));
    });

    // Duplicate sequence to make seamless loop with no visible gap.
    items.forEach(function (item) {
      heroRailEl.appendChild(createCard(item));
    });

    startHeroTicker();
  }

  function startHeroTicker() {
    if (!heroRailEl || heroRailEl.children.length < 2) return;
    var fullWidth = heroRailEl.scrollWidth;
    var loopWidth = fullWidth / 2;
    if (!loopWidth) return;
    // Start from random in-loop position so refresh doesn't start "from edge".
    var offset = Math.random() * loopWidth;
    var lastTs = 0;
    var speed = 74; // px/s

    function frame(ts) {
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      offset += speed * dt;
      if (offset >= loopWidth) offset -= loopWidth;
      heroRailEl.style.transform = "translateX(" + -offset + "px)";
      heroTickerRaf = requestAnimationFrame(frame);
    }

    heroTickerRaf = requestAnimationFrame(frame);
  }

  async function load() {
    var client = window.portfolioSupabase && window.portfolioSupabase.getClient();
    if (!client) {
      showMessage(
        "Добавьте файл js/config.js (скопируйте из js/config.example.js) и укажите Supabase URL и anon key.",
        true
      );
      return;
    }

    showSkeletonPlaceholders();

    var res = await client
      .from("works")
      .select("id,title,item_type,display_order,created_at,work_images(id,public_url,sort_order)")
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (res.error) {
      showMessage("Ошибка загрузки: " + res.error.message + ". Проверьте таблицы и RLS в Supabase.", true);
      return;
    }

    var rows = (res.data || []).filter(function (row) {
      return !isClientTitle(row.title || "");
    });
    setupHero(rows);
    await fillHeroImages(rows);
    masonryEl.innerHTML = "";
    masonryEl.removeAttribute("aria-busy");
    masonryEl.removeAttribute("aria-label");

    if (rows.length === 0) {
      showMessage("Пока нет работ. Зайдите в «Админ» и добавьте первую.", false);
      return;
    }

    var visibleIdx = 0;
    rows.forEach(function (work) {
      var imgs = (work.work_images || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      if (!imgs.length) return;
      var card = renderCard(work, imgs);
      card.style.setProperty("--i", String(Math.min(visibleIdx, 14)));
      visibleIdx++;
      masonryEl.appendChild(card);
    });
  }

  load();
  window.addEventListener("site-lang-changed", refreshCountLabel);
})();
