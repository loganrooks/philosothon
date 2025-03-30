# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-03-30 18:56:53 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

*   Develop a web platform for the University of Toronto Philosothon event.
*   MVP (2-day implementation) focuses on public info pages and Google Forms registration.
*   Architecture designed for future extensions (team formation, submissions, etc.).

## Key Features

*   **MVP:** Public info pages (Home, About, Themes, Workshops, FAQ), Google Forms registration embed, Simple Admin UI (content management, registration data view).
*   **Future:** Team formation system, Submission portal, Feedback collection, Judge portal.

## Overall Architecture

*   **Frontend:** Next.js with Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL DB, Auth).
*   **Registration (MVP):** Embedded Google Forms, manual CSV import to Supabase.
*   **Deployment:** Vercel.
*   (Based on `docs/project_specifications.md` and ADRs in `docs/adr/`)

---
*Footnotes:*
*   2025-03-30 18:56:53 - Initialized Memory Bank. Populated based on `docs/project_specifications.md` and existing ADRs.