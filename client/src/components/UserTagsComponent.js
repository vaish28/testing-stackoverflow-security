import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/userTags.css';

const UserTagsComponent = () => {
    const [tags, setTags] = useState([]);
    const [editingTagId, setEditingTagId] = useState(null);
    const [newTagName, setNewTagName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Authentication check
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                setIsAuthenticated(response.data.isLoggedIn);
                if (response.data.isLoggedIn) {
                    fetchTags();
                }
            })
            .catch(error => {
                console.error('Error checking user session:', error);
            });
    }, []);

    const fetchTags = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/users/tags', { withCredentials: true });
            setTags(response.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (tag) => {
        if (!isAuthenticated) {
            alert('You are not authenticated. Please login to edit tags.');
            return;
        }
        setEditingTagId(tag._id);
        setNewTagName(tag.name);
    };

    const handleEditTag = async (tagTid) => {
        if (!newTagName.trim()) {
            alert('Tag name cannot be empty');
            return;
        }
    
        setIsLoading(true);
        try {
            console.log('Sending Edit Request for Tag ID:', tagTid, 'with new name:', newTagName);
            const response = await axios.put(`http://localhost:8000/tags/edit/${tagTid}`, { newName: newTagName }, { withCredentials: true });
            console.log('Edit response:', response.data);
            alert('Tag updated successfully');
            setEditingTagId(null);
            fetchTags();
        } catch (error) {
            console.error('Error updating tag:', error);
            alert('Error updating tag');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTag = async (tagTid) => {
        if (!isAuthenticated) {
            alert('You are not authenticated. Please login to delete tags.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this tag?')) return;
        
        setIsLoading(true);
        try {
            await axios.delete(`http://localhost:8000/tags/${tagTid}`, { withCredentials: true });
            alert('Tag deleted successfully');
            fetchTags();
        } catch (error) {
            console.error('Error deleting tag:', error);
            alert('Error deleting tag');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (tags.length === 0) {
        return (
            <div>
                <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
                <h2>Your Tags</h2>
                <p>No tags created yet. You must have at least 50 reputation to create new tags!</p>
            </div>
        );
    }

    return (
        <div className="user-tags-container">
            <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
            <h1>Your Created Tags:</h1>
            <ul className="user-tags-list">
                {tags.map(tag => (
                    <li key={tag._id}>
                        {editingTagId === tag._id ? (
                            <>
                                <input 
                                    type="text" 
                                    value={newTagName} 
                                    onChange={(e) => setNewTagName(e.target.value)}
                                />
                                <button onClick={() => handleEditTag(tag.tid)} disabled={isLoading}>Save</button>
                            </>
                        ) : (
                            <>
                                <span>{tag.name}</span>
                                <button onClick={() => handleEditClick(tag)} disabled={isLoading}>Edit</button>
                                <button onClick={() => handleDeleteTag(tag.tid)} disabled={isLoading}>Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
    
};

export default UserTagsComponent;
