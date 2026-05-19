Design a complete responsive web application UI for “SEAL – Hackathon Management Platform with AI-assisted Repository Evaluation”.

Important product positioning:
SEAL is primarily a Hackathon Lifecycle Management Platform, not an AI-first product. AI-assisted repository evaluation is only a supporting feature for judges and coordinators. Do not make the visual identity look like an “AI-powered platform”. The core experience should focus on event operations, registration, teams, judging, GitHub repositories, rankings, and results.

Target users:
1. Participant
2. Team Leader
3. Event Coordinator
4. Mentor
5. Judge
6. Admin

Design style:
Create a modern academic SaaS / operations dashboard interface. It should feel professional, clean, structured, and trustworthy. Use a light theme by default with subtle dark accents. Avoid overly decorative landing-page styling. Use dense but readable layouts suitable for managing hackathon operations. Use cards only for meaningful summaries or repeated items. Use tables, status badges, segmented controls, tabs, filters, step indicators, timeline components, modals, and dashboards.

Brand:
Product name: SEAL
Tagline: Hackathon Management Platform with AI-assisted Repository Evaluation
Tone: academic, organized, transparent, collaborative, reliable
Primary colors: deep navy or charcoal, fresh blue, green success, amber warning, red danger, soft neutral backgrounds.
Use clean typography and consistent spacing.

Create the following desktop web app screens at 1440px width:

1. Login Screen
- Google Login as primary authentication
- Product name SEAL
- Short supporting copy: “Manage hackathon registration, teams, judging, repositories, and results in one platform.”
- Do not overemphasize AI.

2. Event Coordinator Dashboard
Show key metrics:
- Total participants
- Total teams / max 30 teams
- Check-in rate
- Repository access status
- Preliminary judging progress
- Finalists selected
- Published results status
Include a lifecycle progress tracker:
Registration → Team Formation → Check-in & Seminar → Coding → Preliminary Judging → Final Round → Repository Locking → Result Publishing

3. Event Management Screen
- Event list table
- Event status badges: Draft, Open Registration, Ongoing, Scoring, Completed, Archived
- Create/Edit event form
- Fields: title, description, semester, start date, end date, status
- Timeline section for workshops, check-ins, rounds, result publishing, ceremonies

4. Registration & Invitation Screen
- Registration form builder preview
- Participant invitation email panel
- Participant table with status: Invited, Registered, Active, Withdrawn
- Filters by team, status, check-in status, GitHub access status

5. Team Management Screen
- Teams table with max 30 teams indicator
- Team detail drawer
- Team leader badge
- Participant list inside team
- Actions: create team, invite participant, assign leader, register track/category
- Show team status: Active, Inactive, Disqualified

6. Check-in & Seminar Attendance Screen
- QR/check-in style panel
- Participant check-in table
- Seminar/workshop attendance list
- Attendance summary chart
- Status badges: Not Checked In, Checked In

7. GitHub Integration & Repository Management Screen
- GitHub organization configuration
- Auto-create repository action
- Invite collaborators action
- Revoke access after deadline action
- Repository table with repo URL, team, contributors, last sync, submission status
- GitHub access status badges: Not Granted, Granted, Revoked
- Repository locking warning state after deadline

8. Judging Board Assignment Screen
- Preliminary round setup
- Visual board layout:
  Board 1: 10 teams
  Board 2: 10 teams
  Board 3: 10 teams
- Judge assignment per board
- Random assignment button
- Board status: Draft, Assigned, Scoring, Completed

9. Judge Scoring Screen
- Judge dashboard for assigned board
- Team submission list
- Rubric scoring form
- Criteria rows with score input and comment field
- Repository review summary panel
- AI-assisted repository evaluation shown as a small supporting insight panel, not the main scoring area
- Submit evaluation button

10. Final Round & Ranking Screen
- Show finalist selection:
  3 boards x top 2 teams = 6 finalists
- Finalist team cards/table
- Final scoring status
- Ranking table with rank, team, score, board, prize
- Publish results action

11. Participant Dashboard
- Event registration status
- Team information
- Check-in status
- GitHub repository access status
- Timeline of hackathon phases
- Workshop/seminar schedule
- Submission status
- Published result area

12. Team Leader Workspace
- Team profile
- Participant management
- Repository information
- Submission materials form:
  repository link, demo URL, report URL, presentation URL
- Communication panel for coordinator messages

13. Mentor Dashboard
- Assigned teams
- Progress monitoring
- Repository activity summary
- Feedback notes area
- Upcoming seminar/workshop schedule

14. Admin Settings Screen
- Role and permission management
- Account approval list
- External integration configuration:
  GitHub token
  AI API key
  Webhook secret
- Audit log table

Design requirements:
- Use Figma Auto Layout everywhere.
- Create reusable components: sidebar, topbar, buttons, input fields, tables, status badges, metric cards, tabs, modals, drawers, timeline stepper, rubric score row, team card, judging board card.
- Use realistic sample data:
  Event: SEAL Hackathon 2026
  Semester: 2026A
  Max teams: 30
  Preliminary boards: 3 boards x 10 teams
  Finalists: 6 teams
- Include role-based navigation in the sidebar.
- Make the UI suitable for a real system analysis/design project, not a marketing concept.
- Prioritize clarity, operational workflows, and professional dashboard usability.
- Generate both desktop frames and at least 2 responsive mobile examples: Participant Dashboard and Judge Scoring.