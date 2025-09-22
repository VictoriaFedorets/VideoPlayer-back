import nodemailer from 'nodemailer';
import { env } from './env.ts';

interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: env('SMTP_HOST'),
  port: Number(env('SMTP_PORT')),
  secure: false,
  auth: {
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
  },
});

export const sendEmail = async ({
  from,
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: env('SMTP_FROM'),
    to,
    subject,
    html,
  });
};
