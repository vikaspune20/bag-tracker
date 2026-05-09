import prisma from './prisma';

/**
 * Cascade-delete all data belonging to a user.
 * The User row itself is preserved.
 * Returns counts of deleted records.
 */
export async function purgeUserData(userId: string) {
  // Gather IDs first (needed for child deletes)
  const trips = await prisma.trip.findMany({ where: { userId }, select: { id: true } });
  const tripIds = trips.map(t => t.id);

  const bags = tripIds.length
    ? await prisma.bag.findMany({ where: { tripId: { in: tripIds } }, select: { id: true } })
    : [];
  const bagIds = bags.map(b => b.id);

  // Delete in dependency order inside a transaction
  const [logs, notifications, bagsDeleted, tripsDeleted, subs, devices, orders] =
    await prisma.$transaction([
      bagIds.length
        ? prisma.trackingLog.deleteMany({ where: { bagId: { in: bagIds } } })
        : prisma.trackingLog.deleteMany({ where: { bagId: { in: ['__none__'] } } }),

      prisma.notification.deleteMany({ where: { userId } }),

      bagIds.length
        ? prisma.bag.deleteMany({ where: { id: { in: bagIds } } })
        : prisma.bag.deleteMany({ where: { id: { in: ['__none__'] } } }),

      prisma.trip.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.trackingDevice.deleteMany({ where: { userId } }),
      prisma.deviceOrder.deleteMany({ where: { userId } }),
    ]);

  // Reset premium flags on the User row
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: false,
      planType: null,
      expiryDate: null,
      subscriptionId: null,
      cancelAtPeriodEnd: false,
    },
  });

  return {
    trackingLogs: logs.count,
    notifications: notifications.count,
    bags: bagsDeleted.count,
    trips: tripsDeleted.count,
    subscriptions: subs.count,
    devices: devices.count,
    orders: orders.count,
  };
}
