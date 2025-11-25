import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AppointmentForm from './pages/AppointmentForm';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<AppointmentForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;