export class WhatsappService {
  async send(to: string, body: string) {
    // Integrate with Twilio WhatsApp, Meta Graph API etc here.
    console.log(`\n[WHATSAPP_SERVICE] Sending WhatsApp to ${to}\nBody: ${body}\n`);
    return true;
  }
}

export const whatsappService = new WhatsappService();
