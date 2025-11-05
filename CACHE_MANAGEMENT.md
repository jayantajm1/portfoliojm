# Cache Management Guide

This guide explains how the portfolio handles browser caching and how to ensure users always see the latest version.

## 🔧 Implemented Solutions

### 1. **Meta Cache Control Tags**
Added to `index.html` header:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```
These prevent browsers from caching the HTML file.

### 2. **Version Query Parameters (Cache Busting)**
All CSS and JS files include version numbers:
```html
<link rel="stylesheet" href="assets/css/style.css?v=1.0.1" />
<script src="assets/js/script.js?v=1.0.1"></script>
```

**When to update:** Change the version number (e.g., `v=1.0.1` → `v=1.0.2`) whenever you:
- Modify CSS styles
- Update JavaScript code
- Add new features
- Fix bugs

### 3. **Updated Service Worker**
The service worker now:
- Uses versioned cache names
- Automatically deletes old caches
- Uses "Network First" strategy for better updates
- Checks for updates every 60 seconds
- Prompts users to reload when updates are available

**Location:** `/sw.js`

**When to update:** Change `CACHE_VERSION` in `sw.js` when you deploy updates:
```javascript
const CACHE_VERSION = "1.0.1"; // Change this number
```

### 4. **Auto-Update System**
The service worker registration in `script.js` now:
- Checks for updates automatically
- Prompts users when new version is available
- Reloads the page automatically after update

### 5. **Manual Cache Clear Page**
Created a dedicated page for clearing all cache: `clear-cache.html`

**Access it at:** `yourdomain.com/clear-cache.html`

This page will:
- Clear all browser caches
- Unregister service workers
- Clear localStorage and sessionStorage
- Redirect to fresh portfolio

## 📝 How to Deploy Updates

### For Every Update:

1. **Update version numbers in `index.html`:**
   ```html
   <link rel="stylesheet" href="assets/css/style.css?v=1.0.2" />
   <script src="assets/js/script.js?v=1.0.2"></script>
   ```

2. **Update cache version in `sw.js`:**
   ```javascript
   const CACHE_VERSION = "1.0.2";
   ```

3. **Deploy your changes**

4. **Clear your own browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)

## 🔄 For Users Seeing Old Version

### Method 1: Hard Refresh (Recommended)
- **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + R`

### Method 2: Clear Browser Cache
- **Chrome/Edge:** Press `Ctrl/Cmd + Shift + Delete` → Select "Cached images and files" → Clear data
- **Firefox:** Press `Ctrl/Cmd + Shift + Delete` → Select "Cache" → Clear Now
- **Safari:** Safari → Preferences → Privacy → Manage Website Data → Remove All

### Method 3: Use Clear Cache Page
Direct users to: `yourdomain.com/clear-cache.html`

### Method 4: Incognito/Private Mode
Open the site in incognito/private browsing mode to see if it's a cache issue.

## 🎯 Version Numbering Best Practices

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR (1.x.x):** Breaking changes, complete redesign
- **MINOR (x.1.x):** New features, significant updates
- **PATCH (x.x.1):** Bug fixes, minor tweaks

Examples:
- `v=1.0.0` → Initial version
- `v=1.0.1` → Bug fix
- `v=1.1.0` → New feature (chatbot added)
- `v=2.0.0` → Complete redesign

## 🚀 Quick Update Checklist

When deploying updates:

- [ ] Update CSS version in index.html
- [ ] Update JS version in index.html  
- [ ] Update CACHE_VERSION in sw.js
- [ ] Test in incognito mode
- [ ] Deploy changes
- [ ] Verify update notification appears
- [ ] Clear your own cache

## ⚡ Troubleshooting

**Q: Users still see old version after update?**
- Check if version numbers were updated
- Verify sw.js CACHE_VERSION is updated
- Direct users to clear-cache.html page
- Ask users to hard refresh (Ctrl+Shift+R)

**Q: Update notification not appearing?**
- Check browser console for errors
- Verify service worker is registered
- Wait 60 seconds for update check
- Reload the page

**Q: How to disable caching during development?**
- Use browser DevTools → Network tab → "Disable cache"
- Use incognito mode
- Visit clear-cache.html before testing

## 📊 Current Version

**Current Portfolio Version:** 1.0.1

**Last Updated:** November 5, 2025

---

**Note:** Remember to increment version numbers with every deployment to ensure users get the latest version!
