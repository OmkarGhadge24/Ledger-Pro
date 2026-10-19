# LedgerPro Frontend

LedgerPro is the React web client for the Banking System application. It provides separate workspaces for customers and privileged system users and communicates with the Express/MongoDB backend through its REST API.

## Features

### Customer workspace

- Register and sign in.
- View a dashboard with accounts, account statuses, and ledger-derived balances.
- Create and inspect accounts. Full account IDs are displayed so they can be shared as transfer details.
- Transfer between the customer's own accounts or to another customer's account by entering the recipient account ID.
- Review transfer details before confirming.
- View transaction history and ledger entries.
- View profile details and choose a light, dark, or system appearance preference.


### System-user workspace

System users are routed to a separate workspace after the frontend verifies their session and role with the backend. They can:

- Find customer account IDs in the customer account list.
- Select a listed active account or enter its account ID for initial funding.
- Review funding details and confirm before submission.
- View ledger entries associated with system-user funding transactions.

The backend controls system-user authorization and performs the funding and ledger operations.

## Technology

- React 19
- React Router
- Vite
- Tailwind CSS 4
- Axios
- Lucide React

## Project structure

```text
src/
├── App.jsx
├── main.jsx
├── components/
│   ├── layout/              # Sidebar, top bar, and page headers
│   └── ui/                  # Shared loading and error states
├── context/
│   ├── AuthContext.jsx      # Session, sign-in, registration, and sign-out
│   └── ThemeContext.jsx     # Appearance preference
├── layouts/                 # Auth and signed-in application layouts
├── pages/
│   ├── accounts/            # Account list, creation, and details
│   ├── auth/                # Sign-in and registration
│   ├── dashboard/
│   ├── ledger/
│   ├── profile/
│   ├── settings/
│   ├── system/              # System-user console, funding, and ledger
│   ├── transactions/        # Customer transaction history
│   └── transfers/           # Customer transfers
├── routes/                  # Protected-route behavior
└── services/                # API client and endpoint-specific calls
```

## Installation

Clone the repository:

```bash
git clone https://github.com/OmkarGhadge24/Ledger-Pro.git
cd "Ledger Pro"
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in this directory if the backend is not running at the default URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the Vite development server:

```bash
npm run dev
```

Vite prints the local URL after startup (typically `http://localhost:5173`).

## Routes

### Shared routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/register` | Create a customer account |
| `/profile` | View the signed-in user's profile details |
| `/settings` | Appearance and session settings |

### Customer routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Account and balance overview |
| `/accounts` | List accounts and view their full IDs |
| `/accounts/new` | Create an account |
| `/accounts/:accountId` | View account details |
| `/transactions` | Transfer funds |
| `/transactions/history` | View transaction history |
| `/ledger` | View ledger entries |

### System-user routes

System users use the same high-level paths, but see system-specific pages:

| Route | Purpose |
| --- | --- |
| `/dashboard` | System overview and customer accounts |
| `/accounts` | Customer account list and IDs |
| `/transactions` | Initial funding form |
| `/ledger` | Ledger entries from system funding |

The API enforces the user's role independently of the frontend route display.
