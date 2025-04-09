
npm install -g @anthropic-ai/claude-code

npm install react react-dom react-router-dom
npm install @reduxjs/toolkit react-redux
npm install axios
npm install chart.js react-chartjs-2
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


src/
├── app/
│   ├── store.ts
│   ├── App.tsx
│   └── routes.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── services/authService.ts
│   │   ├── slices/authSlice.ts
│   │   ├── pages/LoginPage.tsx
│   │   └── index.ts
│   │
│   ├── dashboard/
│   │   ├── components/DashboardCard.tsx
│   │   ├── pages/DashboardPage.tsx
│   │   ├── services/dashboardService.ts
│   │   └── index.ts
│   │
│
├── components/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Header.tsx
│   └── Loader.tsx
│
├── layouts/
│   └── MainLayout.tsx
│
├── lib/
│   ├── axios.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── types/
│   ├── auth.ts
│   └── index.ts
│
├── assets/
│   └── logo.svg
│
├── styles/
│   └── tailwind.config.ts
│
└── index.tsx