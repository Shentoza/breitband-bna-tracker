import nodemailer from 'nodemailer';
import { getMailerConfig, MailerConfig } from './config';
import { ParsedResult } from './csv';
import { ContractCheckStatus, RatedResult } from './contractChecker';


type NodemailerClient = {
  transport: nodemailer.Transporter;
  config: Omit<MailerConfig, 'smtp'>;
};

type MailData = {
    ping: string;
    download: string;
    upload: string;
    dateTime: string;
}

type ResultMail = {
    subject: string;
    text: string;
    html: string;
}

export async function createMailer(): Promise<NodemailerClient | null> {
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
            return null;
        }
    }
    console.log('Mailer not configured');
    return null;
}

async function sendMail(mailer: NodemailerClient, mail: ResultMail) {
    const { transport, config } = mailer;
    if (!transport) return;
    try {
        const info = await transport.sendMail({
            from: config.sendFrom,
            to: config.sendTo,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        });
        console.log('Mail sent:', info.response ?? info.messageId);
    }
    catch (err) {
        console.error('Error sending mail:', err);
    }
}

function extractMailData(result: ParsedResult): MailData {
    const ping = result['Laufzeit (ms)'].toLocaleString() + ' ms';
    const download = result['Download (Mbit/s)']?.toLocaleString() + ' Mbit/s';
    const upload = result['Upload (Mbit/s)']?.toLocaleString() + ' Mbit/s';
    const dateTime = result.parsedDateTime?.toLocaleString('de-DE');
    return { ping, download, upload, dateTime };
}

export async function sendStatusEmail(mailer: NodemailerClient, result: ParsedResult) {
    const {ping, download, upload, dateTime} = extractMailData(result);

    const subject = `Breitbandmessung — ${download}↓ / ${upload}↑ / ${ping}ms`;
    const text = `Messzeitpunkt: ${dateTime}\nDownload: ${download} Mbit/s\nUpload: ${upload} Mbit/s\nPing: ${ping} ms\nTest-ID: ${result['Test-ID'] ?? ''}`;

    const html = `<p><strong>Breitbandmessung</strong> — ${dateTime}</p>
    <ul>
      <li><strong>Download:</strong> ${download} Mbit/s</li>
      <li><strong>Upload:</strong> ${upload} Mbit/s</li>
      <li><strong>Ping:</strong> ${ping} ms</li>
    </ul>
    ${result['Test-ID'] ? `<p>Test-ID: <code>${result['Test-ID']}</code></p>` : ''}`;

    sendMail(mailer, { subject, text, html });
}

const RatingToString = (status: ContractCheckStatus): string => {
    switch (status) {
        case ContractCheckStatus.BelowMinimum:
            return '- Minimum nicht erreicht ';
        case ContractCheckStatus.BelowAverage:
            return '- Durchschnitt nicht erreicht ';
        case ContractCheckStatus.OK:
            return '';
        default:
            return 'Unknown';
    }
}

export async function sendViolatedEmail(mailer: NodemailerClient, result: RatedResult) { 
    const {ping, download, upload, dateTime} = extractMailData(result.parsedResult);

    const downloadRatingText = RatingToString(result.DownloadStatus);
    const uploadRatingText = RatingToString(result.UploadStatus);

    const worstRating = RatingToString(Math.max(result.DownloadStatus, result.UploadStatus));
    const subject = `Breitbandmessung ${worstRating}— ${download}↓ / ${upload}↑ / ${ping}ms`;

    const text = `Messzeitpunkt: ${dateTime}\nDownload: ${download} Mbit/s${downloadRatingText}\nUpload: ${upload} Mbit/s${uploadRatingText}\nPing: ${ping} ms\nTest-ID: ${result.parsedResult['Test-ID']}`;

    const html = `<p><strong>Breitbandmessung</strong> — ${dateTime}</p>
    <ul>
      <li><strong>Download:</strong> ${download} Mbit/s${downloadRatingText}</li>
      <li><strong>Upload:</strong> ${upload} Mbit/s${uploadRatingText}</li>
      <li><strong>Ping:</strong> ${ping} ms</li>
    </ul>
    ${result.parsedResult['Test-ID'] ? `<p>Test-ID: <code>${result.parsedResult['Test-ID']}</code></p>` : ''}`;

    sendMail(mailer, { subject, text, html });

}