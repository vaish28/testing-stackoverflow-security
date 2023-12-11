// Importing React and necessary hooks from react-router-dom
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Importing the stylesheet for the sidebar
import '../stylesheets/header.css';

const SidebarComponent = () => {
    // useNavigate hook for programmatically navigating between routes
    const navigate = useNavigate();
    // useLocation hook to access the current route's location
    const location = useLocation();

    // Determines the current view based on the path for styling active links
    const currentView = location.pathname === '/' ? 'questions' : 
                        location.pathname.startsWith('/tags') ? 'tags' : '';

    // Render function for the sidebar
    return (
        <div className="sidebar">
            <div id="sideBarNav">
                {/* Navigation list with buttons */}
                <ul style={{ listStyle: 'none' }}>
                    {/* Button for navigating to the questions view */}
                    <button
                        className={`sidebarButton ${currentView === 'questions' ? 'active' : ''}`}
                        id="questionsButton"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate("/home")}
                    >
                        Questions
                    </button>

                    {/* Button for navigating to the tags view */}
                    <button
                        className={`sidebarButton ${currentView === 'tags' ? 'active' : ''}`}
                        id="tagsButton"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate("/tags")}
                    >
                        Tags
                    </button>
                </ul>
            </div>
            {/* Decorative line in the sidebar */}
            <div className="side-bar-dotted-line"></div>
        </div>
    );
};

export default SidebarComponent;
