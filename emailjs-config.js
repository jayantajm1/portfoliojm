// EmailJS Configuration
// To set up EmailJS for the contact form:

/*
1. Go to https://www.emailjs.com/
2. Create a free account
3. Create an email service (Gmail, Outlook, etc.)
4. Create an email template with these variables:
   - {{from_name}}
   - {{from_email}}
   - {{subject}}
   - {{message}}
5. Get your Public Key, Service ID, and Template ID
6. Replace the values below:
*/

const EMAILJS_CONFIG = {
  PUBLIC_KEY: "YOUR_PUBLIC_KEY_HERE",
  SERVICE_ID: "YOUR_SERVICE_ID_HERE",
  TEMPLATE_ID: "YOUR_TEMPLATE_ID_HERE",
};

// Example EmailJS initialization (uncomment and configure)
/*
// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// Contact form submission
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, {
        from_name: formData.get('name'),
        from_email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    }).then(function(response) {
        showNotification('Message sent successfully!', 'success');
        document.getElementById('contactForm').reset();
    }, function(error) {
        showNotification('Failed to send message. Please try again.', 'error');
    });
});
*/

module.exports = EMAILJS_CONFIG;
