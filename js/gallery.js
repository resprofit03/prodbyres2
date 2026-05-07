/**
 * Главная: загрузка работ и masonry-отрисовка.
 */
(function () {
  var masonryEl = document.getElementById("masonry");
  if (!masonryEl) return;

  function showMessage(text, isError) {
    masonryEl.innerHTML =
      '<p class="state-msg' + (isError ? " state-msg--error" : "") + '">' +
      text +
      "</p>";
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

  async function load() {
    var client = window.portfolioSupabase && window.portfolioSupabase.getClient();
    if (!client) {
      showMessage(
        "Добавьте файл js/config.js (скопируйте из js/config.example.js) и укажите Supabase URL и anon key.",
        true
      );
      return;
    }

    showMessage("Загрузка…", false);

    var res = await client
      .from("works")
      .select("id,title,item_type,display_order,created_at,work_images(id,public_url,sort_order)")
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (res.error) {
      showMessage("Ошибка загрузки: " + res.error.message + ". Проверьте таблицы и RLS в Supabase.", true);
      return;
    }

    var rows = res.data || [];
    masonryEl.innerHTML = "";

    if (rows.length === 0) {
      showMessage("Пока нет работ. Зайдите в «Админ» и добавьте первую.", false);
      return;
    }

    rows.forEach(function (work) {
      var imgs = (work.work_images || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      if (!imgs.length) return;
      masonryEl.appendChild(renderCard(work, imgs));
    });
  }

  load();
})();
