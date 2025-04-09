import React from 'react';

const FooterLayout = () => {
  return (
    <footer className="p-4 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Fundflo. All rights reserved.
    </footer>
  );
};

export default FooterLayout;