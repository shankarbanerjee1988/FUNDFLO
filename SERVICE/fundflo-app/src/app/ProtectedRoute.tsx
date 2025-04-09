import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: any) => state.auth.token);
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;