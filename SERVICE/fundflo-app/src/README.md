src/
├── app/                  # App core (routing, store)
│   ├── store.ts
│   ├── App.tsx
│   └── routes.tsx
│
├── features/             # Feature-based modules
│   ├── auth/             # Login, auth state
│   └── dashboard/        # Dashboard with charts
│
├── components/           # Shared UI components (Sidebar, Header, Buttons)
├── layouts/              # MainLayout for protected pages
├── lib/                  # Axios, formatters, validators
├── types/                # TypeScript types
├── assets/               # Logo/images
├── styles/               # Tailwind config
└── index.tsx             # App entry point