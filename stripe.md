# Stripe Connect Integration

This document explains what was implemented for the Stripe Connect integration, why certain choices were made, and how to use the sample integration.

## Overview

The integration enables users to:
1.  **Onboard to Stripe Connect**: Create a "full" dashboard V2 account and complete onboarding.
2.  **Manage Products**: Create and list products directly on their connected account.
3.  **Sell via Storefront**: A dedicated page for each connected account where customers can buy products.
4.  **Subscribe to the Platform**: Connected accounts can subscribe to the platform to access features.
5.  **Manage Subscriptions**: A billing portal for users to manage their platform subscriptions.

## Technical Implementation

### Stripe Client Utility
We use a centralized `stripeClient` in `packages/domain/src/stripe/client.ts`. It's initialized with the requested API version (`2025-12-15.clover`) and includes a helper to ensure the API key is present.

### Database Changes
Added `stripeAccountId` and `subscriptionStatus` to the `User` model to track connected accounts and their platform subscription state.

### Connected Accounts (V2)
When creating accounts, we use the V2 API properties as specified:
- `dashboard: 'full'`
- Capabilities: `card_payments` requested.
- Configuration includes both `merchant` and `customer`.

### Onboarding
Onboarding is handled via **Stripe Account Links (V2)**. The user is redirected to Stripe to fill out their details and then returned to the application.

### Storefront and Direct Charges
Each connected account has a storefront at `/connect-demo/store/[accountId]`. 
- **Retrieval**: Products are fetched using the `Stripe-Account` header.
- **Payment**: Payments are processed as **Direct Charges** via hosted Stripe Checkout, ensuring the revenue goes directly to the connected account.

### Platform Subscription (V2 Customer Account)
With V2 accounts, we use the `customer_account` (the `acct_...` ID) to create subscriptions at the platform level. This simplifies identity management as the same ID is used for both the merchant and the customer.

### Webhooks
Two webhook endpoints are provided:
1.  **V2 Thin Events** (`/api/stripe/v2-webhook`): Specifically for V2 account requirement updates.
2.  **V1 Standard Events** (`/api/stripe/subscription-webhook`): For platform subscription lifecycle events.

## Setup Instructions

1.  **API Keys**: Set `STRIPE_SECRET_KEY` in your `.env`.
2.  **Webhooks**:
    - Add a "Connected accounts" destination for `v2.account[...]` events using **Thin** payload style.
    - Add a standard destination for `customer.subscription.*` and `payment_method.*` events.
3.  **Stripe CLI**: For local testing, use the following command to listen for thin events:
    ```bash
    stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' --forward-thin-to http://localhost:3000/api/stripe/v2-webhook
    ```
4.  **Pricing**: Set `STRIPE_PRICE_ID` in your `.env` for the platform subscription. 
    > [!IMPORTANT]
    > The ID `price_1QXYZABCDEF12345` provided in the initial `.env` documentation is a **placeholder**. You must create a real recurring price in your Stripe dashboard and use its ID (e.g., `price_123...`).

## Security and Invariants
- We strictly follow the **Billing Invariants** documented in `BILLING_INVARIANTS.md`.
- No payment state is modified via client-side input; everything flows through Stripe webhooks.
- Connected account headers are used for all merchant-specific operations.
