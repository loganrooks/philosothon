# ADR: V2 Team Communication Platform

* Status: Proposed
* Date: 2025-04-19

## Context

The V2 specification requires a secure communication channel for formed teams (Req 3.4.2). Options considered were building platform-integrated messaging or leveraging an external managed platform like Discord or Slack.

## Decision

We will use a **managed external platform (Discord or Slack)** for V2 team communication, confirming the recommendation in the V2 specification (Req 3.4.2 - Option B).
1.  **Integration:** Use Supabase Edge Functions, triggered upon team finalization in the Admin UI (or via a database trigger on the `teams` table).
2.  **Automation:** The Edge Function will interact with the chosen platform's API (e.g., Discord Bot API, Slack API) using securely stored credentials (e.g., Supabase Vault or environment variables).
3.  **Functionality:** The function will automatically create a private channel/group for the newly formed team and invite the associated team members (fetching member details and contact info/IDs from the `profiles` and `registrations` tables).

## Consequences

*   **Pros:**
    *   Significantly faster implementation compared to building a custom messaging system.
    *   Leverages robust, feature-rich platforms that many users are already familiar with.
    *   Offloads the complexity of real-time messaging, notifications, user presence, etc., to the external platform.
    *   Reduces the development and maintenance burden on the core platform team.
*   **Cons:**
    *   Creates a dependency on an external service.
    *   Less control over the user experience compared to an integrated solution.
    *   Requires managing API keys/bot tokens securely.
    *   Requires users to have accounts on the chosen external platform (Discord/Slack).
    *   Integration with gamification elements (if desired later) might be less seamless than a fully integrated solution.