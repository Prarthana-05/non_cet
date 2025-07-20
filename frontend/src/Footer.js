import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-content">
          {/* Contact Information Section */}
          <div className="footer-section">
            <h3>📞 Contact & Support</h3>
            <p>
              📧 <a href="mailto:contact@vidyarthimitra.org">contact@vidyarthimitra.org</a>
            </p>
            <p>
              📧 <a href="mailto:info@vidyarthimitra.org">info@vidyarthimitra.org</a>
            </p>
            <p>
              📞 <a href="tel:+917720025900">+91 77200-25900</a>
            </p>
            <p>
              📞 <a href="tel:+917720081400">+91 77200-81400</a>
            </p>
          </div>

          {/* Social Media & Links Section */}
          <div className="footer-section">
            <h3>🌐 Connect With Us</h3>
            <div className="social-links">
              <a href="https://vidyarthimitra.org" target="_blank" rel="noopener noreferrer">
                🌐 Official Website
              </a>
              <a href="https://www.linkedin.com/in/vidyarthi-mitra?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer">
                💼 LinkedIn
              </a>
              <a href="https://www.instagram.com/vidyarthi_mitra?igsh=MTFiYjZjNjZyNzdrdw==" target="_blank" rel="noopener noreferrer">
                📸 Instagram
              </a>
              <a href="https://vidyarthimitra.org/guideme" target="_blank" rel="noopener noreferrer">
                🧭 GuideMe
              </a>
              <a href="https://epaper.vidyarthimitra.org" target="_blank" rel="noopener noreferrer">
                📰 e-Paper
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Copyright Section */}
        <div className="footer-bottom">
          <p>© 2025 Vidyarthi Mitra. All rights reserved. | Empowering Students, Enabling Futures</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;