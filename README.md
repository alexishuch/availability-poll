# Availability Poll

A simple scheduling app that helps groups find a common available time based on participants' availability — currently under development.

## Overview

Availability Poll is a calendar-based polling tool that allows users to indicate their availability on a shared calendar. The application aggregates responses and automatically highlights the most suitable time slots based on participant count.

This tool prioritizes ease of use over complexity.
There is no account creation or password required. Participants can access a poll instantly via a shared link and submit their availability through a clean and minimal interface.
This approach reduces friction and encourages participation, even for users who are usually reluctant to use new tools.

This project is **currently under active development**. Features, architecture, and user interface are subject to change.

## How It Works

1. A user creates a poll represented as a calendar, and shares a link with other participants
2. Each participant mark their availability on the calendar
3. The most suitable time slots are highlighted based on participant count

The frontend is built with Svelte, and the backend relies on NestJS with PostgreSQL as the database. In particular, the backend leverages PostgreSQL’s tsrange type to efficiently manage availability intervals, allowing accurate detection of overlapping time slots and aggregation across multiple participants.
