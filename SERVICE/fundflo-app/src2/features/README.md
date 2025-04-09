
npm install -g @anthropic-ai/claude-code




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
│   └── orders/
│       ├── components/OrderTable.tsx
│       ├── pages/OrdersPage.tsx
│       ├── services/orderService.ts
│       ├── hooks/useOrders.ts
│       └── index.ts
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