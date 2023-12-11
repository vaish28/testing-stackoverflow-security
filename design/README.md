### FakeStackOverflow


#### Architecture:

- The application uses a client server architecture with mongodb as a database.
- The client-side is organized into distinct component. 
- The fakestackoverflow component defines the routes for the other components.
- The fackstackoverflow component acts as the root and is responsible for rendering the header, sidebar, and main content. 
- The main content changes as the respective navigate links are called for each particular component performing specific functionality.
- On the server side, the application features several API calls for both reading (GET requests) and creating data (POST requests). The server-side logic is primarily structured into three parts:
1. routes.js - Manages the api calls and endpoints related to the questions and also fetches data from mongodb database
2. answerRoutes.js - Manages the api calls and endpoints related to the answers and also fetches data from mongodb database
3. tagsRoutes.js - Manages the api calls and endpoints related to the tags and also fetches data from mongodb database
4. commentRoutes.js- Manages the api calls and endpoints related to the comments and fetches, stores data from mongodb databse.
5. userRoutes.js - Manages the api calls and endpoints related to the users and fetches, stores data from the mongodb database.


The application overall as three main folders:
1. Client
2. Server
3. Design 
4. Testing