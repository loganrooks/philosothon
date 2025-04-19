# Project Style Guide: Minimalist Hacker Aesthetic

This document outlines the visual style guidelines for the Philosothon platform, aiming for a consistent minimalist hacker/coder aesthetic.

## Core Principles

*   **Minimalism:** Clean, uncluttered interfaces. Focus on typography and essential elements.
*   **Hacker/Coder Theme:** Dark background, monospace fonts, green accents reminiscent of old terminals.
*   **Consistency:** Apply these guidelines uniformly across all components and pages.
*   **Accessibility:** Ensure sufficient contrast and usability, even within the chosen aesthetic.

## Backgrounds

*   **Default:** The `MatrixBackground` component (`platform/src/components/MatrixBackground.tsx`) should be used as the default background for the main layout. It provides a fixed, full-screen canvas animation.
    *   It uses `dark-base` (`#0D0D0D`) with low alpha for the fading effect.
    *   It renders falling characters using `dark-green` (`#008F11`) for standard binary rain and a slightly brighter green (`#00FF41`, close to `hacker-green`) for embedded philosopher names.
    *   The overall canvas has an opacity of `0.5`.
*   **Solid/Translucent Backgrounds:** To maximize Matrix visibility, avoid solid backgrounds where possible. If a background is needed for readability (e.g., forms, cards), prefer slightly translucent options like `bg-black/75` or `bg-dark-base/80`. Use solid `bg-black` mainly for inputs.

## 1. Color Palette

Use the defined Tailwind theme colors. Avoid arbitrary hex codes or default Tailwind grays (other than `medium-gray` defined below).

*   **Primary Background:** `bg-dark-base` (`#0D0D0D`) / `bg-black` - Use for solid backgrounds only when necessary (e.g., inputs). Prefer translucent variants (`bg-black/75`, `bg-dark-base/80`) or no background for components overlaying the Matrix.
*   **Primary Text:** `text-light-text` (`#E0E0E0`) - **This is the default color for almost all text**, including body text, headings, labels, links, and component content, ensuring readability over the Matrix or translucent backgrounds.
*   **Primary Accent (Background/Border):** `bg-hacker-green` (`#00FF00`) / `border-hacker-green` (`#00FF00`) - Used for primary action button backgrounds, focus indicators (rings/borders), and key decorative elements (like timeline dots/borders).
*   **Primary Accent (Text):** `text-hacker-green` (`#00FF00`) - **Use very sparingly.** Primarily intended for text on a solid `bg-black` background if absolutely necessary for a specific highlight. **Do not use for standard headings, links, or body text over the Matrix/translucent backgrounds.**
*   **Secondary Accent:** `text-dark-green` (`#008F11`) / `bg-dark-green` (`#008F11`) / `border-dark-green` (`#008F11`) - Used for less prominent highlights or secondary states. The Matrix background uses this for the standard binary rain effect.
*   **Button Text (on Green):** `text-black` or `text-dark-base` - Used for text on `bg-hacker-green` buttons to ensure contrast.
*   **Borders/Dividers:** `border-medium-gray` (`#333333`) - Used for standard borders on inputs, cards, dividers.
*   **Error Text:** `text-red-500` (Standard Tailwind red) - Used for form validation errors or critical alerts.

**Example Usage:**

```html
<div class="bg-black/75 text-light-text p-4 border border-medium-gray rounded-none">
  <h2 class="font-philosopher text-light-text mb-2">Section Title</h2>
  <p class="font-mono">This is standard body text.</p>
  <a href="#" class="text-light-text hover:underline">A standard link</a>
  <button class="bg-hacker-green text-black px-4 py-2 rounded-none">Primary Action</button>
</div>
```

## 2. Typography

*   **Default Body Font:** `font-mono` (JetBrains Mono) - Applied via `<body>` tag in `layout.tsx`. Use for all standard text unless specified otherwise.
*   **Heading Font:** `font-philosopher` (Philosopher) - Can be used for main page titles (h1) or section headings (h2, h3) for stylistic emphasis. Apply directly via class: `className="font-philosopher"`.
*   **Code Font:** `font-mono` (JetBrains Mono) - Use for any code snippets or preformatted text.

**Font Sizes:** Use Tailwind's default type scale (`text-sm`, `text-base`, `text-lg`, `text-xl`, etc.).

## 3. Spacing

*   Use Tailwind's default spacing scale (`p-2`, `m-4`, `space-y-4`, etc.) for padding, margins, and gaps between elements.
*   Maintain consistency. Standard component padding might be `p-4`. Standard vertical spacing between form elements might be `space-y-4`.
*   The main layout container uses `container mx-auto px-4 sm:px-6 lg:px-8 py-16`.

## 4. Borders & Corners

*   **No Rounded Corners:** Ensure no `rounded-*` classes are applied to elements like buttons, inputs, cards, or containers. Use `rounded-none` explicitly if needed to override a default or framework style.
*   **Standard Border:** `border border-medium-gray`
*   **Focus/Accent Border:** `border border-hacker-green` or `border border-dark-green`

## 5. Common Component Styles

Provide consistent styling for reusable components.

### Buttons

*   **Primary:**
    *   Classes: `bg-hacker-green text-black px-4 py-2 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base rounded-none`
    *   Example: `<button className="bg-hacker-green text-black px-4 py-2 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base rounded-none">Submit</button>`
*   **Secondary/Outline:**
    *   Classes: `border border-medium-gray text-light-text px-4 py-2 hover:bg-medium-gray focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base rounded-none`
    *   Example: `<button className="border border-medium-gray text-light-text px-4 py-2 hover:bg-medium-gray focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base rounded-none">Cancel</button>`

### Forms

*   **Labels:**
    *   Classes: `block text-sm font-medium text-light-text mb-1`
*   **Inputs (Text, Date, Time, etc.):**
    *   Classes: `mt-1 block w-full bg-black border border-medium-gray text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm rounded-none`
*   **Textareas:**
    *   Classes: `mt-1 block w-full bg-black border border-medium-gray text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm rounded-none` (Adjust `rows` as needed)
*   **Error Messages:**
    *   Classes: `mt-1 text-sm text-red-500`

### Cards / Content Blocks

*   **Container:** Prefer `bg-black/75 border border-medium-gray p-4 rounded-none` or just `border border-medium-gray p-4 rounded-none` to allow Matrix visibility. Use solid `bg-dark-base` only if necessary for readability.
*   **Title:** `font-philosopher text-light-text text-lg mb-2` (Use standard text color)
*   **Body:** `text-light-text text-sm`

### Timeline

*   **Container:** `border-l-2 border-hacker-green pl-6` (Green border is okay)
*   **Heading:** `text-lg font-semibold text-light-text mb-4` (Use standard text color)
*   **Dot:** `absolute -left-[30px] top-1 h-4 w-4 bg-hacker-green border-2 border-dark-base` (Green dot is okay)
*   **Year:** `text-sm font-semibold text-light-text opacity-80` (Use standard text color)
*   **Event Text:** Inherits default `text-light-text`.

## 6. Implementation Notes

*   Apply styles primarily using Tailwind utility classes.
*   Avoid global CSS overrides where possible; prefer component-level styling or Tailwind configuration.
*   Regularly review components against this guide to ensure consistency.
*   Update this guide if new patterns emerge or decisions change.