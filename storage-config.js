// Static/offline distributions keep their original local mode.
// The Netlify build replaces this asset with shared mode for its deployed site.
globalThis.CSV_SHARED_STORAGE ??= false;
