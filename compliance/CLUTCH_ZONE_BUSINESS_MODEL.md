# Clutch Zone Business Model

**Status:** Implementation-based description; legal classification unresolved.

## Platform
Clutch Zone provides direct match pairing, tournaments, host-created tournaments, results, leaderboards, in-app wallet records and Cashfree deposit integration.

## Revenue and collection
- Tournament entries are deducted from the CZ wallet.
- The implementation calculates tournament prize pools, retained amounts, host shares and Clutch Zone fees for applicable formats.
- Direct matches use configured entry fees and prize pools.
- Deposits convert ₹1 to 10 CZ.

## Deposits
- A user initiates a Cashfree order.
- Provider status is verified or delivered by webhook.
- A successful deposit is credited once and recorded as a wallet transaction.

## Tournament flow
- Hosts create tournaments and set game, format, team size, entry fee and schedule.
- Users register using the wallet.
- Hosts or administrators manage tournament stages, room details, results and disputes.
- Prize amounts are credited through format-specific payout functions.

## Hosts
- Hosts can create and manage tournaments.
- The platform stores host Instagram usernames for tournament support escalation.
- Host shares are calculated in tournament financial functions where applicable.

## Disputes
- Direct matches support screenshot evidence and admin dispute resolution.
- Team tournaments support claims, screenshots and host/admin resolution.
- Tournament issue reports support host contact and a six-hour Clutch Zone escalation flow.

## Withdrawals
- Users request at least ₹100.
- Withdrawal is pending until admin approval.
- Approved amounts are debited and may move to processing.
- Paid status requires a manual external payout reference.
- Failed payouts restore the balance exactly once and create a reversal transaction.

## Unresolved legal facts
- Whether all or any paid competition is esports or another regulated category.
- GST base and tax treatment.
- Whether wallet balances constitute regulated stored value or PPI.
- Whether host earnings or referral balances create separate tax liabilities.
