# Job Application Tracker

A lightweight local web app for tracking job applications, interviews, follow-ups, contacts, and notes.

## Features

- Add, edit, and delete job applications
- Track company, role, location, salary, source, and status
- Track interview stages and upcoming interview dates
- Store recruiter / contact details
- Add follow-up dates, links, and notes
- Filter by status and search by company / role
- Dashboard counts for quick review
- Export data to JSON
- Import data from JSON
- Runs entirely in the browser using localStorage

## How to use

1. Download or clone the repository.
2. Open `index.html` in your browser.
3. Start adding applications.

No install step is required.

## Suggested statuses

- Applied
- Recruiter Screen
- Interviewing
- Offer
- Rejected
- Withdrawn

## Files

- `index.html` — app layout
- `styles.css` — styling
- `app.js` — logic and local storage
- `README.md` — setup and usage notes

## Notes

This stores data locally in your browser. If you want cloud sync later, the next upgrade would be:

- Supabase
- Airtable
- Firebase
- Notion API

## Customization ideas

- Add tags for remote / hybrid / onsite
- Add resume version tracking
- Add cover letter version tracking
- Add reminders for thank-you emails
- Add analytics like response rate and interview rate