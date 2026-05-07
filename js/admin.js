/**
 * Админ: вход, загрузка работ (single / pack), удаление.
 * Только email из PORTFOLIO_CONFIG.adminEmail считается главным админом.
 */
(function () {
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
  var btnWorkSubmit = document.getElementById("btn-work-submit");

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

  async function loadWorks() {
    var client = getClient();
    if (!client || !workList) return;

    workList.innerHTML = '<li class="hint">Загрузка списка…</li>';
    var res = await client
      .from("works")
      .select("id,title,item_type,created_at,work_images(id)")
      .order("created_at", { ascending: false });

    if (res.error) {
      workList.innerHTML =
        '<li class="hint state-msg--error">Список: ' +
        res.error.message +
        "</li>";
      return;
    }

    workList.innerHTML = "";
    (res.data || []).forEach(function (w) {
      var n = (w.work_images && w.work_images.length) || 0;
      var li = document.createElement("li");
      var left = document.createElement("span");
      left.textContent =
        (w.title || "Без названия") +
        " · " +
        (w.item_type === "pack" ? "пак" : "одна") +
        " · " +
        n +
        " фото";
      var del = document.createElement("button");
      del.type = "button";
      del.textContent = "Удалить";
      del.dataset.id = w.id;
      li.appendChild(left);
      li.appendChild(del);
      workList.appendChild(li);
    });

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

  formWork.addEventListener("submit", async function (e) {
    e.preventDefault();
    showFormError("");
    showFormSuccess("");

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
        alert("Нет клиента Supabase.");
        return;
      }
      var session = (await client.auth.getSession()).data.session;
      session = await enforceAdminOrLogout(client, session);
      if (!client || !session) {
        showFormError("Сессия истекла или нет доступа. Войдите снова.");
        return;
      }

      var title = document.getElementById("work-title").value.trim();
      var itemType = document.getElementById("work-type").value;
      var orderRaw = document.getElementById("work-order").value;
      var displayOrder = parseInt(orderRaw, 10);
      if (isNaN(displayOrder)) displayOrder = 0;

      var filesInput = document.getElementById("work-files");
      var files = filesInput.files ? Array.from(filesInput.files) : [];
      if (!files.length) {
        showFormError("Выберите хотя бы одно изображение.");
        return;
      }

      if (itemType === "single" && files.length > 1) {
        showFormError(
          'Для типа «Одна картинка» загрузите один файл или выберите тип «Пак».'
        );
        return;
      }

      var workIns = await client
        .from("works")
        .insert({
          title: title,
          item_type: itemType,
          display_order: displayOrder,
        })
        .select("id")
        .single();

      if (workIns.error) {
        var em = workIns.error.message || "";
        var hint =
          /row-level security|rls|permission denied/i.test(em)
            ? " Выполните в Supabase обновлённый supabase/rls-main-admin.sql."
            : "";
        showFormError(em + hint);
        alert("Не сохранилось: " + em);
        return;
      }

      var workId = workIns.data.id;
      var uid = session.user.id;
      var sortIdx = 0;
      var uploadedPaths = [];

      for (var i = 0; i < files.length; i++) {
        var file = files[i];
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
          var uem = "Загрузка файла: " + up.error.message;
          showFormError(uem);
          alert(uem);
          return;
        }

        uploadedPaths.push(path);

        var pub = client.storage.from("portfolio").getPublicUrl(path);
        var url = pub.data && pub.data.publicUrl;
        if (!url) {
          await client.from("works").delete().eq("id", workId);
          showFormError(
            "Не удалось получить публичный URL. Проверьте bucket portfolio (должен быть public)."
          );
          alert("Нет public URL для файла в Storage.");
          return;
        }

        var imgIns = await client.from("work_images").insert({
          work_id: workId,
          public_url: url,
          storage_path: path,
          sort_order: sortIdx++,
        });

        if (imgIns.error) {
          await client.from("works").delete().eq("id", workId);
          for (var j = 0; j < uploadedPaths.length; j++) {
            try {
              await client.storage.from("portfolio").remove([uploadedPaths[j]]);
            } catch (ignore) {}
          }
          var iem = imgIns.error.message || "";
          var ih =
            /row-level security|rls|permission denied/i.test(iem)
              ? " Выполните в Supabase обновлённый supabase/rls-main-admin.sql."
              : "";
          showFormError("Сохранение в БД: " + iem + ih);
          alert("Сохранение в БД: " + iem);
          return;
        }
      }

      formWork.reset();
      showFormSuccess("Готово. Обновите главную (F5) — карточка появится в сетке.");
      loadWorks();
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
})();
