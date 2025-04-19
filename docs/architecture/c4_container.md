# C4 Model: Level 2 - Container Diagram (V2)

* Date: 2025-04-19
* Description: Shows the key deployable units/services within the Philosothon Platform V2 and their primary interactions.

```mermaid
C4Container
    title Container Diagram for Philosothon Platform V2

    Person(Admin, "Admin User", "Manages content, users, teams")
    Person(Participant, "Participant", "Registers, forms teams, submits work, plays puzzle")
    Person(Judge, "Judge", "Reviews submissions")
    Person(Visitor, "Site Visitor", "Views public info, interacts with puzzle")

    System_Boundary(PlatformBoundary, "Philosothon Platform V2") {
        Container(WebApp, "Web Application", "Next.js 14", "Provides all user interfaces (React Server & Client Components), handles routing, API endpoints (Server Actions, Route Handlers)")
        ContainerDb(Database, "Database", "Supabase PostgreSQL", "Stores user profiles, roles, registration data, content (themes, workshops, FAQs, event info), teams, submissions metadata, puzzle state")
        ContainerAuth(Auth, "Authentication Service", "Supabase Auth", "Handles user sign-up, sign-in (Magic Link), session management")
        ContainerStorage(Storage, "File Storage", "Supabase Storage", "Stores team submission files (e.g., documents, presentations)")
        ContainerEdgeFunc(EdgeFunctions, "Edge Functions", "Supabase Deno Functions", "Handles backend logic triggered by DB events or HTTP requests (e.g., Discord/Slack integration, email notifications, potentially team formation algorithm)")
        Container(AI_MCP, "AI Agent MCP Server", "Node.js / Python Service", "Manages gamification AI logic, conversation state, interacts with LLM and Vector DB via MCP protocol")

        Rel(WebApp, Auth, "Authenticates via", "HTTPS/JS Lib")
        Rel(WebApp, Database, "Reads/Writes Data", "SQL/PostgREST")
        Rel(WebApp, Storage, "Uploads/Downloads Files", "HTTPS/JS Lib")
        Rel(WebApp, EdgeFunctions, "Invokes Functions", "HTTPS")
        Rel(WebApp, AI_MCP, "Sends/Receives Messages", "HTTP/WebSocket (MCP)")

        Rel(EdgeFunctions, Database, "Reads/Writes Data", "SQL")

        Rel(AI_MCP, Database, "Reads/Writes User State", "SQL/PostgREST")
    }

    System_Ext(Supabase, "Supabase BaaS Platform", "Provides managed DB, Auth, Storage, Edge Functions")
    System_Ext(EmailService, "Email Service", "e.g., Resend, SendGrid", "Sends transactional emails")
    System_Ext(CommPlatform, "Communication Platform API", "e.g., Discord, Slack", "API for managing channels/groups and users")
    System_Ext(VectorDB, "Vector Database", "Supabase pgvector / Pinecone / Weaviate", "Stores embeddings of philosophical texts")
    System_Ext(LLM_API, "Large Language Model API", "e.g., OpenAI, Anthropic, Google Gemini", "Provides language generation/understanding capabilities")

    Rel(Admin, WebApp, "Uses", "HTTPS")
    Rel(Participant, WebApp, "Uses", "HTTPS")
    Rel(Judge, WebApp, "Uses", "HTTPS")
    Rel(Visitor, WebApp, "Uses", "HTTPS")

    Rel(WebApp, Supabase, "Uses Services")
    Rel(EdgeFunctions, Supabase, "Runs On")
    Rel(EdgeFunctions, CommPlatform, "Calls API", "HTTPS")
    Rel(EdgeFunctions, EmailService, "Calls API", "HTTPS")

    Rel(AI_MCP, VectorDB, "Queries Embeddings", "DB Connection/API")
    Rel(AI_MCP, LLM_API, "Calls API", "HTTPS")

    ' Define relationships crossing the main boundary implicitly via Supabase or direct calls
    ' Rel(Database, Supabase, "Hosted On") ' Implicit
    ' Rel(Auth, Supabase, "Hosted On") ' Implicit
    ' Rel(Storage, Supabase, "Hosted On") ' Implicit

```

**Notes:**
*   Illustrates the main services ("containers" in C4 terms) and their interactions.
*   The `Web Application` (Next.js) is the primary interface for all users.
*   `Supabase` provides multiple backend services (DB, Auth, Storage, Edge Functions).
*   The `AI Agent MCP Server` is a distinct service responsible for gamification logic.
*   External systems include Email, Communication Platforms, Vector DB (potentially internal if using `pgvector`), and LLM APIs.