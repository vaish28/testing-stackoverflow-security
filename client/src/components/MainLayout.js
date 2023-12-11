import React from 'react';
import { Outlet } from 'react-router-dom';
import HeaderComponent from './HeaderComponent.js';
import SidebarComponent from './SidebarComponent.js';
import '../stylesheets/index.css';

const MainLayout = () => {
  return (
    <div className='container'>
      <HeaderComponent />
      <SidebarComponent />
      <Outlet /> {/* This will render the matched child route */}
    </div>
  );
};

export default MainLayout;
