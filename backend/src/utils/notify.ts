import prisma from './prisma';

type Args = {
  userId: string;
  message: string;
  type: string; // BAGGAGE_UPDATE | TRIP_UPDATE | SUBSCRIPTION_REMINDER | SUBSCRIPTION_EXPIRED
  bagId?: string | null;
};

/**
 * Creates a Notification row for the user. Email send (when applicable) is
 * handled by the caller via the email utility — this keeps the DB write
 * cheap and isolates email failures from notification creation.
 */
export async function createNotification(args: Args) {
  return prisma.notification.create({
    data: {
      userId: args.userId,
      bagId: args.bagId || null,
      message: args.message,
      type: args.type,
    },
  });
}
