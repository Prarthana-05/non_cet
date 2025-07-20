import React from 'react';

const AboutUs = () => {
  return (
    <div className="about-us-section">
      <div className="about-container">
        <h2 className="about-title">About Us</h2>
        <p className="about-subtitle">Your trusted partner in educational journey</p>
        
        <div className="about-cards">
          <div className="about-card">
            <div className="card-icon">🎓</div>
            <h3>Our Mission</h3>
            <p>To simplify college admission process and help students find the perfect educational institution that matches their aspirations and goals.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">🌟</div>
            <h3>Why Choose Us</h3>
            <p>Comprehensive database of colleges, personalized recommendations, and expert guidance to make informed decisions about your future.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">📚</div>
            <h3>What We Offer</h3>
            <p>Detailed college information, course listings, admission requirements, and 24/7 chatbot support for all your queries.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">🤝</div>
            <h3>Our Support</h3>
            <p>Dedicated team of education counselors and AI-powered chatbot to assist you throughout your college selection journey.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">🎯</div>
            <h3>Success Stories</h3>
            <p>Over 10,000+ students have found their dream colleges through our platform with a 95% satisfaction rate.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">🚀</div>
            <h3>Future Ready</h3>
            <p>Constantly updating our database with latest college information and emerging courses to keep you ahead in your career.</p>
          </div>
        </div>

        <div className="about-stats">
          <div className="stat-item">
            <h4>500+</h4>
            <p>Colleges Listed</p>
          </div>
          <div className="stat-item">
            <h4>10,000+</h4>
            <p>Students Helped</p>
          </div>
          <div className="stat-item">
            <h4>50+</h4>
            <p>Courses Available</p>
          </div>
          <div className="stat-item">
            <h4>24/7</h4>
            <p>Support Available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;