module.exports = {
  apps: [
    {
      name: "oldseadogs-web",
      script: "npm",
      args: "run start:do",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "750M",
      time: true,
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
        OLDSEADOGS_ENV: process.env.OLDSEADOGS_ENV || "staging",
        OLDSEADOGS_SITE_URL:
          process.env.OLDSEADOGS_SITE_URL || "https://staging.oldseadogs.com",
        NEXT_PUBLIC_SITE_URL:
          process.env.NEXT_PUBLIC_SITE_URL || "https://staging.oldseadogs.com",
        NEXT_PUBLIC_ENABLE_INDEXING: process.env.NEXT_PUBLIC_ENABLE_INDEXING || "false",
        NEXT_PUBLIC_ENABLE_DIRECT_ADS: process.env.NEXT_PUBLIC_ENABLE_DIRECT_ADS || "true",
        OLDSEADOGS_GA4_ID: process.env.OLDSEADOGS_GA4_ID || "G-88HT8MHR7T",
        OLDSEADOGS_ENABLE_ADSENSE: process.env.OLDSEADOGS_ENABLE_ADSENSE || "false",
        OLDSEADOGS_ADSENSE_CLIENT: process.env.OLDSEADOGS_ADSENSE_CLIENT || "",
        OLDSEADOGS_EDITOR_EMAILS:
          process.env.OLDSEADOGS_EDITOR_EMAILS || "captainoldseadog@gmail.com",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
        HOST: process.env.HOST || "127.0.0.1",
        OLDSEADOGS_ENV: "production",
        OLDSEADOGS_SITE_URL: "https://oldseadogs.com",
        NEXT_PUBLIC_SITE_URL: "https://oldseadogs.com",
        NEXT_PUBLIC_ENABLE_INDEXING: "true",
        NEXT_PUBLIC_ENABLE_DIRECT_ADS: process.env.NEXT_PUBLIC_ENABLE_DIRECT_ADS || "true",
        OLDSEADOGS_GA4_ID: process.env.OLDSEADOGS_GA4_ID || "G-88HT8MHR7T",
        OLDSEADOGS_ENABLE_ADSENSE: process.env.OLDSEADOGS_ENABLE_ADSENSE || "false",
        OLDSEADOGS_ADSENSE_CLIENT: process.env.OLDSEADOGS_ADSENSE_CLIENT || "",
        NEXT_PUBLIC_ENABLE_ADSENSE: process.env.NEXT_PUBLIC_ENABLE_ADSENSE || "false",
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
        OLDSEADOGS_EDITOR_EMAILS:
          process.env.OLDSEADOGS_EDITOR_EMAILS || "captainoldseadog@gmail.com",
        OLDSEADOGS_DATA_DIR: process.env.OLDSEADOGS_DATA_DIR || "/var/www/oldseadogs-data",
      },
    },
  ],
};
