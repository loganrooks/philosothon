# Philosothon Website Project Specification

**Project Name:** Philosothon Event Platform  
**Version:** 1.0  
**Date:** March 30, 2025  

## 1. Executive Summary

This document outlines the specifications for developing a web platform to support the Philosothon event at the University of Toronto. The platform will initially focus on event information and registration capabilities, with an architecture designed to easily accommodate future features such as team management, submission handling, and feedback collection.

The solution will be built using modern web technologies prioritizing maintainability, extensibility, and performance while enabling rapid initial development with AI assistance.

## 2. Project Scope

### 2.1 Core Deliverables (MVP - 2 Day Implementation)

1. **Public Information Pages**
   - Home page with event overview and countdown
   - About page explaining Philosothon concept and history
   - Themes page detailing philosophical topics
   - Workshop descriptions
   - FAQ page

2. **Registration System**
   - Multi-step application form
   - Collection of participant preferences and background
   - Registration data storage and management
   - Admin interface for application review

3. **Basic Admin Tools**
   - Dashboard for viewing applications
   - Simple application approval/rejection workflow

### 2.2 Future Extensions (Post-MVP)

1. **Team Formation System**
   - Algorithm for matching participants based on preferences
   - Team management interface
   - Team notification system

2. **Submission Portal**
   - Team file uploads
   - Submission receipt generation
   - Plagiarism detection integration

3. **Feedback Collection**
   - Post-event surveys
   - Analytics dashboard
   - Report generation

4. **Judge Portal**
   - Presentation scheduling
   - Scoring interface
   - Results tabulation

## 3. System Architecture

### 3.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | Next.js | Server-side rendering, file-based routing, API routes, React ecosystem |
| **UI Framework** | Tailwind CSS + DaisyUI | Rapid styling, consistent design system, component extension |
| **Backend** | Next.js API Routes | Unified development experience, serverless deployment |
| **Database** | Supabase (PostgreSQL) | Relational data model, SQL support, real-time capabilities, auth services |
| **Authentication** | Supabase Auth | Easy integration, multiple auth methods, role-based access |
| **File Storage** | Supabase Storage | Tight integration with database, permissions framework |
| **Email Service** | Resend | Developer-friendly API, high deliverability |
| **Deployment** | Vercel | Optimized for Next.js, CI/CD pipeline, edge functions |

### 3.2 High-Level Architecture

```
                                 +-------------------+
                                 |                   |
                                 |  Vercel Platform  |
                                 |                   |
                                 +---------+---------+
                                           |
                                           v
+----------------+              +-------------------+              +----------------+
|                |              |                   |              |                |
|  Web Browsers  | <--------->  |    Next.js App    | <--------->  |    Supabase    |
|                |              |                   |              |                |
+----------------+              +-------------------+              +----------------+
                                           ^
                                           |
                                 +---------+---------+
                                 |                   |
                                 |  External APIs    |
                                 | (Email, Analytics)|
                                 +-------------------+
```

### 3.3 Key Design Decisions

1. **Server-Side Rendering (SSR)** - Critical for SEO and initial load performance
2. **API-first Backend** - Facilitates future mobile app development
3. **Relational Database** - Supports complex relationships between users, teams, and submissions
4. **Component-Based UI** - Promotes reusability and consistency
5. **Role-Based Access Control** - Separates admin, judge, and participant functionality
6. **Progressive Enhancement** - Core functionality works without JavaScript
7. **Incremental Static Regeneration** - For content that changes infrequently

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
| Register | `/register` | Registration form | MultiStepForm, FormControls |
| Admin Dashboard | `/admin` | Overview of applications | DataTable, StatusFilters |
| Admin Applications | `/admin/applications` | Detailed application review | ApplicationDetail, ReviewActions |

#### 4.1.2 Component Hierarchy

```
Layout
├── NavBar
├── PageContainer
│   └── [Page-specific components]
└── Footer

MultiStepForm
├── StepIndicator
├── FormStep
│   ├── InputField
│   ├── SelectInput
│   ├── RankedChoice
│   └── FormNavigation
└── SubmissionConfirmation
```

#### 4.1.3 State Management

- React Context API for global state (theme, authentication)
- React Query for server state (data fetching, caching, mutations)
- Form state managed with React Hook Form

### 4.2 Backend Implementation

#### 4.2.1 API Routes

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|--------------|
| `/api/registration` | POST | Submit registration | No |
| `/api/registration` | GET | Get all registrations | Yes (Admin) |
| `/api/registration/:id` | GET | Get specific registration | Yes (Admin) |
| `/api/registration/:id` | PATCH | Update registration status | Yes (Admin) |
| `/api/themes` | GET | Retrieve all themes | No |
| `/api/workshops` | GET | Retrieve all workshops | No |
| `/api/user/me` | GET | Get current user profile | Yes |

#### 4.2.2 Authentication Logic

- Public access to informational pages and registration form
- JWT-based authentication for protected routes
- Role-based permissions (admin, participant)
- Session management using Supabase Auth

#### 4.2.3 Form Processing

1. Validation using Zod schema
2. Multi-step form state persistence
3. Sanitization of user input
4. Rate limiting to prevent abuse
5. CSRF protection

### 4.3 Database Schema

```sql
-- USERS & AUTHENTICATION
-- Handled by Supabase Auth + custom profiles

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  role TEXT DEFAULT 'participant'
);

-- REGISTRATION & APPLICATIONS

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  program TEXT NOT NULL,
  
  -- Philosophy Background
  philosophy_background TEXT,
  self_rated_confidence INTEGER CHECK (self_rated_confidence BETWEEN 1 AND 10),
  
  -- Preferences
  interest_areas TEXT[],
  theme_preferences JSONB, -- Ranked choices as JSON
  workshop_preferences JSONB, -- Ranked choices as JSON
  is_mentor BOOLEAN DEFAULT FALSE,
  is_mentee BOOLEAN DEFAULT FALSE,
  interest_similarity_preference INTEGER CHECK (interest_similarity_preference BETWEEN 1 AND 10),
  
  -- Team Preferences
  teammate_requests TEXT[],
  
  -- Additional Information
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  extension_status TEXT,
  heard_from TEXT
);

-- CONTENT MANAGEMENT

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  analytic_tradition TEXT,
  continental_tradition TEXT,
  is_selected BOOLEAN DEFAULT FALSE
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  relevant_themes JSONB,
  facilitator TEXT,
  max_capacity INTEGER
);

-- TEAM MANAGEMENT (FUTURE)

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  theme_id UUID REFERENCES themes(id)
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  application_id UUID REFERENCES applications(id)
);
```

### 4.4 Design System

#### 4.4.1 Color Palette

- Primary: `#3B82F6` (Blue)
- Secondary: `#6B7280` (Gray)
- Accent: `#8B5CF6` (Purple)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)
- Background: `#F9FAFB` (Light Gray)
- Text: `#1F2937` (Dark Gray)

#### 4.4.2 Typography

- Headings: Philosopher (serif)
- Body: Inter (sans-serif)
- Monospace: JetBrains Mono (for code snippets)

#### 4.4.3 Component Design

- Buttons: Rounded corners, consistent padding
- Cards: Subtle shadows, consistent spacing
- Forms: Clear labels, validation feedback
- Tables: Zebra striping, responsive design

## 5. Development Process

### 5.1 Development Timeline

#### Day 1: Foundation & Core Pages

| Time | Task | Output |
|------|------|--------|
| 09:00-10:30 | Project setup, Supabase configuration | Working development environment |
| 10:30-12:00 | Component architecture, basic layout | Navigation, layout components |
| 12:00-14:00 | Content page implementation | Home, About, Themes pages |
| 14:00-15:30 | FAQ, Workshop pages | Complete informational section |
| 15:30-17:00 | Registration form development | Working multi-step form |
| 17:00-18:00 | Testing & refinement | Bug fixes, styling improvements |

#### Day 2: Admin & Deployment

| Time | Task | Output |
|------|------|--------|
| 09:00-10:30 | API route implementation | Backend endpoints |
| 10:30-12:00 | Admin dashboard development | Application review interface |
| 12:00-13:00 | Authentication integration | Working login system |
| 13:00-14:30 | Email notification setup | Confirmation emails |
| 14:30-16:00 | Testing & bug fixes | Stable application |
| 16:00-17:00 | Documentation | User and developer docs |
| 17:00-18:00 | Deployment | Live production site |

### 5.2 AI Acceleration Points

1. **Component Generation** - Using GitHub Copilot for rapid component scaffolding
2. **API Route Implementation** - AI assistance for CRUD operations
3. **Schema Validation** - Generating Zod schemas from TypeScript types
4. **Styling** - Tailwind class generation and optimization
5. **Documentation** - API documentation and user guides

### 5.3 Testing Strategy

1. **Unit Testing** - Jest for utility functions and hooks
2. **Component Testing** - React Testing Library for UI components
3. **End-to-End Testing** - Cypress for critical user flows
4. **Accessibility Testing** - Axe integration for WCAG compliance
5. **Performance Testing** - Lighthouse for core web vitals

## 6. Deployment & Operations

### 6.1 Deployment Pipeline

1. GitHub repository with main and development branches
2. Pull request workflow with automated testing
3. Vercel preview deployments for each PR
4. Automatic deployment to production from main branch

### 6.2 Environment Configuration

| Environment | Purpose | Access |
|-------------|---------|--------|
| Development | Local development | Developers only |
| Staging | Testing new features | Internal team |
| Production | Live website | Public |

### 6.3 Monitoring & Analytics

1. Vercel Analytics for performance monitoring
2. Google Analytics for user behavior
3. Error logging with Sentry
4. Database performance monitoring via Supabase dashboard

## 7. Future Extensions

### 7.1 Phase 2: Team Formation & Submission

1. Team matching algorithm implementation
2. Team communication features
3. Submission system with file uploads
4. Receipt generation for submissions

### 7.2 Phase 3: Judging & Feedback

1. Judge portal for evaluating presentations
2. Scheduling system for presentations
3. Feedback collection forms
4. Analytics dashboard for event outcomes

### 7.3 Phase 4: Advanced Features

1. Theme voting system with real-time results
2. Resource library for philosophical materials
3. Interactive schedule builder
4. Presentation archive

## 8. Appendices

### 8.1 Technical Specifications for Development Environment

- Node.js >= 18.x
- npm >= 9.x
- Git >= 2.30
- VS Code with recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - GitHub Copilot

### 8.2 Reference Materials

- Filosothon JSON data structure examples
- UI mockup references
- SEO requirements
- Accessibility guidelines (WCAG 2.1 AA compliance)