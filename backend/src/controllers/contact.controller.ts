import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const submitEnquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    const enquiry = await prisma.contactEnquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || null,
        message: message.trim(),
        status: 'OPEN',
      },
    });

    return res.status(201).json({ message: 'Enquiry submitted successfully', id: enquiry.id });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error submitting enquiry', error: error.message });
  }
};
