/**
 * Общий клиент Supabase (после загрузки config.js и UMD supabase).
 */
(function () {
  function getClient() {
    var cfg = window.PORTFOLIO_CONFIG;
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey ||
        cfg.supabaseUrl.indexOf("YOUR_PROJECT") !== -1) {
      return null;
    }
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      return null;
    }
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  window.portfolioSupabase = { getClient: getClient };
})();
