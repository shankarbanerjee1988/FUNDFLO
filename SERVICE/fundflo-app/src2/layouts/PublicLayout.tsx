import React from 'react';

interface Props {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-blue-600 text-white">Public Header</header>
      <main className="p-4">{children}</main>
      <footer className="p-4 text-center text-sm text-gray-500">© 2025 Fundflo</footer>
    </div>
  );
};

export default PublicLayout;