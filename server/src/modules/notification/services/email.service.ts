export class EmailService {
  async send(to: string, subject: string, body: string) {
    // Integrate with SendGrid, SES, Mailgun etc here.
    console.log(`\n[EMAIL_SERVICE] Sending Email to ${to}\nSubject: ${subject}\nBody: ${body}\n`);
    return true;
  }
}

export const emailService = new EmailService();
