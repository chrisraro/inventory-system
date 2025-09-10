# QR Code Debugging Summary

## Problem
The stock movements page is showing "Product Not Found - This QR code is not registered in the system" when scanning QR codes that should exist in the database.

## Debugging Steps Taken

### 1. Enhanced API Debugging (`app/api/products/check-qr/route.ts`)
- Added detailed logging to see what QR code is being received
- Added fallback checks by both QR code and ID fields
- Added checks for both trimmed and original QR code values
- Added better error logging

### 2. Enhanced Frontend Debugging (`app/stock-movements/page.tsx`)
- Added logging in `handleQRDetected` to see what QR code is detected
- Added logging of URL encoding to check for encoding issues
- Added fallback request without URL encoding
- Added logging in `handleManualQRSubmit` for manual entry debugging

### 3. Enhanced Product Creation Debugging (`app/api/products/create/route.ts`)
- Added logging to see what QR code is being stored
- Enhanced duplicate checking to check both ID and QR code fields
- Added logging of the created product

### 4. Created Debug Script (`scripts/debug-products.js`)
- Simple Node.js script to check what products exist in the database
- Shows product details including ID and QR code fields

## Potential Issues to Investigate

1. **URL Encoding Issues**: Special characters in QR codes might not be properly encoded/decoded
2. **Whitespace/Trimming Issues**: Leading/trailing whitespace might cause mismatches
3. **Database Schema Mismatch**: The ID and QR code fields might not be storing the same values
4. **Case Sensitivity**: QR codes might have case sensitivity issues
5. **Prefix Handling**: The LPG- prefix handling might be inconsistent

## Next Steps

1. Run the debug script to see what products actually exist in the database
2. Check the browser console logs when scanning QR codes
3. Verify that the QR codes being scanned match exactly what's stored in the database
4. Check for any special characters or whitespace that might be causing issues

## How to Test

1. Scan a QR code and check the browser console for detailed logs
2. Manually enter a QR code and check the logs
3. Run the debug script to see what's actually in the database:
   ```bash
   node scripts/debug-products.js
   ```
4. Check the server logs for API request details