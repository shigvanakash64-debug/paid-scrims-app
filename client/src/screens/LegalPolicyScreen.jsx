const EFFECTIVE_DATE = '21 November 2026';
const UPDATED_DATE = '21 November 2026';

const documents = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how Clutch Zone collects, uses, stores and handles personal information in connection with the platform.',
    sections: [
      ['1. Scope and operator', 'This Policy applies to users of clutchzone.in and the Clutch Zone application. Clutch Zone is operated by Akash Dinesh Shigvan. GSTIN: 27SQJPS2378E1Z0.'],
      ['2. Information collected', 'Depending on the service used, Clutch Zone may collect account details such as username, email address and phone number; profile information; match, tournament and result records; wallet, payment and withdrawal records; and technical information such as device, browser, IP address and security logs.'],
      ['3. Account and gameplay information', 'Account records may include registration details, verification status and profile information. Gameplay records may include selected games and formats, entries, opponents, room details, submitted evidence, scores or outcomes, disputes and communications needed to operate a match.'],
      ['4. Payment information', 'Payment references, transaction status, gateway reference IDs, deposit and withdrawal records, and wallet activity may be collected to process and review transactions. Full card or bank credential data is not expected to be stored by Clutch Zone when a third-party payment gateway processes the transaction.'],
      ['5. Use of information', 'Information is used to create and secure accounts, verify identity or phone details where enabled, register users for matches or tournaments, process wallet actions and withdrawals, administer results and disputes, prevent fraud or cheating, provide notifications, maintain records, respond to support requests and comply with applicable law.'],
      ['6. Processing, storage and security', 'Information is processed and retained on systems and service infrastructure used by Clutch Zone and its service providers. Reasonable organisational and technical safeguards are used, but no method of storage or internet transmission can be guaranteed absolutely secure.'],
      ['7. Third-party providers', 'Clutch Zone may use payment, communications, hosting, analytics, push notification and cloud-storage providers. Those providers process information under their own terms and security controls. Payment gateway approval does not itself determine that every tournament or activity is legally permitted.'],
      ['8. Sharing and disclosure', 'Personal information is not sold. It may be shared with users involved in a match or tournament only when relevant, with providers supporting the platform, for reasonable investigation of disputes or misuse, or where disclosure is required by law or a valid legal request.'],
      ['9. Cookies and analytics', 'Where enabled, Clutch Zone may use cookies or similar technologies for authentication, preferences, performance, analytics and security. Browser controls may allow users to restrict cookies, but some features may not operate correctly if essential cookies are disabled.'],
      ['10. Retention and deletion', 'Records are retained only for as long as reasonably needed for platform operation, dispute resolution, fraud prevention, accounting, tax, security or legal obligations. A deletion request may be limited by records Clutch Zone is required or entitled to retain.'],
      ['11. Access, correction and erasure', 'Subject to applicable law and verification requirements, users may request access to or correction of inaccurate personal information and may request deletion of information no longer needed. Certain records may be retained for a legally permitted purpose.'],
      ['12. Consent and withdrawal', 'Use of optional features may require consent to notifications or another collection purpose. A user may withdraw consent prospectively where the feature is optional, subject to any minimum retention or operational requirements. Withdrawal may limit or prevent continued use of a feature.'],
      ['13. Children and underage users', 'Clutch Zone requires users to meet the applicable minimum age. Underage users must not create accounts or make paid entries. If we become aware that information from an underage user was provided without valid authority, we may restrict the account and review or delete the information as appropriate.'],
      ['14. Security incidents', 'Clutch Zone may investigate suspected personal data breaches, take measures to contain harm, preserve evidence and notify affected users or authorities when applicable law requires or reasonably supports notification.'],
      ['15. Cross-border processing', 'Some providers may process information outside India. Where applicable, Clutch Zone and the provider should apply legally appropriate safeguards and data-transfer controls.'],
      ['16. Indian data protection framework', 'Applicable obligations under the Digital Personal Data Protection Act, 2023 and its implementing Rules may apply in stages. This Policy does not represent that every provision has commenced or that a final regulatory determination has been made.'],
      ['17. Complaints and grievances', 'Privacy complaints may be sent to supportclutchzone@gmail.com with the account identifier and relevant details. The Grievance Redressal Policy explains the complaint process.'],
      ['18. Updates', 'This Policy may be updated for operational, legal or security reasons. Material changes should be identified through an updated “Updated” date or a reasonable notice. Continued use after a change is subject to the then-current terms and applicable law.'],
      ['19. Contact', 'Clutch Zone; operated by Akash Dinesh Shigvan; GSTIN 27SQJPS2378E1Z0; supportclutchzone@gmail.com; https://www.clutchzone.in.'],
    ],
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    intro: 'These Terms govern access to and use of Clutch Zone. By creating an account or using the platform, you accept these Terms subject to applicable law.',
    sections: [
      ['1. Operator and platform', 'Clutch Zone is operated by Akash Dinesh Shigvan. GSTIN: 27SQJPS2378E1Z0. The platform provides accounts, tournament and match participation, hosting tools, result handling, leaderboards, internal CZ wallet records and payment integration.'],
      ['2. Acceptance', 'You may use Clutch Zone only if you can enter a binding agreement and meet the eligibility requirements below. Additional rules may apply to a particular tournament, game or host.'],
      ['3. Eligibility', 'You must be at least 18 years old or such higher minimum age required in your jurisdiction, and eligible under applicable law to participate. Availability of a game or paid tournament may vary for legal or operational reasons.'],
      ['4. Registration', 'Provide accurate registration and verification information, maintain only your own account and promptly update materially incorrect profile details. Clutch Zone may verify accounts and records where reasonably necessary.'],
      ['5. Account security', 'Keep passwords and one-time codes confidential and notify support promptly of suspected unauthorised access. Clutch Zone will not ask you to disclose your password through support.'],
      ['6. User responsibilities', 'Users must comply with platform rules, applicable law, game-publisher rules and reasonable requests for evidence or identity verification. No user may access the service to deceive, interfere with, reverse engineer or exploit it.'],
      ['7. Player responsibilities', 'Players must join only matches they can participate in, use accurate in-game details, maintain a stable connection, follow lobby instructions and submit truthful result evidence within the configured time.'],
      ['8. Host and organiser responsibilities', 'Hosts must provide accurate tournament details, honour published rules and schedules, manage rooms lawfully, protect participant information and cooperate with review of complaints or evidence.'],
      ['9. Registration and entry', 'Registration is effective only when the platform has recorded the entry according to its status rules and any required payment or wallet deduction is successful. A tournament may reject, waitlist or cancel a registration for operational or eligibility reasons.'],
      ['10. Match participation', 'A match is governed by the game, format, team size, mode and rules selected for that tournament or direct match. Lobby credentials are to be used only for the relevant match.'],
      ['11. Entry charges and prizes', 'Paid entry charges and prizes are subject to the tournament’s published terms and applicable Indian law, including the relevant regulatory classification. Clutch Zone does not represent that every tournament is a legally recognised esports competition or that paid participation is approved or exempt.'],
      ['12. Wallet', 'CZ wallet balance records are internal platform credits, not a bank deposit or bank account. Wallet availability, pending withdrawals, bonuses, referral earnings and prize credits may have different rules. No provision should be read as preventing lawful withdrawal of an actually payable balance.'],
      ['13. Payments', 'Payments are processed through third-party providers where applicable. Clutch Zone does not control provider uptime or a provider’s payment-rail decisions. Gateway approval is not a representation of gaming-law compliance.'],
      ['14. Cancellations and refunds', 'Cancellation and refund outcomes depend on tournament status, the reason for failure or cancellation, evidence and the Refund & Cancellation Policy. A payment refund and a wallet balance correction are distinct.'],
      ['15. Disputes and evidence', 'Users should submit relevant screenshots, recordings or transaction references promptly and accurately. Clutch Zone may investigate, request additional evidence, place funds on hold pending review, and take proportionate action based on reasonable evidence. An initial decision may be appealed under the grievance process.'],
      ['16. Prohibited conduct', 'Prohibited conduct includes cheating, modified clients, bots, scripts, exploits, multiple-account abuse, impersonation, match fixing, collusion, fabricated evidence, harassment, fraud and attempts to bypass restrictions or security controls.'],
      ['17. Suspension and termination', 'Clutch Zone may take urgent temporary action to protect users or tournament integrity and may suspend or terminate an account after appropriate review for a policy breach or legal necessity. Decisions must be proportionate and are subject to appeal and applicable consumer and data rights.'],
      ['18. Intellectual property', 'Clutch Zone branding and platform content remain the property of their respective owners. Game names and third-party marks are used for identification and remain owned by their publishers. No licence is granted except as needed to use the platform.'],
      ['19. Third-party publishers', 'Clutch Zone is not affiliated with game publishers unless expressly stated. Users are responsible for valid game accounts and compliance with publisher terms. Publisher outages or account restrictions may affect matches.'],
      ['20. Availability', 'The platform may be unavailable during maintenance, outages or circumstances outside reasonable control. Clutch Zone will take reasonable steps to communicate material interruptions, but does not guarantee uninterrupted service.'],
      ['21. Liability', 'To the fullest extent permitted by law, Clutch Zone is not liable for indirect, incidental or consequential loss, unauthorised third-party conduct, network or device failures, or publisher outages. Nothing excludes liability or statutory rights that cannot lawfully be excluded.'],
      ['22. Indemnity', 'Where permitted by applicable law, a user may be responsible for loss caused by intentional misuse or breach of these Terms. Any indemnity is limited to the extent legally enforceable and does not waive statutory consumer rights.'],
      ['23. Grievance mechanism', 'Submit complaints through supportclutchzone@gmail.com or the Grievance Redressal page. Include account details, the event or transaction reference and evidence. Do not include passwords or payment secrets.'],
      ['24. Governing law and jurisdiction', 'Indian law applies subject to mandatory law and jurisdiction rules. The competent courts in India shall have jurisdiction, subject to applicable statutory forums and consumer-protection procedures.'],
      ['25. Changes', 'Clutch Zone may update these Terms with reasonable notice for material changes. Current terms are effective as shown below, subject to applicable law.'],
      ['26. Contact', 'Clutch Zone; operated by Akash Dinesh Shigvan; GSTIN 27SQJPS2378E1Z0; supportclutchzone@gmail.com; https://www.clutchzone.in.'],
    ],
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    intro: 'This policy explains payment refunds, wallet corrections, prize credits and withdrawals separately. Outcomes depend on the recorded transaction and tournament status.',
    sections: [
      ['1. Tournament entry payments', 'An entry is payable only under the then-current tournament terms and applicable law. A successful entry, failed registration, cancellation or dispute may have a different outcome.'],
      ['2. Successful payment but failed registration', 'A verified payment with no completed registration should be investigated. If the platform confirms an error, the amount may be returned or corrected after review, subject to provider timelines and transaction verification.'],
      ['3. Duplicate payments', 'Duplicate or extra payments should be reported promptly with gateway order and transaction references. The platform may verify and correct the transaction or refund the duplicate amount where eligible.'],
      ['4. Failed deposits', 'A failed or pending payment may not be credited to the wallet. No duplicate payment should be made while a transaction is pending. Provider status and deposit records determine the outcome.'],
      ['5. Tournament cancellation by Clutch Zone', 'If Clutch Zone cancels a tournament, confirmed entry amounts should be handled transparently through wallet correction or a payment refund where eligible. Specific treatment is determined by the transaction and applicable law.'],
      ['6. Host cancellation', 'A host cannot unilaterally avoid platform or statutory obligations. Reported host cancellations will be reviewed. Any entry correction or prize treatment will follow the tournament record and this policy.'],
      ['7. Technical failure', 'Network, device or game-publisher failures do not automatically create entitlement to a refund. However, a verified platform-side technical failure may lead to entry reversal or a wallet correction after evidence review.'],
      ['8. Opponent non-participation', 'Entitlement depends on the tournament’s rules and evidence that a participant failed to join or caused an operational breach. The platform may award, reverse or refund the match according to the configured rules and applicable terms.'],
      ['9. Disqualification', 'Voluntary disqualification, cheating or other rule breaches may affect entry amounts or prizes. Penalties must be evidence-based and proportionate; users may use the appeal process.'],
      ['10. Voluntary withdrawal', 'Where a tournament permits withdrawal before the deadline, the published cancellation rule applies. Once an entry closes or a match starts, withdrawal is not automatically refundable.'],
      ['11. Match disputes', 'A disputed match may be held from prize payment while reviewed. Records may be reversed if the dispute establishes an incorrect outcome. Decisions are appealable and must not be arbitrary.'],
      ['12. Refund eligibility', 'Refund eligibility is assessed for the specific payment, tournament status and evidence, not as a blanket promise or blanket exclusion. Mandatory consumer rights remain unaffected.'],
      ['13. Refund processing', 'No fixed refund timeline is guaranteed here. Actual processing depends on the payment provider, bank or UPI rail, verification and applicable requirements. Status is communicated by support or the transaction history where available.'],
      ['14. Refund status tracking', 'Track deposits and wallet transactions within the app. For a refund under review, retain the order ID or transaction reference and contact support.'],
      ['15. Withdrawals', 'Withdrawals request a payout of an eligible wallet balance to a verified UPI ID. The system currently records a minimum request of ₹100 and may require a ₹20 deposit plus a CZ ₹20 or more paid match for eligibility. Final approval, status and provider processing are recorded separately.'],
      ['16. Failed withdrawals', 'If verification fails or an approved payout cannot be completed, the platform should update the withdrawal status and wallet record according to the verified transaction. Contact support with the withdrawal reference.'],
      ['17. Configuration placeholder', 'Any stricter or additional withdrawal limits, fees or timelines must be published in configuration or a revised policy; they must not be invented in this document.'],
      ['18. Support', 'Email supportclutchzone@gmail.com with the transaction or withdrawal reference, amount, date and screenshots. Do not send passwords or sensitive payment credentials.'],
    ],
  },
  'fair-play': {
    title: 'Fair Play & Anti-Cheat Policy',
    intro: 'Clutch Zone requires fair participation, honest evidence and respect for tournament integrity.',
    sections: [
      ['1. Zero tolerance', 'Cheating or deliberate manipulation may result in urgent temporary restriction, disqualification, result reversal or suspension after evidence-based review.'],
      ['2. Hacks and scripts', 'Game cheats, automation, scripts and macros that provide an unfair advantage are prohibited.'],
      ['3. Modified clients and exploits', 'Modified game clients, unauthorized add-ons, known exploits and bypasses are prohibited.'],
      ['4. Bots and automation', 'Bots or tools that play, register, communicate or submit results without genuine human participation are prohibited.'],
      ['5. Multiple accounts', 'Creating or using multiple accounts to evade limits, obtain bonuses, manipulate matchmaking or avoid enforcement is prohibited.'],
      ['6. Match fixing and collusion', 'Players may not agree to predetermine outcomes, trade wins, split prizes or influence results other than through normal play.'],
      ['7. Teaming', 'Teaming or coordinated play in a solo match, or otherwise defeating the configured team rules, is prohibited.'],
      ['8. Impersonation', 'No person may access another person’s account or falsely represent a player, host or platform representative.'],
      ['9. Fake evidence', 'Screenshots or recordings must be genuine and attributable. Fabricated, edited or misrepresented evidence may lead to disqualification.'],
      ['10. Result manipulation', 'Do not alter room details, misreport scores, submit false claims or interfere with an opponent’s legitimate result.'],
      ['11. Conduct', 'Threats, harassment, hate speech and abusive conduct may be enforced separately under Community Guidelines.'],
      ['12. Evidence', 'Relevant screenshots, recordings, match IDs, in-game names and timestamps should be submitted accurately. Sensitive information should be shared only through the support process.'],
      ['13. Investigation', 'Clutch Zone may review platform logs, payment activity, account connections, submitted evidence and relevant witness accounts. Investigations should be timely and reasonable.'],
      ['14. Proportionate penalties', 'Action should be proportionate to the evidence and severity. Where facts are uncertain, the platform may use a temporary hold or restriction rather than a final penalty.'],
      ['15. Urgent temporary action', 'Clutch Zone may immediately restrict or hold an account or prize where necessary to prevent ongoing fraud, cheating or safety harm, with review and notice where practicable.'],
      ['16. Disqualification and reversal', 'An affected match may be disqualified or reversed and any prize or entry record corrected based on verified findings and applicable rules.'],
      ['17. Suspension', 'Temporary suspension may allow account or evidence review. Permanent suspension is reserved for serious, repeated or unresolved violations.'],
      ['18. Appeals', 'Users may appeal a restriction or enforcement decision through support or the Grievance Redressal page, providing the account ID, incident details and additional evidence.'],
      ['19. Enforcement', 'No administrator has unlimited arbitrary authority. Decisions must have a stated basis in this policy and the tournament terms, with a fair opportunity to respond where appropriate.'],
    ],
  },
  'responsible-gaming': {
    title: 'Responsible Gaming Policy',
    intro: 'Clutch Zone promotes informed, measured and legal participation. Gaming should remain optional entertainment, not a financial obligation or guaranteed income.',
    sections: [
      ['1. Responsible participation', 'Set a spending and time limit you can afford, pause when uncomfortable and do not use funds needed for essential expenses.'],
      ['2. Minimum age', 'Users must meet the minimum age required by applicable law, and underage participation is prohibited.'],
      ['3. Age checks', 'Clutch Zone may use account, phone or other proportionate verification processes where required or reasonably necessary.'],
      ['4. Underage accounts', 'A user must not lend an account or payment method to an underage person. Suspected underage use may lead to restriction and review.'],
      ['5. Spending transparency', 'The wallet and transaction history should be used to review deposits, entry deductions, prize credits and withdrawals. Investigate unfamiliar transactions promptly.'],
      ['6. Financial pressure', 'Do not participate to recover losses or while under financial or emotional pressure. Stop and seek independent support if spending no longer feels controlled.'],
      ['7. Healthy habits', 'Take breaks, maintain sleep and time away from screens, and balance gaming with work, study and relationships.'],
      ['8. Temporary self-restriction', 'A user may request temporary account restriction by emailing supportclutchzone@gmail.com. The request should state the preferred restriction period and account identifier.'],
      ['9. Permanent closure', 'Users may request permanent closure, subject to lawful retention, pending transaction and dispute requirements. Support will explain the applicable account and wallet status.'],
      ['10. Withdrawals and balances', 'Do not assume a platform credit is immediately redeemable. Withdrawal eligibility, pending status and verification are governed by the wallet policy and account records.'],
      ['11. Support', 'Clutch Zone support can explain account controls and transaction records. It does not provide medical or psychological treatment.'],
      ['12. Promotions', 'Promotions must be clear, accurate and proportionate. Terms should not imply guaranteed winnings or encourage users to spend more to recover losses.'],
      ['13. Reporting concerns', 'Report suspected underage use, excessive pressure, self-harm concerns or suspicious account activity to support. Where there is immediate danger, contact appropriate local emergency services.'],
    ],
  },
  'paymentwalletpolicy': {
    title: 'Payment & Wallet Policy',
    intro: 'This policy describes Clutch Zone wallet balances, deposits, entry deductions, prize credits and withdrawal requests. It does not turn platform credits into bank deposits or provide a regulatory guarantee.',
    sections: [
      ['1. CZ wallet overview', 'The CZ wallet is an internal platform balance recorded against a Clutch Zone account. It is used to record deposits, wallet adjustments, entry deductions, prizes and withdrawal requests.'],
      ['2. Balance types', 'The platform may distinguish main balance, pending withdrawals, bonus balance and referral earnings. Referral earnings are not currently withdrawable. Bonus or other restricted credits may have account-specific conditions.'],
      ['3. Deposits', 'A user may initiate a Cashfree deposit order only through enabled account features. The deposit amount is validated and a provider payment session is created.'],
      ['4. Payment gateway', 'Cashfree or another configured provider may process UPI and available payment methods. The provider’s status and transaction reference determine whether a deposit is successful. Clutch Zone does not control a third-party payment rail.'],
      ['5. UPI process', 'The user follows the in-app or provider payment flow, completes the payment in the provider environment and returns for verification. UPI credentials and payment secrets must not be shared with support.'],
      ['6. Successful and failed transactions', 'A successful, verified deposit may be credited to the wallet once and a transaction record may be added. Failed or incomplete payments should not be credited. Pending status should be checked before retrying.'],
      ['7. Duplicate transactions', 'Duplicate deposits should be reported with the order and gateway references. Clutch Zone may verify, reconcile or correct the wallet and may seek provider reversal or refund where eligible.'],
      ['8. Entry deductions', 'Entry fees are deducted according to the tournament or direct-match implementation and status. A failed registration or eligible cancellation may lead to a wallet correction or payment refund under the separate refund policy.'],
      ['9. Prize credits', 'A prize may be credited only after the match or tournament is verified and its status is completed. Disputed results may remain on hold pending evidence review.'],
      ['10. Withdrawal eligibility', 'Withdrawal requests require account authentication and verified phone. The wallet system records a minimum request of ₹100. It may require a ₹20 deposit and a CZ 200 or higher (₹20+) entry paid match before redemption eligibility is met.'],
      ['11. Verification', 'The user must provide a UPI ID and sufficient account details. Clutch Zone may verify account, transaction, match and identity records before approval.'],
      ['12. Withdrawal status', 'A withdrawal is initially pending for admin review, then may be approved or rejected. Approval should not be inferred until the transaction status is recorded as approved.'],
      ['13. Transaction history', 'Users can view recorded wallet transactions and pending withdrawals where available in the app. The history is an operational record and should be checked against provider or bank references.'],
      ['14. Corrections', 'Clutch Zone may make wallet corrections for verified deposits, refunds, prizes, cancelled entries or administrative adjustments. Corrections should include a transaction description and are subject to review.'],
      ['15. Suspicious transactions', 'Clutch Zone may hold or investigate suspicious payments, duplicate retries, abusive deposits, rule evasion or evidence manipulation. Restrictions must be connected to reasonable security or compliance concerns.'],
      ['16. Account restrictions', 'A wallet or account restriction may be imposed proportionately while a payment, fraud or KYC concern is investigated. Affected users may request review through grievance channels.'],
      ['17. Complaints', 'Send the order ID, transaction ID, amount, date and payment screenshot to supportclutchzone@gmail.com. Do not send UPI PINs, passwords or OTP codes.'],
      ['18. Refund relationship', 'A payment refund returns a payment through the provider where eligible. A wallet correction changes platform records. Prize payment and withdrawal are separate processes.'],
      ['19. Third-party involvement', 'A payment provider acts under its own terms and processes. Gateway merchant approval does not establish that every tournament is legally recognised or exempt from restrictions.'],
      ['20. Legal restrictions', 'Wallet and paid participation features must operate subject to applicable Indian law and the specific regulatory classification of the tournament or match. No promise of legality or exemption is made by this page.'],
      ['21. Configuration', 'Deposit limits, withdrawal limits, fees and fixed processing guarantees must be taken only from current published configuration, not assumed from this policy.'],
    ],
  },
  'grievanceredressal': {
    title: 'Grievance Redressal Policy',
    intro: 'This policy describes how users may submit, track and escalate complaints concerning Clutch Zone.',
    sections: [
      ['1. Purpose', 'Clutch Zone provides a documented channel for account, tournament, payment, refund, conduct, privacy and host complaints.'],
      ['2. Complaints accepted', 'You may submit complaints about account access or safety, match registration or cancellation, game conduct, result and prize disputes, wallet transactions, refunds, cheating, privacy or host practices.'],
      ['3. Account complaints', 'Include the username, relevant date and the account action in dispute. Do not include passwords or OTPs.'],
      ['4. Tournament complaints', 'Include tournament or match ID, game, format, opponent or host name, event time and result evidence.'],
      ['5. Payment complaints', 'Include order ID, gateway transaction ID, amount and date. For withdrawals, include the withdrawal reference.'],
      ['6. Refund complaints', 'Identify whether you seek a payment refund, wallet correction or prize status review and explain the relevant cancellation or technical failure.'],
      ['7. Cheating complaints', 'Provide in-game names, match ID, timestamps and relevant screenshots or recordings. Do not publicly distribute private information.'],
      ['8. Privacy complaints', 'Describe the personal information concern, desired correction or erasure and verification details. The operator will review applicable law and retention duties.'],
      ['9. Host complaints', 'Include host name, tournament ID, scheduled time and the relevant host conduct or published rule.'],
      ['10. Submission', 'Email supportclutchzone@gmail.com or use an existing working ticket mechanism. State the category and provide accurate, relevant records.'],
      ['11. Required information', 'Provide account username or ID, complaint category, date, transaction or match reference, concise description, requested resolution and supporting evidence.'],
      ['12. Acknowledgement', 'The support team should acknowledge a complete complaint and assign it for review where practicable. No specific response or resolution period is guaranteed unless it is published in current operational information or required by law.'],
      ['13. Investigation', 'The reviewer may examine account, wallet, match, evidence and service logs; request a proportionate response from another party; or place funds or accounts on temporary hold for integrity or safety reasons.'],
      ['14. Resolution', 'The team should explain the outcome and available corrective action. Where a complaint is partly valid, the platform may issue a wallet correction, refund, account restoration or conduct warning as appropriate.'],
      ['15. Appeal and escalation', 'If an outcome is not satisfactory, reply with the original reference and new evidence. A higher or independent reviewer may recheck the decision where available. Mandatory statutory escalation remains available.'],
      ['16. Grievance officer placeholder', 'A named grievance officer, designation and direct contact details must be supplied by Clutch Zone before public appointment. No officer should be represented as appointed until a valid operational appointment exists. Contact for this draft: supportclutchzone@gmail.com.'],
      ['17. Records', 'Clutch Zone may retain complaint records and evidence for as long as reasonably needed for resolution, accountability, fraud prevention, legal or accounting obligations and record retention rules.'],
      ['18. Applicable rules', 'The process is intended to account for the Information Technology Act, 2000, applicable intermediary rules, the Consumer Protection Act, 2019 and other relevant Indian requirements. Statutory obligations take precedence where they apply.'],
    ],
  },
  'communityguidelines': {
    title: 'Community Guidelines',
    intro: 'These guidelines apply to Clutch Zone global match requests, Inbox communications, support interactions, tournaments and any comments or private messaging features that may be enabled.',
    sections: [
      ['1. Respect', 'Communicate respectfully and assume good faith. Disagree with conduct or decisions without humiliating or threatening another person.'],
      ['2. Harassment', 'Repeated unwanted contact, targeted humiliation, doxxing or deliberate intimidation is prohibited.'],
      ['3. Abusive language', 'Insults, sexual harassment, slurs and degrading language are prohibited, especially when directed at a person or protected group.'],
      ['4. Hate speech', 'Content promoting hatred or discrimination based on protected characteristics is prohibited.'],
      ['5. Threats', 'Violence, self-harm threats, credible intimidation and stalking are prohibited. Report immediate danger to appropriate authorities.'],
      ['6. Spam', 'Repeated irrelevant requests, flood messages, referral chains and unsolicited advertising are prohibited.'],
      ['7. Fraud and impersonation', 'Do not impersonate staff, hosts or users or attempt to obtain accounts, wallet details or payment secrets.'],
      ['8. Promotions', 'Unwanted commercial promotion or misleading offers are prohibited in community channels. Hosts must use the official tournament mechanism.'],
      ['9. Scams', 'Never request OTPs, passwords, UPI PINs or off-platform payment to a personal account for a Clutch Zone transaction.'],
      ['10. Match manipulation', 'Cheating, match fixing, fabricated proof and collusion violate both these guidelines and the Fair Play Policy.'],
      ['11. Private information', 'Do not publish phone numbers, addresses, identity documents, payment details or another person’s private records without valid authority.'],
      ['12. Reporting', 'Report a violation with the username, channel, timestamp and relevant evidence through support or the relevant in-app report mechanism where available.'],
      ['13. Warning system', 'Depending on severity and history, enforcement may begin with a warning or restriction. Repeated or serious conduct may result in stronger action.'],
      ['14. Temporary restrictions', 'Messaging, hosting or match privileges may be temporarily restricted during review, account security work or an integrity concern.'],
      ['15. Permanent bans', 'Serious or repeated fraud, threats, cheating or abuse may lead to permanent account restriction after a proportionate review.'],
      ['16. Appeals', 'Users may appeal a restriction by contacting support with the account ID and relevant evidence. Temporary safety action may remain in place during urgent review.'],
      ['17. Monitoring scope', 'Clutch Zone may monitor or preserve reports and platform records where needed to operate and enforce rules. The presence of a feature does not imply every message is actively moderated in real time.'],
    ],
  },
  'tournamentrules': {
    title: 'Tournament Rules & Regulations',
    intro: 'These rules preserve the existing instructions while explaining that tournament rules are determined by the configured game, match type, team size and tournament structure.',
    sections: [
      ['1. General participation', 'Read the specific tournament or match card before registering. The displayed entry, schedule, format, team size, lobby and prize information form part of the particular competition.'],
      ['2. Eligibility', 'Only eligible accounts may register. Users must meet age, jurisdiction, account, identity or game-account requirements. A host or Clutch Zone may verify records reasonably.'],
      ['3. Registration', 'Create or join the competition through the official flow and complete any required wallet or payment step. Registration may remain pending until the platform confirms status and entry.'],
      ['4. Team formation', 'Team mode and size vary. The format card determines whether the event is 1v1, 2v2, 3v3, 4v4 or a larger tournament structure. Teammates must use accurate in-game names and obey mode eligibility.'],
      ['5. Joining', 'Use your own in-game account and enter only the assigned lobby or room. Follow the opponent or host instructions and do not share credentials outside approved participants.'],
      ['6. Schedules', 'Match and tournament times are based on the recorded schedule. Players must check lobby and result notifications. Technical or publisher delays do not automatically alter the published rule.'],
      ['7. Room details', 'A room ID and password may be created by the match creator or host and shared through the platform. Credentials must be used only for the relevant match and may be rotated or withheld for security.'],
      ['8. Match conduct', 'Follow the selected mode, weapon or kill restriction, skill setting, map or game-specific rule, and the actual format on the card. Cross-format assumptions are not valid.'],
      ['9. Lobby entry', 'Join on time with the correct account. Late or failed entry may be handled according to the tournament rules and evidence. Opponent non-participation must be reported through the platform.'],
      ['10. Result submission', 'After the match, submit the configured result or screenshot through the Result page or tournament result flow. Submission should identify the correct match and be made within the configured period.'],
      ['11. Evidence', 'Screenshots or recordings should be readable, attributable and unedited. Relevant evidence may include the scoreboard, match ID, in-game name, timestamp and room details.'],
      ['12. Disputes', 'Submit a dispute promptly with evidence. Clutch Zone or the tournament reviewer may hold prizes pending review and may request additional information. Decisions should be based on reasonable evidence and published rules.'],
      ['13. Disqualification', 'A player or team may be disqualified for cheating, late or invalid entry, impersonation, collusion, fabricated evidence or a material rule breach. Disqualification should be recorded with a stated basis.'],
      ['14. Cancellation', 'Clutch Zone or an authorised host may cancel or postpone an event for integrity, safety, schedule or technical reasons. Entry and prize treatment follows the Refund & Cancellation Policy and the tournament record.'],
      ['15. Prize eligibility', 'Prize or per-kill treatment depends on the prize pool, rules and verification of the actual result. Prize eligibility is subject to applicable law and account compliance.'],
      ['16. Host duties', 'Hosts must publish accurate rules, maintain fair matchmaking, share credentials appropriately, preserve evidence and escalate rule or safety concerns.'],
      ['17. Supported formats', 'Clutch Zone supports 33 configured games and may offer formats such as Free Fire Battle Royale, Free Fire Clash Squad, BGMI squad, Mobile Legends 5v5, direct 1v1 matches and other publisher-specific modes.'],
      ['18. No one-size-fits-all rules', 'Free Fire or BGMI Battle Royale, Clash Squad, direct duels and team-based games do not use identical scoring or team rules. The exact competitive format is determined only by the selected tournament or match configuration.'],
      ['19. Game-specific rules', 'Publisher-specific maps, characters, items, team composition or restrictions must follow the displayed competition configuration. This page does not replace official game rules or invent publisher requirements.'],
      ['20. Match-specific rules', 'For a direct match, the configured 1v1, 2v2, 3v3 or 4v4 mode and restriction type applies. For a BR tournament, the displayed match name, entry fee, scrim type, per-kill reward and player limit apply.'],
      ['21. Existing instructions', 'Create or join using the pairing flow, complete the lobby payment step and provide proof, receive room credentials after verification, submit result proof after the match and add the correct in-game profile information.'],
    ],
  },
};

export const LegalPolicyScreen = ({ page, onNavigate }) => {
  const document = documents[page] || documents['privacy-policy'];
  return (
    <div id={`screen-${page}`} className="screen-home info-page legal-page">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="game-pill"><div className="game-dot"></div><span>Legal & Compliance</span></div>
            <div className="screen-title">{document.title}</div>
          </div>
        </div>
      </div>
      <div className="section">
        <p className="legal-intro">{document.intro}</p>
        <div className="legal-dates">
          <span><strong>Effective:</strong> {EFFECTIVE_DATE}</span>
          <span><strong>Updated:</strong> {UPDATED_DATE}</span>
        </div>
        {document.sections.map(([heading, body]) => (
          <div className="info-section legal-section" key={heading}>
            <h2 className="info-heading">{heading}</h2>
            <p className="info-text">{body}</p>
          </div>
        ))}
        <div className="legal-policy-nav" aria-label="Policy navigation">
          {[
            ['privacy-policy', 'Privacy'],
            ['terms-conditions', 'Terms'],
            ['refund-policy', 'Refunds'],
            ['fair-play', 'Fair Play'],
            ['responsible-gaming', 'Responsible Gaming'],
            ['paymentwalletpolicy', 'Payment & Wallet'],
            ['tournamentrules', 'Tournament Rules'],
            ['communityguidelines', 'Community'],
            ['grievanceredressal', 'Grievance'],
            ['contacts', 'Contact'],
          ].map(([key, label]) => (
            <button type="button" key={key} onClick={() => onNavigate?.(key)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
