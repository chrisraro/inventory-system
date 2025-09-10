# Color Palette Update

## Overview
This document summarizes the changes made to update the web app's color palette to use the specified colors:
- Primary: rgb(113, 182, 170) - Teal/Turquoise
- Secondary: rgb(9, 78, 87) - Dark Teal/Blue
- Accent: #FFFFFF (White)

## Files Modified

### 1. tailwind.config.ts
Updated the Tailwind configuration to define new color scales:
- `primary`: Uses rgb(113, 182, 170) as the main color with a full range of tints and shades
- `secondary`: Uses rgb(9, 78, 87) as the secondary color with appropriate variations
- `accent`: Uses white (#FFFFFF) with appropriate foreground colors
- Added `brand` color definitions for consistency

### 2. app/globals.css
Updated CSS variables for both light and dark modes:
- `--primary`: 170 23% 58% (HSL equivalent of rgb(113, 182, 170))
- `--primary-foreground`: 200 89% 19% (HSL equivalent of rgb(9, 78, 87))
- `--secondary`: 200 89% 19% (HSL equivalent of rgb(9, 78, 87))
- `--secondary-foreground`: 0 0% 100% (White)
- `--accent`: 0 0% 100% (White)
- `--accent-foreground`: 200 89% 19% (HSL equivalent of rgb(9, 78, 87))
- Updated all related colors (background, foreground, card, popover, etc.) to maintain proper contrast and accessibility

### 3. styles/globals.css
Applied the same color updates to the root CSS file to ensure consistency across the application.

## Color Usage Guidelines

### Primary Color (rgb(113, 182, 170))
- Used for main actions, primary buttons, and key interactive elements
- Applied to links, active states, and important UI components

### Secondary Color (rgb(9, 78, 87))
- Used for headers, important text, and secondary actions
- Applied to navigation elements and supporting UI components

### Accent Color (White #FFFFFF)
- Used for backgrounds, cards, and clean UI surfaces
- Applied to text on dark backgrounds for proper contrast

## Implementation Notes
1. All HSL values were calculated from the provided RGB values to maintain consistency with Tailwind's color system
2. Proper contrast ratios have been maintained for accessibility compliance
3. Both light and dark mode variations have been updated
4. Related color tokens (like ring, border, etc.) have been adjusted to match the new palette
5. Brand color definitions were added to ensure consistent usage throughout the application

## Testing
After implementing these changes, verify that:
- All buttons and interactive elements use the new color scheme
- Text maintains proper contrast against backgrounds
- Both light and dark modes display correctly
- No visual regressions appear in existing components