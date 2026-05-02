/**
 * Shared utility: recompute User.isPremium / expiryDate from device subscriptions.
 * Kept in a separate file to avoid circular imports between device.controller
 * and subscription.controller.
 */
import prisma from './prisma';

export async function syncUserPremiumFromDevices(userId: string): Promise<void> {
  const now = new Date();
  const activeDevices = await prisma.trackingDevice.findMany({
    where: { userId, subStatus: 'ACTIVE', subExpiry: { gt: now } },
    select: { subExpiry: true },
  });

  if (activeDevices.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: false, expiryDate: null, planType: null, subscriptionId: null },
    });
    return;
  }

  const maxExpiry = activeDevices.reduce(
    (acc, d) => (d.subExpiry! > acc ? d.subExpiry! : acc),
    activeDevices[0].subExpiry!
  );

  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true, expiryDate: maxExpiry },
  });
}
