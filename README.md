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
- Admin user management (assign roles, activate/deactivate users)

### 📦 Inventory Management
- Add and delete LPG products
- Support for various LPG container types (Cylinders, Tanks, Bottles, Canisters)
- Real-time stock tracking with low stock alerts
- Expiration date monitoring for safety compliance
- QR-based cylinder tracking (1:1 mapping - one QR code per cylinder)

### 📊 Stock Movements
- Record stock in/out operations
- Inventory adjustments with audit trail
- Movement history with user tracking
- Reference number support for documentation
- Status-based tracking (Available, Sold, Maintenance, Damaged, Missing)

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
- **SUPABASE_SERVICE_ROLE_KEY**: Your Supabase service role key (for server-side operations)

### Authentication
Users must be created through Supabase Auth. The system supports:
- **Admin Role**: Full system access including settings, user management, and viewing all data
- **Stockman Role**: Limited to inventory operations and viewing only their own data

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd petrogreen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup** (Required)
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Database Setup**
   ```bash
   # Run the database setup scripts in order:
   # 1. supabase_scripts/01_setup_simplified_system.sql
   # 2. supabase_scripts/02_setup_authentication.sql
   # 3. supabase_scripts/05_complete_rls_fix.sql (IMPORTANT: Run this to fix data visibility issues)
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Configuration

Ensure your Supabase database is properly configured with the necessary tables and Row Level Security policies. The application requires tables for products_simplified, stock_movements_simplified, and user_profiles.

### Data Visibility Rules
- **Admin users** can view all products and stock movements in the system
- **Stockman users** can only view products and stock movements they created
- All users can create, update, and delete their own records

## LPG Industry Features

### Product Types
- 11kg, 22kg, 50kg LPG Cylinders (Residential, Small Business, Industrial)
- Individual cylinder tracking with QR codes
- Status-based inventory management (Available, Sold, Maintenance, Damaged, Missing)

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

```
petrogreen/
├── app/                    # Next.js app directory
│   ├── add-item/          # Add product page
│   ├── reports/           # Reports and analytics
│   ├── settings/          # System settings
│   ├── stock-movements/   # Stock movement tracking
│   ├── backup/            # Backup and restore
│   ├── admin/users/       # User management (admin only)
│   └── login/             # Authentication
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── supabase_scripts/     # Database setup scripts
└── public/               # Static assets
```

## Troubleshooting

If you encounter data visibility issues where stockman users see the same data as admin users:

1. Ensure you've run the [supabase_scripts/05_complete_rls_fix.sql](file:///C:/Users/User/OneDrive/Desktop/inventory-system/supabase_scripts/05_complete_rls_fix.sql) script
2. Check that user profiles have the correct roles in the `user_profiles` table
3. Clear browser cache and refresh the application
4. Check the browser console for any JavaScript errors

For user management issues:
1. Ensure you're logged in as an admin user
2. Navigate to Admin → User Management
3. Check that the user management page loads correctly

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

- [x] QR-based cylinder tracking system
- [x] Status-based inventory management
- [x] Real-time stock movements
- [x] Role-based access control with proper data isolation
- [x] Admin user management functionality
- [ ] Advanced analytics and forecasting
- [ ] Multi-location support
- [ ] Integration with accounting systems
- [ ] Real-time notifications
- [ ] API development for third-party integrations

---

**Petrogreen** - Streamlining LPG inventory management for businesses worldwide.