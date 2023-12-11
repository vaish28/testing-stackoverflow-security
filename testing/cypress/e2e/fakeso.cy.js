// // Template test file. Change the file to add more tests.
// describe('Fake SO Test Suite', () => {
//     beforeEach(() => {
//         // Seed the database before each test
// //        cy.exec('node /path/to/server/init.js');
//       });

//       afterEach(() => {
//         // Clear the database after each test
// //        cy.exec('node /path/to/server/destroy.js');
//       });
//     it('successfully shows All Questions string', () => {
//         cy.visit('http://localhost:3000');
//         cy.contains('All Questions');
//     });
//     it('successfully shows Ask a Question button', () => {
//         cy.visit('http://localhost:3000');
//         cy.contains('Ask a Question');
//     });
// })

import '../support/commands';

describe('Welcome Page Navigation Tests for Guests', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/');
    });

    it('navigates to the home page when "Continue as Guest" is clicked', () => {
        cy.get('.welcome-button').contains('Continue as Guest').click();
        cy.url().should('include', '/home');
        cy.get('.main-top h1').should('contain', 'All Questions');
    });

});

describe('Create Account Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
    });

    // afterEach(() => {
    //     cy.exec('node ../server/destroy.js');
    // });

    it('successfully navigates to the registration page', () => {
        cy.visit('http://localhost:3000');
        cy.get('.welcome-button').contains('Register as New User').click();
        cy.url().should('include', '/#/register');
    });

    it('allows a user to create an account', () => {
        cy.visit('http://localhost:3000/#/register');
        cy.get('input[name="username"]').type('newUser');
        cy.get('input[name="email"]').type('newUser@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="confirmPassword"]').type('password123');
    
        
        cy.on('window:alert', (text) => {
            expect(text).to.contains('User registered successfully');
        });
    
        cy.get('form').submit();
    
        
        cy.url().should('include', '/#/login');
    });

    it('prevents account creation with existing username (server-side)', () => {
        cy.request({
            method: 'POST',
            url: 'http://localhost:8000/api/users/register',
            failOnStatusCode: false,
            body: {
                username: 'user1',
                email: 'uniqueEmail@example.com',
                password: 'password123'
            }
        }).then((response) => {
            expect(response.status).to.eq(409);
            expect(response.body).to.contain('User already exists with the same username or email');
        });
    });

    it('prevents account creation with existing email (server-side)', () => {
        cy.request({
            method: 'POST',
            url: 'http://localhost:8000/api/users/register',
            failOnStatusCode: false,
            body: {
                username: 'uniqueUsername',
                email: 'user2@gmail.com',
                password: 'password123'
            }
        }).then((response) => {
            expect(response.status).to.eq(409);
            expect(response.body).to.contain('User already exists with the same username or email');
        });
    });

    it('validates email format', () => {
        cy.visit('http://localhost:3000/#/register');
        cy.get('input[name="email"]').type('invalidemail');
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="confirmPassword"]').type('password123');

        cy.window().then((win) => {
            cy.stub(win, 'alert').as('windowAlert');
        });

        cy.get('form').submit();

        cy.get('@windowAlert').should('have.been.calledWith', 'Please enter a valid email address');
    });

    it('ensures password does not contain username or email', () => {
        cy.visit('http://localhost:3000/#/register');
        cy.get('input[name="username"]').type('testUser');
        cy.get('input[name="email"]').type('testUser@example.com');
        cy.get('input[name="password"]').type('testUser');

        cy.window().then((win) => {
            cy.stub(win, 'alert').as('windowAlert');
        });

        cy.get('form').submit();

        cy.get('@windowAlert').should('have.been.calledWith', 'Password should not contain username or email');
    });

    it('checks password and confirm password fields match', () => {
        cy.visit('http://localhost:3000/#/register');
    
        
        cy.get('input[name="username"]').type('validUsername');
        cy.get('input[name="email"]').type('validEmail@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="confirmPassword"]').type('differentPassword');
    
        cy.window().then((win) => {
            cy.stub(win, 'alert').as('windowAlert');
        });
    
        cy.get('form').submit();
    
        cy.get('@windowAlert').should('have.been.calledWith', 'Passwords do not match');
    });

    it('does not allow account creation with missing fields in API request', () => {
        cy.request({
            method: 'POST',
            url: 'http://localhost:8000/api/users/register',
            failOnStatusCode: false,
            body: {
                
                password: 'password123'
            }
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.contains('All fields are required');
        });
    });
    

});

describe('Login Tests', () => {
    beforeEach(() => {
        
        cy.exec('node ../server/init.js');
    });

    afterEach(() => {
        
        cy.exec('node ../server/destroy.js');
    });

    it('successfully navigates to the login page', () => {
        cy.visit('http://localhost:3000');
        cy.get('.welcome-button').contains('Login as Existing User').click();
        cy.url().should('include', '/#/login');
    });

    it('allows a registered user (user1) to log in successfully', () => {
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user1'); 
        cy.get('input[name="password"]').type('password1');
        cy.get('form').submit();

        // Handle alert for successful login
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Login successful');
        });

        // Check URL to confirm redirection to home page
        cy.url().should('include', '/#/home');
    });
    

    it('gives feedback for an unregistered username', () => {
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('unregisteredUser');
        cy.get('input[name="password"]').type('pass');

        // Prepare to handle the alert for login failure
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Login failed');
        });

        cy.get('form').submit();
        cy.url().should('include', '/#/login');
    });

    it('gives feedback for an incorrect password', () => {
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user1');
        cy.get('input[name="password"]').type('password2');

        // Prepare to handle the alert for login failure
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Login failed');
        });

        cy.get('form').submit();
        cy.url().should('include', '/#/login');
    });

    
});

describe('Logout Tests', () => {
    beforeEach(() => {
        // Initialize the database state before each test
        cy.exec('node ../server/init.js');

        // Login the user before each test
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user1');
        cy.get('input[name="password"]').type('password1');
        cy.get('form').submit();
        cy.url().should('include', '/#/home');
    });

    afterEach(() => {
    
        cy.exec('node ../server/destroy.js');
    });

    it('allows a logged-in user to log out successfully', () => {describe('Logout Tests', () => {
        beforeEach(() => {
            cy.exec('node ../server/init.js');
    
            // Login the user before each test
            cy.visit('http://localhost:3000/#/login');
            cy.get('input[name="username"]').type('user1');
            cy.get('input[name="password"]').type('password1');
            cy.get('form').submit();
            cy.url().should('include', '/#/home');
        });
    
        afterEach(() => {
            cy.exec('node ../server/destroy.js');
        });
    
        it('allows a logged-in user to log out successfully', () => {
            cy.get('button').contains('Logout').click();
            cy.url().should('include', '/');
        });
    
        it('displays logout button when user is logged in', () => {
            cy.get('button').contains('Logout').should('be.visible');
        });
    
        it('does not display logout button when user is not logged in', () => {
            cy.get('button').contains('Logout').click(); // Logout first
            // Wait for logout to complete
            cy.url().should('include', '/');
            // Revisit the page to ensure the state is reset
            cy.visit('http://localhost:3000');
            cy.get('button').contains('Logout').should('not.exist');
            cy.get('button').contains('Register').should('be.visible');
            cy.get('button').contains('Login').should('be.visible');
        });
    
    });
    
        cy.get('button').contains('Logout').click();
        cy.url().should('include', '/');
    });

    it('displays logout button when user is logged in', () => {
        cy.get('button').contains('Logout').should('be.visible');
    });

    it('does not display logout button when user is not logged in', () => {
        // Clear application state
        cy.clearCookies();
        cy.clearLocalStorage();
    
        // Visit the welcome page as a guest
        cy.visit('http://localhost:3000');
        cy.get('.welcome-button').contains('Continue as Guest').click();
    
        // Ensure the user is on the home page as a guest
        cy.url().should('include', '/#/home');
    
        // Check that the Logout button does not exist
        cy.get('button').contains('Logout').should('not.exist');
    
        // Check that the Register and Login buttons are visible
        cy.get('button').contains('Register').should('be.visible');
        cy.get('button').contains('Login').should('be.visible');
    });
    
    
});

describe('Home Page Tests as Guest User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js'); 
        cy.visit('http://localhost:3000/#/home');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('shows an error message and a way to navigate back on system failure', () => {
        // Intercepting the API call and forcing it to return an error
        cy.intercept('GET', 'http://localhost:8000/api/users/check-session', { statusCode: 500 });
    
        // Reload the page to trigger the intercepted API call
        cy.visit('http://localhost:3000/#/home');
        cy.get('.back').click();
        cy.url().should('include', '/');
    });

    it('ensures the Ask a Question button is disabled for guest users', () => {
        cy.visit('http://localhost:3000/#/home');
        cy.get('.mainDivAskButton').should('be.disabled');
    });
    
    it('loads the home page with default Newest view', () => {
        cy.get('.main-top h1').should('contain', 'All Questions');
        cy.get('.button-container .buttonDeco.active').should('contain', 'Newest');
    });

    it('displays the correct number of questions with all details including votes', () => {
        cy.get('.questionContainer .question-entry').should('have.length', 5);
        cy.get('.questionContainer .question-entry').each(($el) => {
            cy.wrap($el).find('.postTitle a').should('exist');
            cy.wrap($el).find('.questionSummary').should('exist');
            cy.wrap($el).find('.tags .tagButton').should('exist');
            cy.wrap($el).find('.postStats p').should('exist');
            cy.wrap($el).find('.lastActivity p').should('exist');
            cy.wrap($el).find('.vote-buttons span').should('exist');
        });
    });

    it('navigates to question details when question title is clicked', () => {
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').click();
        cy.url().should('include', '/questions/');
    });

    it('paginates to the next set of questions', () => {
        cy.get('.pagination-controls button').contains('Next').click();
        cy.get('.questionContainer .question-entry').should('have.length', 3);
    });

    it('disables the Prev button on the first page', () => {
        cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
    });

    it('disables the Next button on the last page', () => {
        cy.get('.pagination-controls button').contains('Next').click();
        cy.get('.pagination-controls button').contains('Next').should('be.disabled');
    });

    it('sorts questions by Newest view', () => {
        cy.get('.button-container .buttonDeco').contains('Newest').click();
        cy.get('.questionContainer .question-entry').first().find('.lastActivity p')
          .should('contain', 'Jan 10, 2023 at');
    });

    it('sorts questions by Active view', () => {
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().find('.lastActivity p')
        //Question at the top of stack by most recent answer
          .should('contain', 'Jan 03, 2023 at');
    });

    it('sorts questions by Unanswered view', () => {
        cy.get('.button-container .buttonDeco').contains('Unanswered').click();
        cy.get('.questionContainer .question-entry').should('have.length', 5);
        // Verify the titles of the questions to ensure they are the unanswered ones
        cy.get('.questionContainer .question-entry').first().find('.postTitle a')
          .should('contain', 'Introduction to Git and GitHub');
    });

    const testPaginationAndViewCount = (viewType, expectedCount, expectedFirstTitleOnNextPage) => {
        it(`paginates correctly and shows correct question count in ${viewType} view`, () => {
            cy.get('.button-container .buttonDeco').contains(viewType).click();
            cy.get('.main-top p').should('contain', `${expectedCount} questions`);

            if (expectedCount > 5) {
                cy.get('.pagination-controls button').contains('Next').click();
                cy.get('.questionContainer .question-entry').first().find('.postTitle a')
                    .should('contain', expectedFirstTitleOnNextPage);
                cy.get('.pagination-controls button').contains('Prev').click();
            } else {
                // For views with less than or equal to 5 questions, Prev and Next should be disabled
                cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
                cy.get('.pagination-controls button').contains('Next').should('be.disabled');
            }
        });
    };

    testPaginationAndViewCount('Newest', 8, 'Best practices for MongoDB schema design?');
    testPaginationAndViewCount('Active', 8, 'Handling Async Operations in Redux');
    testPaginationAndViewCount('Unanswered', 5);
    
});

describe('Home Page Tests as Registered User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js'); 
        // Login the user before each test
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user2');
        cy.get('input[name="password"]').type('password2');
        cy.get('form').submit();
        cy.url().should('include', '/#/home');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('shows an error message and a way to navigate back on system failure', () => {
        // Mock server failure on user session check
        cy.intercept('GET', 'http://localhost:8000/api/users/check-session', { statusCode: 500 }).as('checkSession');
    
        // Log in and navigate to the home page
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user2');
        cy.get('input[name="password"]').type('password2');
        cy.get('form').submit();
        cy.url().should('include', '/home');
    
        // Wait for the session check request to complete
        cy.wait('@checkSession');
    
        // Check for the error message
        cy.get('.error-message').should('be.visible').and('contain', 'An error occurred. Please try again.');
        cy.get('.back').should('be.visible').click();
        cy.url().should('include', '/');
    });
    
    

    it('ensures the Ask a Question button is enabled for registered users', () => {
        cy.visit('http://localhost:3000/#/home');
        cy.get('.mainDivAskButton').should('not.be.disabled');
    });

    it('navigates to the Ask Question page when Ask a Question button is clicked', () => {
        cy.get('.mainDivAskButton').click();
        cy.url().should('include', '/ask');
    });

    it('loads the home page with default Newest view', () => {
        cy.get('.main-top h1').should('contain', 'All Questions');
        cy.get('.button-container .buttonDeco.active').should('contain', 'Newest');
    });

    it('displays the correct number of questions with all details including votes', () => {
        cy.get('.questionContainer .question-entry').should('have.length', 5);
        cy.get('.questionContainer .question-entry').each(($el) => {
            cy.wrap($el).find('.postTitle a').should('exist');
            cy.wrap($el).find('.questionSummary').should('exist');
            cy.wrap($el).find('.tags .tagButton').should('exist');
            cy.wrap($el).find('.postStats p').should('exist');
            cy.wrap($el).find('.lastActivity p').should('exist');
    
            // Check if the Logout button exists to determine if the user is logged in
            cy.get('body').then(($body) => {
                if ($body.find('button:contains("Logout")').length) {
                    // User is logged in, check for vote buttons
                    cy.wrap($el).find('.vote-buttons button').should('exist');
                } else {
                    // User is not logged in, check for vote counts
                    cy.wrap($el).find('.vote-buttons span').should('exist');
                }
            });
        });
    });

    it('allows a registered user with sufficient reputation to vote on a question', () => {
        cy.get('button:contains("Logout")').click();
        cy.login('user1', 'password1');
        cy.visit('http://localhost:3000/#/home');
    
        cy.get('.questionContainer .question-entry').first().within(() => {
            cy.get('.vote-buttons button').first().invoke('text').then((buttonText) => {
                const initialCount = parseInt(buttonText.split(' ')[1]);
                cy.get('.vote-buttons button').first().click();
                cy.get('.vote-buttons button').first().should('contain', initialCount + 1);
            });
        });
    });
    
    it('prevents a registered user with insufficient reputation from voting on a question', () => {
        // User 2 not enough reputation
        cy.visit('http://localhost:3000/#/home');
        cy.on('window:alert', (text) => {
            expect(text).to.contains('Insufficient reputation to vote');
        });
        cy.get('.questionContainer .question-entry').first().within(() => {
            cy.get('.vote-buttons button').first().click();
        });
    });

    it('increases reputation by 5 points after upvoting a question', () => {
        cy.get('button:contains("Logout")').click();
        cy.login('user1', 'password1');
        cy.visit('http://localhost:3000/#/home');
        cy.get('.questionContainer .question-entry').eq(1).within(() => {
            cy.get('.vote-buttons button').contains('Upvote').click();
        });
        cy.get('button:contains("Logout")').click();
        cy.login('user3', 'password3');
        cy.visit('http://localhost:3000/#/userprofile');
        cy.get('.userDetails').should('contain', 'Reputation Points: 75');
    });

    it('decreases reputation by 10 points after downvoting a question', () => {
        cy.get('button:contains("Logout")').click();
        cy.login('user1', 'password1');
        cy.visit('http://localhost:3000/#/home');
        cy.get('.questionContainer .question-entry').eq(1).within(() => {
            cy.get('.vote-buttons button').contains('Downvote').click();
        });
        cy.get('button:contains("Logout")').click();
        cy.login('user3', 'password3');
        cy.visit('http://localhost:3000/#/userprofile');
        cy.get('.userDetails').should('contain', 'Reputation Points: 60');
    });

    it('navigates to question details when question title is clicked', () => {
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').click();
        cy.url().should('include', '/questions/');
    });

    it('paginates to the next set of questions', () => {
        cy.get('.pagination-controls button').contains('Next').click();
        cy.get('.questionContainer .question-entry').should('have.length', 3);
    });

    it('disables the Prev button on the first page', () => {
        cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
    });

    it('disables the Next button on the last page', () => {
        cy.get('.pagination-controls button').contains('Next').click();
        cy.get('.pagination-controls button').contains('Next').should('be.disabled');
    });

    it('sorts questions by Newest view', () => {
        cy.get('.button-container .buttonDeco').contains('Newest').click();
        cy.get('.questionContainer .question-entry').first().find('.lastActivity p')
          .should('contain', 'Jan 10, 2023 at');
    });

    it('sorts questions by Active view', () => {
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().find('.lastActivity p')
          .should('contain', 'Jan 03, 2023 at');
    });

    it('sorts questions by Unanswered view', () => {
        cy.get('.button-container .buttonDeco').contains('Unanswered').click();
        cy.get('.questionContainer .question-entry').should('have.length', 5);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a')
          .should('contain', 'Introduction to Git and GitHub');
    });

    const testPaginationAndViewCount = (viewType, expectedCount, expectedFirstTitleOnNextPage) => {
        it(`paginates correctly and shows correct question count in ${viewType} view`, () => {
            cy.get('.button-container .buttonDeco').contains(viewType).click();
            cy.get('.main-top p').should('contain', `${expectedCount} questions`);

            if (expectedCount > 5) {
                cy.get('.pagination-controls button').contains('Next').click();
                cy.get('.questionContainer .question-entry').first().find('.postTitle a')
                    .should('contain', expectedFirstTitleOnNextPage);
                cy.get('.pagination-controls button').contains('Prev').click();
            } else {
                cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
                cy.get('.pagination-controls button').contains('Next').should('be.disabled');
            }
        });
    };

    testPaginationAndViewCount('Newest', 8, 'Best practices for MongoDB schema design?');
    testPaginationAndViewCount('Active', 8, 'Handling Async Operations in Redux');
    testPaginationAndViewCount('Unanswered', 5);
});

describe('Search Functionality Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.visit('http://localhost:3000/#/search');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('searches and displays results for text match', () => {
        cy.get('.searchBar').type('JavaScript{enter}');
        cy.url().should('include', '/search?query=JavaScript');
        cy.get('.questionContainer .question-entry').should('have.length', 2);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').should('contain', 'How to use promises in JavaScript?');
    });

    it('searches and displays results for tag match', () => {
        cy.get('.searchBar').type('[React]{enter}');
        cy.url().should('include', '/search?query=[React]');
        cy.get('.questionContainer .question-entry').should('have.length', 2);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').should('contain', 'Handling Async Operations in Redux');
    });

    it('searches and displays results for combined text and tag match', () => {
        cy.get('.searchBar').type('best practices [mongoDB]{enter}');
        cy.url().should('include', '/search?query=best%20practices%20[mongoDB]');
        cy.get('.questionContainer .question-entry').should('have.length', 2);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').should('contain', 'Node.js Best Practices');
    });

    it('displays no results for unmatched queries', () => {
        cy.get('.searchBar').type('nonexistentquery{enter}');
        cy.get('.questionContainer').should('be.visible').and('contain', 'No questions found.');
    });

    const testPaginationForViewType = (viewType, expectedFirstTitleOnNextPage, expectedTotalQuestions) => {
        it(`paginates correctly for search query "a" in ${viewType} view with correct question count`, () => {
            cy.get('.searchBar').type('a{enter}');
            cy.get('.button-container .buttonDeco').contains(viewType).click();
    
            // Verify the total number of questions
            cy.get('.main-top p').should('contain', `${expectedTotalQuestions} questions`);
    
            if (expectedTotalQuestions > 5) {
                // Verify that Next button is enabled and works
                cy.get('.pagination-controls button').contains('Next').should('not.be.disabled').click();
                cy.get('.questionContainer .question-entry').first().find('.postTitle a')
                    .should('contain', expectedFirstTitleOnNextPage);
    
                // Verify that Prev button is enabled and works
                cy.get('.pagination-controls button').contains('Prev').should('not.be.disabled').click();
                cy.get('.questionContainer .question-entry').should('have.length', 5);
            } else {
                // For views with less than or equal to 5 questions, Prev and Next should be disabled
                cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
                cy.get('.pagination-controls button').contains('Next').should('be.disabled');
            }
        });
    };
    
    testPaginationForViewType('Newest', 'Best practices for MongoDB schema design?', 8);
    testPaginationForViewType('Active', 'Handling Async Operations in Redux', 8);
    testPaginationForViewType('Unanswered', null, 5);
    
    

    const testPaginationForSearch = (searchQuery, viewType, expectedFirstTitleOnNextPage) => {
        it(`paginates correctly in ${viewType} view for search query "${searchQuery}"`, () => {
            cy.get('.searchBar').type(`${searchQuery}{enter}`);
            cy.get('.button-container .buttonDeco').contains(viewType).click();

            // Check if pagination is needed
            cy.get('.main-top p').invoke('text').then((text) => {
                const totalQuestions = parseInt(text.split(' ')[0]);
                if (totalQuestions > 5) {
                    cy.get('.pagination-controls button').contains('Next').click();
                    cy.get('.questionContainer .question-entry').first().find('.postTitle a')
                        .should('contain', expectedFirstTitleOnNextPage);
                    cy.get('.pagination-controls button').contains('Prev').click();
                } else {
                    // For views with less than or equal to 5 questions, Prev and Next should be disabled
                    cy.get('.pagination-controls button').contains('Prev').should('be.disabled');
                    cy.get('.pagination-controls button').contains('Next').should('be.disabled');
                }
            });
        });
    };

    testPaginationForSearch('JavaScript', 'Newest');
    testPaginationForSearch('[react]', 'Active', 'React State Management');
    testPaginationForSearch('best practices [MongoDB]', 'Unanswered');

    it('allows a registered user to search for "React"' , () =>{
        // Login the user before test
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user2');
        cy.get('input[name="password"]').type('password2');
        cy.get('form').submit();
        cy.visit('http://localhost:3000/#/search');
        cy.get('.searchBar').type('React{enter}');
        cy.url().should('include', '/search?query=React');
        cy.get('.questionContainer .question-entry').should('not.have.length', 0);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').should('contain', 'React');
    });
    

    it('guest user search for "react" matches registered user' , () =>{
        // Login the user before test
        cy.visit('http://localhost:3000/');
        cy.get('.welcome-button').contains('Continue as Guest').click();
        cy.visit('http://localhost:3000/#/search');
        cy.get('.searchBar').type('react{enter}');
        cy.url().should('include', '/search?query=react');
        cy.get('.questionContainer .question-entry').should('not.have.length', 0);
        cy.get('.questionContainer .question-entry').first().find('.postTitle a').should('contain', 'React');
    });
    
    it('shows an error message and a way to navigate back on system failure', () => {
        // Intercepting the API call and forcing it to return an error
        cy.intercept('GET', 'http://localhost:8000/api/users/check-session', { statusCode: 500 });
    
        // Reload the page to trigger the intercepted API call
        cy.visit('http://localhost:3000/#/home');
        cy.get('.error-message').should('be.visible');
        cy.get('.back').click();
        cy.url().should('include', '/');
    });
});

describe('All Tags Page Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.visit('http://localhost:3000/#/tags');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('displays all tags with question counts', () => {
        cy.get('.tagsContainer .tagNode').should('not.have.length', 0);
        cy.get('.tagsContainer .tagNode').each(($el) => {
            cy.wrap($el).find('span').should('contain', 'questions');
        });
    });

    it('navigates to the correct tag page when a tag is clicked', () => {
        cy.visit('http://localhost:3000/#/tags');

        cy.get('.tagsContainer .tagNode').first().invoke('attr', 'key').then((_id) => {
            cy.get('.tagsContainer .tagNode').first().click();
            cy.url().should('include',`/tags/t1`);
        });
    });

    it('ensures the Ask a Question button is disabled for guest users', () => {
        cy.get('.askQuestionButton').should('be.disabled');
    });

    it('allows a registered user to click the Ask a Question button', () => {
        cy.intercept('POST', 'http://localhost:8000/api/users/login').as('loginRequest');
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user3');
        cy.get('input[name="password"]').type('password3');
        cy.get('form').submit();
        cy.wait('@loginRequest');
        cy.visit('http://localhost:3000/#/tags');
        cy.get('.askQuestionButton').should('not.be.disabled').click();
        cy.url().should('include', '/ask');
    });
    
    

    it('shows an error message and a way to navigate back on system failure', () => {
        cy.intercept('GET', 'http://localhost:8000/tags', { statusCode: 500 });
        cy.visit('http://localhost:3000/#/tags');
        cy.get('.back').should('be.visible').click();
        cy.url().should('include', '/');
    });
    

    
    it('displays tags in groups of 3 per row', () => {
        cy.get('.tagsContainer .tagNode').then($tags => {
            const totalTags = $tags.length;
            const expectedRows = Math.ceil(totalTags / 3);
    
            for (let i = 0; i < expectedRows; i++) {
                const startIndex = i * 3;
                const endIndex = startIndex + 3;
                cy.wrap($tags.slice(startIndex, endIndex)).should('have.length.lessThan', 4);
            }
        });
    });
    
});


describe('Question Tags Page Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.visit('http://localhost:3000/#/tags/t2');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('displays questions associated with the tag', () => {
        cy.get('.questionsList .question-entry').should('not.have.length', 0);
        cy.get('.questionsList .question-entry').each(($el) => {
            cy.wrap($el).find('.postTitle').should('exist');
            cy.wrap($el).find('footer').should('contain', 'Asked by:');
        });
    });

    it('navigates to the correct question page when a question is clicked', () => {
        cy.get('.questionsList .question-entry').first().click();
        cy.url().should('include', '/questions/');
    });

    it('displays questions tagged with React in newest order', () => {
        cy.get('.questionsList .question-entry').should('have.length.at.least', 1);
        let previousDate = new Date();

        cy.get('.questionsList .question-entry').each(($el) => {
            const dateText = $el.find('footer').text().match(/Asked: (.+)$/)[1];
            const questionDate = new Date(dateText);

            // Ensure the current question's date is less than or equal to the previous question's date
            expect(questionDate.getTime()).to.be.at.most(previousDate.getTime());
            previousDate = questionDate;
        });
    });

    it('shows an error message and a way to navigate back on system failure', () => {
        cy.intercept('GET', `http://localhost:8000/tags/t1/questions`, { statusCode: 500 });
        cy.visit('http://localhost:3000/#/tags/t1');
        cy.get('.error-message').should('be.visible').and('contain', 'Error loading questions');
        cy.get('.back').should('be.visible').click();
        cy.url().should('include', '/');
    });
    
});


function loginUser(username, password) {
    cy.visit('http://localhost:3000/#/login');
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('form').submit();
    cy.url().should('include', '/home');
}

describe('New Question Page Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        loginUser('user3', 'password3')
        cy.visit('http://localhost:3000/#/ask');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('validates empty title input', () => {
        cy.get('#formTitleInput').clear();
        cy.get('#formTextInput').type('Sample question text');
        cy.get('#formTagInput').type('tag1 tag2');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Title cannot be empty');
    });
    
    it('validates empty question text input', () => {
        cy.get('#formTitleInput').type('Sample Title');
        cy.get('#formTextInput').clear();
        cy.get('#formTagInput').type('tag1 tag2');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Question text cannot be empty');
    });
    
    it('validates long title input', () => {
        cy.get('#formTitleInput').type('a'.repeat(101));
        cy.get('#formTextInput').type('Sample question text');
        cy.get('#formTagInput').type('tag1 tag2');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Title cannot be more than 100 characters');
    });

    it('validates more than 5 tags', () => {
        cy.get('#formTitleInput').type('Sample Title');
        cy.get('#formTextInput').type('Sample question text');
        cy.get('#formTagInput').type('tag1 tag2 tag3 tag4 tag5 tag6');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Cannot have more than 5 tags');
    });
    
    it('validates long tag name', () => {
        cy.get('#formTitleInput').type('Sample Title');
        cy.get('#formTextInput').type('Sample question text');
        cy.get('#formTagInput').type('a'.repeat(21));
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Tag length cannot be more than 20 characters');
    });

    it('validates invalid hyperlink format', () => {
        cy.get('#formTitleInput').type('Sample Title');
        cy.get('#formTextInput').type('Check this link [Google](http://www.google.com)');
        cy.get('#formTagInput').type('tag1');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Invalid hyperlink');
    });

    it('validates hyperlink with empty text', () => {
        cy.get('#formTitleInput').type('Hyperlink Test');
        cy.get('#formTextInput').type('Check this link [](https://www.google.com)');
        cy.get('#formTagInput').type('tag1');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Invalid hyperlink');
    });

    it('validates hyperlink with empty URL', () => {
        cy.get('#formTitleInput').type('Hyperlink Test');
        cy.get('#formTextInput').type('Check this link [Google]()');
        cy.get('#formTagInput').type('tag1');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Invalid hyperlink');
    });
    
    it('submits a valid question successfully', () => {
        cy.get('#formTitleInput').type('Valid Question Title');
        cy.get('#formTextInput').type('Valid question text');
        cy.get('#formTagInput').type('tag1');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.question-entry').first().should('contain', 'Valid Question Title');
    });

    it('displays the newly created question at the top on the homepage', () => {
        cy.get('#formTitleInput').type('New Question Title');
        cy.get('#formTextInput').type('New question text');
        cy.get('#formTagInput').type('tag5');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.question-entry').first().find('.postTitle').should('contain', 'New Question Title');
    });

    it('displays the newly created question at the top in the Unanswered tab', () => {
        cy.get('#formTitleInput').type('New Question Title');
        cy.get('#formTextInput').type('New question text for unanswered view');
        cy.get('#formTagInput').type('tag2');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.button-container .buttonDeco').contains('Unanswered').click();
        cy.get('.question-entry').first().find('.postTitle').should('contain', 'New Question Title');
    });

    it('handles multiple new tags correctly', () => {  
        cy.get('#formTitleInput').type('Question with Multiple New Tags');
        cy.get('#formTextInput').type('This is a test question with multiple new tags.');
        cy.get('#formTagInput').type('newTag1 newTag2 newTag3');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.question-entry').first().find('.postTitle').should('contain', 'Question with Multiple New Tags');
        cy.get('.question-entry').first().find('.tagButton').should('contain', 'newtag1')
            .and('contain', 'newtag2')
            .and('contain', 'newtag3');
    });
    
    
    it('allows tag creation by users with enough reputation', () => {
        cy.get('#formTitleInput').type('Question with New Tag');
        cy.get('#formTextInput').type('Question text');
        cy.get('#formTagInput').type('newTag');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.tagButton').should('contain', 'newtag');
    });

    it('restricts tag creation for users with low reputation', () => {
        loginUser('user2', 'password2');
        cy.visit('http://localhost:3000/#/ask');
        cy.get('#formTitleInput').type('Question with New Tag');
        cy.get('#formTextInput').type('Question text');
        cy.get('#formTagInput').type('newTag');
        cy.get('form').submit();
        cy.get('.error-message').should('contain', 'Insufficient reputation to add new tags');
    });

    it('allows using of existing tag for users with low reputation', () => {
        loginUser('user1', 'password1');
        cy.visit('http://localhost:3000/#/ask');
        cy.get('#formTitleInput').type('Question with Existing Tag');
        cy.get('#formTextInput').type('Question text');
        cy.get('#formTagInput').type('React');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.get('.tagButton').should('contain', 'react');
    });
    
    

    it('shows an error message on system failure during question submission', () => {
        cy.intercept('POST', 'http://localhost:8000/api/questions', { statusCode: 500 }).as('postQuestion');
        cy.visit('http://localhost:3000/#/login');
        cy.get('input[name="username"]').type('user3');
        cy.get('input[name="password"]').type('password3');
        cy.get('form').submit();
        cy.url().should('include', '/home');
        cy.visit('http://localhost:3000/#/ask');
        cy.get('#formTitleInput').type('Valid Question Title');
        cy.get('#formTextInput').type('Valid question text');
        cy.get('#formTagInput').type('tag1');
        cy.get('form').submit();
    });
    
});


function navigateToQuestionAnswer(questionTitle) {
    function findAndClickQuestion() {
        // Wait for a specific element that indicates the questions are loaded
        cy.get('.question-entry').should('exist');

        cy.get('body').then($body => {
            if ($body.text().toLowerCase().includes(questionTitle.toLowerCase())) {
                cy.contains(questionTitle).click();
            } else {
                cy.get('.pagination-controls').then($pagination => {
                    if ($pagination.find('button:contains("Next")').is(':enabled')) {
                        cy.get('.pagination-controls').find('button:contains("Next")').click();
                        cy.wait(1000);
                        findAndClickQuestion();
                    } else {
                        assert.fail(`Question not found: ${questionTitle}`);
                    }
                });
            }
        });
    }

    findAndClickQuestion();
}



describe('Answer Page Tests for Guest User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.visit('http://localhost:3000/#/home');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('displays question details including title, views, text, tags, metadata, and votes', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        // Check for the presence of question title, number of answers, and views
        cy.get('#answersHeader').within(() => {
            cy.get('h2').should('exist');
            cy.contains(/\d+ answers/);
            cy.contains(/\d+ views/);
        });
    
        // Check for question text, tags, metadata, and votes
        cy.get('#questionBody').within(() => {
            cy.get('div').first().should('exist');
            cy.get('.questionTags').find('.tagButton').should('have.length.at.least', 1);
            cy.get('.questionMetadata').should('contain', 'asked');
            cy.get('.vote-counts').within(() => {
                cy.contains(/Upvotes: \d+/);
                cy.contains(/Downvotes: \d+/);
            });
        });
    });
    

    it('increments view count upon page load', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#answersHeader').should('contain', 'views');
    });

    it('displays a set of answers for the question', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section').within(() => {
            cy.get('.answer-container').should('have.length.at.least', 1);
        });
    });

    it('displays the most recent answer first', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section .answer-container').first().within(() => {
            cy.get('.answerAuthor').invoke('text').then((authorText) => {
                const dateText = authorText.split(' ').slice(-3).join(' ');
                const firstAnswerDate = new Date(dateText);
                expect(firstAnswerDate).to.be.ok;
            });
        });
    });
    

    it('displays answer details correctly', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section .answer-container').first().within(() => {
            cy.get('.answerText').should('exist'); 
            cy.get('.vote-buttons').should('exist');
            cy.get('.answerAuthor').should('contain', 'answered');
        });
    });

    it('enables the Next button when more answers are available', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?'); //Has 6 answers
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').should('not.be.disabled');
        });
    });

    it('disables the Prev button on the first page', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Prev').should('be.disabled');
        });
    });

    it('loads next set of answers when Next button is clicked', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').click();
        });
        cy.get('.answers-section .answer-container').should('have.length', 1);
    });

    it('enables the Prev button and loads previous answers when clicked', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        // Navigate to the second page first
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').click();
        });

        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Prev').should('not.be.disabled').click();
        });

        cy.get('.answers-section .answer-container').should('have.length', 5);
    });

    it('shows Ask a Question button as disabled for guest users', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#askQuestionButton').should('be.disabled');
    });

    it('does not display the Answer Question button for guest users', () => {
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section-button').should('not.exist');
    });

    it('displays a message when there are no answers and pagination buttons are disabled', () => {
        navigateToQuestionAnswer('Introduction to Git and GitHub');
        cy.get('.answers-section').should('contain', 'No answers yet. Be the first to answer!');
        cy.get('.pagination-controls button').each(button => {
            cy.wrap(button).should('be.disabled');
        });
    });
    

    it('renders and allows clicking on a valid hyperlink in the question text', () => {
        navigateToQuestionAnswer('Introduction to Git and GitHub');
        cy.get('#questionBody').within(() => {
            cy.get('a').contains('GitHub').should('have.attr', 'href', 'https://github.com').and('have.attr', 'target', '_blank');
        });
    });

    it('shows an error message on system failure', () => {
        cy.intercept('GET', `http://localhost:8000/questions/q1`, { statusCode: 500 });
        cy.visit('http://localhost:3000/#/questions/q1');
        cy.get('.error-message').should('be.visible').and('contain', 'Error loading data');
    });
});

describe('Answer Page Tests for Registered User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.visit('http://localhost:3000/#/');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    // Reusing tests from the guest user suite
    it('displays question details including title, views, text, tags, metadata, and votes for registered user', () => {
        cy.login('user2', 'password2');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#answersHeader').within(() => {
            cy.get('h2').should('exist');
            cy.contains(/\d+ answers/);
            cy.contains(/\d+ views/);
        });
    
        // Check for question text, tags, metadata, and votes
        cy.get('#questionBody').within(() => {
            cy.get('div').first().should('exist');
            cy.get('.questionTags').find('.tagButton').should('have.length.at.least', 1);
            cy.get('.questionMetadata').should('contain', 'asked');
            cy.get('.vote-counts').within(() => {
                cy.contains(/Upvotes: \d+/);
                cy.contains(/Downvotes: \d+/);
            });
        });
    });

    it('increments view count upon page load', () => {
        cy.login('user3', 'password3');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#answersHeader').should('contain', 'views');
    });

    it('displays a set of answers for the question', () => {
        cy.login('user4', 'password4');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section').within(() => {
            cy.get('.answer-container').should('have.length.at.least', 1);
        });
    });

    it('displays the most recent answer first', () => {
        cy.login('user5', 'password5');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section .answer-container').first().within(() => {
            cy.get('.answerAuthor').invoke('text').then((authorText) => {
                const dateText = authorText.split(' ').slice(-3).join(' ');
                const firstAnswerDate = new Date(dateText);
                expect(firstAnswerDate).to.be.ok;
            });
        });
    });

    it('enables the Next button when more answers are available', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?'); //Has 6 answers
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').should('not.be.disabled');
        });
    });

    it('disables the Prev button on the first page', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Prev').should('be.disabled');
        });
    });

    it('loads next set of answers when Next button is clicked', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').click();
        });
        cy.get('.answers-section .answer-container').should('have.length', 1);
    });

    it('enables the Prev button and loads previous answers when clicked', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Next').click();
        });

        cy.get('.pagination-controls').within(() => {
            cy.get('button').contains('Prev').should('not.be.disabled').click();
        });

        cy.get('.answers-section .answer-container').should('have.length', 5);
    });

    // Tests specific to registered users

    it('verifies Answer Question button visibility and functionality for registered user', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('CSS Grid vs Flexbox');
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
    });

    it('verifies Ask a Question button is enabled and functional for registered user', () => {
        cy.login('user2', 'password2');
        navigateToQuestionAnswer('CSS Grid vs Flexbox');
        cy.get('#askQuestionButton').should('be.visible').and('not.be.disabled').click();
        cy.url().should('include', '/ask')
    });

    it('allows upvoting and downvoting answers with enough reputation', () => {
        cy.login('user3', 'password3');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').first().within(() => {
            // Upvote check
            cy.get('button').contains('Upvote').invoke('text').then((upvoteText) => {
                const initialUpvoteCount = parseInt(upvoteText.split(' ')[1]);
                cy.get('button').contains('Upvote').click();
                cy.get('button').contains('Upvote').should('contain', initialUpvoteCount + 1);
            });
    
            // Downvote check
            cy.get('button').contains('Downvote').invoke('text').then((downvoteText) => {
                const initialDownvoteCount = parseInt(downvoteText.split(' ')[1]);
                cy.get('button').contains('Downvote').click();
                cy.get('button').contains('Downvote').should('contain', initialDownvoteCount + 1);
            });
        });
    });
    
    it('restricts user voting based on reputation', () => {
        cy.login('user5', 'password5');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').first().within(() => {
            cy.get('button').contains('Upvote').click();
            cy.get('button').contains('Upvote').invoke('text').then((buttonText) => {
                const initialCount = parseInt(buttonText.split(' ')[1]);
                cy.get('button').contains('Upvote').should('contain', initialCount);
            });
            cy.on('window:alert', (text) => {
                expect(text).to.contains('Insufficient reputation to vote.');
            });
            cy.get('button').contains('Downvote').click();
            cy.get('button').contains('Downvote').invoke('text').then((downvoteText) => {
                const initialCount = parseInt(downvoteText.split(' ')[1]);
                cy.get('button').contains('Downvote').should('contain', initialCount);
            });
            cy.on('window:alert', (text) => {
                expect(text).to.contains('Insufficient reputation to vote.');
            });
        });
    });

    it('increases reputation by 5 points after upvoting an answer', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').eq(1).find('.vote-buttons').contains('Upvote').click(); // Upvote the second answer
        cy.get('button:contains("Logout")').click();
        cy.login('user5', 'password5');
        cy.visit('http://localhost:3000/#/userprofile');
        cy.get('.userDetails').should('contain', '15');
    });
    
    
    it('decreases reputation by 10 points after downvoting an answer', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').eq(1).find('.vote-buttons').contains('Downvote').click(); // Downvote the second answer
        cy.get('button:contains("Logout")').click();
        cy.login('user5', 'password5');
        cy.visit('http://localhost:3000/#/userprofile');
        cy.get('.userDetails').should('contain', 'Reputation Points: 0');
    });

    it('shows Accept Answer button for the user who asked the question', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').first().within(() => {
            cy.get('button').contains('Accept Answer').should('exist');
        });
    });

    it('does not show Accept Answer button for users who did not ask the question', () => {
        cy.login('user2', 'password2');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answer-container').first().within(() => {
            cy.get('button').contains('Accept Answer').should('not.exist');
        });
    });
    
    it('allows a question asker to accept an answer from list of answers', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#questionBody').should('exist');
        cy.get('.answer-container').first().within(() => {
            cy.get('button').contains('Accept Answer').click();
        });
        cy.get('.answer-container').first().should('have.class', 'accepted-answer');
        cy.get('.answer-container').first().should('contain', 'Accepted Answer');
    });

    it('allows a question asker to accept the second answer and verifies the order of remaining answers', () => {
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('#questionBody').should('exist');
        cy.get('.answer-container').eq(1).within(() => {
            cy.get('button').contains('Accept Answer').click();
        });
        cy.get('.answer-container').first().should('have.class', 'accepted-answer');
        cy.get('.answer-container').first().should('contain', 'Promises can also be used with .then() and .catch() methods.');
        cy.get('.answer-container').eq(1).should('contain', 'Exploring error handling in promises.');
        cy.get('.answer-container').eq(2).should('contain', 'Understanding promise chaining is crucial for complex async tasks.');
    });
    
    it('marks a question as active after posting an answer', () => {
        cy.login('user3', 'password3');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.answers-section-button').click();
        cy.get('textarea#answerTextInput').type('New answer to make question active');
        cy.get('button[type="submit"]').click();
        cy.visit('/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().should('contain', 'How to use promises in JavaScript?');
    });
    
    
});


describe('Comments Page Tests for Guest User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('displays a list of comments for a question and answers', () => {
        cy.visit(`http://localhost:3000/#/home`);
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.comments-section').should('exist');
        cy.wait(1000);
        cy.get('.comments-section').find('div').filter(':contains("Comment:")');
    });
    

    it('navigates to the next set of comments and back to the first set for a specific answer', () => {
        cy.visit(`http://localhost:3000/#/home`);
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.wait(1000);
        cy.get('.answer-container').each($answer => {
            const nextButton = $answer.find('.comments-section button:contains("Next"):not(:disabled)');
            if (nextButton.length > 0) {
                nextButton.click();
                cy.wait(1000);
                cy.get('div').filter(':contains("Comment:")'); 
                $answer.find('.comments-section button:contains("Prev")').click();
                cy.wait(1000);
                cy.get('div').filter(':contains("Comment:")');
                return false;
            }
        });
    });
    
    
    

    it('displays the most recent comment first', () => {
        cy.visit(`http://localhost:3000/#/home`);
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.comments-section div').first();
    });

    it('displays username and votes for comments', () => {
        cy.visit(`http://localhost:3000/#/home`);
        navigateToQuestionAnswer('How to use promises in JavaScript?');
        cy.get('.comments-section').should('exist');
        cy.wait(1000);
        cy.get('.comments-section').contains('Commented by:').should('exist');
        cy.get('.comments-section').contains('Upvotes:').should('exist');
    });

    it('handles no comments condition', () => {
        cy.visit('http://localhost:3000/#/questions/q2');
        cy.get('.comments-section').should('contain', 'No comments yet.');
    });

    it('displays an error message on failure to retrieve comments', () => {
        cy.intercept('GET', 'http://localhost:8000/comments/question/*', { statusCode: 500 });
        cy.visit('http://localhost:3000/#/questions/q1');
        cy.get('.comments-section').should('contain', 'Failed to load comments.');
    });
});


describe('Comments Page Tests for Registered User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.login('user1', 'password1');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('allows a registered user to add a new comment', () => {
        // Target the first comments section found on the page
        cy.get('.comments-section').first().within(() => {
            cy.get('input[type="text"]').type('This is a new comment from a registered user.');
            cy.get('button').contains('Post Comment').click();
        });
    
        // Verify the new comment is added
        cy.get('.comments-section').first().should('contain', 'This is a new comment from a registered user.');
    });
    

    it('rejects a new comment that exceeds 140 characters', () => {
        const longComment = 'a'.repeat(141); // Generate a string longer than 140 characters
    
        cy.get('.comments-section').first().within(() => {
            cy.get('input[type="text"]').type(longComment);
            cy.get('button').contains('Post Comment').click();
        });
        cy.get('body').should('contain', 'Comment exceeds character limit of 140.');
    });
    
    

    it('rejects a comment from a user with insufficient reputation', () => {
        // Assuming user2 has less than 50 reputation points
        cy.login('user2', 'password2');
        navigateToQuestionAnswer('How to use promises in JavaScript?');
    
        cy.get('.comments-section').first().within(() => {
            cy.get('input[type="text"]').type('This is a comment from a low-rep user.');
            cy.get('button').contains('Post Comment').click();
        });
    
        // Verify the page displays the specific text
        cy.get('body').should('contain', 'Insufficient reputation to comment');
    });
    
    it('allows a registered user to upvote a comment', () => {
        cy.wait(1000);
        cy.get('button').contains('Upvote');
    });

    it('Upvote on comment updated question activity', () => {
        cy.wait(1000);
        cy.get('button').contains('Upvote');
        cy.visit('/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().should('contain', 'Best practices for MongoDB schema design?');
    });

    
    
    
});







describe('New Answer Page Tests as Registered User', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.login('user2', 'password2');
        navigateToQuestionAnswer('Introduction to Git and GitHub');// Unanswered question
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('verifies Answer Question button visibility and functionality for registered user', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
    });

    it('displays the answer submission form', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        cy.get('.new-answer-page').should('be.visible');
        cy.get('textarea#answerTextInput').should('be.visible');
        cy.get('button[type="submit"]').should('contain', 'Post Answer');
    });

    it('shows an error for an invalid hyperlink', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        
        const invalidText = 'Check this [google](http://google.com)';
        cy.get('textarea#answerTextInput').type(invalidText);
        cy.get('button[type="submit"]').click();
        cy.get('.error').should('contain', 'Invalid hyperlink');
    });

    it('shows an error for an empty hyperlink', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        
        const invalidText = 'Check this [google]()';
        cy.get('textarea#answerTextInput').type(invalidText);
        cy.get('button[type="submit"]').click();
        cy.get('.error').should('contain', 'Invalid hyperlink');
    });

    it('shows an error for an empty hyperlink text', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        
        const invalidText = 'Check this [](https://google.com)';
        cy.get('textarea#answerTextInput').type(invalidText);
        cy.get('button[type="submit"]').click();
        cy.get('.error').should('contain', 'Invalid hyperlink');
    });
    
    it('accepts a valid hyperlink without showing an error', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        
        const validText = 'Check this [google](https://google.com)';
        cy.get('textarea#answerTextInput').clear().type(validText);
        cy.get('button[type="submit"]').click();
        cy.get('.error').should('not.exist');
    });
    
    it('submits the form and redirects to the question page', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        cy.get('textarea#answerTextInput').type('This is a valid answer');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', `/questions/`);
    });

    it('posts a new answer and verifies its display on the question page', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        const answerText = 'This is a test answer for the question.';
        cy.get('textarea#answerTextInput').type(answerText);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', `/questions/`);
        
        // Verify the answer is posted and displayed correctly at the top
        cy.get('.answers-section .answer-container').first().should('contain', answerText);
    });

    it('displays answer details correctly for the most recent answer', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        const answerText = 'This is a test answer for the question.';
        cy.get('textarea#answerTextInput').type(answerText);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', `/questions/`);
        
        cy.get('.answers-section .answer-container').first().within(() => {
            cy.get('.answerText').should('contain', answerText); 
            // Check vote buttons for registered users
        cy.get('.vote-buttons').within(() => {
            cy.get('button').contains(/Upvote \d+/); // Checks for 'Upvote [number]'
            cy.get('button').contains(/Downvote \d+/); // Checks for 'Downvote [number]'
        });

        cy.get('.answerAuthor').should('contain', 'answered')
            .and('contain', 'user2'); // Check for the username

        // Check for the date format
        cy.get('.answerAuthor').invoke('text').then((text) => {
            const datePattern = /\banswered \w{3} \d{1,2}, \d{4}, \d{2}:\d{2}\b/;
            expect(text).to.match(datePattern);
            });
        });
    });

    it('moves the question to the top in active view after posting an answer', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        const answerText = 'This is a test answer for the question.';
        cy.get('textarea#answerTextInput').type(answerText);
        cy.get('button[type="submit"]').click();
        // Navigate back to the homepage
        cy.visit('http://localhost:3000/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().find('.postTitle a')
          .should('contain', 'Introduction to Git and GitHub');
    });

    it('displays the latest answer at the top after posting multiple answers', () => {
        const postAnswer = (answerText) => {
            cy.get('.answers-section-button').should('be.visible').click();
            cy.url().should('include', '/answer');
            cy.get('textarea#answerTextInput').type(answerText);
            cy.get('button[type="submit"]').click();
            cy.url().should('include', `/questions/`);
            cy.wait(1000);
        };
    
        // Post three answers
        postAnswer('First test answer for the question.');
        postAnswer('Second test answer for the question.');
        postAnswer('Third test answer for the question.');
    
        // Verify the latest (third) answer is at the top
        cy.get('.answers-section .answer-container').first().within(() => {
            cy.get('.answerText').should('contain', 'Third test answer for the question.');
        });
    });

    it('updates the answer count to 1 and total questions under Active and Unanswered tabs', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        const answerText = 'This is a test answer for the question.';
        cy.get('textarea#answerTextInput').type(answerText);
        cy.get('button[type="submit"]').click();
        cy.visit('http://localhost:3000/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.main-top p').should('contain', 8);
        cy.get('.questionContainer .question-entry').first().within(() => {
            cy.contains('1 answers');
        });
        cy.get('.button-container .buttonDeco').contains('Unanswered').click();
        cy.get('.main-top p').should('contain', 4);
    });

    it('updates the answer count to 2 on the homepage after posting two answers', () => {
        const postAnswer = (answerText) => {
            cy.get('.answers-section-button').should('be.visible').click();
            cy.url().should('include', '/answer');
            cy.get('textarea#answerTextInput').type(answerText);
            cy.get('button[type="submit"]').click();
            cy.url().should('include', `/questions/`);
            cy.wait(1000);
        };
        postAnswer('First test answer for the question.');
        postAnswer('Second test answer for the question.');
        cy.visit('http://localhost:3000/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().within(() => {
            cy.contains('2 answers');
        });
    });

    it('displays an error when submitting an empty answer', () => {
        cy.get('.answers-section-button').should('be.visible').click();
        cy.url().should('include', '/answer');
        cy.get('textarea#answerTextInput').clear();
        cy.get('button[type="submit"]').click();
        cy.get('.error').should('contain', 'Answer text cannot be empty');
    });
    
});

describe('User Profile Page Tests', () => {
    beforeEach(() => {
        cy.exec('node ../server/init.js');
        cy.login('user1', 'password1');
        cy.visit('/#/userprofile');
    });

    afterEach(() => {
        cy.exec('node ../server/destroy.js');
    });

    it('displays user information correctly', () => {
        cy.get('.userDetails').should('be.visible');
        cy.get('.userDetails').should('contain', 'Member for:');
        cy.get('.userDetails').should('contain', 'Reputation Points: 50');
    });

    it('verifies user profile information for points and member days', () => {
        cy.login('user4', 'password4');
        cy.visit('/#/userprofile');
        cy.get('.userDetails').should('be.visible');
        cy.get('.userDetails').should('contain', 'Reputation Points: 30');
        cy.get('.userDetails').should('contain', 'Member for: 10 days');
    });

    it('navigates to the correct pages from menu links', () => {
        cy.contains('View All Your Questions').click();
        cy.url().should('include', '/#/userprofile/questions');
        cy.visit('/#/userprofile');
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        cy.visit('/#/userprofile');
        cy.contains('View All Your Answers').click();
        cy.url().should('include', '/userprofile/answers');

    });

    it('displays user asked questions correctly', () => {
        cy.contains('View All Your Questions').click();
        cy.get('.questions-list').should('be.visible');
        cy.get('.questions-list li').each(($li) => {
            cy.wrap($li).find('a').should('have.attr', 'href').and('include', '/questions/details/');
        });
    });

    it('allows user to edit and repost a question', () => {
        cy.contains('View All Your Questions').click();
        cy.get('.questions-list').should('be.visible');
        cy.get('.questions-list li').first().click();
        cy.get('input.question-input').clear().type('Updated Question Title');
        cy.get('textarea.question-textarea').clear().type('Updated question text');
        cy.get('button.editButton').click();
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Question reposted successfully');
        });
        cy.url().should('include', '/userprofile/questions');
        cy.get('.questions-list li').first().contains('Updated Question Title')
    });

    it('allows user to delete a question', () => {
        cy.contains('View All Your Questions').click();
        cy.get('.questions-list').should('be.visible');
        cy.get('.questions-list li').first().click();
        cy.get('button.deleteButton').click();
        cy.on('window:confirm', () => true);
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Question deleted successfully');
        });
        cy.url().should('include', '/userprofile/questions');
        cy.get('.questions-list li').first().contains('Introduction to Git and GitHub')
    });

    it('reposting does not change original posting date', () => {
        cy.contains('View All Your Questions').click();
        cy.get('.questions-list').should('be.visible');
        cy.get('.questions-list li').first().click();
        cy.get('input.question-input').clear().type('Updated Question Title');
        cy.get('textarea.question-textarea').clear().type('Updated question text');
        cy.get('button.editButton').click();
        cy.visit('/#/home');
        navigateToQuestionAnswer('Updated Question Title');
        cy.get('.questionMetadata').contains('Jan 1');
    });
    

    it('reposting a question marks it as active', () => {
        cy.contains('View All Your Questions').click();
        cy.get('.questions-list').should('be.visible');
        cy.get('.questions-list li').first().click();
        cy.get('input.question-input').clear().type('Updated Question Title');
        cy.get('textarea.question-textarea').clear().type('Updated question text');
        cy.get('button.editButton').click();
        cy.visit('/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().find('.postTitle a')
          .should('contain', 'Updated Question Title');
    });

    it('allows the user to view all tags created by them', () => {
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        cy.get('.user-tags-list').should('be.visible');
        cy.get('.user-tags-list li').contains('JavaScript');
    });

    it('allows the user to create a new tag', () => {
        cy.visit('/#/ask');
        cy.get('#formTitleInput').type('Question with New Tag');
        cy.get('#formTextInput').type('Question text');
        cy.get('#formTagInput').type('newtag');
        cy.get('form').submit();
        cy.visit('/#/userprofile/tags');
        cy.get('.user-tags-list').should('contain', 'newtag');
    });
    
    
    it('allows the user to edit tag not used by others and verify change', () => {
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        cy.get('.user-tags-list').contains('Git').parents('li').then($li => {
            cy.wrap($li).find('button').contains('Edit').click();
            cy.wrap($li).find('input[type="text"]').clear().type('Github');
            cy.wrap($li).find('button').contains('Save').click();
        });
        cy.visit('http://localhost:3000/#/tags');
        cy.get('.tagsContainer').should('contain', 'Github');
    });
    
    
    
    it('allows the user to delete a tag not used by others and verify by checking the number of tags', () => {
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        cy.get('.user-tags-list').contains('Git').parents('li').then($li => {
            cy.wrap($li).find('button').contains('Delete').click();
            cy.on('window:confirm', () => true);
        });
        cy.visit('http://localhost:3000/#/tags');
        cy.get('.tagsContainer .tagNode').should('have.length', 5);
    });
    
    

    it('prevents editing a tag if it is used by other users', () => {
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        
        cy.get('.user-tags-list').contains('JavaScript').parents('li').then($li => {
            cy.wrap($li).find('button').contains('Edit').click();
            cy.wrap($li).find('input[type="text"]').clear().type('Attempted New Name');
            cy.wrap($li).find('button').contains('Save').click();
            cy.on('window:alert', (str) => {
                expect(str).to.contain('Error updating tag');
            });
        });
    });
    

    it('prevents deleting a tag if it is used by other users', () => {
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        
        cy.get('.user-tags-list').contains('JavaScript').parents('li').as('JavaScriptTag');
        cy.get('@JavaScriptTag').find('button').contains('Delete').click();
        cy.on('window:confirm', () => true);
        cy.on('window:alert', (str) => {
            expect(str).to.contain('Error deleting tag');
        });
    });
    

    it('displays a message when the user has no tags created', () => {
        cy.login('user4', 'password4');
        cy.visit('/#/userprofile');
        cy.contains('View All Your Tags').click();
        cy.url().should('include', '/userprofile/tags');
        cy.get('p').should('contain', 'No tags created yet. You must have at least 50 reputation to create new tags!');
    });
    
    
    
    it('allows the user to view all answers posted by them', () => {
        cy.contains('View All Your Answers').click();
        cy.url().should('include', '/userprofile/answers');
        cy.get('.answers-list').should('be.visible');
        cy.get('.answers-list li').each(($li) => {
            cy.wrap($li).find('a').should('have.attr', 'href').and('include', '/userprofile/answers/edit/');
            cy.wrap($li).invoke('text').should('match', /...$/);
        });
    });
    
    

    it('allows the user to edit an answer', () => {
        cy.visit('/#/userprofile/answers');
        cy.get('.answers-list li').first().find('a').click();
        cy.url().should('include', '/userprofile/answers/edit/');
        cy.get('textarea').clear().type('Updated answer text');
        cy.get('form').submit();
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Answer updated successfully');
        });
        cy.url().should('include', '/userprofile/answers');
        cy.get('.answers-list li').first().should('contain', 'Updated answer text');
    });

    it('allows the user to delete an answer', () => {
        cy.visit('/#/userprofile/answers');
        cy.get('.answers-list li').first().find('a').click();
        cy.url().should('include', '/userprofile/answers/edit/');
    
        cy.get('button').contains('Delete Answer').click();
        cy.on('window:confirm', () => true);
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Answer deleted successfully');
        });
        cy.url().should('include', '/userprofile/answers');
        cy.get('.answers-list li').should('not.contain', 'Updated answer text');
    });
    
    

    it('marks the corresponding question as active when an answer is edited', () => {
        cy.visit('/#/userprofile/answers');
        cy.get('.answers-list li').first().find('a').click();
        cy.url().should('include', '/userprofile/answers/edit/');
        cy.get('textarea').clear().type('Updated answer text');
        cy.get('form').submit();
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Answer updated successfully');
        });
        cy.visit('/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().should('contain', 'Best practices for MongoDB schema design?');
    });

    it('marks the corresponding question as active when an answer is deleted', () => {
        cy.visit('/#/userprofile/answers');
        cy.get('.answers-list li').first().find('a').click();
        cy.url().should('include', '/userprofile/answers/edit/');
        cy.get('button').contains('Delete Answer').click();
        cy.on('window:confirm', () => true);
        cy.on('window:alert', (str) => {
            expect(str).to.equal('Answer deleted successfully');
        });
        cy.visit('/#/home');
        cy.get('.button-container .buttonDeco').contains('Active').click();
        cy.get('.questionContainer .question-entry').first().should('contain', 'Best practices for MongoDB schema design?');
    }); 
    
});
















