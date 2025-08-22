// Theme Toggle Functionality
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");

  if (body.getAttribute("data-theme") === "light") {
    body.setAttribute("data-theme", "dark");
    themeIcon.className = "fas fa-moon";
    localStorage.setItem("theme", "dark");
  } else {
    body.setAttribute("data-theme", "light");
    themeIcon.className = "fas fa-sun";
    localStorage.setItem("theme", "light");
  }
}

// Load saved theme
document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem("theme") || "dark";
  const themeIcon = document.getElementById("theme-icon");

  document.body.setAttribute("data-theme", savedTheme);
  themeIcon.className = savedTheme === "light" ? "fas fa-sun" : "fas fa-moon";
});

// Typing Animation
function typeWriter() {
  const text = "Jayanta Mardi";
  const element = document.querySelector("h1");
  let i = 0;

  function type() {
    if (i < text.length) {
      element.innerHTML =
        text.slice(0, i + 1) + '<span class="typing-animation"></span>';
      i++;
      setTimeout(type, 100);
    }
  }

  type();
}

// Skills Animation
function animateSkills() {
  const skillBars = document.querySelectorAll(".skill-progress");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const skillLevel = entry.target.getAttribute("data-skill");
          entry.target.style.width = skillLevel + "%";
        }
      });
    },
    { threshold: 0.5 }
  );

  skillBars.forEach((bar) => observer.observe(bar));
}

// Testimonials Slider
let currentTestimonial = 0;
const testimonials = document.querySelectorAll(".testimonial-card");

function showTestimonial(index) {
  testimonials.forEach((testimonial) => testimonial.classList.remove("active"));
  if (testimonials[index]) {
    testimonials[index].classList.add("active");
  }
}

function changeTestimonial(direction) {
  currentTestimonial += direction;

  if (currentTestimonial >= testimonials.length) {
    currentTestimonial = 0;
  } else if (currentTestimonial < 0) {
    currentTestimonial = testimonials.length - 1;
  }

  showTestimonial(currentTestimonial);
}

// Auto-rotate testimonials
function autoRotateTestimonials() {
  setInterval(() => {
    changeTestimonial(1);
  }, 5000);
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
  const navLinks = document.querySelectorAll("nav ul li a");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });
}

// Contact Form Handling
function initContactForm() {
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);
      const name = formData.get("name");
      const email = formData.get("email");
      const subject = formData.get("subject");
      const message = formData.get("message");

      // Basic validation
      if (!name || !email || !subject || !message) {
        showNotification("Please fill in all fields", "error");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
      }

      // Simulate form submission (replace with actual EmailJS implementation)
      showNotification("Message sent successfully!", "success");
      contactForm.reset();

      // EmailJS implementation (uncomment and configure)
      /*
            emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                from_name: name,
                from_email: email,
                subject: subject,
                message: message
            }).then(function(response) {
                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
            }, function(error) {
                showNotification('Failed to send message. Please try again.', 'error');
            });
            */
    });
  }
}

// Notification System
function showNotification(message, type) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === "success" ? "#4caf50" : "#f44336"};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

  // Add CSS animation
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Parallax Effect
function initParallax() {
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector(".hero");

    if (hero) {
      hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });
}

// Navigation Bar Scroll Effect
function initNavbarScroll() {
  const nav = document.querySelector("nav");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      nav.style.background = "rgba(0, 0, 0, 0.9)";
      nav.style.backdropFilter = "blur(10px)";
    } else {
      nav.style.background = "rgba(0, 0, 0, 0.1)";
      nav.style.backdropFilter = "blur(10px)";
    }
  });
}

// Scroll to Top Button
function createScrollToTop() {
  const scrollBtn = document.createElement("button");
  scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollBtn.className = "scroll-to-top";
  scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
        font-size: 18px;
    `;

  document.body.appendChild(scrollBtn);

  // Show/hide button based on scroll position
  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      scrollBtn.style.display = "block";
    } else {
      scrollBtn.style.display = "none";
    }
  });

  // Scroll to top functionality
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Hover effect
  scrollBtn.addEventListener("mouseenter", () => {
    scrollBtn.style.transform = "scale(1.1)";
  });

  scrollBtn.addEventListener("mouseleave", () => {
    scrollBtn.style.transform = "scale(1)";
  });
}

// Project Filter (if you want to add filtering functionality)
function initProjectFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");

      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Filter projects
      projects.forEach((project) => {
        if (filter === "all" || project.classList.contains(filter)) {
          project.style.display = "block";
          project.style.animation = "fadeIn 0.5s ease";
        } else {
          project.style.display = "none";
        }
      });
    });
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  // Create hamburger menu button
  const menuToggle = document.createElement("div");
  menuToggle.className = "mobile-menu-toggle";
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  menuToggle.style.cssText = `
        display: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        z-index: 1001;
    `;

  const nav = document.querySelector("nav");
  const navList = document.querySelector("nav ul");

  nav.appendChild(menuToggle);

  // Toggle menu
  menuToggle.addEventListener("click", () => {
    navList.classList.toggle("mobile-open");
    const icon = menuToggle.querySelector("i");
    icon.className = navList.classList.contains("mobile-open")
      ? "fas fa-times"
      : "fas fa-bars";
  });

  // Close menu when clicking on a link
  const navLinks = document.querySelectorAll("nav ul li a");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("mobile-open");
      menuToggle.querySelector("i").className = "fas fa-bars";
    });
  });

  // Add mobile styles
  const mobileStyles = document.createElement("style");
  mobileStyles.textContent = `
        @media (max-width: 900px) {
            .mobile-menu-toggle {
                display: block !important;
            }
            
            nav ul {
                position: fixed;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                flex-direction: column;
                justify-content: center;
                align-items: center;
                transition: left 0.3s ease;
                z-index: 1000;
            }
            
            nav ul.mobile-open {
                left: 0;
            }
            
            nav ul li {
                margin: 20px 0;
            }
            
            nav ul li a {
                font-size: 24px;
            }
        }
    `;
  document.head.appendChild(mobileStyles);
}

// Counter Animation
function animateCounters() {
  const counters = document.querySelectorAll(".counter");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute("data-target"));
          const increment = target / 100;
          let current = 0;

          const updateCounter = () => {
            if (current < target) {
              current += increment;
              counter.textContent = Math.ceil(current);
              setTimeout(updateCounter, 20);
            } else {
              counter.textContent = target;
            }
          };

          updateCounter();
          observer.unobserve(counter);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

// Preloader
function initPreloader() {
  // Create preloader element
  const preloader = document.createElement("div");
  preloader.className = "preloader";
  preloader.innerHTML = `
        <div class="preloader-content">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;

  // Add preloader styles
  const preloaderStyles = document.createElement("style");
  preloaderStyles.textContent = `
        .preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-color);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s ease;
        }
        
        .preloader-content {
            text-align: center;
            color: var(--text-color);
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid var(--border-color);
            border-top: 5px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
  document.head.appendChild(preloaderStyles);
  document.body.appendChild(preloader);

  // Hide preloader when page loads
  window.addEventListener("load", () => {
    setTimeout(() => {
      preloader.style.opacity = "0";
      setTimeout(() => {
        preloader.remove();
      }, 500);
    }, 1000);
  });
}

// Initialize all functions when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all features
  initPreloader();
  typeWriter();
  animateSkills();
  autoRotateTestimonials();
  initSmoothScrolling();
  initContactForm();
  initParallax();
  initNavbarScroll();
  createScrollToTop();
  initMobileMenu();
  animateCounters();

  // Initialize AOS if available
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });
  }

  // Add intersection observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-on-scroll");
      }
    });
  }, observerOptions);

  // Observe all sections
  const sections = document.querySelectorAll(
    "section, .content, .contact-me, footer"
  );
  sections.forEach((section) => {
    observer.observe(section);
  });
});

// Add resize event listener for responsive adjustments
window.addEventListener("resize", () => {
  // Recalculate any responsive elements if needed
  if (window.innerWidth > 900) {
    const navList = document.querySelector("nav ul");
    navList.classList.remove("mobile-open");
    const menuToggle = document.querySelector(".mobile-menu-toggle i");
    if (menuToggle) {
      menuToggle.className = "fas fa-bars";
    }
  }
});

// Service Worker Registration (for PWA functionality)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
