# arkusze-tracker

Tampermonkey userscript for tracking completed exam papers on [arkusze.pl](https://arkusze.pl).
Vibe-coded with claude lol

## Features

- Adds checkboxes to every exam row on subject index pages
- Records the date each exam was completed
- Progress bar showing how many exams you've done in a subject
- Percentage badge on subject thumbnails on the homepage
- Reset button at the bottom of each subject page
- All data stored locally in your browser (localStorage) — nothing is sent anywhere

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click the link below to install the script directly:

**[Install arkusze-tracker](https://raw.githubusercontent.com/YOUR_USERNAME/arkusze-tracker/main/arkusze_tracker_universal.user.js)**

> Replace `YOUR_USERNAME` with your GitHub username after uploading the script.

## Usage

- Visit any subject page (e.g. [informatyka rozszerzona](https://arkusze.pl/informatyka-matura-poziom-rozszerzony/)) — checkboxes will appear next to each exam row
- Check a box to mark an exam as done; the completion date is saved automatically and shown under the checkbox
- The progress bar at the top updates in real time
- On the homepage, each subject thumbnail shows the percentage of completed exams (visible after you've visited that subject's page at least once)
- On individual exam pages, a button below the title lets you toggle the done status
- To clear progress for a subject, use the reset button at the bottom of the page

## Compatibility

Works across all subjects on arkusze.pl:
- Matura podstawowa and rozszerzona
- Matura dwujęzyczna
- Egzamin ósmoklasisty
- Egzamin gimnazjalny
- Sprawdzian szóstoklasisty
- Egzamin zawodowy

## Notes

Progress is stored in your browser's localStorage under the key `arkusze_done_v2`. Clearing your browser data will erase it. The script does not sync between devices or browsers.
