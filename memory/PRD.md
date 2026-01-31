# FundFlow - Group Collection Platform PRD

## Original Problem Statement
Build a web app where people can collect funds from friends/family for various activities:
- Kitty Party, School/College Reunions, Team Celebrations
- Society funds, Festival celebrations (Ganesh Utsav, Navratri)
- Medical emergencies, Social activities (tree plantation, charity)

Features: Public/private collections, Cashfree payment integration with escrow, donors list, gallery.

## User Choices
- Payment Gateway: Cashfree (with escrow functionality)
- UI Design: Modern
- Cashfree API Keys: TEST environment provided
- Authentication: JWT-based custom auth

## Architecture

### Backend (FastAPI + MongoDB)
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user (protected)
- `/api/collections` - CRUD for collections (create protected)
- `/api/my-collections` - Get user's collections (protected)
- `/api/payments/create-order` - Cashfree payment order creation
- `/api/payments/verify/{order_id}` - Payment verification
- `/api/webhooks/payment` - Cashfree webhook handler
- `/api/categories` - Collection categories
- `/api/stats` - Platform statistics

### Frontend (React + Tailwind + shadcn/ui)
- HomePage - Hero, active collections
- BrowseCollections - Search, filter by category
- CollectionDetails - Overview, Donate form, Donors list tabs
- CreateCollection - Multi-step wizard (protected route)
- PaymentCallback - Payment success/failure handling
- AboutPage - Stats, use cases, features
- LoginPage - User login
- RegisterPage - User registration

### Database Collections
- `users` - User accounts with hashed passwords
- `collections` - Collection documents with user_id
- `donations` - Donation records with payment status

## User Personas
1. **Organizer** - Creates collections for events/causes (requires login)
2. **Donor** - Contributes to collections (no login required)
3. **Visitor** - Browses public collections

## Core Requirements (Static)
- [x] Public/Private collection visibility
- [x] Multi-category support
- [x] Cashfree payment integration
- [x] Real-time donation tracking
- [x] Share collection links
- [x] Anonymous donations option
- [x] User authentication (login/register)
- [x] Protected collection creation

## What's Been Implemented (Jan 31, 2026)
- [x] Complete backend API with Cashfree HTTP integration
- [x] Modern responsive UI with Bricolage Grotesque + Inter fonts
- [x] Collection creation wizard (3-step process)
- [x] Browse collections with search and category filter
- [x] Collection details with tabs (Overview, Donate, Donors)
- [x] Payment order creation and verification
- [x] Webhook endpoint for payment notifications
- [x] Platform statistics dashboard
- [x] About Us page with moved sections
- [x] User authentication (JWT-based)
- [x] Protected routes for collection creation
- [x] User dropdown menu with logout

## Prioritized Backlog

### P0 (Critical)
- All core features implemented ✓

### P1 (Important)
- [ ] Gallery/photos for collections
- [ ] Email notifications for donations
- [ ] Payout management to organizers
- [ ] My Collections dashboard page

### P2 (Nice to Have)
- [ ] Social sharing buttons (WhatsApp, Facebook)
- [ ] Collection updates/announcements
- [ ] Recurring donations
- [ ] Export donor list
- [ ] Dashboard for organizers

## Next Tasks
1. Implement gallery feature for collections
2. Add email notifications on donation success
3. Build My Collections dashboard page
4. Add social sharing buttons
