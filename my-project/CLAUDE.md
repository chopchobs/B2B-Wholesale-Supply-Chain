# Project Overview

โปรเจกต์นี้คือการพัฒนาระบบ Web Application B2B Wholesale & Supply Chain เป้าหมายคือเน้นประสิทธิภาพสูง โค้ดอ่านง่าย และสามารถดูแลรักษาระยะยาวได้

## Tech Stack

- Next.js 16.2 (App Router)
- TypeScript
- Prisma + PostgreSQL (Supabase)
- Tailwind CSS v4
- UI Components: Shadcn UI, Radix UI, Base UI
- State Management: Zustand
- Forms & Validation: React Hook Form + Zod
- Charts & Icons: Recharts, Lucide React

## Build Commands

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Project Structure

- `app/` — Next.js routes
- `components/` — React components
- `lib/` — Utilities
- `prisma/` — Database schema

## UI & Design System Rules

**Theme Concept:** Modern Minimalist with Elegant Accents.
**Core Directive:** The entire project must strictly adhere to the following Color Palette. The overall tone must be kept clean with White and Cream, using Rose Gold exclusively as a luxurious accent.

### 🎨 Color Palette & Usage Guidelines

- **Main Background (Warm Cream):** `#F5F0E8`
  - _Usage:_ Main application background, body background. This provides a natural, warm feel consistent with the Claude brand. ⚠️ DO NOT use stark white (`#FFFFFF`) for the main background.
- **Surface & Elements (White):** `#FFFFFF`
  - _Usage:_ Cards, Modals, Dropdowns, Sidebars, and input fields. This creates a clean depth against the Cream background.
- **Accent & Action (Terracotta):** `#CC785C` (Hover: `#B86548`)
  - _Usage:_ Primary Buttons, Call-to-Actions (CTAs), Active States (tabs/links), Checkboxes, and highlighted icons. This grounded warm tone serves as the primary interactive color.
- **Highlight & Brand (Sand):** `#D4A574`
  - _Usage:_ Brand accents, underlines, icon fills, progress bars, or decorative elements representing the Claude identity. DO NOT use this for interactive CTAs (use Terracotta instead).
- **Typography (Dark Brownish-Gray):** - _Primary Text:_ `#2D2825` (Headings, main body text). NEVER use pure black (`#000000`).
  - _Secondary Text:_ `#736B66` (Subtitles, helper text, placeholders).
- **Borders & Dividers (Warm Gray):** `#E8E0D5`
  - _Usage:_ Card borders, table borders, and section dividers. Harmonizes smoothly with the warm cream background.

### 💻 Tailwind CSS Integration

When generating or modifying UI components, always assume the project uses this color structure. If you need to generate Tailwind utility classes, use arbitrary values matching this palette (e.g., `bg-[#FAF9F5]`, `text-[#2D2825]`, `bg-[#B76E79]`) or assume these are mapped in the `tailwind.config` file.

## Key Conventions & Architecture

- React Components: ใช้รูปแบบ Standard Function Declaration เสมอ หลีกเลี่ยง Arrow Functions เด็ดขาด
- TypeScript: ต้องมีการระบุ Interface หรือ Type ให้ชัดเจนเสมอ
- API Routes: ต้อง return JSON ด้วยรูปแบบ `{ data, error }` เสมอ
- Database: ทุกการคิวรีต้องใช้ Prisma (ไม่อนุญาตให้ใช้ raw SQL เว้นแต่จะระบุไว้)
- Environment Variables: การตั้งค่า `frontend URL` และ `host` ใน Backend Controller ต้องดึงค่าผ่าน `.env` เสมอ ห้ามฮาร์ดโค้ด
- Comments: อธิบายลอจิกซับซ้อนด้วยคอมเมนต์ภาษาไทยสั้นๆ กระชับ
