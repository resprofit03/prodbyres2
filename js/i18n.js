(function () {
  var STORAGE_KEY = "site_lang";
  var DEFAULT_LANG = "ru";

  var DICT = {
    ru: {
      nav_main: "Главная",
      nav_price: "Цены",
      nav_contacts: "Контакты",
      nav_clients: "Клиенты",
      nav_label: "Навигация",
      lang_btn: "EN",

      index_meta: "ПОРТФОЛИО • 2026 • ГРАФИЧЕСКИЙ ДИЗАЙН",
      index_lead: "Креативные обложки, постеры и визуалы для контента.",
      index_selected: "Избранные работы",
      index_chip_design: "Графический дизайн",
      index_cta_lead: "Есть проект?",
      index_cta: "Написать в Telegram",

      price_name_1: "Превью / обложка",
      price_lead_1: "Статичное оформление для видео",
      price_feat_1: "1 превью / обложка для одного ролика",
      price_feat_2: "Срок выполнения согласуем перед стартом",
      price_feat_3: "1 раунд правок включён",
      price_btn_1: "Заказать превью",
      price_name_2: "Монтаж видео",
      price_lead_2: "Индивидуальный расчёт под задачу",
      price_custom: "цена обсуждается",
      price_feat_4: "Цена зависит от длительности исходников",
      price_feat_5: "Учитывается сложность монтажа",
      price_feat_6: "Учитывается общий объём работы",
      price_btn_2: "Обсудить монтаж",
      pay_title: "Оплата",
      pay_text_1: "Оплата возможна в USD, в криптовалюте и в гривне (ГРН).",
      pay_text_2: "Итоговая стоимость по монтажу обсуждается после ознакомления с материалом.",

      contacts_label_1: "Telegram личный",
      contacts_label_2: "Telegram канал",
      contacts_title: "Свяжемся",
      contacts_lead: "Открыт к проектам и сотрудничеству. Пиши в Telegram — отвечу в течение часа.",
      contacts_hint_1: "Написать напрямую",
      contacts_hint_2: "Свежие работы и кейсы",
      contacts_status: "Онлайн сейчас — отвечаю быстро",
      contacts_note: "Если не отвечу в течение дня — напишите ещё раз. Иногда сообщения теряются.",

      clients_title: "С кем работал",
      clients_lead: "Люди и проекты, которым делал визуал и обложки. Если вы здесь — спасибо за доверие.",

      admin_title: "Админ",
      admin_login: "Вход",
      admin_logout: "Выйти",
      admin_new_work: "Новая работа",
      admin_pub: "Опубликованные работы",
    },
    en: {
      nav_main: "Home",
      nav_price: "Pricing",
      nav_contacts: "Contacts",
      nav_clients: "Clients",
      nav_label: "Navigation",
      lang_btn: "RU",

      index_meta: "Portfolio • 2026 • Graphic Design",
      index_lead: "Creative covers, posters and design visuals.",
      index_selected: "Selected works",
      index_chip_design: "Graphic Design",
      index_cta_lead: "Got a project?",
      index_cta: "Write on Telegram",

      price_name_1: "Thumbnail / cover",
      price_lead_1: "Static design for a video",
      price_feat_1: "1 thumbnail / cover per video",
      price_feat_2: "Delivery time is agreed before start",
      price_feat_3: "1 revision round included",
      price_btn_1: "Order thumbnail",
      price_name_2: "Video editing",
      price_lead_2: "Custom quote for your task",
      price_custom: "price on request",
      price_feat_4: "Price depends on source footage duration",
      price_feat_5: "Editing complexity is considered",
      price_feat_6: "Overall workload is considered",
      price_btn_2: "Discuss editing",
      pay_title: "Payment",
      pay_text_1: "Payment is available in USD, cryptocurrency and UAH.",
      pay_text_2: "Final editing cost is discussed after reviewing the materials.",

      contacts_label_1: "Personal Telegram",
      contacts_label_2: "Telegram channel",
      contacts_title: "Let's talk",
      contacts_lead: "Open to projects and collaboration. Drop a message on Telegram — I usually reply within an hour.",
      contacts_hint_1: "Message me directly",
      contacts_hint_2: "Fresh works and cases",
      contacts_status: "Online now — replying quickly",
      contacts_note: "If you don't hear back within a day — message me again. Things sometimes get lost.",

      clients_title: "Worked with",
      clients_lead: "People and projects I designed visuals and covers for. If you're here — thanks for trusting me.",

      admin_title: "Admin",
      admin_login: "Sign in",
      admin_logout: "Log out",
      admin_new_work: "New work",
      admin_pub: "Published works",
    },
  };

  function getLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "ru" ? saved : DEFAULT_LANG;
  }

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  function applyCommon(lang) {
    var t = DICT[lang];
    var nav = document.querySelector(".site-header__nav");
    if (nav) nav.setAttribute("aria-label", t.nav_label);

    var links = document.querySelectorAll(".site-header__nav a");
    var labels = [t.nav_main, t.nav_price, t.nav_contacts, t.nav_clients];
    for (var i = 0; i < links.length && i < labels.length; i++) {
      links[i].setAttribute("aria-label", labels[i]);
      links[i].textContent = labels[i];
    }

    var btn = document.getElementById("lang-switch");
    if (btn) btn.textContent = t.lang_btn;
    document.documentElement.lang = lang;
  }

  function applyByPage(lang) {
    var t = DICT[lang];
    var page = location.pathname.toLowerCase();
    // Vercel cleanUrls режет .html из URL — нормализуем для одинаковых проверок
    if (page !== "/" && !/\.html$/.test(page)) page += ".html";

    if (page.endsWith("/index.html") || page === "/" || page.endsWith("/portoflio") || page.endsWith("/portoflio.html")) {
      setText(".home-hero__meta", t.index_meta);
      setText(".home-hero__lead", t.index_lead);
      setText(".home-section-title", t.index_selected);
      setText(".home-hero__chip--soft", t.index_chip_design);
      setText(".home-cta-section__lead", t.index_cta_lead);
      setText(".home-cta__text", t.index_cta);
      document.title = "PRODBYRES";
      return;
    }

    if (page.endsWith("/price.html")) {
      setText(".pricing-tier:nth-child(1) .pricing-tier__name", t.price_name_1);
      setText(".pricing-tier:nth-child(1) .pricing-tier__lead", t.price_lead_1);
      setText(".pricing-tier:nth-child(1) .pricing-tier__list li:nth-child(1) span:last-child", t.price_feat_1);
      setText(".pricing-tier:nth-child(1) .pricing-tier__list li:nth-child(2) span:last-child", t.price_feat_2);
      setText(".pricing-tier:nth-child(1) .pricing-tier__list li:nth-child(3) span:last-child", t.price_feat_3);
      setText(".pricing-tier:nth-child(1) .pricing-tier__btn", t.price_btn_1);
      setText(".pricing-tier:nth-child(2) .pricing-tier__name", t.price_name_2);
      setText(".pricing-tier:nth-child(2) .pricing-tier__lead", t.price_lead_2);
      setText(".pricing-tier:nth-child(2) .pricing-tier__amount--custom", t.price_custom);
      setText(".pricing-tier:nth-child(2) .pricing-tier__list li:nth-child(1) span:last-child", t.price_feat_4);
      setText(".pricing-tier:nth-child(2) .pricing-tier__list li:nth-child(2) span:last-child", t.price_feat_5);
      setText(".pricing-tier:nth-child(2) .pricing-tier__list li:nth-child(3) span:last-child", t.price_feat_6);
      setText(".pricing-tier:nth-child(2) .pricing-tier__btn", t.price_btn_2);
      setText(".pricing-payments__title", t.pay_title);
      setText(".pricing-payments__text", t.pay_text_1);
      setText(".pricing-payments__text--muted", t.pay_text_2);
      document.title = lang === "en" ? "PRODBYRES — pricing" : "PRODBYRES — цены";
      return;
    }

    if (page.endsWith("/contacts.html")) {
      setText(".contact-links a:nth-child(1) .contact-links__label", t.contacts_label_1);
      setText(".contact-links a:nth-child(2) .contact-links__label", t.contacts_label_2);
      setText(".contact-links a:nth-child(1) .contact-card__hint", t.contacts_hint_1);
      setText(".contact-links a:nth-child(2) .contact-card__hint", t.contacts_hint_2);
      var titleEl = document.querySelector(".contacts-hero__title");
      if (titleEl) {
        titleEl.innerHTML =
          (t.contacts_title || "") +
          '<span class="contacts-hero__dot">.</span>';
      }
      setText(".contacts-hero__lead", t.contacts_lead);
      setText(".contacts-status span:last-child", t.contacts_status);
      setText(".contacts-note", t.contacts_note);
      document.title = lang === "en" ? "PRODBYRES — contacts" : "PRODBYRES — контакты";
      return;
    }

    if (page.endsWith("/clients.html")) {
      var clientsTitleEl = document.querySelector(".clients-hero__title");
      if (clientsTitleEl) {
        clientsTitleEl.innerHTML =
          (t.clients_title || "") +
          '<span class="clients-hero__dot">.</span>';
      }
      setText(".clients-hero__lead", t.clients_lead);
      document.title = lang === "en" ? "PRODBYRES — clients" : "PRODBYRES — клиенты";
      return;
    }

    if (page.endsWith("/admin.html")) {
      setText(".top-bar .page-title", t.admin_title);
      setText("#admin-login .page-title", t.admin_login);
      setText("#btn-logout", t.admin_logout);
      setText("#admin-app .page-title", t.admin_new_work);
      setText("#admin-app h2.page-title[style*='margin-top: 2.5rem']", t.admin_pub);
      document.title = lang === "en" ? "PRODBYRES — admin" : "PRODBYRES — админ";
    }
  }

  function applyLang(lang) {
    applyCommon(lang);
    applyByPage(lang);
    window.dispatchEvent(
      new CustomEvent("site-lang-changed", {
        detail: { lang: lang },
      })
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var lang = getLang();
    applyLang(lang);

    var btn = document.getElementById("lang-switch");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = getLang() === "ru" ? "en" : "ru";
      localStorage.setItem(STORAGE_KEY, next);
      applyLang(next);
    });
  });
})();
