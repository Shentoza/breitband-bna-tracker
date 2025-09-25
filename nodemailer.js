import nodemailer from 'nodemailer';
import { getMailerConfig } from './config.js';

export async function createMailer() {
    const mailerConfig = await getMailerConfig();
    if (mailerConfig?.enabled !== true) {
        return null;
    }
    const transport = nodemailer.createTransport(mailerConfig.smtp);
    return {
        transport,
        sendStatus: mailerConfig.sendStatus,
        sendFrom: mailerConfig.sendFrom,
        sendTo: mailerConfig.sendTo
    };
}

export async function sendStatusEmail(mailer, result) {
    if (!mailer.transport) return;
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
        const info = await mailer.transport.sendMail({
            from: mailer.sendFrom,
            to: mailer.sendTo,
            subject,
            text,
            html,
        });
        console.log('Status mail sent:', info.response ?? info.messageId);
    } catch (err) {
        console.error('Error sending status mail:', err);
    }
}