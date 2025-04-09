import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../app/store';
import { loginSuccess, logout } from '../slices/authSlice';
import { authService } from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const login = async (username: string, password: string) => {
    const user = await authService.login(username, password);
    dispatch(loginSuccess(user));
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  return { login, logoutUser };
};