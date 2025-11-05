# Project Structure

This document describes the organized folder structure of the portfolio project.

## Folder Organization

```
portfoliojm/
├── assets/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── script.js          # Main JavaScript file
│   │   └── emailjs-config.js  # EmailJS configuration
│   └── images/
│       ├── index.jpg          # Profile/hero image
│       ├── community-event-ind.jpg
│       ├── cris.jpg
│       ├── cyber-security-blog.jpg
│       ├── fun-proposal.jpg
│       ├── index3.jpg
│       ├── job-notifier.jpg
│       ├── testimonial.jpg
│       ├── tritoybox.jpg
│       ├── web-app-blog.jpg
│       └── webtools.jpg
├── index.html                 # Main HTML file
├── sw.js                      # Service Worker
├── resume.pdf                 # Resume file
├── README.md                  # Project documentation
└── CNAME                      # GitHub Pages domain

```

## File Paths

### CSS
- Main stylesheet: `assets/css/style.css`

### JavaScript
- Main script: `assets/js/script.js`
- EmailJS config: `assets/js/emailjs-config.js`

### Images
- All images are located in: `assets/images/`
- Images are referenced as: `assets/images/[filename].jpg`

## Benefits of This Structure

✅ **Better Organization** - Files are grouped by type
✅ **Easy Maintenance** - Easy to find and update files
✅ **Scalability** - Easy to add more files in the future
✅ **Professional** - Standard industry practice
✅ **Clean Root** - Less clutter in the main directory

## Usage

When adding new files:
- **Images**: Add to `assets/images/`
- **CSS**: Add to `assets/css/`
- **JavaScript**: Add to `assets/js/`

Update references in `index.html` accordingly.
