export class SmsService {
  async send(to: string, body: string) {
    // Integrate with Twilio, AWS SNS etc here.
    console.log(`\n[SMS_SERVICE] Sending SMS to ${to}\nBody: ${body}\n`);
    return true;
  }
}

export const smsService = new SmsService();
