Here is a clean, professional README.md for your project. This is designed to help you (or any other admin) understand how to maintain it and what's happening "under the hood."

🛡️ LTE Care Plus: Session Report Portal
A secure, high-performance web portal built with Next.js 14 that allows staff members to verify their identity and receive automated session reports via email.

🚀 Features
Real-time Sheet Lookup: Connects directly to Google Sheets to verify flagged sessions.

Secure Delivery: Uses Resend to bypass spam filters and deliver reports to personal emails.

Modern UI: Glassmorphism design with Tailwind CSS, Lucide icons, and Sonner notifications.

Data Normalization: Automatically handles phone number formatting and name case-sensitivity to ensure accurate matches.

🛠️ Tech Stack
Framework: Next.js (App Router)

Database: Google Sheets API (v4)

Email: Resend

Styling: Tailwind CSS + Lucide Icons

Notifications: Sonner (Toasts)

📋 Environment Variables
To run this project, you must add a .env.local file with the following keys:

Bash

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your_long_sheet_id_here

# Email Configuration
RESEND_API_KEY=re_your_api_key
📂 Project Structure
/app/api/report/route.js: The "brain" of the app. Handles sheet filtering and email triggers.

/components/verify-form.js: The frontend form with validation and loading states.

/lib/google.js: Helper file to initialize the Google Auth client.

⚙️ Logic & Outliers
Name Matching: The system joins LastName, FirstName and converts to lowercase before comparing to Column J (Index 9) of the spreadsheet.

Phone Matching: All non-numeric characters are stripped. The system compares the last 10 digits to ensure compatibility with international or local formatting in the Sheet.

Rate Limiting: The Resend Free tier allows 100 emails/day. For a staff of 3,000, keep an eye on usage in the Resend dashboard.

🛠️ Maintenance
Updating Data: Simply update the Google Sheet named Flagged_1/10. The app fetches live data on every request.

Domain Verification: If emails stop sending, check the Resend Dashboard to ensure the DNS records (DKIM/SPF) are still "Verified."