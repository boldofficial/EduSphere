import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { logInfo, logWarn, logError } from '@/lib/logger';

// Rate limiting: simple in-memory store (for production, use Redis)
const submissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS = 5; // Max 5 submissions per hour per IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const userSubmissions = submissions.get(ip) || [];
    
    // Filter out old submissions
    const recentSubmissions = userSubmissions.filter(time => now - time < RATE_LIMIT_WINDOW);
    submissions.set(ip, recentSubmissions);
    
    return recentSubmissions.length >= MAX_SUBMISSIONS;
}

function recordSubmission(ip: string): void {
    const userSubmissions = submissions.get(ip) || [];
    userSubmissions.push(Date.now());
    submissions.set(ip, userSubmissions);
}

// Email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize input to prevent injection
function sanitize(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
        
        // Check rate limit
        if (isRateLimited(ip)) {
            logWarn('Contact form rate limited', { ip });
            return NextResponse.json(
                { error: 'Too many submissions. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { name, email, phone, subject, message } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required.' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address.' },
                { status: 400 }
            );
        }

        // Validate field lengths
        if (name.length > 100 || email.length > 100 || (phone && phone.length > 20) || 
            (subject && subject.length > 200) || message.length > 5000) {
            return NextResponse.json(
                { error: 'One or more fields exceed maximum length.' },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedData = {
            name: sanitize(name),
            email: sanitize(email),
            phone: phone ? sanitize(phone) : 'Not provided',
            subject: subject ? sanitize(subject) : 'Website Contact Form',
            message: sanitize(message),
        };

        // Configure SMTP transporter with multiple fallback options
        const port = parseInt(process.env.SMTP_PORT || '465');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                // Do not fail on invalid certs (common with cPanel)
                rejectUnauthorized: false,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });

        // Verify SMTP connection before sending
        try {
            await transporter.verify();
        } catch (verifyError) {
            logError('SMTP connection verification failed', verifyError);
            return NextResponse.json(
                { error: 'Email service temporarily unavailable. Please try again later or contact us by phone.' },
                { status: 503 }
            );
        }

        // Email content
        const mailOptions = {
            from: `"Website Contact Form" <${process.env.SMTP_FROM}>`,
            to: 'info@fruitfulvineheritageschools.org.ng',
            replyTo: sanitizedData.email,
            subject: `📬 ${sanitizedData.subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
                            <p style="color: #b8d4e8; margin: 10px 0 0; font-size: 14px;">Fruitful Vine Heritage Schools</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 30px;">
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                                <h2 style="color: #1e3a5f; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Contact Details</h2>
                                
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Name:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${sanitizedData.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                                            <a href="mailto:${sanitizedData.email}" style="color: #2563eb; text-decoration: none;">${sanitizedData.email}</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${sanitizedData.phone}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subject:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${sanitizedData.subject}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                                <h2 style="color: #1e3a5f; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Message</h2>
                                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${sanitizedData.message}</p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">
                                This message was sent from the contact form on<br>
                                <a href="https://www.fruitfulvineheritageschools.org.ng" style="color: #2563eb; text-decoration: none;">www.fruitfulvineheritageschools.org.ng</a>
                            </p>
                            <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">
                                Submitted on ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
New Contact Form Submission
===========================

Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Phone: ${sanitizedData.phone}
Subject: ${sanitizedData.subject}

Message:
${sanitizedData.message}

---
Submitted on ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
From: www.fruitfulvineheritageschools.org.ng
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        // Record successful submission for rate limiting
        recordSubmission(ip);
        
        logInfo('Contact form submitted successfully', { 
            name: sanitizedData.name, 
            email: sanitizedData.email 
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Thank you! Your message has been sent successfully.' 
        });

    } catch (error) {
        // Log detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        logError('Contact form error', error, { 
            errorMessage,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
        });
        
        // Check for specific error types
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
            return NextResponse.json(
                { error: 'Could not connect to email server. Please try again later or contact us by phone.' },
                { status: 503 }
            );
        }
        
        if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
            return NextResponse.json(
                { error: 'Email service configuration error. Please contact us by phone.' },
                { status: 503 }
            );
        }
        
        return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 }
        );
    }
}
