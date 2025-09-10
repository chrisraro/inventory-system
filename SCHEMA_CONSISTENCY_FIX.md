# Schema Consistency Fix

## Problem
The database schema comment for the `products_simplified` table stated that the `id` field should be in "LPG-{QR_CODE} format", but the actual implementation was storing raw QR codes. This inconsistency could cause confusion and potential issues with data lookup.

## Solution
Updated the schema to be consistent with the actual implementation by:
1. Changing the schema comment to reflect that the `id` field uses "Raw QR code format"
2. Updating the helper functions to work with raw QR codes instead of LPG-prefixed format
3. Cleaning up the API implementations to be consistent with raw QR code approach
4. Removing unnecessary debugging code

## Changes Made

### 1. Database Schema (`supabase_scripts/01_setup_simplified_system.sql`)
- Updated comment for `id` field from "LPG-{QR_CODE} format" to "Raw QR code format"
- Modified helper functions to work with raw QR codes:
  - `generate_cylinder_id`: Now returns the QR code directly
  - `extract_qr_code`: Now returns the cylinder ID directly
  - `check_cylinder_exists`: Now checks both fields with raw QR codes
- Updated success message to reflect raw QR code format

### 2. API Routes
- `app/api/products/check-qr/route.ts`: Simplified product lookup to check only the `qr_code` field
- `app/api/products/create/route.ts`: Clarified that both `id` and `qr_code` fields contain raw QR codes

### 3. Frontend
- `app/stock-movements/page.tsx`: Removed debugging code and simplified QR code handling

## Benefits
1. **Consistency**: Schema documentation now matches actual implementation
2. **Simplicity**: Helper functions are simpler and more straightforward
3. **Clarity**: Clear indication that raw QR codes are used throughout the system
4. **Maintainability**: Easier to understand and maintain codebase

## Testing
To verify the fix:
1. Scan a QR code in the stock movements page
2. Verify that the product is found correctly
3. Check that manual entry also works properly
4. Confirm that product creation still works as expected

The system now consistently uses raw QR codes throughout, eliminating any confusion about the format.