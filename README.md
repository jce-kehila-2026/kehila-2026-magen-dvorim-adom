
# Magen Dvorim Adom 2026

## Overview
A web-based system engineered to digitize and optimize the entire bee rescue lifecycle for the organization Magen Dvorim Adom. By replacing manual, fragmented communication—such as WhatsApp messages—with an organized, role-based workflow, the platform effectively bridges the gap between the public, staff, and volunteers. The system provides a centralized hub for reporting bee-related incidents, automated volunteer dispatch, and a professional dashboard for coordinators to track missions in real-time, collect operational data, and view comprehensive statistics. By streamlining the entire rescue process, the platform enhances service efficiency, ensuring the timely resolution of distress calls and contributing to the protection of bee populations and environmental conservation.

## Contents
- [Overview](#overview) • [Non‑Profit](#non-profit) • [Team](#team) • [Quick start](#quick-start) • [Handover](#handover) • [Privacy](#privacy) • [Contacts](#contacts)

## Non‑Profit
- Organization: Magen Dvorim Adom  
- Primary stakeholder(s): Zeev Golan — Administrator.
- Key deliverable: A fully integrated Bee Rescue and Volunteer Management System featuring real-time case intake, automated volunteer assignment, and a centralized operational dashboard.

## Team Introduction
- Team lead — Aseel Janazira — Janaziraaseel@gmail.com — Aseel-zira  
- Member — Doaa Abdeen — doaaab@post.jce.ac.il — doaa-ab
- Member — Aya Diab — diabaya2004@gmail.com — AyaDiab-dev
 
Include student IDs if required.

## Quick start (local)
1. git clone https://github.com/<org>/<repo>.git
2. cd <repo>
3. cp .env.example .env  # edit values
4. npm install
5. npm run dev
Open http://localhost:3000

## Demo / Deployment
- Deployed app: [https://magen-dvorim-adom-5024e.web.app/](https://magen-dvorim-adom-5024e.web.app)  
- CI: GitHub Actions (push → deploy)

## Handover (minimum)
- [x] Deployed URL + admin credentials (shared securely)  
- [x] HANDOVER.md with maintenance steps  
- [x] Add non‑profit staff as repo collaborators or transfer repo.

## Privacy & Security

We are committed to the security and privacy of our users. 

*   **Data Collection:** The system collects essential information to facilitate bee rescue operations, including user names, contact emails, phone numbers, and incident location data.
*   **Data Storage:** All operational data is securely stored and managed using **Firebase Firestore**.
*   **Security Practices:** We adhere to industry standards for security. All sensitive API keys and credentials are kept out of the source code; they are managed exclusively through **GitHub Secrets** and local `.env` files.

## Known limitations
Briefly list major limitations or missing features and any workarounds.

 ## Contacts
- Aseel Janazira — janaziraaseel@gmail.com
- Doaa Abdeen — doaaab@post.jce.ac.il 
- Aya Diab — diabaya2004@gmail.com 


## License
This project is licensed under the MIT License. The source code is provided for the Magen Dvorim Adom organization, granting them full rights to use, modify, and manage the software for their operational needs.

## Use Case Documentation
The detailed use case documentation for the system is available in the project Wiki.
https://github.com/jce-kehila-2026/kehila-2026-magen-dvorim-adom/wiki/User-Manual-and-System-Documentation
