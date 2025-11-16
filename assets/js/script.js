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

// Resume Dropdown Functionality
const resumeBtn = document.getElementById("resume-btn");
const resumeOptions = document.getElementById("resume-options");

if (resumeBtn && resumeOptions) {
  resumeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    resumeOptions.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!resumeBtn.contains(e.target) && !resumeOptions.contains(e.target)) {
      resumeOptions.classList.remove("show");
    }
  });

  // Close dropdown after selecting an option
  const resumeOptionLinks = resumeOptions.querySelectorAll(".resume-option");
  resumeOptionLinks.forEach((link) => {
    link.addEventListener("click", function () {
      resumeOptions.classList.remove("show");
    });
  });
}

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
  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);
      const name = formData.get("from_name");
      const email = formData.get("from_email");
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

      // Show sending message
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending...';
      submitButton.disabled = true;

      // EmailJS implementation
      emailjs
        .send("service_portfoliojm", "template_5euef4n", {
          name: name, // For {{name}} in your template
          from_name: name, // For {{from_name}} if you update template
          from_email: email,
          subject: subject,
          message: message,
          to_email: "jayantaofficial84@gmail.com", // For {{to_email}} in template
        })
        .then(
          function (response) {
            showNotification("Message sent successfully!", "success");
            contactForm.reset();
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
          },
          function (error) {
            console.error("EmailJS Error:", error);
            showNotification(
              "Failed to send message. Please try again.",
              "error"
            );
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
          }
        );
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
  // Initialize EmailJS
  if (typeof emailjs !== "undefined") {
    emailjs.init("6MWgYgaBSkGv2uS19"); // Your EmailJS Public Key
  }

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

// About Tabs Functionality
function initAboutTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Show corresponding tab pane
      const tabId = button.getAttribute("data-tab");
      const tabPane = document.getElementById(tabId);
      if (tabPane) {
        tabPane.classList.add("active");
      }
    });
  });
}

// Initialize tabs when DOM is loaded
document.addEventListener("DOMContentLoaded", initAboutTabs);

// Blog Detail Page Toggle
document.addEventListener("DOMContentLoaded", function () {
  // Handle "Read More" clicks on blog cards
  const blogLinks = document.querySelectorAll(".blog-card .btn-link");
  const blogSection = document.querySelector(".blog");
  const blogDetailSections = document.querySelectorAll(".blog-detail");

  blogLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href.startsWith("#") && href !== "#") {
        e.preventDefault();

        // Hide blog grid
        if (blogSection) blogSection.style.display = "none";

        // Hide all blog detail sections first
        blogDetailSections.forEach((section) => {
          section.style.display = "none";
        });

        // Show the specific blog detail section
        const targetSection = document.querySelector(href);
        if (targetSection) {
          targetSection.style.display = "block";
          // Scroll to top of blog detail
          targetSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Handle "Back to Blog" clicks (multiple buttons)
  const backToButtons = document.querySelectorAll(
    ".blog-navigation .btn-secondary"
  );
  backToButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      // Hide all blog detail sections
      blogDetailSections.forEach((section) => {
        section.style.display = "none";
      });

      // Show blog grid
      if (blogSection) {
        blogSection.style.display = "block";
        blogSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

// Service Worker Registration with auto-update (for PWA functionality)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available, prompt user to refresh
              if (
                confirm(
                  "New version available! Reload to get the latest updates?"
                )
              ) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });

  // Reload page when new service worker takes control
  let refreshing;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// ============== Chatbot Functionality ==============

// Q&A Database
const chatbotQA = {
  greetings: {
    keywords: ["hi", "hello", "hlw", "hey", "hello there"],
    answer:
      "Hello — I'm your quick assistant. How can I help you today? Ask me about my skills, experience, projects, or anything else you'd like to know.",
  },
  skills: {
    keywords: [
      "skill",
      "technology",
      "tech",
      "languages",
      "programming",
      "what you know",
    ],
    answer:
      "I specialize in Web Development (HTML, CSS, JavaScript, Angular), Backend Development (Asp.net,Node.js), Database Management (PostgreSQL,SQl, MongoDB), and Cloud Services (Firebase, Google Cloud).",
  },
  experience: {
    keywords: ["experience", "work", "job", "worked", "career", "professional"],
    answer:
      "I have 1+ year of professional experience as a Full Stack Developer. I've worked on various projects including e-commerce platforms, job notification systems, educational websites, and custom web applications. Check out my Experience section for detailed timeline!",
  },
  education: {
    keywords: [
      "education",
      "study",
      "degree",
      "qualification",
      "school",
      "university",
      "college",
    ],
    answer:
      "I hold a Bachelor's degree in Computer Science with specialization in Software Engineering. I've also completed numerous online certifications in Web Development, Cloud Computing, and Cybersecurity. View my Education tab for more details!",
  },
  projects: {
    keywords: [
      "project",
      "work sample",
      "portfolio",
      "built",
      "created",
      "developed",
    ],
    answer:
      "I've built several exciting projects: 🔹 Job Notifier - Government job alerts platform 🔹 TritoyBox - Educational website for students 🔹 WebTools - Collection of useful web utilities 🔹 Fun Proposal - Creative proposal website. Check the Projects section to see more!",
  },
  contact: {
    keywords: [
      "contact",
      "reach",
      "email",
      "phone",
      "hire",
      "available",
      "touch",
    ],
    answer:
      "You can reach me via email at jayantaofficial84@gmail.com or call me at +91 9083655784. Feel free to use the contact form below or connect with me on LinkedIn and GitHub. I'm always open to new opportunities!",
  },
  services: {
    keywords: ["service", "offer", "provide", "do", "help"],
    answer:
      "I offer three main services: 💻 Web Development - Full-stack web applications 📱 App Development - Cross-platform mobile apps ☁️ Cloud Solutions - Scalable cloud infrastructure. Let me know what you need!",
  },
  location: {
    keywords: ["location", "where", "based", "from", "live", "city"],
    answer:
      "I'm based in India and work with clients globally. I'm comfortable working remotely and across different time zones to deliver quality solutions!",
  },
  technologies: {
    keywords: ["tools", "framework", "library", "software", "use"],
    answer:
      "I work with modern technologies including React, Node.js, Flutter, Firebase, MongoDB, MySQL, AWS, Git, Docker, and more. I stay updated with the latest industry trends and continuously learn new tools!",
  },
  availability: {
    keywords: ["available", "free", "time", "when", "schedule"],
    answer:
      "I'm currently available for freelance projects and full-time opportunities. I typically respond within 24 hours. Use the contact form or email me directly to discuss your project!",
  },
  hire: {
    keywords: ["hire", "cost", "price", "rate", "budget", "quote"],
    answer:
      "I'd love to work with you! Project costs vary based on requirements, complexity, and timeline. Please fill out the contact form with your project details, and I'll provide a customized quote within 24 hours!",
  },
  resume: {
    keywords: ["resume", "cv", "curriculum", "download resume", "download cv"],
    answer:
      "You can download my resume from the Resume section on this site or request a copy via email at jayantaofficial84@gmail.com. Would you like me to open the Resume section for you?",
  },
  social: {
    keywords: ["github", "linkedin", "social", "profiles", "social media"],
    answer:
      "Find my work and connect with me on GitHub: https://github.com/jayantajm1 and LinkedIn: https://www.linkedin.com/in/jayanta-mardi/ — feel free to follow or message me there!",
  },
  blog: {
    keywords: ["blog", "articles", "posts", "write"],
    answer:
      "I write occasional technical posts and guides. Check the Blog section on this site for the latest articles like 'HP WiFi Fixer'. Would you like me to open the Blog section?",
  },
  certifications: {
    keywords: ["certification", "certificate", "courses", "certified"],
    answer:
      "I've completed a number of online certifications in Web Development, Cloud Computing, and Cybersecurity. You can find details in the Education section or request specific certificates by email.",
  },
  process: {
    keywords: ["process", "how you work", "workflow", "development process"],
    answer:
      "My typical process: 1) Requirements & discovery, 2) Proposal & timeline, 3) Design & development, 4) Testing & review, 5) Deployment & support. I keep regular communication and deliver incremental updates.",
  },
  demo: {
    keywords: ["demo", "show", "preview", "live demo"],
    answer:
      "I can provide demos or walkthroughs of past projects. Tell me which project you're interested in and I can prepare a short demo or provide a link to a live preview.",
  },
  testimonials: {
    keywords: ["testimonials", "reviews", "feedback", "clients"],
    answer:
      "You can find client feedback and testimonials in the Testimonials section on this site. If you'd like, I can show you recent client reviews or share references.",
  },
};

// Chatbot Elements
const chatbotToggle = document.getElementById("chatbot-toggle");
const chatbotContainer = document.getElementById("chatbot");
const chatbotClose = document.getElementById("chatbot-close");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInputField = document.getElementById("chatbot-input-field");
const chatbotSend = document.getElementById("chatbot-send");
const chatbotSuggestions = document.querySelectorAll(".suggestion-btn");

// Chatbot State
let isChatbotOpen = false;

// Toggle Chatbot
function toggleChatbot() {
  isChatbotOpen = !isChatbotOpen;
  chatbotContainer.classList.toggle("active");
  chatbotToggle.classList.toggle("active");

  // Remove badge when opened
  if (isChatbotOpen) {
    chatbotToggle.querySelector(".chatbot-badge").style.display = "none";

    // Show welcome message if no messages
    if (chatbotMessages.children.length === 0) {
      addBotMessage(
        "👋 Hi! I'm here to help you learn more about me and my work. Feel free to ask anything or click on a suggestion below!"
      );
    }
  }
}

// Add Bot Message
function addBotMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "bot-message";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = message;

  messageDiv.appendChild(contentDiv);
  chatbotMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Add User Message
function addUserMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "user-message";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = message;

  messageDiv.appendChild(contentDiv);
  chatbotMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Scroll to Bottom
function scrollToBottom() {
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Find Answer
function findAnswer(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  // Check each Q&A entry
  for (const [key, qa] of Object.entries(chatbotQA)) {
    for (const keyword of qa.keywords) {
      if (lowerMessage.includes(keyword)) {
        return qa.answer;
      }
    }
  }

  // Default response if no match
  return "I'm not sure about that. Try asking about my skills, experience, education, projects, services, or how to contact me! You can also use the suggestion buttons below.";
}

// Handle User Input
function handleUserInput() {
  const userMessage = chatbotInputField.value.trim();

  if (userMessage === "") return;

  // Add user message
  addUserMessage(userMessage);
  chatbotInputField.value = "";

  // Simulate typing delay
  setTimeout(() => {
    const answer = findAnswer(userMessage);
    addBotMessage(answer);
  }, 500);
}

// Event Listeners
chatbotToggle.addEventListener("click", toggleChatbot);
chatbotClose.addEventListener("click", toggleChatbot);

chatbotSend.addEventListener("click", handleUserInput);

chatbotInputField.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleUserInput();
  }
});

// Suggestion Buttons
chatbotSuggestions.forEach((btn) => {
  btn.addEventListener("click", () => {
    const question = btn.textContent;
    addUserMessage(question);

    setTimeout(() => {
      const answer = findAnswer(question);
      addBotMessage(answer);
    }, 500);
  });
});
