# Styling Conventions - Second Brain Frontend

## Overview

Second Brain uses Tailwind CSS for styling with a utility-first approach. This document outlines styling conventions and patterns.

---

## Tailwind Configuration

**File**: `frontend/tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors (if any)
      }
    },
  },
  plugins: [],
}
```

---

## Color System

### Category Colors

```javascript
const categoryColors = {
  'Idea': { 
    bg: 'bg-amber-100', 
    text: 'text-amber-800', 
    border: 'border-amber-200' 
  },
  'Task': { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-200' 
  },
  'Project': { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800', 
    border: 'border-purple-200' 
  },
  'Reference': { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-800', 
    border: 'border-emerald-200' 
  },
  'Journal': { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-200' 
  },
  'Meeting': { 
    bg: 'bg-pink-100', 
    text: 'text-pink-800', 
    border: 'border-pink-200' 
  },
  'Learning': { 
    bg: 'bg-cyan-100', 
    text: 'text-cyan-800', 
    border: 'border-cyan-200' 
  },
  'Unsorted': { 
    bg: 'bg-slate-100', 
    text: 'text-slate-800', 
    border: 'border-slate-200' 
  }
};
```

---

### Primary Colors

- **Primary**: `blue-600` (#2563eb)
- **Success**: `green-600` (#16a34a)
- **Warning**: `yellow-600` (#ca8a04)
- **Danger**: `red-600` (#dc2626)
- **Gray**: `slate-600` (#475569)

---

## Common Patterns

### Buttons

```jsx
// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Primary Action
</button>

// Secondary button
<button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
  Secondary
</button>

// Danger button
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
  Delete
</button>

// Disabled button
<button 
  disabled 
  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
>
  Disabled
</button>

// Loading button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-wait">
  <span className="animate-spin mr-2">⏳</span>
  Loading...
</button>
```

---

### Cards

```jsx
// Basic card
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>

// Card with hover effect
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
  {/* Content */}
</div>

// Card with border
<div className="bg-white rounded-lg border border-gray-200 p-6">
  {/* Content */}
</div>
```

---

### Inputs

```jsx
// Text input
<input 
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text..."
/>

// Textarea
<textarea 
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
  rows="4"
  placeholder="Enter content..."
/>

// Select
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Input with error
<input 
  className="w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
/>
<p className="mt-1 text-sm text-red-600">Error message</p>
```

---

### Modals

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Modal header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold">Modal Title</h2>
      <button className="text-gray-500 hover:text-gray-700">
        <X className="w-5 h-5" />
      </button>
    </div>
    
    {/* Modal body */}
    <div className="p-6">
      {/* Content */}
    </div>
    
    {/* Modal footer */}
    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
      <button className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
    </div>
  </div>
</div>
```

---

### Badges/Tags

```jsx
// Tag/badge
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
  <Tag className="w-3 h-3 mr-1" />
  Tag Name
</span>

// Removable tag
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
  Tag Name
  <button className="ml-2 hover:bg-blue-200 rounded-full p-1">
    <X className="w-3 h-3" />
  </button>
</span>
```

---

### Loading States

```jsx
// Spinner
<div className="flex justify-center items-center p-8">
  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
</div>

// Skeleton loader
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Pulsing text
<p className="text-gray-500 animate-pulse">Loading...</p>
```

---

### Layouts

```jsx
// Container
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>

// Two-column layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>{/* Column 1 */}</div>
  <div>{/* Column 2 */}</div>
</div>

// Sidebar layout
<div className="flex h-screen">
  <aside className="w-64 bg-gray-50 border-r border-gray-200">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 overflow-y-auto p-6">
    {/* Main content */}
  </main>
</div>
```

---

## Responsive Design

### Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Usage

```jsx
// Responsive padding
<div className="px-4 md:px-6 lg:px-8">

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Hide on mobile
<div className="hidden md:block">

// Show only on mobile
<div className="block md:hidden">

// Responsive text size
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

---

## Animations

### Transitions

```jsx
// Hover transitions
<button className="transition-colors hover:bg-blue-700">
<div className="transition-all hover:scale-105">
<div className="transition-shadow hover:shadow-lg">

// Duration
<div className="transition-all duration-200">  // Fast
<div className="transition-all duration-300">  // Default
<div className="transition-all duration-500">  // Slow
```

### Framer Motion

```jsx
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide in
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
>
  Content
</motion.div>
```

---

## Accessibility

### Focus States

```jsx
// Always include focus states
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Visible focus indicator
<a className="focus-visible:ring-2 focus-visible:ring-blue-500">
```

### Screen Reader Text

```jsx
<span className="sr-only">Description for screen readers</span>
```

---

## Best Practices

1. **Consistent Spacing**: Use Tailwind's spacing scale (4px increments)
2. **Limit Custom CSS**: Prefer Tailwind utilities
3. **Component Variants**: Use conditional classes for variants
4. **Extract Repeated Patterns**: Create reusable components
5. **Mobile-First**: Start with mobile, add desktop with breakpoints
6. **Dark Mode** (future): Use `dark:` variant

---

**Last Updated**: 2026-01-24  
**Tailwind Version**: 3.4.4  
**Design System**: Utility-first, mobile-responsive
