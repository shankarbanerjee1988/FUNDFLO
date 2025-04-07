import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { login, logout, clearError } from '../slices/authSlice';
import { LoginCredentials } from '../../../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const loginUser = useCallback(
    (credentials: LoginCredentials) => dispatch(login(credentials)),
    [dispatch]
  );
  
  const logoutUser = useCallback(
    () => dispatch(logout()),
    [dispatch]
  );
  
  const resetAuthError = useCallback(
    () => dispatch(clearError()),
    [dispatch]
  );
  
  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token,
    loginUser,
    logoutUser,
    resetAuthError,
  };
};