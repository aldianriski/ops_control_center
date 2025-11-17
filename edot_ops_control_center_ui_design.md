# Edot Ops Control Center — UI Architecture & Detailed Screen Design

## 1. UI Architecture Overview
The Ops Control Center UI provides unified visibility across InfraOps, SecOps, and FinOps with fast access to dashboards, reports, and SOP workflows.

### UI Structure
- Global Navigation
- Feature Dashboards
- Drill‑down Views
- Reporting Module
- SOP Module
- Admin Module

---

## 2. Global Navigation
```
[Dashboard]  [InfraOps]  [SecOps]  [FinOps]  [Reports]  [SOP]  [Admin]
```

### Role Access
| Role | Dashboard | InfraOps | SecOps | FinOps | Reports | SOP | Admin |
|------|-----------|----------|--------|--------|---------|-----|--------|
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Head of Eng | ✓ | ✓ | summary | ✓ | ✓ | – | – |
| Viewer | ✓ | ✓ | ✓ | ✓ | – | ✓ | – |

---

## 3. Screens

# 3.1 Home Dashboard
### Purpose
Provide a single‑pane view of InfraOps, SecOps, and FinOps health.

### Layout
- Global KPI Cards
- InfraOps Summary Panel
- SecOps Summary Panel
- FinOps Summary Panel
- Alerts & Anomalies

### KPI Cards
- Weekly Incidents
- SLA % Delivered
- AWS OPEX MTD vs Budget
- ICS Credits Remaining

---

# 3.2 InfraOps Module
```
InfraOps
 ├─ Incidents
 ├─ Tasks & Progress
 ├─ Uptime Requests
 └─ SLA Panel
```

## Incidents Dashboard
- Filters: Date, Severity, Squad, Status
- Incident Trend Chart
- Incident Table
- Right‑side Detail Panel

## Tasks & Progress
- Kanban View: To Do / In Progress / Blocked / Done
- Per Squad Filters

## Uptime Requests
- KPI Cards: Total Hours, Delivered, SLA %
- Table: Requester, Ticket ID, Environment, Window, Delivered

## SLA Panel
- SLA % Trend 12 Weeks
- Delivered vs Requested Hours

---

# 3.3 SecOps Module
```
SecOps
 ├─ Vulnerabilities
 ├─ Remediation Tasks
 └─ Security Incidents
```

## Vulnerabilities
- Severity Pie Chart
- 30‑day Trend
- Table: System, Severity, Age, Owner
- Detail Panel: Description, Evidence, SOP

## Remediation Tasks
- Kanban View
- SOP attached per issue
- SLA indicators

## Security Incidents
- Trend chart
- Event timeline
- TTP profile

---

# 3.4 FinOps Module
```
FinOps
 ├─ OPEX Overview
 ├─ Cost Breakdown
 ├─ Forecast
 └─ ICS Credits
```

## OPEX Overview
- MTD Cost, Forecast EOM, Budget, Variance
- Daily cost trend chart
- Environment cost share

## Cost Breakdown
- Hierarchical table: Environment → Service → Resource
- ICS credit applied
- Filters: environment, service, tags

## Forecast
- 30‑day forecast with buffer
- Scenarios: baseline, high load, low load
- What‑if Estimator

## ICS Credits
- Current balance
- Burn rate chart
- Remaining days estimate

---

# 3.5 Reports Module
```
Reports
 ├─ Weekly Ops Report
 └─ Monthly FinOps Report
```

## Report List
- PDF/MD downloads
- Status badges
- Generate Now button

## Report Viewer
- Inline PDF preview
- Metadata (timestamp, generator)

---

# 3.6 SOP Module
```
SOP
 ├─ Provisioning
 ├─ Security SOPs
 ├─ Incident SOPs
 └─ Custom SOPs
```

## SOP List
- Search bar
- Category filters
- Tag filters

## SOP Detail
- Title, description
- Step‑by‑step checklist
- Attach to Task action

---

# 3.7 Admin Module
```
Admin
 ├─ Users & Roles
 ├─ Thresholds & Alerts
 ├─ Integrations
 └─ Report Templates
```

## Admin Features
- Integration status cards (Jira, AWS, SOP KB)
- Cron schedule editor
- Template editor
- Threshold sliders (anomaly %)

---

## 4. UI to Backend Mapping
| UI Component | API Endpoint |
|--------------|---------------|
| Dashboard KPIs | /dashboard/summary |
| Incidents | /infra/incidents |
| Uptime | /infra/uptime |
| SLA | /infra/sla |
| Vulnerabilities | /sec/vulnerabilities |
| Security incidents | /sec/incidents |
| FinOps summary | /finops/summary |
| Forecast | /finops/forecast |
| ICS | /finops/ics |
| Reports | /reports/* |
| SOP | /sop/* |
| Admin config | /admin/* |

---

## 5. MVP UI Scope
- Home Dashboard
- InfraOps (Incidents, Tasks, SLA)
- FinOps (OPEX, Cost Breakdown, ICS)
- Reports (Weekly + Monthly)
- Integrations Status
- Basic SOP Viewer

---

## 6. Post‑MVP Enhancements
- Advanced SecurityOps analytics
- Automated task workflows
- SOP editor
- What‑if FinOps modeling

