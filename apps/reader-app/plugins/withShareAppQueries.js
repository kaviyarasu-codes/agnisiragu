// plugins/withShareAppQueries.js
// Android 11+ (API 30+) hides other apps' package info by default —
// Linking.canOpenURL('whatsapp://...') silently returns false even when
// WhatsApp IS installed, unless this app declares it needs to see that
// package via a <queries> entry in AndroidManifest.xml. This was the root
// cause of "WhatsApp sharing not working": ShareSheet/ActionBar's WhatsApp
// button always fell through to the generic OS share sheet instead of
// opening WhatsApp directly, because canOpenURL always came back false.
//
// Adds <queries><package android:name="..."/></queries> entries for every
// app ShareSheet.tsx / SwipeFeed.tsx / ArticleDetailScreen.tsx deep-link
// to, so canOpenURL correctly reports whether each one is installed.

const { withAndroidManifest } = require('expo/config-plugins');

const PACKAGES = [
  'com.whatsapp', // WhatsApp
  'com.facebook.katana', // Facebook
  'org.telegram.messenger', // Telegram
];

module.exports = function withShareAppQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest.queries) manifest.queries = [{}];
    const queries = manifest.queries[0];
    if (!queries.package) queries.package = [];

    for (const pkg of PACKAGES) {
      const exists = queries.package.some((p) => p.$ && p.$['android:name'] === pkg);
      if (!exists) {
        queries.package.push({ $: { 'android:name': pkg } });
      }
    }

    return cfg;
  });
};
