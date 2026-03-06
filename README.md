# Shega Report Admin Web Page

ShegaReport is a digital civic issue reporting platform designed to help residents report municipal problems such as water outages, sanitation issues, road damage, and infrastructure failures. The system connects residents, administrators, and technicians to improve service delivery and transparency.

## Project Overview

Rapid urbanization in towns like Debre Berhan has increased the demand for efficient public service management. However, many municipal complaints are still reported through manual methods such as phone calls or in-person visits.

ShegaReport solves this problem by providing a centralized digital platform where residents can easily submit complaints with photos and location data. Municipal authorities can review reports, prioritize urgent issues, and assign tasks to technicians for quick resolution.

## Features

- Submit complaints with text, photos, and location
- Track complaint status using a ticket number
- Priority scheduling based on urgency level
- Admin dashboard for complaint management
- Technician task assignment system
- Duplicate complaint detection
- Protection against fake submissions
- Multilingual support (Amharic & English)
- SMS / notification updates

## System Workflow

1. Residents submit complaints using the ShegaReport mobile application.
2. Admins review complaints through the dashboard.
3. Tasks are assigned to technicians.
4. Technicians resolve the issue in the field.
5. Residents receive notifications when issues are resolved.

## Technologies Used

Frontend
- Next.js
- Tailwind CSS

Backend
- NestJS
- Prisma ORM

Database
- PostgreSQL 

Other Tools
- REST APIs
- GPS location services
- 
 ## System Architecture

The ShegaReport system follows a modern full-stack architecture:

User Mobile App → Backend API → Database  
Admin Dashboard → Backend API → Database  
Technician Interface → Backend API → Database

## Getting Started

Clone the repository:

git clone https://github.com/yourusername/shegareport.git

Navigate to the project folder:

cd shegareport

Install dependencies:

npm install

Run the development server:

npm run dev

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
## Screenshots

### User Reporting Interface
![User Report](images/report.png)

### Admin Dashboard
![Admin Dashboard](images/admin.png)

### Technician Task Assignment
![Technician](images/technician.png)
