/**
 * Админ: вход, загрузка работ (single / pack), удаление.
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

  function getClient() {
    return window.portfolioSupabase ? window.portfolioSupabase.getClient() : null;
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
      .select(
        "id,title,item_type,created_at,work_images(id)"
      )
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
    var res = await client.auth.signInWithPassword({ email: email, password: password });
    if (res.error) {
      showAuthError(loginError, res.error.message);
      return;
    }
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

  function showAuthError(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  function showFormError(msg) {
    if (!formError) return;
    formError.textContent = msg || "";
    formError.hidden = !msg;
  }

  formWork.addEventListener("submit", async function (e) {
    e.preventDefault();
    showFormError("");

    var client = getClient();
    var session = (await client.auth.getSession()).data.session;
    if (!client || !session) {
      showFormError("Сессия истекла. Войдите снова.");
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
      showFormError('Для типа «Одна картинка» загрузите один файл или выберите тип «Пак».');
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
      showFormError(workIns.error.message);
      return;
    }

    var workId = workIns.data.id;
    var uid = session.user.id;
    var sortIdx = 0;

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
        showFormError("Загрузка файла: " + up.error.message);
        return;
      }

      var pub = client.storage.from("portfolio").getPublicUrl(path);
      var url = pub.data.publicUrl;

      var imgIns = await client.from("work_images").insert({
        work_id: workId,
        public_url: url,
        storage_path: path,
        sort_order: sortIdx++,
      });

      if (imgIns.error) {
        showFormError("Сохранение URL: " + imgIns.error.message);
        return;
      }
    }

    formWork.reset();
    loadWorks();
  });

  refreshSession().then(function (s) {
    if (s) loadWorks();
  });

  if (typeof window !== "undefined" && window.supabase) {
    var client = getClient();
    if (client) {
      client.auth.onAuthStateChange(function () {
        refreshSession().then(function (s) {
          if (s) loadWorks();
        });
      });
    }
  }
})();
