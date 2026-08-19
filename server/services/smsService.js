const SMS_PROVIDER = process.env.SMS_PROVIDER || 'test';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || '';

export async function sendOtp(phone, otp) {
  // Do not log OTP in production
  if (SMS_PROVIDER === 'test') {
    console.log(`[SMS TEST] sendOtp to ${phone}: <OTP hidden in logs>`);
    return { success: true, provider: 'test' };
  }

  // Example for a generic provider - users should adapt to their provider
  if (SMS_PROVIDER === 'generic') {
    const url = process.env.SMS_API_URL;
    if (!url) throw new Error('SMS_API_URL not configured');
    const body = {
      to: phone,
      from: SMS_SENDER_ID,
      message: `Your verification code is ${otp}`
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMS_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SMS provider error: ${res.status} ${text}`);
    }
    return { success: true, provider: 'generic' };
  }

  throw new Error('Unsupported SMS_PROVIDER: ' + SMS_PROVIDER);
}
