import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../models/User.js';
import PaymentDeposit from '../models/PaymentDeposit.js';
import { finalizeDeposit } from './cashfreeService.js';

describe('cashfreeService finalizeDeposit idempotency tests', () => {
  let testUser;
  let testDeposit;

  before(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clutchzone_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ username: /^test_cf_user_/ });
      await PaymentDeposit.deleteMany({ orderId: /^CZ-TEST-/ });
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ username: /^test_cf_user_/ });
    await PaymentDeposit.deleteMany({ orderId: /^CZ-TEST-/ });

    testUser = await User.create({
      username: `test_cf_user_${Date.now()}`,
      password: 'password123',
      passwordSalt: 'salt123',
      wallet: { balance: 0, transactions: [] },
    });

    testDeposit = await PaymentDeposit.create({
      userId: testUser._id,
      orderId: `CZ-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: 100,
      paymentStatus: 'PENDING',
      paymentMethod: 'cashfree',
    });
  });

  it('credits wallet balance exactly once upon successful payment status', async () => {
    const result = await finalizeDeposit({
      orderId: testDeposit.orderId,
      paymentStatus: 'SUCCESS',
      cfPaymentId: 'CF123456',
      paymentMethod: 'upi',
      userId: testUser._id.toString(),
    });

    assert.equal(result.success, true);
    assert.equal(result.amount, 100);
    assert.equal(result.walletBalance, 100);

    const updatedUser = await User.findById(testUser._id);
    assert.equal(updatedUser.wallet.balance, 100);
    assert.equal(updatedUser.wallet.transactions.length, 1);
  });

  it('handles duplicate calls idempotently without double-crediting balance', async () => {
    const firstCall = await finalizeDeposit({
      orderId: testDeposit.orderId,
      paymentStatus: 'SUCCESS',
      cfPaymentId: 'CF123456',
      paymentMethod: 'upi',
      userId: testUser._id.toString(),
    });

    assert.equal(firstCall.success, true);
    assert.equal(firstCall.walletBalance, 100);

    const secondCall = await finalizeDeposit({
      orderId: testDeposit.orderId,
      paymentStatus: 'SUCCESS',
      cfPaymentId: 'CF123456',
      paymentMethod: 'upi',
      userId: testUser._id.toString(),
    });

    assert.equal(secondCall.success, true);
    assert.equal(secondCall.alreadyCredited, true);

    const updatedUser = await User.findById(testUser._id);
    assert.equal(updatedUser.wallet.balance, 100);
    assert.equal(updatedUser.wallet.transactions.length, 1);
  });

  it('rejects deposit finalization when userId mismatches order owner', async () => {
    const wrongUserId = new mongoose.Types.ObjectId().toString();

    await assert.rejects(
      async () => {
        await finalizeDeposit({
          orderId: testDeposit.orderId,
          paymentStatus: 'SUCCESS',
          cfPaymentId: 'CF123456',
          paymentMethod: 'upi',
          userId: wrongUserId,
        });
      },
      (err) => err.message.includes('ownership mismatch')
    );
  });

  it('throws error if deposit record does not exist', async () => {
    await assert.rejects(
      async () => {
        await finalizeDeposit({
          orderId: 'CZ-NONEXISTENT-ORDER',
          paymentStatus: 'SUCCESS',
          cfPaymentId: 'CF123456',
          paymentMethod: 'upi',
          userId: testUser._id.toString(),
        });
      },
      (err) => err.message.includes('No deposit record found')
    );
  });
});
