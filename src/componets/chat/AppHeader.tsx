import React from 'react';
import { Layout } from 'antd';
import './AppHeader.scss';
import logo from '@/assets/1.jpg';


const { Header } = Layout;

const AppHeader: React.FC = () => {
  return (
    <Header className="header">
      <div className="left-section">
        <img src={logo} alt="Logo" className="logo" />
        <span className="title">智链 iLink</span>
      </div>
    </Header>
  );
};

export default AppHeader;
