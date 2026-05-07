/**
 * Один общий клиент Supabase на всю вкладку (иначе GoTrueClient дублируется и ломает auth).
 * Подключать после config.js и UMD supabase.
 */
(function () {
  var instance;

  function getClient() {
    if (instance !== void 0) {
      return instance;
    }

    var cfg = window.PORTFOLIO_CONFIG;
    if (
      !cfg ||
      !cfg.supabaseUrl ||
      !cfg.supabaseAnonKey ||
      cfg.supabaseUrl.indexOf("YOUR_PROJECT") !== -1
    ) {
      instance = null;
      return null;
    }
    if (
      typeof window.supabase === "undefined" ||
      !window.supabase.createClient
    ) {
      instance = null;
      return null;
    }

    instance = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return instance;
  }

  window.portfolioSupabase = { getClient: getClient };
})();
