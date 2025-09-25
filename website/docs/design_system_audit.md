# Tailwind CSS Design System Audit

This document outlines the audit of the existing Tailwind CSS implementation to formalize a design system.

## Color Palette

### Primary Colors
- `indigo`: Used for primary actions, links, and highlights. (e.g., `bg-indigo-600`, `text-indigo-600`, `border-indigo-500`)
- `blue`: Used for informational messages and some UI elements. (e.g., `bg-blue-50`, `text-blue-700`, `border-blue-200`)

### Secondary Colors
- `purple`: Used for secondary actions and highlights. (e.g., `bg-purple-100`, `text-purple-800`)
- `pink`: Used in gradients with purple. (e.g., `from-pink-500`, `to-pink-100`)
- `teal`: Used in the hero section. (e.g., `bg-teal-700`)

### Accent Colors
- `green`: Used for success states and indicators. (e.g., `bg-green-100`, `text-green-800`, `border-green-500`)
- `yellow`: Used for warnings or attention-grabbing elements. (e.g., `bg-yellow-100`, `text-yellow-800`)
- `red`: Used for error states and destructive actions. (e.g., `bg-red-50`, `text-red-800`, `border-red-200`)

### Neutral Colors
- `gray`: Used for text, backgrounds, and borders. (e.g., `bg-gray-100`, `text-gray-600`, `border-gray-300`)
- `white`: Used for backgrounds and text.
- `black`: Used for text and overlays.

## Typography

### Font Families
- `font-sans`: Default font.
- `font-heading`: Used for main headings.

### Font Sizes
- `text-xs`
- `text-sm`
- `text-base`
- `text-lg`
- `text-xl`
- `text-2xl`
- `text-3xl`
- `text-4xl`
- `text-6xl`

### Font Weights
- `font-light`
- `font-medium`
- `font-semibold`
- `font-bold`

## Spacing

A consistent spacing scale is used, based on Tailwind's default spacing scale. Common spacing utilities include:
- `p-`, `px-`, `py-`
- `m-`, `mx-`, `my-`
- `gap-`
- `space-x-`, `space-y-`

## Borders

- `border`
- `border-2`
- `border-b`
- `border-t`
- `border-l-4`
- `rounded`
- `rounded-md`
- `rounded-lg`
- `rounded-full`

## Shadows

- `shadow`
- `shadow-sm`
- `shadow-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`

## Component Primitives

Based on the class usage, the following component primitives can be identified:

- **Buttons:**
  - Primary: `bg-indigo-600 text-white`
  - Secondary: `bg-gray-100 text-gray-700`
  - Destructive: `bg-red-500 text-white`
- **Inputs:** `border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`
- **Cards:** `bg-white rounded-lg shadow-md border border-gray-200`
- **Badges:** `px-2 py-1 rounded-full text-xs font-medium`
- **Alerts:**
  - Info: `bg-blue-50 border border-blue-200 rounded-lg p-4`
  - Error: `bg-red-50 border border-red-200 rounded-lg p-4`

## Implemented Components

The following components have been created and are available for use:

- **Button:** A reusable button component with variants for different styles and sizes. Located at `src/components/ui/Button.tsx`.
- **Input:** A reusable input component with a consistent base style. Located at `src/components/ui/Input.tsx`.
- **Card:** A reusable card component with sub-components for header, title, description, content, and footer. Located at `src/components/ui/Card.tsx`.
- **Badge:** A reusable badge component with variants for different colors. Located at `src/components/ui/Badge.tsx`.
- **Alert:** A reusable alert component with variants for different states. Located at `src/components/ui/Alert.tsx`.

### Usage

To use the new components, import them from their respective files and use them in your JSX. For example:

```tsx
import { Button } from '@/components/ui/Button';

const MyComponent = () => (
  <Button variant="primary" size="lg">Click me</Button>
);
```

## Next Steps

1.  **Refactor Existing Code:** Continue replacing raw Tailwind classes with the new design tokens and reusable components.
2.  **Document the Design System:** Create a storybook or a style guide to document the design system.