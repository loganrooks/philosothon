# Philosothon Website Project Specification (Revised)

**Project Name:** Philosothon Event Platform  
**Version:** 1.1  
**Date:** March 30, 2025  

## 1. Executive Summary

This document outlines the specifications for developing a web platform to support the Philosothon event at the University of Toronto, with a focus on rapid implementation within a 2-day development window. The platform will initially focus on delivering event information and basic registration capabilities through an integrated Google Forms approach, with an architecture designed to easily accommodate future features such as team management, submission handling, and feedback collection.

Following careful consideration of multiple architectural options, this specification outlines an approach that balances immediate delivery needs with long-term maintainability and extensibility.

## 2. Project Scope

### 2.1 Core Deliverables (2-Day Implementation)

1. **Public Information Pages**
   - Home page with event overview and countdown
   - About page explaining Philosothon concept and history
   - Themes page detailing philosophical topics
   - Workshop descriptions
   - FAQ page with detailed answers to common questions

2. **Registration System**
   - Google Forms integration for participant registration
   - Embedded form on website
   - Form designed to collect all necessary participant data
   - Manual data export process for team formation

3. **Simple Admin Interface**
   - Password-protected admin area
   - Basic dashboard for viewing exported registration data
   - Interface for managing event content

### 2.2 Future Extensions (Post-MVP)

1. **Team Formation System**
   - Database integration for registration data
   - Algorithm for matching participants based on preferences
   - Team management interface
   - Automated notifications

2. **Submission Portal**
   - Team file uploads
   - Submission receipt generation

3. **Feedback Collection**
   - Post-event surveys
   - Analytics dashboard

4. **Judge Portal**
   - Presentation scheduling
   - Scoring interface

## 3. System Architecture & Technology Decisions

### 3.1 Technology Stack

| Component | Selected Technology | Alternatives Considered | Justification |
|-----------|---------------------|-------------------------|---------------|
| **Frontend Framework** | Next.js | Static Site Generator, WordPress, SPA | • Server-side rendering for SEO<br>• API routes for future backend needs<br>• File-based routing for developer efficiency<br>• React ecosystem compatibility |
| **UI Framework** | Tailwind CSS | Bootstrap, Material UI, Chakra UI | • Utility-first approach speeds development<br>• No unnecessary JavaScript<br>• Highly customizable<br>• Excellent with AI code assistance |
| **Registration System** | Google Forms | Custom forms, Typeform, Airtable | • Zero development time<br>• Complex question logic support<br>• Free tier sufficient<br>• Familiar interface for users |
| **Database** | Supabase | Firebase, MongoDB, Excel | • Relational model suits event data<br>• Built-in auth for admin access<br>• Row-level security for future features<br>• Free tier sufficient for event scale |
| **Authentication** | Supabase Auth (Email-only) | NextAuth.js, Custom JWT | • Simplest implementation for admin-only auth<br>• No user accounts needed initially<br>• Easily extensible for future needs |
| **Deployment** | Vercel | Netlify, GitHub Pages, AWS | • Optimized for Next.js<br>• Preview deployments speed development<br>• Free tier sufficient<br>• Minimal configuration |

### 3.2 High-Level Architecture

```
+----------------+                 +-------------------+
|                |    Embedded     |                   |
|  Google Forms  | <-------------> |  Next.js Website  | 
|                |      Form       |                   |
+----------------+                 +--------+----------+
        |                                   ^
        |                                   |
        v                                   v
+----------------+                 +-------------------+
|                |    Manual       |                   |
| Google Sheets  | ------------+-> |  Supabase DB      |
|                |    Import    |  |                   |
+----------------+              |  +--------+----------+
                                |           ^
                                |           |
                                v           v
                          +---------------------+
                          |                     |
                          | Admin Interface     |
                          | (Protected Routes)  |
                          |                     |
                          +---------------------+
```

### 3.3 Key Design Decisions

| Decision Area | Selected Approach | Rationale |
|---------------|-------------------|-----------|
| **Registration Flow** | Google Forms with manual data import | • Fastest implementation<br>• Complete feature set<br>• Minimal technical debt<br>• Acceptable for first event |
| **Authentication** | Email-based admin access only | • Students don't need accounts<br>• Simplifies development<br>• Secure admin access |
| **Rendering Strategy** | Hybrid (SSG + SSR) | • Static pages for content<br>• Server components for dynamic data<br>• Optimal performance |
| **Content Management** | Database-driven with admin interface | • Flexibility to update content<br>• Structured data for future features |

## 4. Detailed Specifications

### 4.1 Frontend Implementation

#### 4.1.1 Page Structure

| Page | Route | Description | Components |
|------|-------|-------------|------------|
| Home | `/` | Event overview, countdown | Hero, Countdown, EventHighlights |
| About | `/about` | Philosothon concept and history | ContentBlock, Timeline |
| Themes | `/themes` | Theme descriptions | ThemeCard, FilterControls |
| Workshops | `/workshops` | Workshop descriptions | WorkshopCard, TagFilter |
| FAQ | `/faq` | Frequently asked questions | AccordionGroup, SearchBar |
| Register | `/register` | Embedded Google Form | FormEmbed, InstructionBlock |
| Admin Dashboard | `/admin` | Protected admin area | DataTable, StatusFilters |

#### 4.1.2 Component Hierarchy

```
Layout
├── NavBar
├── PageContainer
│   └── [Page-specific components]
└── Footer

FormEmbed
├── IntroductionText
├── GoogleFormEmbed
└── SubmissionInstructions
```

#### 4.1.3 State Management

- React Context API for theme and admin authentication
- Server components for data fetching where possible
- Minimal client-side state for UI interactions

### 4.2 Backend Implementation

#### 4.2.1 API Routes

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|--------------|
| `/api/auth/login` | POST | Email magic link login | No |
| `/api/content/themes` | GET | Retrieve all themes | No |
| `/api/content/workshops` | GET | Retrieve all workshops | No |
| `/api/admin/registrations` | GET | Get registration data | Yes (Admin) |
| `/api/admin/content` | PUT | Update site content | Yes (Admin) |

#### 4.2.2 Authentication Logic

- Email magic link for admin access
- No registration required for students
- Session management using Supabase Auth
- Protected API routes and admin pages

#### 4.2.3 Google Forms Integration

1. Design comprehensive registration form in Google Forms
2. Embed form on website using iframe or JavaScript embed
3. Configure form to collect all necessary data:
   - Personal information
   - Philosophy background
   - Theme/workshop preferences (ranked choice)
   - Mentor/mentee preferences
   - Team pairing preferences
4. Link form to Google Sheet
5. Create manual export process to CSV
6. Import process to database for admin review

### 4.3 Database Schema

```sql
-- ADMIN USERS
-- Handled by Supabase Auth

-- CONTENT MANAGEMENT

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  analytic_tradition TEXT,
  continental_tradition TEXT,
  is_selected BOOLEAN DEFAULT FALSE
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  relevant_themes JSONB,
  facilitator TEXT,
  max_capacity INTEGER
);

CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER
);

-- REGISTRATION DATA (FOR FUTURE AUTOMATION)

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  import_batch TEXT,
  
  -- From Google Forms import
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  program TEXT NOT NULL,
  philosophy_background TEXT,
  self_rated_confidence INTEGER,
  interest_areas TEXT[],
  theme_preferences JSONB,
  workshop_preferences JSONB,
  is_mentor BOOLEAN DEFAULT FALSE,
  is_mentee BOOLEAN DEFAULT FALSE,
  interest_similarity_preference INTEGER,
  teammate_requests TEXT[],
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  extension_status TEXT,
  
  -- Added during review
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  team_id UUID
);
```

### 4.4 Design System

#### 4.4.1 Color Palette

- Primary: `#3B82F6` (Blue)
- Secondary: `#6B7280` (Gray)
- Accent: `#8B5CF6` (Purple)
- Background: `#F9FAFB` (Light Gray)
- Text: `#1F2937` (Dark Gray)

#### 4.4.2 Typography

- Headings: Philosopher (serif)
- Body: Inter (sans-serif)
- Monospace: JetBrains Mono (for code snippets)

## 5. Development Process

### 5.1 Development Timeline

#### Day 1: Foundation & Core Pages

| Time | Task | Deliverable |
|------|------|-------------|
| 09:00-10:00 | Project setup, Supabase configuration | Working development environment |
| 10:00-12:00 | Layout components, navigation | Site shell with navigation |
| 12:00-14:00 | Home page and About page | Content-populated pages |
| 14:00-16:00 | Themes and Workshop pages | Complete theme information |
| 16:00-17:30 | FAQ page with accordion | Interactive FAQ system |
| 17:30-18:00 | Google Form design | Registration form draft |

#### Day 2: Registration & Admin

| Time | Task | Deliverable |
|------|------|-------------|
| 09:00-10:30 | Finalize Google Form | Complete registration system |
| 10:30-11:30 | Registration page with form embed | Working registration flow |
| 11:30-13:00 | Admin authentication | Secure admin access |
| 13:00-15:00 | Admin dashboard implementation | Basic admin interface |
| 15:00-16:00 | Data import process | Working CSV import |
| 16:00-17:00 | Testing & bug fixes | Stable application |
| 17:00-18:00 | Deployment | Live production site |

### 5.2 AI Acceleration Points

1. **Component Generation** - Using GitHub Copilot for React components
2. **Styling** - Tailwind class suggestion and optimization
3. **API Routes** - Endpoint implementation templates
4. **Auth Logic** - Security pattern implementation
5. **Form Design** - Google Form structure optimization

### 5.3 Testing Strategy

1. **Manual Testing** - Core user journeys
2. **Responsive Testing** - Mobile, tablet, desktop
3. **Form Testing** - Submission and validation
4. **Admin Testing** - Protected route security

## 6. Deployment & Operations

### 6.1 Deployment Strategy

1. GitHub repository with main branch protection
2. Vercel continuous deployment from main
3. Environment variables for sensitive configuration
4. Custom domain setup with SSL

### 6.2 Operations Processes

**Registration Data Handling:**
1. Export Google Sheet to CSV weekly
2. Import to database using admin interface
3. Review applications and mark status
4. Export team assignments

## 7. Future Extensions

### 7.1 Phase 2: Database Integration & Team Formation

1. Direct API integration with Google Forms (via Webhook)
2. Automated data import process
3. Team matching algorithm implementation
4. Email notification system for team assignments

### 7.2 Phase 3: Submission System

1. Team portal for file submissions
2. Receipt generation for submissions
3. Judge access for reviewing submissions
4. Presentation scheduling system

### 7.3 Phase 4: Full Platform

1. Custom registration form replacing Google Forms
2. Integrated voting for themes and workshops
3. Feedback collection system
4. Analytics dashboard for event outcomes

## 8. Appendix: Google Form Design

### Registration Form Structure

1. **Introduction**
   - Explanation of Philosothon
   - Expected time commitment
   - Important dates

2. **Personal Information**
   - Full name
   - Email address
   - Academic year
   - Program/Major
   - Dietary restrictions
   - Accessibility requirements

3. **Philosophy Background**
   - Philosophy courses taken
   - Self-rated confidence (1-10)
   - Areas of philosophical interest (checkboxes)

4. **Event Preferences**
   - Theme ranking (drag-and-drop ranking)
   - Workshop ranking (drag-and-drop ranking)
   - Mentorship preferences (options for mentor/mentee/neither)

5. **Team Formation**
   - Interest similarity preference (1-10 scale)
   - Specific teammate requests (optional)

6. **Logistics**
   - Extension status (requested/approved/not needed)
   - How they heard about the event