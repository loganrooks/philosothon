# Philosothon Git Workflow: GitHub Flow

This document outlines the recommended Git version control workflow for the Philosothon project, based on the GitHub Flow model.

## 1. Rationale

Given the project's nature (Next.js application, Vercel deployment, iterative development with SPARC modes, likely small team), GitHub Flow provides a simple yet effective structure:

*   **Simplicity:** Easy to understand and implement compared to more complex models like Gitflow.
*   **Deployment Alignment:** The `main` branch always represents a deployable state, aligning perfectly with Vercel's default deployment triggers.
*   **Feature Isolation:** Feature branches keep work-in-progress separate from the stable `main` branch.
*   **Collaboration & Review:** Pull Requests (PRs) facilitate code review (even self-review or AI review) and discussion before merging changes.
*   **SPARC Integration:** Clearly accommodates the cycle of specification, coding, and testing within feature branches.

## 2. Workflow Steps

### a. The `main` Branch

*   The `main` branch is the definitive source of truth for the *production-ready* code.
*   **Anything in `main` must be deployable.**
*   Direct commits to `main` should be avoided (enforced via branch protection rules if possible).
*   Vercel production deployments should be configured to trigger automatically when changes are merged into `main`.

### b. Feature Branches

*   **Create Branches from `main`:** All new work (features, bug fixes, chores) must start on a new branch created from the latest `main`.
    *   Use descriptive names, e.g., `feature/admin-workshop-crud`, `fix/navbar-style-bug`, `chore/update-readme`.
    *   Command: `git checkout main && git pull && git checkout -b feature/your-feature-name`
*   **Develop on the Branch:** Make all code changes related to the specific task or feature on this branch.

### c. Development & Committing (Integrating SPARC Tasks)

*   **Iterative Development:** Follow the SPARC mode sequence:
    1.  `spec-pseudocode`: Define the task/feature requirements.
    2.  `code`: Implement the feature on the feature branch.
    3.  `tdd`: Write and run tests for the implemented code on the same feature branch.
*   **Commit After Testing:** This is crucial. **Only commit code to the feature branch *after* the relevant tests (written by `tdd` mode or manually) have passed.**
*   **Atomic Commits:** Make small, logical commits that represent a single unit of work (e.g., "feat: Implement theme creation form", "test: Add tests for theme creation action", "fix: Correct validation logic in theme form"). This makes history easier to understand and allows for easier rollbacks if needed.
*   **Meaningful Commit Messages:** Use a consistent format, preferably [Conventional Commits](https://www.conventionalcommits.org/). Examples:
    *   `feat: Add dynamic theme page display`
    *   `test: Implement tests for dynamic theme page notFound`
    *   `fix: Resolve hydration error in Countdown component`
    *   `refactor: Improve styling of AccordionGroup`
    *   `docs: Update Git workflow guide`
    *   `chore: Install autoprefixer dependency`
*   **Push Regularly:** Push your feature branch to the remote repository frequently to back up your work and enable collaboration/visibility.
    *   Command: `git push -u origin feature/your-feature-name` (first time)
    *   Command: `git push` (subsequent times)

### d. Pull Requests (PRs)

*   **Open a PR:** When the feature is complete and tested on the branch, open a Pull Request (PR) to merge the feature branch into `main`.
*   **Describe Changes:** Write a clear description in the PR explaining what the changes do and why they were made. Reference any relevant task IDs or issues.
*   **Automated Checks:** Vercel can automatically create preview deployments for each PR. Ensure any configured automated checks (linting, testing, Vercel build) pass.
*   **Code Review:** Review the changes. This can be:
    *   Self-review: Carefully check your own code.
    *   AI review: Use tools like RooCode's review capabilities.
    *   Peer review: If other developers are involved.
    *   Focus on correctness, clarity, test coverage, and adherence to project standards.
*   **Address Feedback:** Make any necessary changes based on review feedback by committing and pushing to the feature branch. The PR will update automatically.

### e. Merging to `main`

*   **Merge:** Once the PR is approved and all checks pass, merge the feature branch into `main`.
    *   Options:
        *   **Squash and Merge:** Combines all commits on the feature branch into a single commit on `main`. Keeps `main` history clean. Often preferred for small features.
        *   **Merge Commit:** Creates a merge commit on `main`, preserving the individual commits from the feature branch. Useful for complex features or when detailed history is important.
*   **Deployment:** Merging the PR into `main` should automatically trigger the Vercel production deployment. Monitor the deployment status.
*   **Delete Branch:** After merging, delete the feature branch (locally and remotely).

### f. Hotfixes

*   If an urgent bug is discovered in production (`main`):
    1.  Create a `hotfix/issue-description` branch directly from `main`.
    2.  Make the minimal necessary changes to fix the bug.
    3.  Test thoroughly.
    4.  Open a PR, get it reviewed quickly, and merge it to `main`.
    5.  Ensure the fix is also merged into any long-running feature branches if necessary.

## 3. Staging and Committing Tested Tasks

This workflow directly addresses the need to stage and commit tested work:

*   **Work Isolation:** Feature branches isolate ongoing development.
*   **Testing Gate:** The `tdd` mode acts as a gate *before* committing. Code is only committed once tests confirm it works as expected for that specific task or sub-task.
*   **Atomic Commits:** Each commit on the feature branch should ideally represent a tested, functional increment. For example, after Task 10 (Dynamic Theme Page Tests) was completed and tests passed, a commit like `test: Add tests for dynamic theme page rendering and notFound` should have been made on the relevant feature branch.
*   **Benefits:** This creates a reliable history, makes debugging easier (using `git bisect`), and ensures that the `main` branch only receives code that has passed testing scrutiny.

## 4. Supporting Tools & Practices

*   **`.gitignore`:** Essential for keeping unwanted files (like `node_modules`, `.env`, build artifacts) out of the repository. Ensure it's comprehensive. (Already present).
*   **Conventional Commits:** Strongly recommended for clear and automated history tracking (can help with automated changelog generation).
*   **Pull Request Templates:** Create a `.github/pull_request_template.md` file (if using GitHub) to guide PR descriptions.
*   **Branch Protection Rules (GitHub/GitLab etc.):**
    *   Protect the `main` branch.
    *   Require PRs before merging.
    *   Require status checks (e.g., Vercel build, tests) to pass before merging.
    *   Optionally require reviews.

## 5. Adoption Steps

1.  **Establish `main`:** Ensure the current `main` branch reflects the latest stable, deployable state of the project. If not, create a PR to bring it up to date from the current working branch.
2.  **Branch for New Work:** For the *next* task (e.g., Task 12, if applicable), create a new feature branch from `main`: `git checkout main && git pull && git checkout -b feature/task-12-description`.
3.  **Follow the Cycle:** Perform specification, coding, and testing on the feature branch.
4.  **Commit Tested Code:** After tests pass for a logical unit of work, make an atomic commit with a conventional message: `git add . && git commit -m "feat: Implement feature X"`.
5.  **Push Branch:** `git push -u origin feature/task-12-description`.
6.  **Create PR:** When the entire task is complete and tested on the branch, create a PR to `main`.
7.  **Review & Merge:** Follow the PR review and merge process.
8.  **Configure Vercel:** Ensure Vercel is connected to the Git repository and configured to deploy automatically from the `main` branch. Enable PR preview deployments.
9.  **Protect `main`:** Configure branch protection rules on the Git hosting platform.