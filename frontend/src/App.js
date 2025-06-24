import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.png';

function App() {
  const [formData, setFormData] = useState({
    courseName: '',
    studentName: '',
    city: '',
    searchQuery: '',
    educationLevel: '',
    specialization: ''
  });


  const [showChat, setShowChat] = useState(false);
const [chatInput, setChatInput] = useState('');
const [chatMessages, setChatMessages] = useState([
  { from: 'bot', text: 'Hi! I am here to help. Ask me anything.' }
]);

const handleChatSend = async () => {
  if (!chatInput.trim()) return;

  const userMessage = { from: 'user', text: chatInput };
  setChatMessages(prev => [...prev, userMessage]);

  try {
    const res = await axios.post('http://localhost:5000/api/students/chatbot', {
      message: chatInput
    });

    const botMessage = { from: 'bot', text: res.data.reply };
    setChatMessages(prev => [...prev, botMessage]);
  } catch (error) {
    console.error('Error from chatbot:', error);
    setChatMessages(prev => [...prev, { from: 'bot', text: 'Sorry, something went wrong.' }]);
  }

  setChatInput('');
};


  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const collegesPerPage = 7;
  const [loggedIn, setLoggedIn] = useState(false);

const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
const [authError, setAuthError] = useState('');
const [authSuccess, setAuthSuccess] = useState('');


  useEffect(() => {
    const fetchSpecializations = async () => {
      if (formData.courseName) {
        try {
          const res = await axios.get(`http://localhost:5000/api/students/specializations?stream=${formData.courseName}`);
          setSpecializations(res.data.data.map(item => item.course));
          console.log('Selected Stream:', formData.courseName);
          console.log('Fetched specializations:', res.data.data);
        } catch (error) {
          console.error('Error fetching specializations:', error);
          setSpecializations([]);
        }
      } else {
        setSpecializations([]);
      }
    };

    fetchSpecializations();
  }, [formData.courseName]);

  useEffect(() => {
    if (formData.specialization) {
      console.log('Selected Specialization:', formData.specialization);
    }
  }, [formData.specialization]);

  // Modified useEffect for cities - only fetch for Undergraduate
  useEffect(() => {
    const fetchCities = async () => {
      // Only fetch cities for Undergraduate courses
      if (formData.courseName && formData.educationLevel === 'Undergraduate') {
        try {
          const res = await axios.get(`http://localhost:5000/api/students/cities?stream=${formData.courseName}`);
          setCities(res.data.data.map(item => item.city));
          console.log('Fetched cities:', res.data.data);
        } catch (error) {
          console.error('Error fetching cities:', error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    fetchCities();
  }, [formData.courseName, formData.educationLevel]);

  // Modified useEffect for colleges - conditional city parameter
  useEffect(() => {
    const fetchColleges = async () => {
      if (formData.courseName && formData.specialization) {
        // For Undergraduate: require city selection
        // For Postgraduate: don't require city
        if (formData.educationLevel === 'Undergraduate' && !formData.city) {
          setColleges([]);
          return;
        }

        try {
          let url = `http://localhost:5000/api/students/colleges?stream=${formData.courseName}&specialization=${formData.specialization}`;
          
          // Only add city parameter for Undergraduate
          if (formData.educationLevel === 'Undergraduate' && formData.city) {
            url += `&city=${formData.city}`;
          }

          const res = await axios.get(url);
          setColleges(res.data.data);
          console.log('Fetched colleges:', res.data.data);
        } catch (error) {
          console.error('Error fetching colleges:', error);
          setColleges([]);
        }
      } else {
        setColleges([]);
      }
    };

    fetchColleges();
  }, [formData.courseName, formData.specialization, formData.city, formData.educationLevel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'educationLevel') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        courseName: '',
        specialization: '',
        city: '' // Clear city when education level changes
      }));
      setColleges([]);
    }
    else if (name === 'courseName') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        specialization: '',
        city: '' // Clear city when stream changes
      }));
      setColleges([]);
    }
    else if (name === 'specialization') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setColleges([]);
      console.log('Selected Specialization:', value);
    }
    else if (name === 'searchQuery') {
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  // Trigger college search by name
  if (value.trim() !== '') {
    fetchCollegeBySearch(value.trim());
  } else {
    setColleges([]);
    setShowResults(false);
  }
}

    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };





  const fetchCollegeBySearch = async (query) => {
  try {
    const res = await axios.get(`http://localhost:5000/api/students/search-college?q=${query}`);
    setColleges(res.data.data);
    setShowResults(true);
    setCurrentPage(1);
    console.log('Colleges fetched by search:', res.data.data);
  } catch (error) {
    console.error('Error searching colleges:', error);
    setColleges([]);
    setShowResults(false);
  }
};


  const handleSubmit = async () => {
    // Modified validation - city only required for Undergraduate
    const isCityRequired = formData.educationLevel === 'Undergraduate';
    
    if (!formData.educationLevel || !formData.courseName || !formData.specialization || !formData.studentName) {
      alert('Please fill all required fields');
      return;
    }

    if (isCityRequired && !formData.city) {
      alert('Please select a city');
      return;
    }

    try {
      let url = `http://localhost:5000/api/students/colleges?stream=${formData.courseName}&specialization=${formData.specialization}`;
      
      // Only add city parameter for Undergraduate
      if (formData.educationLevel === 'Undergraduate' && formData.city) {
        url += `&city=${formData.city}`;
      }

      const res = await axios.get(url);
      setColleges(res.data.data);
      setShowResults(true);
      setCurrentPage(1);
      console.log('Fetched colleges on submit:', res.data.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      alert('Error fetching colleges. Please try again.');
    }
  };

  // Pagination logic
  const indexOfLastCollege = currentPage * collegesPerPage;
  const indexOfFirstCollege = indexOfLastCollege - collegesPerPage;
  const currentColleges = colleges.slice(indexOfFirstCollege, indexOfLastCollege);
  const totalPages = Math.ceil(colleges.length / collegesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };


 

const handleAuthChange = (e) => {
  const { name, value } = e.target;
  setAuthData(prev => ({ ...prev, [name]: value }));
};

const handleAuthSubmit = async () => {
  try {
    const url = authMode === 'login'
      ? 'http://localhost:5000/api/students/login'
      : 'http://localhost:5000/api/students/register';

    const payload = authMode === 'login'
      ? { email: authData.email, password: authData.password }
      : authData;

    const res = await axios.post(url, payload);

    if (res.data.success) {
  const user = res.data.user;
  if (authMode === 'login') {
    setLoggedIn(true);
    setAuthSuccess('Login successful');

    // ✅ Automatically set the logged-in user's name
    setFormData(prev => ({
      ...prev,
      studentName: user.name
    }));
  } else {
    setAuthSuccess('Registered successfully');
    setAuthMode('login'); // Switch to login
  }
  setAuthError('');
}

  } catch (error) {
    setAuthError(error.response?.data?.message || 'Something went wrong');
    setAuthSuccess('');
  }
};



  return loggedIn ?(
    <div className="app">
      {/* Watermark */}
      <div className="watermark"></div>
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="header-logo" />
        </div>
        <div className="header-right">
          <h1>VidyarthiMitra Non-Cet College</h1>
          <div className="header-subtitle">Empowering Your College Search</div>
        </div>
      </div>

      <div className="container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            className="text-input"
            name="searchQuery"
            value={formData.searchQuery || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="education-level-group">
          <label className="label">Select Education Level:</label>
          <div className="education-level-options">
            <label>
              <input
                type="radio"
                name="educationLevel"
                value="Undergraduate"
                checked={formData.educationLevel === 'Undergraduate'}
                onChange={handleInputChange}
              />
              Undergraduate
            </label>
            <label>
              <input
                type="radio"
                name="educationLevel"
                value="Postgraduate"
                checked={formData.educationLevel === 'Postgraduate'}
                onChange={handleInputChange}
              />
              Postgraduate
            </label>
          </div>
        </div>
   
        <div className="course-selection">
          <label className="label">
            Select Stream:
          </label>
          <select 
            name="courseName"
            value={formData.courseName}
            onChange={handleInputChange}
            className="select-dropdown course-select"
            disabled={!formData.educationLevel}
          >
            <option value="">Select Stream</option>
            {formData.educationLevel === 'Undergraduate' && (
              <>
                <option value="Sports Management">Bachelors in Sports Management</option>
                <option value="Fine Arts">Bachelors in Fine Arts</option>
                <option value="Performing Arts">Bachelors in Performing Arts</option>
                <option value="Management">Bachelors in Management Studies</option>
                <option value="Science">Bachelors in Science</option>
                <option value="Commerce">Bachelors in Commerce</option>
                <option value="Arts">Bachelors in Arts</option>
                <option value="Vocational">Bachelors in Vocational</option>
                <option value="International Accounting">Bachelors in International Accounting</option>
              </>
            )}
            {formData.educationLevel === 'Postgraduate' && (
              <>
                <option value="Master of Science">Master of Science</option>
                <option value="Master of Arts">Master of Arts</option>
                <option value="Master of Commerce">Master of Commerce</option>
                <option value="MA Psychology">MA Psychology</option>
              </>
            )}
          </select>
        </div>

       {/* Specialization Dropdown */}
<div className="specialization-group">
  <label className="label">Select Specialization:</label>
  <select
    name="specialization"
    value={formData.specialization}
    onChange={handleInputChange}
    className="select-dropdown"
  >
    <option value="">Select Specialization</option>
    {specializations.map((spec, index) => (
      <option key={index} value={spec}>{spec}</option>
    ))}
  </select>
</div>

        {/* Filter Colleges Section */}
        <div className="filter-section">
          <h2 className="section-title">Filter Colleges</h2>
          
          {/* Student Name */}
          <div className="form-group">
            <label className="label">
              Student Name:
            </label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className="text-input"
              readOnly
            />
          </div>

          {/* City Selection - Only show for Undergraduate */}
          {formData.educationLevel === 'Undergraduate' && (
            <div className="form-row">
              <div className="form-group">
                <label className="label">
                  City:
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="select-dropdown"
                  disabled={!formData.courseName}
                >
                  <option value="">Select City</option>
                  <option value="All">All</option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="submit-section" style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            className="submit-btn"
            disabled={showResults}
          >
            {showResults ? 'Results Displayed' : 'Submit'}
          </button>
        </div>

        {/* Results Table */}
        {showResults && colleges.length > 0 && (
          <div className="results-section">
            <h2 className="section-title">Available Colleges ({colleges.length} found)</h2>
            <table className="colleges-table">
              <thead>
                <tr>
                  {colleges[0]?.college_code && <th>College Code</th>}
                  <th>College Name</th>
                  {colleges[0]?.city && <th>City</th>}
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {currentColleges.map((college, index) => (
                  <tr key={index}>
  {college.college_code && <td>{college.college_code}</td>}
  <td>{college.institute_name}</td>
  {college.city && <td>{college.city}</td>}
  <td>{college.course}</td>
</tr>

                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {showResults && colleges.length > 0 && (
          <div className="pagination">
            <button 
              className="pagination-btn" 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button 
              className="pagination-btn" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}



        


        {/* Chatbot Button and Box */}
<button className="chat-toggle-btn" onClick={() => setShowChat(prev => !prev)}>
  {showChat ? 'Close Chat' : 'Chatbot'}
</button>

{showChat && (
  <div className="chatbot-container">
    <div className="chatbot-header">
      Chatbot
      <button className="chatbot-close-btn" onClick={() => setShowChat(false)}>×</button>
    </div>
    <div className="chatbot-messages">
      {chatMessages.map((msg, idx) => (
        <div
          key={idx}
          className={msg.from === 'bot' ? 'chatbot-message-bot' : 'chatbot-message-user'}
        >
          {msg.text}
        </div>
      ))}
    </div>
    <div className="chatbot-input">
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleChatSend}>Send</button>
    </div>
  </div>
)}

      </div> 
      {/* Footer */}
      <footer className="footer">
        <div className="footer-top-bar"></div>
        <div className="footer-content">
          <div className="footer-section social">
            <div className="footer-title">Connect with us</div>
            <div className="footer-icons">
              <a href="https://www.linkedin.com/company/vidyarthimitra" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/></svg>
              </a>
              <a href="https://twitter.com/vidyarthimitra" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482c-4.086-.205-7.713-2.164-10.141-5.144a4.822 4.822 0 0 0-.664 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z"/></svg>
              </a>
              <a href="https://www.instagram.com/vidyarthimitra" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608-.058-1.266-.069-1.646-.069-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308 1.266-.058 1.646-.069 4.85-.069zm0-2.163c-3.259 0-3.667.012-4.947.07-1.276.058-2.687.334-3.678 1.325-.991.991-1.267 2.402-1.325 3.678-.058 1.28-.07 1.688-.07 4.947s.012 3.667.07 4.947c.058 1.276.334 2.687 1.325 3.678.991.991 2.402 1.267 3.678 1.325 1.28.058 1.688.07 4.947.07s3.667-.012 4.947-.07c1.276-.058 2.687-.334 3.678-1.325.991-.991 1.267-2.402 1.325-3.678.058-1.28.07-1.688.07-4.947s-.012-3.667-.07-4.947c-.058-1.276-.334-2.687-1.325-3.678-.991-.991-2.402-1.267-3.678-1.325-1.28-.058-1.688-.07-4.947-.07zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://www.vidyarthimitra.org" target="_blank" rel="noopener noreferrer" aria-label="Website">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10C22 6.477 17.523 2 12 2zm0 2c1.657 0 3.156.672 4.242 1.758A5.978 5.978 0 0 1 19.197 8H16.5a.5.5 0 0 0 0 1h2.697c.13.646.203 1.32.203 2 0 .68-.073 1.354-.203 2H16.5a.5.5 0 0 0 0 1h2.697a5.978 5.978 0 0 1-2.955 2.242A7.963 7.963 0 0 1 12 20a7.963 7.963 0 0 1-4.242-1.758A5.978 5.978 0 0 1 4.803 16H7.5a.5.5 0 0 0 0-1H4.803A7.963 7.963 0 0 1 4 12c0-.68.073-1.354.203-2H7.5a.5.5 0 0 0 0-1H4.803a5.978 5.978 0 0 1 2.955-2.242A7.963 7.963 0 0 1 12 4zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 12 6z"/></svg>
              </a>
            </div>
          </div>
          <div className="footer-section website">
            <div className="footer-title">Official Website</div>
            <a href="https://www.vidyarthimitra.org" className="footer-link" target="_blank" rel="noopener noreferrer">www.vidyarthimitra.org</a>
          </div>
          <div className="footer-section contact">
            <div className="footer-title">CONTACT <span className="footer-highlight">US</span></div>
            <hr className="footer-divider" />
            <div className="footer-contact-item"><i className="fas fa-phone"></i> +91 77200 25900</div>
            <div className="footer-contact-item"><i className="fas fa-phone"></i> +91 77200 81400</div>
            <div className="footer-contact-item"><i className="fas fa-envelope"></i> contact@vidyarthimitra.org</div>
            <div className="footer-contact-item"><i className="fas fa-envelope"></i> info@vidyarthimitra.org</div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2025 VidyarthiMitra. All rights reserved.
        </div>
      </footer>
    </div> 
) : (
  <div className="login-container">
    <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>

    {authMode === 'register' && (
      <input
        type="text"
        name="name"
        placeholder="Your Name"
        value={authData.name}
        onChange={handleAuthChange}
        className="text-input"
      />
    )}

    <input
      type="email"
      name="email"
      placeholder="Email"
      value={authData.email}
      onChange={handleAuthChange}
      className="text-input"
    />
    <input
      type="password"
      name="password"
      placeholder="Password"
      value={authData.password}
      onChange={handleAuthChange}
      className="text-input"
    />

    <button className="submit-btn" onClick={handleAuthSubmit}>
      {authMode === 'login' ? 'Login' : 'Register'}
    </button>

    <p style={{ marginTop: '10px' }}>
      {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
      <button
        onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {authMode === 'login' ? 'Register' : 'Login'}
      </button>
    </p>

    {authError && <p style={{ color: 'red' }}>{authError}</p>}
    {authSuccess && <p style={{ color: 'green' }}>{authSuccess}</p>}
  </div>
);

}

export default App;