import { useDispatch } from 'react-redux';
import { loginSuccess } from './../slices/authSlice';
import { login } from './../authAPI';
import { useNavigate } from 'react-router-dom';
import React from "react";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.currentTarget as any).email.value;
    const password = (e.currentTarget as any).password.value;
    const { token, user } = await login(email, password);
    dispatch(loginSuccess({ token, user }));
    navigate('/dashboard');
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl font-bold">Login</h2>
        <input type="email" name="email" placeholder="Email" className="border w-full p-2" required />
        <input type="password" name="password" placeholder="Password" className="border w-full p-2" required />
        <button className="bg-blue-500 text-white px-4 py-2 w-full">Login</button>
      </form>
    </div>
  );
};

export default Login;