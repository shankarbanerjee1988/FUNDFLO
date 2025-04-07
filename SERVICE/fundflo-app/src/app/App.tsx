import React, { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { useAuth } from '../features/auth/hooks/useAuth';
import { authService } from '../features/auth/services/authService';

const App: React.FC = () => {
  const routing = useRoutes(routes);
  const { user, token } = useAuth();
  
  // Fetch current user on app load if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token && !user) {
        try {
          const currentUser = await authService.getCurrentUser();
          // You could dispatch an action here to update the user in the redux store
          console.log('Current user loaded:', currentUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          // Handle error, possibly by redirecting to login
        }
      }
    };
    
    fetchCurrentUser();
  }, [token, user]);
  
  return <>{routing}</>;
};

export default App;

// import React from 'react';

// const App: React.FC = () => {
//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-bold">React App</h1>
//       <p>App is starting up...</p>
//     </div>
//   );
// };

// export default App;