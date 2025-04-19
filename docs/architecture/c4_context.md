# C4 Model: Level 1 - System Context (V2)

* Date: 2025-04-19
* Description: High-level overview showing users interacting with the Philosothon Platform V2 and its key external dependencies.

```mermaid
graph TD
    subgraph "Philosothon Ecosystem"
        Admin[Admin User] -- Manages Content/Users --> Platform(Philosothon Platform\\nNext.js / Supabase)
        Participant[Participant] -- Registers & Interacts --> Platform
        Judge[Judge] -- Reviews Submissions --> Platform
        Visitor[Site Visitor] -- Views Info & Puzzle --> Platform
    end

    Platform -- Uses Auth/DB/Storage --> Supabase(Supabase BaaS)
    Platform -- Sends Notifications --> EmailService(Email Service\\ne.g., Resend)
    Platform -- Creates Channels/Invites --> CommunicationPlatform(Team Communication\\ne.g., Discord/Slack API)
    Platform -- Interacts for Gamification --> AI_MCP(AI Agent MCP Server)
    AI_MCP -- Queries --> VectorDB(Vector DB\\npgvector / Pinecone)
    AI_MCP -- Uses --> LLM_API(LLM API\\n e.g., OpenAI/Anthropic)

    style Platform fill:#lightblue,stroke:#333,stroke-width:2px
```

**Notes:**
*   Shows the primary system boundaries and external dependencies for the V2 platform.
*   The AI Agent MCP Server, Vector DB, and LLM API are key new external dependencies supporting the gamification features.
*   Team Communication integration (Discord/Slack) is another new external dependency.