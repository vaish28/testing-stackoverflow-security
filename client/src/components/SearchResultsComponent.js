// Importing React and necessary hooks
import React from 'react';
import { useLocation } from 'react-router-dom';

// Importing the HomePageComponent to reuse for displaying search results
import HomePageComponent from './HomePageComponent';

function SearchResultsComponent() {
    // Using useLocation hook to access the query parameter from the URL
    const location = useLocation();
    // Extracting the 'query' parameter from the URL
    const query = new URLSearchParams(location.search).get('query');

    // Render function for the search results page
    return (
        <div >
            {/* Displaying the search query */}
            <h2>{`Search Results for '${query}'`}</h2>
            {/* Reusing HomePageComponent to display search results
                by passing the extracted query as a prop */}
            <HomePageComponent query={query} />
        </div>
    );
}

export default SearchResultsComponent;
