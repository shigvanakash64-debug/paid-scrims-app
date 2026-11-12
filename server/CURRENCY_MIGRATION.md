# CZ currency migration

CZ now converts at **10 CZ = ₹1**. The migration multiplies existing CZ wallet
balances and transaction amounts, CZ-priced standard matches/challenges, and
CZ-denominated reward settings by 10. Tournament and BR host prices, payment
deposit records, first-deposit values, and pending/processed withdrawal request
amounts remain in rupees.

Before deploying the new application version:

1. Put the application into maintenance mode so wallet and match writes stop.
2. Take and verify a restorable MongoDB backup.
3. From the `server` directory, run `npm run migrate:cz-v1` against the intended
   database. `MONGO_URI` must point to it; this migration requires a MongoDB
   replica set because it runs in a transaction.
4. Confirm the command reports completion, then deploy the new application
   version and re-enable writes.

The migration records `cz-wallet-ratio-10-v1` in `schema_migrations` and will
not apply the conversion again if that marker exists. It is intentionally not
run automatically during server startup or deployment.
