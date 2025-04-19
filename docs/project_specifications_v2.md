# Philosothon Event Platform - Project Specification v2.1

**Version:** 2.1  
**Date:** 2025-04-19  
**Status:** Draft  

## 1. Introduction

This document outlines the revised specifications for the Philosothon Event Platform, building upon the initial MVP defined in v1.1 (`docs/project_specifications.md`). This version incorporates a broader feature set based on user feedback while prioritizing implementation needs. Features are organized by implementation priority with P0 (highest) to P3 (lowest).

## 2. Core Goals (Revised)

* Provide a comprehensive online presence for the Philosothon event.
* Streamline the registration process, moving away from external forms.
* Support participant engagement through roles, team formation, and communication.
* Facilitate the submission and review process for event deliverables.
* Enhance user engagement through gamification elements.
* Ensure secure and manageable administration of the platform and its content.

## 3. Functional Requirements (By Priority)

### 3.1 Authentication and Security (P0)

* **Requirement 3.1.1 (Enhanced Admin Security):** The current admin authentication mechanism (Magic Link) needs to be reviewed and potentially replaced or enhanced to improve security.
  * *Implementation Note:* Specific method (e.g., MFA, password-based, SSO) is TBD and requires architectural investigation.

* **Requirement 3.1.2 (Role-Based Access Control - RBAC):** The system must support distinct user roles with specific permissions.
  * *Implementation Note:* Role assignment mechanism (e.g., manual admin assignment, automated based on registration status) is TBD.

### 3.2 Registration System (P0)

* **Requirements 3.2.1-3.2.3:** [as previously defined]

* **Requirement 3.2.4 (Enhanced Registration Fields):** The registration form must collect additional data to support improved team formation and event planning:

  * **Date Flexibility:**
    * Required question: "Would you be able to participate if the event were delayed to May 3-4, 2025?" (Yes/No/Maybe with optional comment field)
    * Purpose: Contingency planning for potential date changes
  
  * **Philosophical Background:**
    * Prior philosophy courses taken (multi-select from common courses + "other" field)
    * Self-assessed familiarity with different philosophical traditions (scale rating)
    * Areas of philosophical interest beyond those listed in themes (open text)
  
  * **Team Formation Preferences:**
    * Preferred working style (structured/exploratory/balanced)
    * Skills self-assessment (writing, speaking, research, synthesis, critique)
    * Optional question: "Is there anyone you'd particularly like to work with?" (text field)
    * Optional question: "Are there any perspectives you feel would complement yours on a team?" (text field)
  
  * **Technical Experience:**
    * Familiarity with technology concepts relevant to themes (scale rating)
    * Prior experience with hackathons or similar collaborative events (Yes/No + optional details)
  
  * **Accessibility Planning:** 
    * Expanded questions regarding specific accommodations needed for participation
    
  * *Implementation Note:* The registration form should be designed to minimize cognitive load despite the increased number of fields, potentially using progressive disclosure, sectioning, or similar UX techniques. All matchmaking fields should store data in a format conducive to both algorithmic and manual team formation.

### 3.3 Content Management (P0)

* **Requirement 3.3.1 (Event Information Management):** Implement a centralized system for managing core event information.
  
  * **Data to Centralize:**
    * Event dates, times, and location
    * Schedule items and timing
    * Key deadlines
    * Event descriptions
  
  * **Implementation Options:**
    
    * **Option A: Supabase Content Tables**
      * Pros: Dynamic updates without redeployment, centralized management, consistent data source
      * Cons: Requires building admin interface, database dependency
      * Implementation: Create structured tables for event details, schedule items, with admin CRUD interface
    
    * **Option B: Content Configuration Files**
      * Pros: Simple implementation, version control, works with static generation
      * Cons: Requires redeployment for changes, technical knowledge for content editors
      * Implementation: JSON/YAML files in code repository containing structured event data
    
    * **Recommendation:** Given the need for frequent schedule updates and the existing use of Supabase, Option A provides the best solution for propagating changes across the site.

* **Requirement 3.3.2 (Theme Information Display System):** Enhance the existing theme display system to properly handle detailed theme pages.
  
  * **Current Status:** Basic theme information displays correctly on the main themes page from Supabase, but detailed theme pages show only the short description.
  
  * **Content Source Options:**
    
    * **Option A: Expanded Markdown File Parsing**
      * Pros: Maintains existing markdown file structure, easy editing
      * Cons: Disconnected from primary theme data in Supabase, requires parser implementation
      * Implementation: Parse `theme_descriptions_expanded.md` at build time or on-demand
    
    * **Option B: Individual Theme Markdown Files**
      * Pros: Clean organization, one file per theme, easier to maintain
      * Cons: Requires reorganizing existing content, same parser requirements
      * Implementation: Create `/themes/[theme-slug].md` files for each theme
    
    * **Option C: Migrate Expanded Content to Supabase**
      * Pros: Single source of truth, consistent with existing basic theme data
      * Cons: More complex content structure in database, larger content fields
      * Implementation: Add `expanded_description` field to existing theme tables
    
    * **Recommendation:** Option C provides the most consistent approach with your existing architecture, avoiding the need for a separate parsing system and maintaining a single source of truth.

* **Requirement 3.3.3 (FAQ Management):** Retain current FAQ system as it's working effectively.

### 3.4 Team Management (P1)

* **Requirement 3.4.1 (Team Formation Algorithm):** Develop an algorithm to assist with team formation based on enhanced registration data.
  
  * **Algorithm Features:**
    * Primary balancing factors: philosophical interests, skill self-assessment, working style preferences
    * Secondary matching factors: prior course experience, complementary perspectives
    * Admin override capability for manual adjustments
    * Visual representation of proposed teams with balance metrics
  
  * **Implementation Note:** Algorithm should output team suggestions with confidence scores, not automatic assignments. Final decisions remain with administrators.

* **Requirement 3.4.2 (Team Communication Platform):** Implement a secure communication channel for formed teams.
  
  * **Platform Options:**
    * **Option A: Platform-Integrated Messaging**
      * Pros: Full control over experience, data retention, integrated with existing accounts
      * Cons: Development intensive, requires notifications system
    
    * **Option B: Managed External Platform (e.g., Discord, Slack)**
      * Pros: Robust features, familiar to users, minimal development
      * Cons: External dependency, less control over experience
      * Implementation: Automated channel/group creation and invitations upon team formation
    
    * **Recommendation:** Option B provides the fastest implementation with robust features, though Option A offers better integration with the puzzle elements if development resources permit.

* **Requirements 3.4.3-3.4.4:** [as previously defined]

* **Requirement 3.4.5 (Team Profile Pages):** Create dedicated pages for formed teams.
  
  * **Features:**
    * Team name and members with optional photos
    * Team philosophical interests visualization
    * Private notes area visible only to team members
    * Progress tracking on team deliverables
    * Optional: Integration with gamification elements
  
  * **Implementation Note:** Team pages should be viewable by all participants but with private sections for team-only content.

### 3.5 Gamification (Puzzle Element) (P2)

* **Requirement 3.5.1 (Puzzle Integration & Theme):** Incorporate a multi-stage puzzle or scavenger hunt element into the platform, inspired by ARGs like Cicada 3301 but themed around deep philosophical knowledge. Thematically, it should blend philosophy of technology, posthumanism, accelerationism, AI concepts (e.g., Roko's Basilisk), occult undertones, and potentially meta-narrative elements inspired by "House of Leaves", aiming for a viral, engaging experience.

* **Requirement 3.5.2 (Gameplay & Tone):** The puzzle should guide users on a scavenger hunt "deeper" into philosophical concepts and potentially hidden areas of the site. Clues may require consulting specific philosophy texts (potentially accessible via the platform or external links). The tone should become progressively more eerie or uncanny, evoking a sense of approaching "occult" or profound hidden knowledge related to the intersection of philosophy, technology, and perhaps the nature of the AI itself.

* **Requirement 3.5.3 (Live AI Agent Interaction):** Integrate a live AI agent, triggered post-registration, as a central part of the puzzle. This agent should:
  * Address the user by name and leverage registration data for personalized, potentially unsettling, dialogue.
  * Act as a lore source, gatekeeper, or Socratic guide, drawing knowledge from a curated database of relevant philosophical texts (accessed via MCP server, e.g., using `vectorize`).
  * Contribute significantly to the eerie, uncanny, "House of Leaves"-esque atmosphere.
  * *Implementation Note:* This requires investigation into: feasibility, setting up an MCP server with DB/vector access, prompt engineering for the AI's persona and tone, specific trigger mechanism post-registration.

* **Requirement 3.5.4 (Core Mechanics):** The puzzle mechanics are defined as follows:
  * **Access:** Open to all site visitors (initial discovery).
  * **Start:** The overall puzzle may be initiated via a hidden prompt on the homepage, but the core AI interaction should be triggered post-registration.
  * **Clues:** A mixture of riddles/puzzles hidden within the website's content and challenges requiring reference to external philosophical texts (links may be provided or research required).
  * **AI Role:** Primary role as a source of lore/context, personalized based on registration data.
  * **Goal:** The puzzle culminates in a narrative conclusion or philosophical insight.
  * *Implementation Note:* TBD items include the exact nature/location of the homepage prompt, the post-registration trigger for AI interaction, the specific riddles/texts used for clues, the puzzle structure, and the progress tracking mechanism.

* **Requirement 3.5.5 (Enhanced Personalization):** The system should incorporate multiple layers of personalization to create an uncanny, individualized experience:
  * Leverage registration data beyond basic name recognition (philosophical interests, academic background)
  * Incorporate browsing behavior within the site (pages visited, time spent on philosophical themes)
  * Implement subtle environmental responses to user choices (UI shifts based on puzzle progression)
  * Store user puzzle paths and reference them later ("I notice you were drawn to questions of consciousness...")
  * *Implementation Note:* Requires a user activity tracking system and personalization engine connected to the AI agent.

* **Requirement 3.5.6 (Interface Transformation):** As users progress deeper into the puzzle experience, the interface should subtly transform:
  * Initial design follows clean, academic aesthetics matching the main site
  * Gradual introduction of glitches, artifacts, and distortions as users progress
  * Text that occasionally "breaks character" or references the user's actions outside the expected flow
  * Hidden messages in page source code or developer console that provide meta-narrative clues
  * Final stages featuring dramatically altered UI with occult symbolism and philosophical diagrams
  * *Implementation Note:* Requires a progression tracking system tied to CSS/UI modifications, potentially using class-based theme switching.

* **Requirement 3.5.7 (Progression Feedback):** Implement a multilayered feedback system:
  * Overt progression: Visual indicators showing puzzle stage completion
  * Covert progression: Subtle environmental changes (color shifts, typography changes)
  * Narrative advancement: AI responses that evolve in tone and content
  * "Unreliable narrator" element: Occasional contradictory feedback creating doubt
  * Time-delayed responses: Messages appearing hours/days after certain puzzle actions
  * *Implementation Note:* Requires a notification system capable of scheduling delayed messages and a progression tracking mechanism.

* **Requirement 3.5.8 (Philosophical Depth Enhancement):** Use the vectorize tool to generate dynamic philosophical content:
  * AI-generated philosophical thought experiments tailored to user's interests
  * Procedurally combined fragments from different philosophical traditions creating novel juxtapositions
  * "Philosophical Turing test" where users must determine if passages were written by humans or AI
  * Personalized philosophical paradoxes that reference user's background or previous answers
  * *Implementation Note:* Requires integration with vectorize and creation of templates for philosophical content generation.

* **Requirement 3.5.9 (Collective Mystery):** Incorporate community elements that enhance the uncanny experience:
  * Fragments of other users' interactions appearing as "echoes" in the system
  * Collaborative puzzles requiring multiple participants to progress
  * Hidden leaderboard or progress visualization visible only to those who discover it
  * "Traces" of previous users visible in puzzle spaces (similar to Dark Souls messages)
  * *Implementation Note:* Requires anonymized storage of user interactions and a mechanism for displaying these interactions to other users.

* **Requirement 3.5.10 (Psychological Elements):** Incorporate elements that create cognitive dissonance:
  * False memory implantation: Reference events or choices the user never actually made
  * Subtle inconsistencies in the narrative that increase over time
  * Fourth-wall breaking moments where the AI appears to "realize" its nature
  * Time distortion techniques: puzzles that claim to take exactly 7 minutes but actually take longer/shorter
  * Elements that appear to predict user actions through careful psychological priming
  * *Implementation Note:* Requires sophisticated scripting of AI interactions and careful design of the narrative flow to create cognitive dissonance without frustrating users.

* **Requirement 3.5.11 (Technical Architecture):** Implement a technical infrastructure to support the gamification experience:
  * Vector database (e.g., Pinecone, Weaviate) to store philosophical text embeddings
  * Context-aware conversation manager that tracks user progress and personalizes AI responses
  * "Persona shift" system where the AI subtly transforms its communication style based on puzzle depth
  * Flexible templating system that can inject personalized details into pre-crafted narrative segments
  * *Implementation Note:* Requires architectural decisions around vector database selection, conversation state management, and integration with the broader platform.

* **Requirement 3.5.12 (Cryptic Email Notification):** Implement a staged email notification system for the puzzle experience:

  * **For Existing Registrants:** When gamification features are deployed, send a cryptic email to all previously registered applicants hinting at new content ("something there that wasn't there before").
  
  * **For New Registrants:** 
    * Send standard confirmation email immediately upon registration
    * Follow up with the cryptic notification email after a deliberate delay (e.g., 24-48 hours)
  
  * **Email Content Requirements:**
    * Must be philosophically intriguing yet vague
    * Should not explicitly mention a game or puzzle
    * May include subtle visual elements that connect to the puzzle's aesthetic
    * Should create curiosity without revealing the nature of the experience
    * May include hidden elements (e.g., cryptic signatures, encoded messages in HTML comments)
    
  * **Tracking:** System should track which users have received the cryptic email and whether they've returned to the site afterward.
  
  * *Implementation Note:* Email templates, exact timing of delayed emails, and tracking mechanism are TBD. This feature depends on a working email notification system and user activity tracking.

### 3.6 Submission Portal (P3)

* **Requirement 3.6.1 (Portal Access):** Access to the submission portal must be restricted to users with the "Accepted Team Member" role.

* **Requirement 3.6.2 (File Upload):** The portal must allow users to upload deliverables (e.g., written component, presentation).
  * *Implementation Note:* Permitted file types and maximum file size limits are TBD.

* **Requirement 3.6.3 (Multiple Submissions):** The system should allow multiple submissions per team.
  * *Implementation Note:* How multiple submissions are handled (e.g., versioning, replacing previous, grouping) is TBD.

* **Requirement 3.6.4 (Submission Permissions):** Any member of an accepted team can submit files on behalf of the team.

* **Requirement 3.6.5 (Submission Receipt):** Upon successful submission, an email receipt must be sent to all members of the submitting team.
  * The receipt must include: Timestamp, Submitter's name, Team name, Names of submitted file(s).

### 3.7 Judge Portal (P3)

* **Requirement 3.7.1 (Access Control):** The judge portal must be accessible only to users with the "Judge" role.

* **Requirement 3.7.2 (Submission Review):** Judges must be able to view and download all team submissions.

* **Requirement 3.7.3 (Feedback Mechanism):** The portal should allow judges to provide feedback on submissions.
  * *Implementation Note:* The specific format for feedback (e.g., structured form, free text) is TBD. (Optional, much lower priority)

* **Requirement 3.7.4 (Analytics Dashboard):** Provide judges with an analytics dashboard showing submission status and other relevant metrics.
  * *Implementation Note:* Specific metrics and visualization methods are TBD. (Optional, much lower priority)

### 3.8 Analytics and Reporting (P2)

* **Requirement 3.8.1 (Event Participation Metrics):** Implement analytics tracking for key event engagement metrics.
  
  * **Metrics to Track:**
    * Registration completion rate
    * Theme popularity (views, selections)
    * Gamification engagement levels
    * Page interaction patterns
    * Time spent on different platform sections
  
  * **Implementation Note:** Use appropriate analytics tools (e.g., Supabase Analytics, Plausible) with privacy considerations.

* **Requirement 3.8.2 (Post-Event Survey System) (P4):** Develop an integrated post-event feedback system.
  
  * **Survey Features:**
    * Experience rating questions
    * Open feedback fields
    * Specific feedback on philosophical content
    * Interest in future events
    * Comparison with traditional philosophy formats
  
  * **Implementation Note:** Survey should be integrated with existing accounts to track participation and pre-fill team information. 

* **Requirement 3.8.3 (Reporting Dashboard):** Create an administrative dashboard for event analytics.
  
  * **Dashboard Features:**
    * Real-time participation metrics
    * Registration status visualization
    * Team formation status
    * Submission tracking
    * Engagement heat maps for gamification elements
  
  * **Implementation Note:** Dashboard should support data export for further analysis and reporting.

## 4. Implementation Timeline

* **Phase 1 (Immediate):** P0 requirements - Security enhancements, Registration system, Content management
* **Phase 2 (High Priority):** P1 requirements - Team management functionality
* **Phase 3 (Medium Priority):** P2 requirements - Gamification elements
* **Phase 4 (Post-Launch Enhancement):** P3 requirements - Submission and Judge portals

## 5. Technical Considerations

* **Security Review:** A comprehensive security review is required for the current authentication system.
* **Registration Integration:** The decision on registration method (built-in vs. external) will impact multiple system components and should be decided early.
* **Data Management:** Content management approach needs decision on whether to use a database, file-based system, or hybrid approach.
* **Technical Stack:** Current stack (Next.js, supabase) should be evaluated for suitability to implement all required features.

## 6. Appendices

* **Appendix A:** Reference to original specification (`docs/project_specifications.md`)
* **Appendix B:** Theme descriptions source (`docs/event_info/theme_descriptions.md`)
* **Appendix C:** General event information (`docs/event_info/general_information.md`)