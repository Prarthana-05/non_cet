import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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
      {/* Header */}
      <div className="header">
        <h1>VidyarthiMitra Non-Cet College</h1>
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
        <div className="submit-section">
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
