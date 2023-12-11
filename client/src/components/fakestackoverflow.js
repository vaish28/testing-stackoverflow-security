import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';

// Importing individual page and layout components
import WelcomePageComponent from './WelcomePageComponent.js';
import HomePageComponent from './HomePageComponent.js';
import TagsPageComponent from './TagsPageComponent.js';
import AnswersPageComponent from './AnswersPageComponent.js';
import AskQuestionComponent from './AskQuestionComponent.js';
import SearchResultsComponent from './SearchResultsComponent.js';
import NewAnswerComponent from './NewAnswerComponent.js';
import QuestionTagsPage from './QuestionsTagsPage.js';
import RegistrationFormComponent from './RegistrationFormComponent.js';
import LoginPageComponent from './LoginPageComponent.js';
import MainLayout from './MainLayout.js';
import UserProfile from './UserProfile.js';
import UserQuestionComponent from './UserQuestionComponent.js';
import UserAnswerComponent from './UserAnswerQuestionComponent.js';
import EditAnswerComponent from './EditAnswerComponent.js';
import QuestionDetailsComponent from './QuestionDetailsComponent';
import UserTagsComponent from './UserTagsComponent';




const FakeStackOverflow = () => {
  return (
    <HashRouter>
      <div>
        <Routes>
          {/* Set WelcomePageComponent as the default route */}
          <Route path="/" element={<WelcomePageComponent />} />

          {/* Individual routes for login and registration */}
          <Route path="/login" element={<LoginPageComponent />} />
          <Route path="/register" element={<RegistrationFormComponent />} />

          {/* Nested routes within MainLayout for authenticated pages */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePageComponent />} />
            {/* Other routes inside MainLayout */}
            <Route path="/questions/:qid/answer" element={<NewAnswerComponent />} />
            <Route path="/questions/:qid" element={<AnswersPageComponent />} />
            <Route path="/tags" element={<TagsPageComponent />} />
            <Route path="/ask" element={<AskQuestionComponent />} />
            <Route path="/search" element={<SearchResultsComponent />} /> 
            <Route path="/tags/:tid" element={<QuestionTagsPage />} />
            <Route path="/userprofile" element={<UserProfile />} />
            <Route path="/userprofile/questions" element={<UserQuestionComponent />} />
            <Route path="/userprofile/tags" element={<UserTagsComponent />} />
            <Route path="/userprofile/answers" element={<UserAnswerComponent />} />
            <Route path="/userprofile/answers/edit/:aid" element={<EditAnswerComponent />} />
            <Route path="/questions/details/:qid" element={<QuestionDetailsComponent />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
};
export default FakeStackOverflow;
