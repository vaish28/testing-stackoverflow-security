
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/userProfile.css'


const UserProfile = () => {
  const [memberDays, setMemberDays] = useState(0);
  const [reputationPoints, setReputationPoints] = useState(0);

  // const [isAuthenticated, setIsAuthenticated] = useState(false); // Added state to track authentication
  
  useEffect(() => {

    const fetchUserProfile = async () => {
      
      // console.log(userProfileData);
      try {
        // Make an API call to get user profile data
        const userProfileData = await axios.get('http://localhost:8000/api/users/profile', { withCredentials: true });
        
        console.log(userProfileData);
        // Update state with user profile information
        setMemberDays(userProfileData.data.memberDays);
        setReputationPoints(userProfileData.data.reputationPoints);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className='main-userProfile'>
      <h2 className='heading'>User Profile</h2>
     
      <div className='userDetails'>
        <p>Member for: {memberDays} days</p>
        <p>Reputation Points: {reputationPoints}</p>
      </div>

      <div className='main-content'>
        <h3>Menu</h3>
        <ul>
          <li><Link to="/userprofile/questions">View All Your Questions</Link></li>
          <li><Link to="/userprofile/tags">View All Your Tags</Link></li>
          <li><Link to="/userprofile/answers">View All Your Answers</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default UserProfile;
