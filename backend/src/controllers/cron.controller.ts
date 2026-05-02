import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendSubscriptionExpiringSoonEmail, sendSubscriptionExpiredEmail } from '../utils/email';
import { createNotification } from '../utils/notify';

function authorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  return provided && provided === expected;
}

export const runExpiryReminders = async (req: Request, res: Response) => {
  if (!authorized(req)) return res.status(401).json({ message: 'Unauthorized' });

  const now = new Date();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const HALF_DAY = 12 * 60 * 60 * 1000;

  // 7-day-out window: [now + 6.5d, now + 7.5d]
  const sevenLow = new Date(now.getTime() + SEVEN_DAYS - HALF_DAY);
  const sevenHigh = new Date(now.getTime() + SEVEN_DAYS + HALF_DAY);

  // Day-of window: [now - 12h, now + 12h]
  const dayOfLow = new Date(now.getTime() - HALF_DAY);
  const dayOfHigh = new Date(now.getTime() + HALF_DAY);

  let sevenSent = 0;
  let dayOfSent = 0;

  const sevenDayUsers = await prisma.user.findMany({
    where: {
      isPremium: true,
      expiryDate: { gte: sevenLow, lte: sevenHigh },
      expiryReminder7SentAt: null,
    },
  });
  for (const u of sevenDayUsers) {
    if (!u.expiryDate) continue;
    await prisma.user.update({
      where: { id: u.id },
      data: { expiryReminder7SentAt: now },
    });
    createNotification({
      userId: u.id,
      type: 'SUBSCRIPTION_REMINDER',
      message: `Your subscription expires on ${u.expiryDate.toDateString()} (in about 7 days). Renew to keep tracking.`,
    }).catch(() => {});
    sendSubscriptionExpiringSoonEmail(u.email, u.fullName, u.expiryDate).catch(() => {});
    sevenSent += 1;
  }

  const dayOfUsers = await prisma.user.findMany({
    where: {
      isPremium: true,
      expiryDate: { gte: dayOfLow, lte: dayOfHigh },
      expiryReminder0SentAt: null,
    },
  });
  for (const u of dayOfUsers) {
    if (!u.expiryDate) continue;
    await prisma.user.update({
      where: { id: u.id },
      data: { expiryReminder0SentAt: now },
    });
    createNotification({
      userId: u.id,
      type: 'SUBSCRIPTION_EXPIRED',
      message: `Your subscription has expired. Add Trip, Add Bag, and live tracking are now disabled. Resubscribe to restore access.`,
    }).catch(() => {});
    sendSubscriptionExpiredEmail(u.email, u.fullName).catch(() => {});
    dayOfSent += 1;
  }

  return res.status(200).json({
    ok: true,
    sevenDay: sevenSent,
    dayOf: dayOfSent,
    runAt: now.toISOString(),
  });
};
