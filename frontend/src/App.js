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
    specialization: '',
    university: ''
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
          const res = await axios.get(`http://localhost:5000/api/students/specializations?stream=${formData.courseName}&university=${formData.university}`);

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
  },[formData.courseName, formData.university]);

  useEffect(() => {
    if (formData.specialization) {
      console.log('Selected Specialization:', formData.specialization);
    }
  }, [formData.specialization]);

  // Modified useEffect for cities - only fetch for Undergraduate
  useEffect(() => {
    const fetchCities = async () => {
      // Only fetch cities for Undergraduate courses
      const eligibleLevels = ['Undergraduate', 'Diploma', 'Certificate', 'Integrated'];
      if (formData.courseName && eligibleLevels.includes(formData.educationLevel)) {
        try {
         const res = await axios.get(`http://localhost:5000/api/students/cities?stream=${formData.courseName}&university=${formData.university}`);

        setCities(res.data.data);

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
  }, [formData.courseName, formData.educationLevel, formData.university]);

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
          let url = `http://localhost:5000/api/students/colleges?stream=${formData.courseName}&specialization=${formData.specialization}&university=${formData.university}`;
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
  },[formData.courseName, formData.specialization, formData.city, formData.educationLevel, formData.university]);

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
let url = `http://localhost:5000/api/students/colleges?stream=${formData.courseName}&specialization=${formData.specialization}&university=${formData.university}`;
     
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

const streamOptions = {
  'Mumbai University': {
    Undergraduate: [
      'Arts',
      'Science',
      'Commerce',
      'Fine Arts',
      'Vocational',
      'International Accounting',
      'Management',
      'Performing Arts',
      'Tourism and Travel Managment',
      'Architecture',
      'Gujarati',
      'Adv.Dip.in Accounting and Taxation',
      'Sports Management'
    ],
    Postgraduate: [
      'Master of Science',
      'Master of Arts',
      'Master of Commerce',
      'MA Psychology'
    ],
    Integrated: ['Integrated Master of Science'],
    
    Diploma:[
      'Diploma Course',
      'Advanced Diploma Course'
    ],

    Certificate:[
      'Certificate Course',
      'Teacher Training Certificate Course'
    ],
    

  },
  'Pune University': {
    Undergraduate: ['Science', 'Commerce', 'Arts'],
    Postgraduate: ['Master of Science', 'Master of Commerce']
  },
'Savitribai Phule Pune University':{},
'Shivaji University':{},
'Dr. Babasaheb Ambedkar Marathwada University':{},
'Rashtrasant Tukadoji Maharaj Nagpur University':{},
'North Maharashtra University':{},
'Sant Gadge Baba Amravati University':{},
'Solapur University':{},
'Swami Ramanand Teerth Marathwada University':{},
'Dr. Babasaheb Ambedkar Technological University':{},
'Yashwantrao Chavan Maharashtra Open University':{},
'Gondwana University':{},
'Kavikulaguru Kalidas Sanskrit University':{},
'Maharashtra University of Health Sciences':{},
'Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth':{},
'Vasantrao Naik Marathwada Krishi Vidyapeeth':{},
'Mahatma Phule Krishi Vidyapeeth':{},
'Maharashtra National Law University (Mumbai)':{},
'Maharashtra National Law University (Nagpur)':{},
'Maharashtra National Law University (Aurangabad)':{},
'Dr. Homi Bhabha State University':{},
'COEP Technological University':{},
'Cluster University of Nagpur':{},
'Cluster University of Mumbai':{},
'Cluster University of Pune':{},
};


  return loggedIn ?(
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="logo-title">
          <img src="/logo.png" alt="Vidyarthi Mitra Logo" className="logo" />

          <h1>🎓 VidyarthiMitra Non-Cet College</h1>
      </div>
    </div>


      <div className="container">
        <div className="search-bar">
          
          <input
            type="text"
            placeholder="🔍 Search colleges..."

            className="text-input"
            name="searchQuery"
            value={formData.searchQuery || ''}
            onChange={handleInputChange}
          />
        </div>


           <select name="university" value={formData.university} onChange={handleInputChange} className="select-dropdown">
  <option value="">Select University</option>
  
  <option value="Mumbai University">Mumbai University</option>
  <option value="Pune University">Pune University</option>
  <option value="Savitribai Phule Pune University">Savitribai Phule Pune University</option>
  <option value="Shivaji University">Shivaji University</option>
  <option value="Dr. Babasaheb Ambedkar Marathwada University">Dr. Babasaheb Ambedkar Marathwada University</option>
  <option value="Rashtrasant Tukadoji Maharaj Nagpur University">Rashtrasant Tukadoji Maharaj Nagpur University</option>
  <option value="Sant Gadge Baba Amravati University">Sant Gadge Baba Amravati University</option>
  <option value="Solapur University">Solapur University</option>
  <option value="Swami Ramanand Teerth Marathwada University">Swami Ramanand Teerth Marathwada University</option>
  <option value="Dr. Babasaheb Ambedkar Technological University">Dr. Babasaheb Ambedkar Technological University</option>
  <option value="Yashwantrao Chavan Maharashtra Open University">Yashwantrao Chavan Maharashtra Open University</option>
  <option value="Gondwana University">Gondwana University</option>
  <option value="Kavikulaguru Kalidas Sanskrit University">Kavikulaguru Kalidas Sanskrit University</option>
  <option value="Maharashtra University of Health Sciences">Maharashtra University of Health Sciences</option>
  <option vaule="Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth">Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth</option>
  <option value="Vasantrao Naik Marathwada Krishi Vidyapeeth">Vasantrao Naik Marathwada Krishi Vidyapeeth</option>
  <option value="Mahatma Phule Krishi Vidyapeeth">Mahatma Phule Krishi Vidyapeeth</option>
  <option value="Maharashtra National Law University (Mumbai)">Maharashtra National Law University (Mumbai)</option>
  <option value="Maharashtra National Law University (Nagpur)">Maharashtra National Law University (Nagpur)</option>
  <option value="Maharashtra National Law University (Aurangabad)">Maharashtra National Law University (Aurangabad)</option>
  <option value="Dr. Homi Bhabha State University">Dr. Homi Bhabha State University</option>
  <option value="COEP Technological University">COEP Technological University</option>
  <option value="Cluster University of Nagpur">Cluster University of Nagpur</option>
  <option value="Cluster University of Mumbai">Cluster University of Mumbai</option>
  <option value="Cluster University of Pune">Cluster University of Pune</option>
</select>


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
    <label>
      <input
        type="radio"
        name="educationLevel"
        value="Diploma"
        checked={formData.educationLevel === 'Diploma'}
        onChange={handleInputChange}
      />
      Diploma
    </label>
    <label>
      <input
        type="radio"
        name="educationLevel"
        value="Certificate"
        checked={formData.educationLevel === 'Certificate'}
        onChange={handleInputChange}
      />
      Certificate
    </label>
    <label>
      <input
        type="radio"
        name="educationLevel"
        value="Integrated"
        checked={formData.educationLevel === 'Integrated'}
        onChange={handleInputChange}
      />
      Integrated
    </label>
  </div>
</div>

   <div className="course-selection">
  <label className="label">Select Stream:</label>
  <select
    name="courseName"
    value={formData.courseName}
    onChange={handleInputChange}
    className="select-dropdown course-select"
    disabled={!formData.educationLevel || !formData.university}
  >
    <option value="">Select Stream</option>
            {formData.university && formData.educationLevel &&
              streamOptions[formData.university]?.[formData.educationLevel]?.map((stream, idx) => (
                <option key={idx} value={stream}>
                  {(formData.educationLevel === 'Integrated' ||
                    formData.educationLevel === 'Postgraduate' ||
                    formData.educationLevel === 'Diploma' ||
                    formData.educationLevel === 'Certificate')
                    ? stream
                    : `Bachelors in ${stream}`}
                </option>
              ))}
          </select>
        </div>



       {/* Specialization Dropdown */}
<select
  name="specialization"
  value={formData.specialization}
  onChange={handleInputChange}
  className="select-dropdown"
>
  <option value="">Select Specialization</option>
  {specializations
    .filter(spec => {
      const selected = formData.courseName;
      if (!selected) return false;

      if (formData.courseName === 'Diploma Course') {
        return spec.startsWith('Diploma Course');
      } else if (formData.courseName === 'Advanced Diploma Course') {
        return spec.startsWith('Advanced Diploma Course');
      } else if (selected === 'Certificate Course') {
        return spec.startsWith('Certificate Course');
      } else if (selected === 'Teacher Training Certificate Course') {
        return spec.startsWith('Teacher Training Certificate Course');
      }

      return true;
    })
    .map((spec, index) => (
      <option key={index} value={spec}>{spec}</option>
    ))}
</select>


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
          
          {['Undergraduate', 'Diploma', 'Certificate', 'Integrated'].includes(formData.educationLevel) && (

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
    {colleges[0]?.university && <th>University</th>}
  </tr>
</thead>

              <tbody>
                {currentColleges.map((college, index) => (
                <tr key={index}>
  {college.college_code && <td>{college.college_code}</td>}
  <td>{college.institute_name}</td>
  {college.city && <td>{college.city}</td>}
  <td>{college.course}</td>
  {college.university && <td>{college.university}</td>}
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


{showResults && colleges.length === 0 && (
  <div className="results-section">
    <h2 className="section-title">No colleges found.</h2>
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
  <div className="login-and-aboutus">
{/* Fancy Welcome Heading */}
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px',
    animation: 'floatGlow 2s ease-out',
  }}
>
  <img
    src="/logo.png"
    alt="VidyarthiMitra Logo"
    style={{
      width: '500px',
      height: '100px',
      marginBottom: '10px',
      // boxShadow: '0 0 15px rgba(0, 123, 255, 0.4)',
    }}
  />
  <h1
    style={{
      fontSize: '2.5rem',
      color: '#1a237e',
      textShadow: '0 0 5px white, 0 0 10px white',
      fontWeight: 'bold',
      letterSpacing: '1px',
      margin: 0,
    }}
  >
    🎓 Welcome to <span style={{ color: 'black' }}>VidyarthiMitra</span> 🎓
  </h1>
  <p style={{ fontSize: '1.1rem', color: 'black', marginTop: '8px',fontWeight: 'bold' }}>
    Your guide to Non-CET college admissions
  </p>
</div>

  {/* Login Box */}
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

  {/* About Us Section */}
  <div className="about-us-section" style={{ marginTop: '0px', padding: '20px' }}>
    <h1 style={{ textAlign: 'center', marginBottom: '10px', color: 'black',textShadow: '0 0 5px white, 0 0 10px black' }}>About Us:</h1>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h3>🎓 What is VidyarthiMitra?</h3>
        <p>VidyarthiMitra is an education support platform that guides students with career and college admission information.</p>
      </div>

      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h3>📚 Website Purpose</h3>
        <p>This portal helps students explore Non-CET colleges, search by stream, and find specializations with accurate cutoffs.</p>
      </div>

      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h3>🔍 Smart Filters</h3>
        <p>Find colleges by university, stream, city, and more fast and intuitively. Results are clear, with filters that really help.</p>
      </div>

      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h3>🤖 Chatbot Assistant</h3>
        <p>Need help? Use the built-in chatbot to answer common questions, assist in finding colleges, or get guidance instantly.</p>
      </div>
    </div>
  </div>

</div>



);

}

export default App;
