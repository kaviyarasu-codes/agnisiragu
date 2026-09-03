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
    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter((perm) => {
        const name = perm.$ && perm.$['android:name'];
        return !BLOCKED_PERMISSIONS.includes(name);
      });
    }
    return cfg;
  });
};
