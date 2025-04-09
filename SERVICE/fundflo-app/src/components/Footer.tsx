import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 text-center text-sm text-gray-500 p-4 border-t">
      © {new Date().getFullYear()} My Company. All rights reserved.
    </footer>
  );
}