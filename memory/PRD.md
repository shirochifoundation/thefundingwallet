# FundFlow - Crowdfunding Platform PRD

## Original Problem Statement
Build a "FundFlow" web application - a crowdfunding/group collection platform for social and corporate activities where users can create public fundraisers, receive donations, and withdraw collected funds.

## Core Features

### Implemented
1. **User Authentication** - Registration, login, JWT tokens
2. **Collections (Fundraisers)** - Create, browse, view details
3. **Collection Approval System** - Admin must approve collections before they go live
4. **Donations** - Razorpay Payment Gateway (Card/UPI checkout modal)
5. **KYC System** - User KYC submission (Bank/UPI, PAN, Aadhaar)
6. **Admin Panel** - Collection management, KYC approval, withdrawal management, platform settings
7. **Withdrawals** - RazorpayX Payouts API integration with admin approval flow
8. **Static Pages** - About, Contact, Terms, Privacy, Refund policies

### Collection Approval Flow
1. User creates a collection → Status: `pending_approval`
2. Collection NOT visible on public dashboard
3. Admin reviews collection in Admin Panel → Collections tab
4. Admin approves → Status: `active` → Visible on public dashboard
5. Admin rejects with reason → Status: `rejected` → User sees rejection reason

### Payment Flow
- **Donations:** Razorpay Checkout (TEST mode)
- **Payouts:** RazorpayX Payouts API (TEST mode)
- **Webhook:** `/api/webhooks/payout` for automatic status updates

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI, MongoDB (pymongo)
- **Payments:** Razorpay Payment Gateway, RazorpayX Payouts

## Key Endpoints

### Collection Management (Admin)
- `GET /api/admin/collections` - Get all collections
- `GET /api/admin/collections/pending` - Get pending collections only
- `POST /api/admin/collections/{id}/review` - Approve/reject collection

### Withdrawals
- `POST /api/webhooks/payout` - RazorpayX payout status webhook
- `POST /api/admin/withdrawals/{id}/sync` - Manual payout status sync
- `POST /api/admin/withdrawals/{id}/process` - Approve/reject withdrawal

### Payments
- `POST /api/payments/create-razorpay-order`
- `POST /api/payments/verify-razorpay-payment`

## Database Collections
- `users` - User accounts with KYC status
- `collections` - Fundraiser campaigns (status: pending_approval, active, rejected, completed, cancelled)
- `donations` - Payment records
- `kyc_details` - KYC submissions
- `withdrawals` - Payout requests with RazorpayX payout IDs

## Test Credentials
- **User:** testuser@example.com / password
- **Admin:** admin@fundflow.com / admin123

## Changelog

### 2026-03-11
- Implemented Collection Management in Admin Panel
- New collections require admin approval before going live
- Added "Collections" tab as default in Admin Panel
- Added "Pending Collections" stat card
- Users can see collection status in "My Collections" page
- Updated success message after creating collection

### 2026-03-10
- Fixed phone number input in donation form
- Removed hardcoded customer identifier defaults
- Disabled automatic Razorpay Smart Collect on collection creation

### 2026-03-09
- Added RazorpayX Payout Webhook endpoint (`/api/webhooks/payout`)
- Added Admin Sync Status feature for manual payout status check
- Added Payout ID and UTR display in admin panel

### 2026-03-07-08
- Full migration from Cashfree to Razorpay
- Implemented RazorpayX Payouts for withdrawals
- Made Browse Collections the new homepage
- Added static pages (Contact, Terms, Privacy, Refund)

## Pending Tasks

### P1 - Medium Priority
- Gallery Feature - Allow organizers to add images/videos to collections
- Update Contact Us page with actual contact details
- Email notifications (Resend integration)

### P2 - Low Priority
- Social sharing buttons
- Backend refactoring (split server.py into modules)

## Webhook Configuration Required
To enable automatic payout status updates:
1. Go to Razorpay Dashboard > Webhooks
2. Add webhook URL: `https://<your-domain>/api/webhooks/payout`
3. Enable events: `payout.processed`, `payout.failed`, `payout.reversed`
4. Save the webhook secret to `RAZORPAY_WEBHOOK_SECRET` in backend/.env
