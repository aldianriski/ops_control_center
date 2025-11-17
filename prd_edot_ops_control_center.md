# Edot Ops Control Center – Product Requirements Document (PRD)

## 1. Overview & Purpose
- **Vision:** Create a single control center that unifies InfraOps, SecurityOps, and FinOps into an automated, real-time operational dashboard to eliminate manual reporting, reduce context switching, and increase team autonomy.
- **Problem Statement:** The Infra & Security Manager is overwhelmed by dual responsibilities: deep technical troubleshooting and strategic reporting. Weekly and daily reports (SLA, uptime request, incident summaries, AWS OPEX, ICS credits, etc.) require manual narrative writing and calculations. Team operations lack SOP clarity, causing inefficiency, repetitive tasks, and context switching across multiple channels.
- **Purpose:** Centralize operational visibility, automate reporting, streamline team workflows, and provide real-time dashboards for leadership.
- **Scope (In-Scope):** InfraOps automation, SecOps automation, FinOps reporting & forecasting, executive dashboards, SOP integration, automated report generation.
- **Out-of-Scope:** Tool replacement for Jenkins/Grafana; full incident automation (only drafting supported).
- **Primary Users:** Infra & Security Manager, Head of Engineering.
- **Stakeholders:** Engineering Lead, Security Lead, Infra Squad, FinOps team.

## 2. Goals & Success Metrics
- **Goal 1:** Reduce manual weekly reporting workload.
  - *Success Metric:* 90% of weekly report auto-generated.
- **Goal 2:** Improve team autonomy and reduce dependency on manager.
  - *Success Metric:* 70% reduction in repeated questions and manual status requests.
- **Goal 3:** Provide real-time visibility to Head of Engineering.
  - *Success Metric:* Daily executive dashboard with <5 min latency.
- **Non-Goals:** Replace existing tools; automate deep technical debugging.

## 3. High-Level Product Summary
- **Product Description:** A unified control center automating reporting, forecasting, operational tracking, and SOP-driven workflows.
- **Core Domains Covered:** Infra Operations, Security Operations, FinOps.
- **Key Capabilities:** Automated reporting, forecasting engine, team status consolidation, incident/RCA draft generator, SOP-driven workflows, executive dashboards.

## 4. Detailed Features & Requirements
### 4.1 Dashboard & Reporting Automation
- **Description:** Generates real-time dashboards and weekly/monthly reports.
- **User Stories:**
  - As a Manager, I want automatic weekly reports so I don’t spend hours writing narratives.
  - As Head of Engineering, I want real-time dashboards for incidents, uptime, and OPEX.
- **Acceptance Criteria:** Auto-generated PDF/MD reports, SLA calculation accuracy, ICS tracking.
- **Functional Requirements:** Fetch data from Jira, AWS, SOP KB daily or real-time.
- **Non-Functional Requirements:** Report generation under 30 seconds.

### 4.2 FinOps Automation
- **Description:** Automated AWS cost, ICS tracking, monthly forecasts.
- **User Stories:**
  - As a Manager, I want OPEX to be calculated automatically.
- **Acceptance Criteria:** Forecast accuracy within agreed threshold; detects anomalies.
- **Functional Requirements:** Use best-practice forecasting logic.
- **Non-Functional Requirements:** Handle 12 months of CUR data efficiently.

### 4.3 InfraOps Automation
- **Description:** Consolidates Infra tasks, blockers, and urgent events.
- **User Stories:**
  - As a Manager, I want team task summaries and blockers collected automatically.
- **Acceptance Criteria:** Daily summary compiled from Jira.
- **Functional Requirements:** Integrate Jira ITSM.

### 4.4 SecurityOps Automation
- **Description:** Centralizes SecOps reports, vulnerabilities, tasks.
- **User Stories:**
  - As a Manager, I want visibility of security tasks and blockers.

### 4.5 Team Workflow, SOP, and Task Intelligence
- **Description:** SOP-driven automation for workflow clarity.
- **User Stories:**
  - As a Manager, I want SOP-linked tasks so the team is more autonomous.
- **Acceptance Criteria:** SOP checklist auto-attached per task.

## 5. User Experience & Design
- **Personas:** Manager, Head of Engineering.
- **User Flows:** Daily sync → Dashboard → Weekly report generation.
- **Wireframes & Mockups:** To be designed.
- **Design Guidelines:** Minimalist, fast, dashboard-first.
- **UX Requirements:** One-click report generation, drill-down dashboards.

## 6. Integrations
- **Jira ITSM:** Task, incident, and progress sync.
- **AWS Cost Explorer / CUR:** Daily or real-time cost pull.
- **SOP Knowledge Base:** Outline-format SOP ingestion.
- **Sync Requirements:** Real-time preferred; fallback daily sync.

## 7. Assumptions, Constraints, and Dependencies
- **Assumptions:** Jira workflows are consistent; AWS CUR accessible.
- **Constraints:** Deliverable in 2 months.
- **Dependencies:** Jira API, AWS CUR availability.

## 8. Technical Architecture Overview
- **Proposed Architecture:** Web app + backend scheduler + data ingestion workers.
- **Data Flow:** Ingest → Normalize → Store → Dashboard → PDF/MD generator.
- **Components:** Dashboard UI, reporting engine, forecasting engine.
- **APIs:** Jira API, AWS Billing.
- **Storage:** Relational DB or Supabase.
- **Security Considerations:** IAM roles, encrypted storage.

## 9. Non-Functional Requirements (Global)
- **Performance:** Dashboard loads <2 sec.
- **Security:** All data encrypted; RBAC.
- **Scalability:** Supports 2–3 squads.
- **Availability:** 99% uptime.
- **Observability:** Logs, metrics, health checks.
- **Maintainability:** Modular architecture.

## 10. Timeline & Milestones
- **Target MVP:** 2 months.
- **Target Full Release:** Post-MVP enhancements.
- **Milestones:**
  - Week 1–2: Integrations
  - Week 3–4: Dashboard
  - Week 5–6: Reporting Engine
  - Week 7–8: Testing & Release

## 11. Stakeholders & Approvals
- **Document Owner:** Infra & Security Manager.
- **Engineering Lead:** TBD.
- **Design Lead:** TBD.
- **Security Lead:** TBD.
- **Business Owner:** Head of Engineering.
- **Approval Notes:** Pending.

## 12. Revision History
- **v0.1:** Structure created.
- **v0.2:** Populated based on user inputs.
- **v1.0:** Pending.

