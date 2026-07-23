export class PushService {
  async send(toToken: string, title: string, body: string) {
    // Integrate with Firebase Cloud Messaging (FCM), APNs etc here.
    console.log(`\n[PUSH_SERVICE] Sending Push Notification to ${toToken}\nTitle: ${title}\nBody: ${body}\n`);
    return true;
  }
}

export const pushService = new PushService();
