import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="flex flex-col space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) =>
          \`block px-3 py-2 rounded \${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}\`
        }>
          Dashboard
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) =>
          \`block px-3 py-2 rounded \${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}\`
        }>
          Orders
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;