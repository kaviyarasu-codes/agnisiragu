// plugins/withoutMediaPermissions.js
// Google Play's "Photo and Video Permissions" policy (in force since 2024)
// blocks apps from declaring READ_MEDIA_IMAGES / READ_MEDIA_VIDEO (or the
// older READ/WRITE_EXTERNAL_STORAGE) unless the Android system Photo Picker
// is technically insufficient for the app's core functionality. It isn't
// here — PostNewsScreen.tsx's only gallery access is
// ImagePicker.launchImageLibraryAsync(), which already uses the system
// picker at runtime on Android 13+ and never actually needs these
// permissions to work. expo-image-picker's own config plugin injects them
// into the manifest unconditionally anyway regardless of that (a known
// upstream bug: https://github.com/expo/expo/issues/42819) — that's what
// got this app flagged and blocked from Play Store review under "Use
// alternative system pickers for photos / videos" (version codes 13 & 18).
// This plugin strips them back out of the generated manifest after
// expo-image-picker's plugin has already run — must stay listed AFTER
// "expo-image-picker" in app.json's plugins array for that ordering to
// hold. Safe to remove entirely if a future expo-image-picker release
// fixes the upstream issue and stops adding these on its own.
//
// IMPORTANT: simply omitting/filtering these out of this app's own
// manifest is NOT enough — expo-image-picker's native Android module
// bundles its own AndroidManifest.xml (inside its .aar) declaring these
// permissions directly, and Gradle's manifest merger re-adds them from
// there during the actual native build, which happens AFTER this config
// plugin has already run at prebuild time. Confirmed this the hard way:
// version code 19, built after the first (filter-only) version of this
// plugin, still had them. The fix is to add an explicit
// tools:node="remove" directive for each one, which is the documented
// Android manifest-merger instruction to reject a permission even when a
// merged library dependency re-declares it.

const { withAndroidManifest } = require('expo/config-plugins');

const BLOCKED_PERMISSIONS = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

module.exports = function withoutMediaPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = [];
    }

    // Drop any plain (non-removal) entries already present for these —
    // added by expo-image-picker's app.json-level plugin — then add
    // explicit removal directives that also survive Gradle's later
    // manifest merge from the library's own bundled manifest.
    manifest['uses-permission'] = manifest['uses-permission'].filter((perm) => {
      const name = perm.$ && perm.$['android:name'];
      return !BLOCKED_PERMISSIONS.includes(name);
    });

    for (const name of BLOCKED_PERMISSIONS) {
      manifest['uses-permission'].push({
        $: { 'android:name': name, 'tools:node': 'remove' },
      });
    }

    return cfg;
  });
};
