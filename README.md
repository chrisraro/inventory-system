# Petrogreen - LPG Inventory Management System

A comprehensive inventory management system specifically designed for LPG (Liquefied Petroleum Gas) distributors and retailers.

## Features

### 🔥 Core Functionality
- **LPG Product Management**: Track cylinders, tanks, and gas containers
- **Real-time Inventory**: Monitor stock levels with automatic alerts
- **Stock Movements**: Record incoming, outgoing, refills, and exchanges
- **Supplier Management**: Track multiple LPG suppliers and distributors
- **Expiration Tracking**: Monitor product expiry dates for safety compliance
- **Low Stock Alerts**: Automatic notifications for products below threshold

### 🔐 Authentication & Authorization
- Role-based access control (Admin & Stock Manager)
- Secure login with Supabase authentication
- Session management with database-backed user profiles

### 📦 Inventory Management
- Add, edit, and delete LPG products
- Support for various LPG container types (Cylinders, Tanks, Bottles, Canisters)
- Real-time stock tracking with low stock alerts
- Expiration date monitoring for safety compliance

### 📊 Stock Movements
- Record stock in/out operations
- Inventory adjustments with audit trail
- Movement history with user tracking
- Reference number support for documentation

### 📈 Reports & Analytics
- Comprehensive inventory reports
- Export data to CSV format
- Date range filtering (monthly, yearly, custom)
- Real-time dashboard metrics

### 💾 Backup & Restore
- Complete data backup functionality
- JSON export/import capabilities
- Data integrity validation
- Automated backup scheduling options

### ⚙️ Settings Management
- Company information configuration
- Inventory preferences and thresholds
- Notification settings
- Currency and localization support

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Hooks, Context API
- **Data Storage**: Supabase PostgreSQL database
- **Authentication**: Supabase Auth with role-based permissions

## Database Setup

This application requires a Supabase database setup:

### Required Environment Variables
- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous key

### Authentication
Users must be created through Supabase Auth. The system supports:
- **Admin Role**: Full system access including settings and user management
- **Stockman Role**: Limited to inventory operations

## Getting Started

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd petrogreen
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup** (Required)
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Configuration

Ensure your Supabase database is properly configured with the necessary tables and Row Level Security policies. The application requires tables for products, stock_movements, qr_codes, and settings.

## LPG Industry Features

### Product Types
- 5kg, 12.5kg, 19kg, 45kg LPG Cylinders
- Portable Canisters (2.5kg)
- Bulk Tanks and Industrial Containers
- Custom unit types support

### Suppliers
- Shell Gas
- BP Gas
- Total Gas
- Calor Gas
- Petron Gasul
- Solane
- Liquigaz
- Custom suppliers

### Safety Compliance
- Expiration date tracking
- Safety inspection reminders
- Regulatory compliance monitoring
- Hazardous material handling protocols

## Project Structure

\`\`\`
petrogreen/
├── app/                    # Next.js app directory
│   ├── add-item/          # Add product page
│   ├── edit-item/         # Edit product page
│   ├── reports/           # Reports and analytics
│   ├── settings/          # System settings
│   ├── stock-movements/   # Stock movement tracking
│   ├── backup/            # Backup and restore
│   └── login/             # Authentication
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact:
- Email: support@petrogreen.com
- Documentation: [docs.petrogreen.com](https://docs.petrogreen.com)

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics and forecasting
- [ ] Multi-location support
- [ ] Integration with accounting systems
- [ ] Barcode scanning functionality
- [ ] Real-time notifications
- [ ] API development for third-party integrations

---

**Petrogreen** - Streamlining LPG inventory management for businesses worldwide.
