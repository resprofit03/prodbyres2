/**
 * Админ: вход, загрузка работ (single / pack), удаление.
 * Только email из PORTFOLIO_CONFIG.adminEmail считается главным админом.
 */
(function () {
  var CLIENT_PREFIX = "__client__:";
  var loginSection = document.getElementById("admin-login");
  var appSection = document.getElementById("admin-app");
  if (!loginSection || !appSection) return;

  var formLogin = document.getElementById("form-login");
  var formWork = document.getElementById("form-work");
  var btnLogout = document.getElementById("btn-logout");
  var workList = document.getElementById("admin-work-list");
  var authStatus = document.getElementById("admin-auth-status");
  var loginError = document.getElementById("login-error");
  var formError = document.getElementById("form-error");
  var formSuccess = document.getElementById("form-success");
  var formProgress = document.getElementById("form-progress");
  var btnWorkSubmit = document.getElementById("btn-work-submit");
  var statWorks = document.getElementById("admin-stat-works");
  var statClients = document.getElementById("admin-stat-clients");
  var workTypeEl = document.getElementById("work-type");
  var workTitleEl = document.getElementById("work-title");
  var workOrderEl = document.getElementById("work-order");
  var filesInputEl = document.getElementById("work-files");
  var filesHintEl = document.getElementById("work-files-hint");
  var filesPreviewEl = document.getElementById("admin-files-preview");

  function getClient() {
    return window.portfolioSupabase ? window.portfolioSupabase.getClient() : null;
  }

  function getAdminEmail() {
    var c = window.PORTFOLIO_CONFIG;
    return (c && c.adminEmail && String(c.adminEmail).trim().toLowerCase()) || "";
  }

  function sessionEmail(session) {
    return ((session && session.user && session.user.email) || "")
      .trim()
      .toLowerCase();
  }

  function showAuthError(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  async function enforceAdminOrLogout(client, session) {
    var want = getAdminEmail();
    if (!session) return null;
    if (!want) return session;
    if (sessionEmail(session) === want) return session;
    await client.auth.signOut();
    loginSection.hidden = false;
    appSection.hidden = true;
    if (authStatus) authStatus.textContent = "";
    showAuthError(
      loginError,
      "Этот аккаунт не главный администратор. Войдите как " + want + "."
    );
    return null;
  }

  async function refreshSession() {
    var client = getClient();
    if (!client) {
      loginSection.hidden = false;
      appSection.hidden = true;
      if (authStatus) {
        authStatus.textContent =
          "Создайте js/config.js по образцу js/config.example.js";
      }
      return null;
    }

    var session = (await client.auth.getSession()).data.session;
    if (!session) {
      loginSection.hidden = false;
      appSection.hidden = true;
      if (authStatus) authStatus.textContent = "";
      return null;
    }

    session = await enforceAdminOrLogout(client, session);
    if (!session) return null;

    loginSection.hidden = true;
    appSection.hidden = false;
    if (authStatus) {
      authStatus.textContent =
        "Вы вошли как " + (session.user.email || session.user.id);
    }
    return session;
  }

  function safeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  function isClientTitle(title) {
    return typeof title === "string" && title.indexOf(CLIENT_PREFIX) === 0;
  }

  function encodeClientTitle(title) {
    return CLIENT_PREFIX + (title || "");
  }

  function decodeClientTitle(title) {
    return isClientTitle(title) ? title.slice(CLIENT_PREFIX.length) : title;
  }

  async function loadWorks() {
    var client = getClient();
    if (!client || !workList) return;

    workList.innerHTML = '<p class="hint">Загрузка списка…</p>';
    var res = await client
      .from("works")
      .select("id,title,item_type,created_at,work_images(id,public_url,sort_order)")
      .order("created_at", { ascending: false });

    if (res.error) {
      workList.innerHTML =
        '<p class="hint state-msg--error">Список: ' +
        res.error.message +
        "</p>";
      return;
    }

    var all = res.data || [];
    var worksCount = 0;
    var clientsCount = 0;
    workList.innerHTML = "";
    if (!all.length) {
      workList.innerHTML = '<p class="hint">Пока нет работ.</p>';
      if (statWorks) statWorks.textContent = "0";
      if (statClients) statClients.textContent = "0";
      return;
    }

    all.forEach(function (w) {
      var imgs = (w.work_images || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      var n = imgs.length;
      var firstImg = imgs[0] && imgs[0].public_url;
      var isClient = isClientTitle(w.title || "");
      if (isClient) clientsCount += 1;
      else worksCount += 1;

      var typeLabel = isClient
        ? "Клиент"
        : w.item_type === "pack"
        ? "Пак"
        : "Одна";

      var card = document.createElement("article");
      card.className = "admin-card";
      if (isClient) card.classList.add("admin-card--client");

      var thumb = document.createElement("div");
      thumb.className = "admin-card__thumb";
      if (firstImg) {
        var im = document.createElement("img");
        im.src = firstImg;
        im.alt = "";
        im.loading = "lazy";
        thumb.appendChild(im);
        if (n > 1 && !isClient) {
          var badge = document.createElement("span");
          badge.className = "admin-card__count";
          badge.textContent = "+" + (n - 1);
          thumb.appendChild(badge);
        }
      } else {
        thumb.classList.add("admin-card__thumb--empty");
        thumb.textContent = "—";
      }

      var body = document.createElement("div");
      body.className = "admin-card__body";

      var title = document.createElement("p");
      title.className = "admin-card__title";
      title.textContent = decodeClientTitle(w.title) || "Без названия";

      var meta = document.createElement("p");
      meta.className = "admin-card__meta";
      meta.textContent = typeLabel + " · " + n + " фото";

      body.appendChild(title);
      body.appendChild(meta);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "admin-card__delete";
      del.textContent = "Удалить";
      del.dataset.id = w.id;

      card.appendChild(thumb);
      card.appendChild(body);
      card.appendChild(del);
      workList.appendChild(card);
    });
    if (statWorks) statWorks.textContent = String(worksCount);
    if (statClients) statClients.textContent = String(clientsCount);

    workList.querySelectorAll("button[data-id]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        if (!confirm("Удалить работу и все её изображения?")) return;
        var id = btn.getAttribute("data-id");
        var client2 = getClient();
        var delRes = await client2.from("works").delete().eq("id", id);
        if (delRes.error) {
          alert(delRes.error.message);
          return;
        }
        loadWorks();
      });
    });
  }

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    showAuthError(loginError, "");
    var client = getClient();
    if (!client) return;

    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value;
    var res = await client.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (res.error) {
      showAuthError(loginError, res.error.message);
      return;
    }
    var sess = res.data.session;
    var ok = await enforceAdminOrLogout(client, sess);
    if (!ok) return;
    await refreshSession();
    loadWorks();
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", async function () {
      var client = getClient();
      if (client) await client.auth.signOut();
      await refreshSession();
    });
  }

  function showFormError(msg) {
    if (formSuccess) {
      formSuccess.textContent = "";
      formSuccess.hidden = true;
    }
    if (!formError) return;
    formError.textContent = msg || "";
    formError.hidden = !msg;
    if (msg) {
      try {
        console.error("[admin]", msg);
      } catch (ignore) {}
      if (formError.scrollIntoView) formError.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function showFormSuccess(msg) {
    if (formError) {
      formError.textContent = "";
      formError.hidden = true;
    }
    if (!formSuccess) return;
    formSuccess.textContent = msg || "";
    formSuccess.hidden = !msg;
  }

  function showFormProgress(msg) {
    if (!formProgress) return;
    formProgress.textContent = msg || "";
    formProgress.hidden = !msg;
  }

  function fileBaseTitle(file) {
    var name = (file && file.name) || "image";
    return name.replace(/\.[^.]+$/, "");
  }

  // Загружает один файл в storage и создаёт работу + work_image
  async function uploadOneAsWork(client, uid, file, opts) {
    var dbTitle = opts.dbTitle;
    var dbItemType = opts.dbItemType;
    var displayOrder = opts.displayOrder;

    var workIns = await client
      .from("works")
      .insert({
        title: dbTitle,
        item_type: dbItemType,
        display_order: displayOrder,
      })
      .select("id")
      .single();

    if (workIns.error) {
      return { error: workIns.error };
    }

    var workId = workIns.data.id;
    var path =
      uid +
      "/" +
      crypto.randomUUID() +
      "_" +
      safeFileName(file.name || "image");

    var up = await client.storage.from("portfolio").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (up.error) {
      await client.from("works").delete().eq("id", workId);
      return { error: { message: "Загрузка файла: " + up.error.message } };
    }

    var pub = client.storage.from("portfolio").getPublicUrl(path);
    var url = pub.data && pub.data.publicUrl;
    if (!url) {
      await client.from("works").delete().eq("id", workId);
      try {
        await client.storage.from("portfolio").remove([path]);
      } catch (ignore) {}
      return {
        error: {
          message:
            "Не удалось получить публичный URL. Проверьте bucket portfolio (должен быть public).",
        },
      };
    }

    var imgIns = await client.from("work_images").insert({
      work_id: workId,
      public_url: url,
      storage_path: path,
      sort_order: 0,
    });

    if (imgIns.error) {
      await client.from("works").delete().eq("id", workId);
      try {
        await client.storage.from("portfolio").remove([path]);
      } catch (ignore) {}
      return { error: imgIns.error };
    }

    return { workId: workId };
  }

  formWork.addEventListener("submit", async function (e) {
    e.preventDefault();
    showFormError("");
    showFormSuccess("");
    showFormProgress("");

    function setBusy(busy) {
      if (btnWorkSubmit) {
        btnWorkSubmit.disabled = !!busy;
        btnWorkSubmit.textContent = busy ? "Загрузка…" : "Загрузить";
      }
    }

    setBusy(true);

    try {
      var client = getClient();
      if (!client) {
        showFormError("Проверьте js/config.js (URL и ключ Supabase).");
        return;
      }
      var session = (await client.auth.getSession()).data.session;
      session = await enforceAdminOrLogout(client, session);
      if (!client || !session) {
        showFormError("Сессия истекла или нет доступа. Войдите снова.");
        return;
      }

      var title = (workTitleEl ? workTitleEl.value : "").trim();
      var itemType = workTypeEl ? workTypeEl.value : "single";
      var orderRaw = workOrderEl ? workOrderEl.value : "0";
      var displayOrder = parseInt(orderRaw, 10);
      if (isNaN(displayOrder)) displayOrder = 0;

      var filesInput = filesInputEl || document.getElementById("work-files");
      var files = filesInput.files ? Array.from(filesInput.files) : [];
      if (!files.length) {
        showFormError("Выберите хотя бы одно изображение.");
        return;
      }

      var uid = session.user.id;

      // === BULK: каждая картинка — отдельная работа ===
      if (itemType === "bulk") {
        var ok = 0;
        var fail = 0;
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          showFormProgress(
            "Загружаю " + (i + 1) + " из " + files.length + ": " + (f.name || "image")
          );
          var perTitle = title ? title + " " + (i + 1) : fileBaseTitle(f);
          var r = await uploadOneAsWork(client, uid, f, {
            dbTitle: perTitle,
            dbItemType: "single",
            displayOrder: displayOrder,
          });
          if (r.error) {
            fail++;
            console.error("[admin][bulk]", f.name, r.error);
          } else {
            ok++;
          }
        }
        showFormProgress("");
        if (ok && !fail) {
          showFormSuccess(
            "Загружено " + ok + " работ. Обновите главную (F5)."
          );
          formWork.reset();
          renderFilesPreview();
          applyTypePreset();
        } else if (ok && fail) {
          showFormError(
            "Загружено " + ok + ", не удалось — " + fail + ". Подробности в консоли."
          );
        } else {
          showFormError("Не удалось загрузить ни одной работы. Подробности в консоли.");
        }
        loadWorks();
        return;
      }

      // === SINGLE / CLIENT — одна картинка, одна работа ===
      if (itemType === "single" || itemType === "client") {
        if (files.length > 1) {
          showFormError("Для одиночной карточки выберите один файл.");
          return;
        }
        var dbTitleS =
          itemType === "client" ? encodeClientTitle(title) : (title || fileBaseTitle(files[0]));
        showFormProgress("Загружаю файл…");
        var sr = await uploadOneAsWork(client, uid, files[0], {
          dbTitle: dbTitleS,
          dbItemType: "single",
          displayOrder: displayOrder,
        });
        showFormProgress("");
        if (sr.error) {
          var em = sr.error.message || "Ошибка загрузки";
          var hint =
            /row-level security|rls|permission denied/i.test(em)
              ? " Выполните в Supabase обновлённый supabase/rls-main-admin.sql."
              : "";
          showFormError(em + hint);
          return;
        }
        formWork.reset();
        renderFilesPreview();
        applyTypePreset();
        showFormSuccess("Готово. Обновите главную (F5).");
        loadWorks();
        return;
      }

      // === PACK — несколько картинок в одной карточке ===
      if (itemType === "pack") {
        var workIns = await client
          .from("works")
          .insert({
            title: title,
            item_type: "pack",
            display_order: displayOrder,
          })
          .select("id")
          .single();

        if (workIns.error) {
          var pem = workIns.error.message || "";
          var ph =
            /row-level security|rls|permission denied/i.test(pem)
              ? " Выполните в Supabase обновлённый supabase/rls-main-admin.sql."
              : "";
          showFormError(pem + ph);
          return;
        }

        var workId = workIns.data.id;
        var sortIdx = 0;
        var uploadedPaths = [];

        for (var k = 0; k < files.length; k++) {
          showFormProgress(
            "Загружаю " + (k + 1) + " из " + files.length + " в пак…"
          );
          var pf = files[k];
          var pPath =
            uid + "/" + crypto.randomUUID() + "_" + safeFileName(pf.name || "image");
          var pUp = await client.storage.from("portfolio").upload(pPath, pf, {
            cacheControl: "3600",
            upsert: false,
          });
          if (pUp.error) {
            await client.from("works").delete().eq("id", workId);
            for (var x = 0; x < uploadedPaths.length; x++) {
              try {
                await client.storage.from("portfolio").remove([uploadedPaths[x]]);
              } catch (ignore) {}
            }
            showFormError("Загрузка файла: " + pUp.error.message);
            return;
          }
          uploadedPaths.push(pPath);

          var pPub = client.storage.from("portfolio").getPublicUrl(pPath);
          var pUrl = pPub.data && pPub.data.publicUrl;
          if (!pUrl) {
            await client.from("works").delete().eq("id", workId);
            showFormError("Не удалось получить публичный URL.");
            return;
          }

          var pImg = await client.from("work_images").insert({
            work_id: workId,
            public_url: pUrl,
            storage_path: pPath,
            sort_order: sortIdx++,
          });
          if (pImg.error) {
            await client.from("works").delete().eq("id", workId);
            for (var y = 0; y < uploadedPaths.length; y++) {
              try {
                await client.storage.from("portfolio").remove([uploadedPaths[y]]);
              } catch (ignore) {}
            }
            showFormError("Сохранение в БД: " + pImg.error.message);
            return;
          }
        }

        showFormProgress("");
        formWork.reset();
        renderFilesPreview();
        applyTypePreset();
        showFormSuccess("Готово. Пак из " + files.length + " картинок создан.");
        loadWorks();
        return;
      }

      showFormError("Неизвестный тип работы: " + itemType);
    } catch (err) {
      showFormError("Ошибка: " + (err && err.message ? err.message : String(err)));
      try { console.error(err); } catch (ignore) {}
    } finally {
      setBusy(false);
    }
  });

  var emInput = document.getElementById("login-email");
  var ae = getAdminEmail();
  if (emInput && ae) emInput.value = ae;

  refreshSession().then(function (s) {
    if (s) loadWorks();
  });

  var client = getClient();
  if (client) {
    client.auth.onAuthStateChange(function () {
      refreshSession().then(function (s) {
        if (s) loadWorks();
      });
    });
  }

  function applyTypePreset() {
    if (!workTypeEl || !filesInputEl) return;
    var t = workTypeEl.value;
    var singleLike = t === "single" || t === "client";
    filesInputEl.multiple = !singleLike;
    if (filesHintEl) {
      filesHintEl.textContent =
        t === "pack"
          ? "Для «Пак» выберите несколько файлов — они окажутся в одной карточке."
          : t === "bulk"
          ? "Выберите 10–20 файлов — каждая картинка станет отдельной карточкой на главной."
          : t === "client"
          ? "Для «Клиент» загрузите одну картинку — она появится в разделе «Клиенты»."
          : "Для «Одна картинка» загрузите один файл.";
    }
    var typeHint = document.getElementById("work-type-hint");
    if (typeHint) {
      typeHint.textContent =
        t === "bulk"
          ? "Самое то для массового импорта: выбрал папку — каждая картинка станет работой."
          : t === "pack"
          ? "Несколько картинок объединятся в одну карточку с сеткой."
          : t === "client"
          ? "Карточка появится в разделе «Клиенты», а не на главной."
          : "Одна картинка станет одной карточкой.";
    }
  }

  function renderFilesPreview() {
    if (!filesPreviewEl || !filesInputEl) return;
    var files = filesInputEl.files ? Array.from(filesInputEl.files) : [];
    filesPreviewEl.innerHTML = "";
    if (!files.length) {
      filesPreviewEl.removeAttribute("data-has-files");
      return;
    }
    filesPreviewEl.setAttribute("data-has-files", "true");

    var counter = document.createElement("p");
    counter.className = "admin-files-preview__count";
    counter.textContent = "Выбрано файлов: " + files.length;
    filesPreviewEl.appendChild(counter);

    var grid = document.createElement("div");
    grid.className = "admin-files-preview__grid";
    files.forEach(function (file, idx) {
      var tile = document.createElement("div");
      tile.className = "admin-files-preview__tile";
      var img = document.createElement("img");
      try {
        img.src = URL.createObjectURL(file);
      } catch (e) {}
      img.alt = "";
      img.loading = "lazy";
      tile.appendChild(img);

      var label = document.createElement("span");
      label.className = "admin-files-preview__name";
      label.textContent = file.name || "image " + (idx + 1);
      tile.appendChild(label);

      grid.appendChild(tile);
    });
    filesPreviewEl.appendChild(grid);
  }

  if (filesInputEl) {
    filesInputEl.addEventListener("change", renderFilesPreview);
  }

  if (workTypeEl) {
    workTypeEl.addEventListener("change", applyTypePreset);
    applyTypePreset();
  }
})();
