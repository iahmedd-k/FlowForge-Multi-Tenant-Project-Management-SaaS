// Responsive wrapper functions for dashboard pages
// This file provides utility classes and wrapper components for mobile responsiveness

export const responsiveClasses = {
  // Container classes
  pageContainer: 'mx-auto max-w-4xl px-3 sm:px-4 md:px-6 py-3 sm:py-6',
  cardContainer: 'rounded-lg border border-[#d9e1f4] bg-white p-3 sm:p-5 shadow-sm',
  
  // Typography
  heading1: 'text-xl sm:text-2xl md:text-3xl font-bold',
  heading2: 'text-lg sm:text-xl md:text-2xl font-semibold',
  heading3: 'text-base sm:text-lg font-semibold',
  body: 'text-sm md:text-base',
  caption: 'text-xs sm:text-sm',
  
  // Spacing
  sectionGap: 'space-y-3 sm:space-y-4 md:space-y-6',
  gridGap: 'gap-2 sm:gap-3 md:gap-4',
  
  // Buttons & Controls
  primaryButton: 'h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm',
  secondaryButton: 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm',
  
  // Dropdowns & Popovers
  dropdown: 'w-[calc(100vw-24px)] sm:w-auto max-w-sm',
  popover: 'absolute left-0 top-[calc(100%+8px)] z-50',
  
  // Table/List views
  tableContainer: 'overflow-x-auto',
  tableRow: 'flex flex-col sm:flex-row gap-2 sm:gap-3',
  tableCell: 'text-xs sm:text-sm',
};

// Responsive grid configurations
export const responsiveGrids = {
  // 2 columns on mobile, 3 on sm, 4 on md
  responsive24: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  
  // 1 column on mobile, 2 on sm, 3 on md
  responsive123: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  
  // Stack on mobile, side-by-side on larger screens
  responsiveStack: 'flex flex-col sm:flex-row',
};

// Responsive breakpoints
export const breakpoints = {
  xs: '(max-width: 320px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};
