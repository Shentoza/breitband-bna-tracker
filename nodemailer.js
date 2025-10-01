import nodemailer from 'nodemailer';
import { getMailerConfig } from './config.js';

export async function createMailer() {
    const mailerConfig = await getMailerConfig();
    if (mailerConfig) {
        try {
            const transport = nodemailer.createTransport(mailerConfig.smtp);
            const { smtp: _, ...configRest } = mailerConfig;
            return {
                transport,
                config: configRest,
            };
        }
        catch (err) {
            console.error('Error creating mail transporter:', err);
            return { transport: null, config: null };
        }
    }
    console.log('Mailer not configured');
    return null;
}

export async function sendStatusEmail(mailer, result) {
    const { transport, config } = mailer;
    if (!transport) return;
    const ping = result['Laufzeit (ms)'] ?? 'n/a' + ' ms';
    const download = result['Download (Mbit/s)'] ?? 'n/a' + ' Mbit/s';
    const upload = result['Upload (Mbit/s)'] ?? 'n/a' + ' Mbit/s';
    const date = result['Messzeitpunkt'] ?? new Date().toLocaleString('de-DE');
    const time = result['Uhrzeit'] ?? '';
    const dateTime = time ? `${date} ${time}` : date;

    const subject = `Breitbandmessung — ${download}↓ / ${upload}↑ / ${ping}ms`;
    const text = `Messzeitpunkt: ${dateTime}\nDownload: ${download} Mbit/s\nUpload: ${upload} Mbit/s\nPing: ${ping} ms\nTest-ID: ${result['Test-ID'] ?? ''}`;

    const html = `<p><strong>Breitbandmessung</strong> — ${dateTime}</p>
    <ul>
      <li><strong>Download:</strong> ${download} Mbit/s</li>
      <li><strong>Upload:</strong> ${upload} Mbit/s</li>
      <li><strong>Ping:</strong> ${ping} ms</li>
    </ul>
    ${result['Test-ID'] ? `<p>Test-ID: <code>${result['Test-ID']}</code></p>` : ''}`;

    try {
        const info = await transport.sendMail({
            from: config.sendFrom,
            to: config.sendTo,
            subject,
            text,
            html,
        });
        console.log('Status mail sent:', info.response ?? info.messageId);
    } catch (err) {
        console.error('Error sending status mail:', err);
    }
}