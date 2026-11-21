# Data Protection Compliance

**Status:** Implementation review plus phased statutory review.

## Data presently represented in the models
- Username
- Phone number and phone verification fields
- Profile fields: title, biography and in-game UID
- Wallet and transaction records
- Match, tournament and dispute records
- Uploaded screenshot/evidence references
- OneSignal push identifier and notification preferences
- Trust, ban and suspicious-activity records
- Age declaration and declaration timestamp

## Data not confirmed
- The current `User` model does not store email.
- No DOB or verified identity document field is implemented.
- Device fingerprint and IP fields exist in the model but confirmed population should be verified.
- Cookie and analytics use should be confirmed in deployment configuration.

## Third parties
- Cashfree: deposits and return/webhook flows
- Cloudinary: uploaded payment/result evidence
- OneSignal: push notification delivery
- Hosting/provider configuration: not verified

## Required controls
- Data inventory and purpose mapping
- Processor and retention agreements
- Secure credential handling
- Access-control review
- User correction/request process
- Deletion request process that preserves financial, dispute and legal records
- Data-breach response and notification procedure
- Cross-border transfer assessment

## Owner action
Assign the actual data fiduciary/grievance role, confirm provider locations and retention periods, and verify phased DPDP obligations with counsel.
