# Clutch Zone Policy Accuracy Audit

Audit date: 21 November 2026

This is a second-stage implementation audit, not a legal opinion or approval determination. Statements marked unsupported are unsupported or only partially supported by the current codebase.

## 1. Privacy Policy

**Implementation status:** Needs corrections before publishing

**Verified statements**
- The operator, GSTIN, support email and website are included consistently.
- Passwords are handled as a salted password hash. `server/controllers/authController.js` generates a salt and uses password hashing; login uses bcrypt comparison.
- The platform stores username, phone verification status, profile fields, wallet records, match and tournament records, result evidence, notifications and push subscription IDs.
- OneSignal push notification IDs and preferences are implemented.
- Cashfree deposit orders, payment status records and third-party payment processing are implemented.
- Cloudinary is used for uploaded payment/result evidence.
- Admin deletion and data removal of some related records exist, but no user self-service deletion flow exists.

**Unsupported or inaccurate statements**
- “Email address” is not a field in the current `User` model. Requests to Cashfree use placeholder email values; the platform should not imply that users supply or that Clutch Zone stores email addresses.
- “Device, browser or IP information” may be stored in model fields, but the audit found no confirmed population or collection of `deviceFingerprint` and `ipAddress` in normal registration or gameplay flows.
- “Cookies or similar technologies” are conditional and no explicit cookie implementation was identified. The app uses localStorage for screen/navigation and OneSignal SDK storage. It is safer to describe local storage and push behavior specifically rather than claim cookie collection.
- “Cross-border processing” is not implementation-verified. It depends on provider and hosting configuration.
- “Data may be shared with users involved in a match” is only supportable for records displayed by the match/tournament UI, not as a general access promise.
- The policy says consent may be withdrawn where an optional feature is used. No user-facing consent-management UI was found for cookies or analytics.

**Missing information**
- Actual browser localStorage keys and purposes.
- Whether OneSignal, Cloudinary, Cashfree, hosting and analytics providers transfer or retain data outside India.
- Actual data-retention periods.
- Deletion and erasure workflow response process.
- Exact breach-notification process and officer or team responsible.
- Whether AdSense is enabled and, if enabled, the data and consent implications.

**Recommended corrections**
- Replace email collection with “phone number, where supplied and verified” and remove any implication of a stored user email.
- Describe `username`, phone, profile, wallet, match, tournament, screenshot, notification and security records accurately.
- Replace cookie collection language with localStorage and SDK language until actual cookie use is confirmed.
- State that IP/device fields may exist in the database but are not automatically confirmed as collected.
- Make no absolute guarantee of data deletion; clarify that legal/financial/dispute records may need to be retained.
- Add placeholders for provider locations, retention periods and breach procedures.

**Prior to publication:** High

## 2. Terms & Conditions

**Implementation status:** Needs corrections before publishing

**Verified statements**
- Accounts, users, hosts and admins are represented by `role` in the database.
- Password change and account authentication are implemented.
- Phone verification is required for wallet withdrawals and direct-match or tournament entry routes where configured.
- Direct matches support configured modes and in-match formats. Tournaments support multiple formats, team sizes and 33 configured game names.
- Main wallet balance, bonus balance and referral balance are separate fields.
- Withdrawal is recorded as pending and requires admin approval.
- Disputes, screenshots, match resolution and tournament team disputes exist.
- Admin ban/unban and trust-score restrictions exist.
- Third-party games remain separate publisher ecosystems.

**Unsupported or inaccurate statements**
- “You may maintain only your own account” is supported, but no age, identity or adult declaration is enforced at registration.
- “Clutch Zone may verify accounts” is general and reasonable, but a formal KYC/identity-verification process is not implemented.
- “The platform may reject or waitlist registration” is partly supported by capacity/status checks; waitlist behavior was not identified.
- “A tournament may be postponed or cancelled for operational reasons” is a broad lawful description, but no general host cancellation endpoint or participant refund workflow was found.
- “A payment gateway is used” is correct only for deposit flows.
- “Clutch Zone may place funds on hold pending review” is supported for pending matches/disputes but should not imply every wallet balance can be held without a particular recorded reason.
- “Serious or repeated violations may lead to permanent suspension” is supported by admin and trust-score features, but the exact appeal notice process is not complete.

**Missing information**
- No age attestation or DOB collection.
- No formal self-service account closure flow.
- No published host code of conduct beyond database role and tournament support features.
- No specific cancellation rule for tournament deletion or Clutch Zone host cancellation.
- No KYC data or identity-verification standard.
- No fixed minimum, fees or withdrawal terms beyond code defaults.

**Recommended corrections**
- State that age eligibility is contractual and platform requirement, not an age check already enforced by the software.
- Replace waitlist language unless it is confirmed in UI.
- State that tournament cancellation and refunds follow the actual system workflow and applicable law rather than a general guaranteed entitlement.
- State that paid participation remains subject to applicable law and regulatory classification.
- Add that the existence of a trust-score or ban system does not make final enforcement unlimited or arbitrary.

**Prior to publication:** High

## 3. Refund & Cancellation Policy

**Implementation status:** Requires major factual corrections

**Verified statements**
- Cashfree deposit success creates a deposit record and credits the wallet once.
- Failed or pending deposit statuses are not credited.
- Duplicate deposits are guarded by deposit status and order ownership/atomic finalization.
- Direct-match entries can be cancelled before a match starts under controller rules.
- Admin direct-match cancellation refunds paid players in the admin controller.
- Withdrawal minimum is ₹100 and is implemented.
- Withdrawals begin as pending and can be approved or rejected by admins.
- Referral earnings cannot be withdrawn.
- Tournament registration deducts entry funds and rolls them back if participant creation fails.

**Unsupported or inaccurate statements**
- “If Clutch Zone cancels a tournament, confirmed entry amounts should be returned” is not implemented. No tournament-cancellation refund function was found.
- “A host cancellation is investigated and corrected” is not implemented as a participant refund or withdrawal workflow.
- “A failed registration may lead to a wallet correction or refund” is implemented for tournament registration failures only, and direct-match behavior may differ.
- “A pre-match host cancellation is governed” is unsupported because no host cancellation route was found.
- “No fixed refund timeline is guaranteed” is correct, but the document should explicitly supersede the UI 24–48-hour redemption estimate until that estimate is operationally confirmed.
- The document’s ₹20 deposit and ₹20 paid-match eligibility wording is implementation-supported, but the UI and backend currently describe one successful deposit total and one qualifying paid match. It should not imply a recurring or permanent additional eligibility condition.

**Missing information**
- Tournament deletion behavior: it deletes tournament and related records without a visible participant refund.
- Direct-match opponent cancellation behavior: it removes the opponent and does not refund in the identified controller path.
- Rules for creator cancellation after payment.
- Whether all direct-match cancellation functions call the refund utility or only admin cancellation does.
- Refund method and provider reversal process for external deposits.
- Actual wallet-correction and refund transaction descriptions.
- Approved withdrawal payout rail and actual settlement process.

**Recommended corrections**
- Remove any automatic tournament-cancellation refund promise.
- State that direct-match admin cancellation is the only clearly identified match cancellation refund implementation.
- Add a placeholder: tournament cancellation/refund handling is pending implementation or formal operational policy.
- Separate a tournament cancellation from tournament deletion. Deletion must not be represented as a refund mechanism.
- Keep the ₹100 minimum and ₹20 deposit/₹20 match eligibility as code-backed requirements, but add a clear review status.
- Align UI withdrawal copy with backend 24–48-hour text or remove the estimate until the payout process confirms it.

**Prior to publication:** Critical

## 4. Fair Play & Anti-Cheat Policy

**Implementation status:** Partially accurate; corrections needed

**Verified statements**
- Duplicate screenshot hashes and suspicious-activity fields are implemented.
- Fake-screenshot, wrong-result and conflict-submission dispute handling exists.
- Admin can flag screenshots and resolve disputes.
- Admin permanent bans and trust-score temporary/permanent enforcement exist.
- Match result rejection can move a match to disputed status.
- Tournament issue reports cover cheating, hacking, teaming, wrong results and fake evidence.

**Unsupported or inaccurate statements**
- “Temporary or permanent suspension may occur after evidence-based review” is implemented, but the code also includes automatic trust-score bans. That is not necessarily supported by the policy’s stated evidence standards without documenting review.
- “No administrator has unlimited authority” is a policy aspiration, but the code has broad admin endpoints. This must be a governance commitment, not a claim of technical constraint.
- “Readability, attributable and unedited evidence” is largely supported, but the screenshot system validates the file and duplicate hash, not truth or authenticity.
- “Match records may be held while reviewed” is implemented for disputed statuses.

**Missing information**
- Appeal standards, notice, reason and reversal procedure for bans.
- Whether temporary bans expire automatically and how ban expiration is enforced.
- Whether trust-score penalties are visible to users.
- Evidence-retention period.
- Tournament host versus Clutch Zone authority to enforce tournament penalties.

**Recommended corrections**
- State clearly that urgent admin action may be taken and followed by review.
- Add the actual match/tournament reporting channels.
- Avoid claiming the system reliably detects or proves cheating; describe it as reviewing logs and evidence.
- Add that users receive a reason or support opportunity where operationally possible.

**Prior to publication:** Medium

## 5. Responsible Gaming Policy

**Implementation status:** Needs corrections

**Verified statements**
- No guaranteed-income language was added.
- The wallet and transaction history expose balance, deposits, withdrawals and match transactions.
- Permanent and temporary account restrictions can be administered from the backend.
- Users can contact the support email.

**Unsupported or inaccurate statements**
- “Age verification may be used” is not true for standard registration. No DOB or age declaration exists.
- “Underage users must not create accounts” is a policy rule, but it is not technically enforced.
- “Users may request temporary account restriction” has no dedicated self-service feature; support email is the only documented route.
- “Permanent account closure” has no user-facing request or user self-service implementation. An admin-only deletion endpoint exists.
- “Withdrawal eligibility, pending status and verification are shown” are partly true through wallet UI and backend data.

**Missing information**
- Actual self-restriction duration options.
- Procedure for permanent closure requests.
- Pending-balance handling during closure.
- Independent support resources or official helplines.
- Grievance/officer details.

**Recommended corrections**
- State explicitly that standard account registration does not collect age and that users remain responsible for meeting the age requirement.
- Remove or qualify all “request temporary restriction” and “permanent closure” promises as email-based requests pending operational implementation.
- Do not state that support offers account controls unless those controls are confirmed by the support team.
- Add the support email as the only confirmed channel.

**Prior to publication:** High

## 6. Contact Us

**Implementation status:** Partially accurate

**Verified statements**
- Support email, operator, GSTIN and website are provided.
- A tournament support reporting UI exists.
- Tournament issues can be reported directly in the app and escalated to Clutch Zone Instagram after host contact.
- Match and tournament communication routes exist.

**Unsupported or inaccurate statements**
- Instagram and Discord contact details were not removed by this audit and may be valid existing channels, but no ownership verification was supplied.
- The page says users can submit “host enquiries” and “legal and compliance enquiries” to the support email. The email is defined, but team ownership, staffing and response guarantees are not verified.
- The placeholder grievance officer is not represented as appointed.
- The page gives no response-time promise, which is appropriate.

**Missing information**
- Verification of existing Instagram, Discord and tournament Instagram channels.
- Official general support account for Clutch Zone.
- Grievance officer name, designation and direct contact details.
- Whether support email is monitored continuously.

**Recommended corrections**
- Verify all public social accounts before publishing.
- Keep the grievance officer section clearly placeholder.
- Link “General”, “Payment”, “Tournament”, “Privacy”, “Host” and “Legal” categories to the support email with issue references.
- For tournament complaints, direct users to the in-app Tournament Support flow and then the official Instagram escalation flow.

**Prior to publication:** Medium

## 7. Payment & Wallet Policy

**Implementation status:** Largely implemented but needs precision

**Verified statements**
- Main balance, bonus balance and referral earnings are separate database fields.
- CZ is converted at 10 CZ per ₹1.
- Cashfree creates a wallet deposit order.
- Successful deposits are finalized once and added to main balance with a transaction record.
- Failed/pending deposits are not credited.
- Tournament and direct-match entries deduct wallet balance.
- Tournament and match prizes can credit wallet balance.
- Minimum redemption is ₹100 in the backend and UI.
- Withdrawal requests require verified phone and sufficient main balance.
- Withdrawal eligibility requires aggregate successful deposits of at least ₹20 and at least one qualifying paid match at CZ 200 or more.
- Referral earnings cannot be withdrawn.
- Withdrawal approval debits main balance and adds a transaction; rejection only changes status.
- Transaction history and pending withdrawal history are exposed by API/UI.

**Unsupported or inaccurate statements**
- “A failed or incomplete payment should not be credited” is implementation-backed.
- “Any extra withdrawal limits or fees must be published” is an operational recommendation, not current functionality.
- “Cashfree or another configured provider may process UPI” is implementation-backed for Cashfree, but no alternative gateway should be assumed.
- “The policy does not turn credits into bank deposits” is accurate.
- “Wallet corrections for refunds and cancellations” is only partly true; no reliable general correction workflow is confirmed for tournament cancellation.
- “Approval does not mean payout completed” is a necessary implementation distinction.

**Missing information**
- Actual payout rail used after approval.
- Withdrawal fees.
- Maximum withdrawal amount.
- Deposit limits.
- Actual 24–48-hour settlement process.
- Confirmed UPI payout implementation.
- Refund reversals from Cashfree.

**Recommended corrections**
- State the exact CZ conversion ratio.
- Describe bonus and referral balances as distinct and explicitly non-withdrawable where required.
- Correct the withdrawal policy so it says “minimum ₹100” and “approval is separate from payout status.”
- Remove 24–48-hour guarantee or state it is UI-estimated only.
- Remove implied deposit fees or limits until operationally confirmed.
- Separate direct-match entry deductions, tournament entry deductions and prize-credit behavior.

**Prior to publication:** Critical

## 8. Grievance Redressal Policy

**Implementation status:** Mixed

**Verified statements**
- Backend ticket creation/retrieval and admin ticket-status APIs exist.
- The original frontend InfoScreen ticket form was replaced and is not currently exposed.
- Tournament issue reports are fully implemented in the frontend/backend.
- Tournament escalation has a six-hour waiting period after the user confirms host contact.
- Tournament escalation directs users to a Clutch Zone Instagram account for evidence and escalation.
- Match disputes can be raised and resolved by admin.
- Withdrawal, account ban, wallet adjustment and refund-related admin workflows exist.
- No named grievance officer is implemented or represented.

**Unsupported or inaccurate statements**
- “Email or existing working ticket mechanism” is incomplete for the public UI. No working ticket form is currently mounted.
- “Complaint acknowledgement” is not guaranteed; only ticket creation would return success if called by another client.
- “Higher or independent reviewer” is not confirmed. The backend has admin resolution, not an independent review role.
- “Clutch Zone should explain outcomes” is a policy commitment, not an existing guaranteed workflow.
- “Recordkeeping” is partly supported for tickets and tournament reports, but no retention periods or export process were found.

**Missing information**
- Public complaint form status.
- Ticket status visibility for users.
- Named grievance officer.
- Actual acknowledgement and resolution service levels.
- Whether account/payment complaints are handled from the email or only by the admin dashboard.
- Actual independent escalation route outside Instagram.

**Recommended corrections**
- State that general complaints can be sent to `supportclutchzone@gmail.com`.
- State that ticket APIs exist but no public ticket form is currently confirmed if that remains the implementation.
- State that tournament support reports and host escalation are working in-app features.
- Remove promises of an independent reviewer or acknowledgement SLA.
- Retain six-hour host-contact escalation because it is implemented.
- Leave the grievance officer details as explicit placeholders.

**Prior to publication:** High

## 9. Community Guidelines

**Implementation status:** Partially accurate

**Verified statements**
- A global match-request feature exists and is labelled Global Chat.
- A controlled match communications chat exists with user, admin and system message types.
- Tournament issue reporting and support channels exist.
- Admin bans and trust-score penalties exist.
- Match evidence and anti-cheat mechanisms exist.

**Unsupported or inaccurate statements**
- “Global match requests, Inbox communications, support interactions and tournaments” is mostly true, but Inbox is notifications and match chat, not necessarily unrestricted private messaging.
- “Private messaging features” are not confirmed. The policy currently says the rules apply if enabled, which is appropriately cautious.
- “Users may report violations with a channel and timestamp” is possible in support and tournament support, but no general report button was found for Global Chat or match chat.
- “Messaging privileges may be restricted” is not a specific implementation found; account bans exist, but feature-level restrictions are not confirmed.

**Missing information**
- Moderation scope for match chat.
- Whether match chat is stored or monitored.
- General user report endpoint for Global Chat.
- Any private direct-message system.
- Warning and restriction escalation procedure.

**Recommended corrections**
- Describe Global Chat accurately as match requests, not general group chat.
- Describe match communications accurately as controlled user/admin/system messages.
- State that no verified general private-DM or comment moderation system was identified.
- Do not claim real-time monitoring.
- Replace feature-specific restrictions with account-level enforcement until feature-level controls exist.

**Prior to publication:** Medium

## 10. Tournament Rules & Regulations

**Implementation status:** Largely accurate but incomplete

**Verified statements**
- The tournament model supports 33 configured games and formats including `single-match`, `custom`, `br-per-kill`, `br-custom`, `cs-custom` and `team-vs-team`.
- Team size is configurable from 1 to 6.
- Tournament modes include knockout and best-of-three for team tournaments.
- Tournament registration requires sufficient wallet balance and valid team/in-game details.
- Entry fees are deducted from wallet and rolled back on participant failure.
- Room credentials and schedules can be stored.
- Tournament result screenshots and disputes are implemented for team tournaments.
- Per-kill and prize-payout flows are implemented.
- Tournament support reports and six-hour escalation are implemented.

**Unsupported or inaccurate statements**
- “For Battle Royale tournaments, the recorded BR match structure applies” is partly true: separate BRMatch and tournament models exist, but rules differ.
- “A host cannot unilaterally avoid platform obligations” is a policy commitment, not a technical enforcement guarantee.
- “Tournament entry is available for active and team-vs-team status” is implementation-dependent and should not be generalized.
- “Lobby credentials must be used only for the relevant match” is a suitable rule, not an implementation guarantee.
- “Completed tournament records remain available” only for a fixed 2-day cleanup window found in the backend, not indefinitely.
- “Dispute decisions are based on reasonable evidence” is a policy commitment.

**Missing information**
- Whether every tournament format exposes the same room/lobby rules.
- Exact scoring rules for each game.
- Official per-game map, weapon and prohibited-item rules.
- Tournament late-entry and no-show deadlines.
- Tournament cancellation and rescheduling rules.
- Participant withdrawal/cancellation behavior.
- Prize distribution formula for every format.
- Dispute evidence deadline.

**Recommended corrections**
- Preserve existing game-specific rules as tournament/card-specific, not as a fixed universal rule.
- State that the card/configuration controls team size, format and schedule.
- Do not invent official publisher rules or map restrictions.
- Add the existing 24-hour global-match request TTL, 6-hour tournament escalation, and 2-day completed-tournament cleanup only if operationally relevant.
- Add a placeholder for cancellation/refund if no implementation exists.
- State that per-kill payout and tournament prize payout are format-specific.

**Prior to publication:** High

# Prioritized Issues Before Publishing

## Critical

1. **Tournament cancellation and deletion are not refund-safe.** `/tournament` deletion removes participants and result records without a documented entry refund. The policy must not promise a tournament-cancellation refund until a refund function is implemented.
2. **Do not publish a general refund promise.** Direct-match admin cancellation refunds paid users, but host/tournament cancellation and player withdrawal outcomes are not complete or consistent.
3. **Withdrawal payout status is incomplete.** Backend marks approvals and debits balance, but there is no verified external payout completion model or settlement guarantee. Remove all fixed processing promises beyond confirmed code behavior.
4. **Direct-match cancellation rules are inconsistent.** Opponent cancellation and player/creator cancellation paths do not all implement the same refund behavior. Publication requires the exact outcome for each status.
5. **No formal user age or closure enforcement.** Registration accepts no DOB/age attestation, and permanent closure is not self-service.

## High

6. **Remove unsupported email collection claims.** The current `User` model has no email field; Cashfree receives placeholder values.
7. **Correct privacy cookie and analytics claims.** Confirm or remove AdSense, localStorage, OneSignal and cross-border provider disclosures.
8. **Grievance officer details are missing.** Do not publish a name or placeholder as if appointed. The public ticket form is not currently mounted.
9. **General complaint ticket mechanism is not publicly exposed.** Publish email and tournament support as confirmed channels, not a promise of ticket acknowledgement.
10. **Responsible-gaming restriction and closure promises require qualification.** Neither temporary restriction nor permanent closure is confirmed as a user-controlled feature.
11. **Tournament rules need actual cancellation, late-entry and no-show terms.** Do not rely on generic legal language.
12. **Withdrawal UI contains an estimate.** Align policy/UI if 24–48 hours is not supported by the payout integration.

## Medium

13. Verify Instagram and Discord ownership and availability.
14. Add exact phone/OTP data handling and provider details.
15. Document what the ban, trust score and appeal process actually notify users.
16. Document the real match-chat and tournament-support moderation scope.
17. Confirm Cloudinary, OneSignal, Cashfree, AdSense and hosting data-location arrangements.
18. Add formal data-retention, breach and deletion workflows.
19. Confirm provider names and actual refund reversals before describing processing timelines.

# Final Publication Recommendation

Do not publish the current policies as operational terms until at least the Critical and High items are resolved or wording is changed to clearly identify the limitation. The implementation already provides enough verified technical facts for a draft, but several cancellation, age, closure, grievance and payout claims remain partially implemented or unsupported.
