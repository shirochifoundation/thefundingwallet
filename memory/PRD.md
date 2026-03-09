# FundFlow - Crowdfunding Platform PRD

## Original Problem Statement
Build a "FundFlow" web application - a crowdfunding/group collection platform for social and corporate activities where users can create public fundraisers, receive donations, and withdraw collected funds.

## Core Features

### Implemented
1. **User Authentication** - Registration, login, JWT tokens
2. **Collections (Fundraisers)** - Create, browse, view details
3. **Donations** - Razorpay Payment Gateway (Card/UPI checkout modal)
4. **KYC System** - User KYC submission (Bank/UPI, PAN, Aadhaar)
5. **Admin Panel** - KYC approval, withdrawal management, platform settings
6. **Withdrawals** - RazorpayX Payouts API integration with admin approval flow
7. **Static Pages** - About, Contact, Terms, Privacy, Refund policies

### Payment Flow
- **Donations:** Razorpay Checkout (TEST mode)
- **Payouts:** RazorpayX Payouts API (TEST mode)
- **Webhook:** `/api/webhooks/payout` for automatic status updates

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI, MongoDB (pymongo)
- **Payments:** Razorpay Payment Gateway, RazorpayX Payouts

## Key Endpoints
- `POST /api/payments/create-razorpay-order`
- `POST /api/payments/verify-razorpay-payment`
- `POST /api/webhooks/payout` - RazorpayX payout status webhook
- `POST /api/admin/withdrawals/{id}/sync` - Manual payout status sync
- `POST /api/admin/withdrawals/{id}/process` - Approve/reject withdrawal

## Database Collections
- `users` - User accounts with KYC status
- `collections` - Fundraiser campaigns
- `donations` - Payment records
- `kyc_details` - KYC submissions
- `withdrawals` - Payout requests with RazorpayX payout IDs

## Test Credentials
- **User:** testuser@example.com / password
- **Admin:** admin@fundflow.com / admin123

## Changelog

### 2026-03-09
- Added RazorpayX Payout Webhook endpoint (`/api/webhooks/payout`)
- Added Admin Sync Status feature for manual payout status check
- Added Payout ID and UTR display in admin panel
- Fixed modal text from Cashfree to RazorpayX

### 2026-03-07-08
- Full migration from Cashfree to Razorpay
- Implemented RazorpayX Payouts for withdrawals
- Made Browse Collections the new homepage
- Added static pages (Contact, Terms, Privacy, Refund)
- Updated About page content

## Pending Tasks

### P0 - High Priority
- Configure RazorpayX webhook in Razorpay dashboard for automatic status updates

### P1 - Medium Priority
- Gallery Feature - Allow organizers to add images/videos to collections
- Update Contact Us page with actual contact details

### P2 - Low Priority
- Email notifications (Resend integration)
- Social sharing buttons
- Backend refactoring (split server.py into modules)

## Webhook Configuration Required
To enable automatic payout status updates:
1. Go to Razorpay Dashboard > Webhooks
2. Add webhook URL: `https://<your-domain>/api/webhooks/payout`
3. Enable events: `payout.processed`, `payout.failed`, `payout.reversed`
4. Save the webhook secret to `RAZORPAY_WEBHOOK_SECRET` in backend/.env
