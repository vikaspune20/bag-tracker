/*
  Warnings:

  - A unique constraint covering the columns `[tripId,tagNumber]` on the table `Bag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Bag_tagNumber_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "deviceId" TEXT;

-- AlterTable
ALTER TABLE "TrackingLog" ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "endedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailOtp" TEXT,
ADD COLUMN     "emailOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiryReminder0SentAt" TIMESTAMP(3),
ADD COLUMN     "expiryReminder7SentAt" TIMESTAMP(3),
ALTER COLUMN "identificationNo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TrackingDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subStatus" TEXT NOT NULL DEFAULT 'NONE',
    "subPlan" TEXT,
    "subExpiry" TIMESTAMP(3),
    "subStripeSubId" TEXT,
    "subCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TrackingDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingAddressLine" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingState" TEXT NOT NULL,
    "shippingZip" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL DEFAULT 'United States',
    "bonusGranted" BOOLEAN NOT NULL DEFAULT false,
    "shippingTrackingNumber" TEXT,
    "shippingCarrier" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "key" TEXT NOT NULL,
    "cents" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingDevice_deviceId_key" ON "TrackingDevice"("deviceId");

-- CreateIndex
CREATE INDEX "TrackingDevice_userId_status_idx" ON "TrackingDevice"("userId", "status");

-- CreateIndex
CREATE INDEX "TrackingDevice_userId_subStatus_idx" ON "TrackingDevice"("userId", "subStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceOrder_stripeSessionId_key" ON "DeviceOrder"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceOrder_stripePaymentIntentId_key" ON "DeviceOrder"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "DeviceOrder_userId_status_idx" ON "DeviceOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_createdAt_idx" ON "ContactEnquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bag_tripId_tagNumber_key" ON "Bag"("tripId", "tagNumber");

-- CreateIndex
CREATE INDEX "Subscription_deviceId_idx" ON "Subscription"("deviceId");

-- AddForeignKey
ALTER TABLE "TrackingDevice" ADD CONSTRAINT "TrackingDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingDevice" ADD CONSTRAINT "TrackingDevice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeviceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceOrder" ADD CONSTRAINT "DeviceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
