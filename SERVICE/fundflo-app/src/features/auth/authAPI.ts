import api from '../../lib/axios';
import { setToken } from '../../lib/token';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  const { token, user } = res.data;
  setToken(token);
  return { token, user };
};