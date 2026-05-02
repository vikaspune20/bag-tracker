import prisma from './prisma';

export type DeviceSummary = {
  deviceId: string;
  status: string;
  expiresAt: Date;
};

/**
 * Validates that a tagNumber, if it matches a TrackingDevice, may be assigned
 * to a (new or updated) bag for the given user. Returns:
 *   - { ok: true, device }   if the tag is a valid usable device
 *   - { ok: true, device: null } if the tag does not correspond to any device (treat as a plain airline tag)
 *   - { ok: false, reason }  if the tag matches a device that cannot be used
 *
 * `excludeBagId` lets a PATCH skip its own bag when checking for conflicts.
 */
export async function validateDeviceTag(args: {
  tagNumber: string;
  userId: string;
  tx?: any;
  excludeBagId?: string;
}): Promise<
  | { ok: true; device: DeviceSummary | null }
  | { ok: false; reason: string }
> {
  const client = args.tx || prisma;
  const device = await client.trackingDevice.findUnique({
    where: { deviceId: args.tagNumber },
  });
  if (!device) return { ok: true, device: null };

  if (device.userId !== args.userId) {
    return { ok: false, reason: 'This device id is registered to another account.' };
  }
  const now = new Date();
  if (device.expiresAt <= now || device.status !== 'ACTIVE') {
    return { ok: false, reason: 'This tracking device has expired and cannot be used.' };
  }

  const conflict = await client.bag.findFirst({
    where: {
      tagNumber: device.deviceId,
      ...(args.excludeBagId ? { NOT: { id: args.excludeBagId } } : {}),
      trip: {
        userId: args.userId,
        OR: [{ arrivalDateTime: null }, { arrivalDateTime: { gt: now } }],
      },
    },
  });
  if (conflict) {
    return {
      ok: false,
      reason: 'This device is already attached to another in-progress trip.',
    };
  }

  return {
    ok: true,
    device: {
      deviceId: device.deviceId,
      status: device.status,
      expiresAt: device.expiresAt,
    },
  };
}

/**
 * Given a list of bags, look up matching TrackingDevice rows once and attach a
 * synthetic `device` field (or null) to each bag. Mutates and returns the input.
 */
export async function attachDeviceField<T extends { tagNumber: string }>(
  bags: T[],
  userId: string
): Promise<(T & { device: DeviceSummary | null })[]> {
  if (bags.length === 0) return bags as any;
  const tags = Array.from(new Set(bags.map((b) => b.tagNumber)));
  const devices = await prisma.trackingDevice.findMany({
    where: { deviceId: { in: tags }, userId },
  });
  const byTag = new Map(devices.map((d) => [d.deviceId, d]));
  return bags.map((b) => {
    const d = byTag.get(b.tagNumber);
    return {
      ...b,
      device: d
        ? { deviceId: d.deviceId, status: d.status, expiresAt: d.expiresAt }
        : null,
    };
  }) as any;
}
