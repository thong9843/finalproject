const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 1025;
const logDir = path.join(__dirname, '..', '..', 'uploads', 'email-logs');

// Ensure log folder exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function startSmtpServer() {
    const server = net.createServer((socket) => {
        console.log('[SMTP Server] Client connected');
        socket.write('220 SimpleMockSMTPServer Ready\r\n');
        
        let state = 'CMD';
        let dataBuffer = '';
        let recipient = '';
        let sender = '';

        socket.on('data', (chunk) => {
            const dataStr = chunk.toString();
            
            if (state === 'DATA') {
                dataBuffer += dataStr;
                // Check if we reached the end of the email
                if (dataBuffer.endsWith('\r\n.\r\n') || dataBuffer.endsWith('\n.\n') || dataBuffer.includes('\r\n.\r\n')) {
                    const dotIndex = dataBuffer.indexOf('\r\n.\r\n');
                    let rawEmail = dataBuffer;
                    if (dotIndex !== -1) {
                        rawEmail = dataBuffer.substring(0, dotIndex);
                    } else {
                        rawEmail = dataBuffer.replace(/\r?\n\.\r?\n$/, '');
                    }

                    // Parse email
                    const parsed = parseEmail(rawEmail);
                    if (!parsed.to && recipient) parsed.to = recipient;
                    if (!parsed.from && sender) parsed.from = sender;

                    const emailId = `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    const logFile = path.join(logDir, `${emailId}.json`);

                    const emailLog = {
                        id: emailId,
                        from: parsed.from,
                        to: parsed.to,
                        subject: parsed.subject,
                        body: parsed.body,
                        headers: parsed.headers,
                        sentAt: new Date().toISOString()
                    };

                    fs.writeFileSync(logFile, JSON.stringify(emailLog, null, 2), 'utf8');
                    console.log(`[SMTP Server] Saved email ${emailId} to ${logFile}`);

                    socket.write('250 OK: Message accepted for delivery\r\n');
                    state = 'CMD';
                    dataBuffer = '';
                    recipient = '';
                    sender = '';
                }
            } else {
                const lines = dataStr.split('\r\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    
                    const upperLine = line.toUpperCase();
                    if (upperLine.startsWith('HELO') || upperLine.startsWith('EHLO')) {
                        socket.write('250-localhost Hello\r\n250-AUTH LOGIN PLAIN\r\n250-SIZE 35840000\r\n250 HELP\r\n');
                    } else if (upperLine.startsWith('MAIL FROM:')) {
                        const match = line.match(/<([^>]+)>/);
                        if (match) sender = match[1];
                        socket.write('250 2.1.0 OK\r\n');
                    } else if (upperLine.startsWith('RCPT TO:')) {
                        const match = line.match(/<([^>]+)>/);
                        if (match) recipient = match[1];
                        socket.write('250 2.1.5 OK\r\n');
                    } else if (upperLine.startsWith('DATA')) {
                        state = 'DATA';
                        dataBuffer = '';
                        socket.write('354 Start mail input; end with <CRLF>.<CRLF>\r\n');
                    } else if (upperLine.startsWith('QUIT')) {
                        socket.write('221 2.0.0 Bye\r\n');
                        socket.end();
                    } else if (upperLine.startsWith('AUTH')) {
                        socket.write('235 2.7.0 Authentication successful\r\n');
                    } else {
                        socket.write('250 OK\r\n');
                    }
                }
            }
        });

        socket.on('error', (err) => {
            console.error('[SMTP Server] Socket error:', err.message);
        });
    });

    server.listen(PORT, '127.0.0.1', () => {
        console.log(`✔ [SMTP Server] Running on 127.0.0.1:${PORT}`);
    });

    return server;
}

function decodeMimeHeader(headerVal) {
    if (!headerVal) return '';
    
    // Remove spaces between adjacent MIME encoded words as per RFC 2047
    const normalizedVal = headerVal.replace(/\?=\s+=\?/g, '?==?');
    const mimeRegex = /=\?([A-Za-z0-9_-]+)\?([QBqb])\?([^?]*)\?=/g;
    
    return normalizedVal.replace(mimeRegex, (match, charset, encoding, text) => {
        if (encoding.toUpperCase() === 'Q') {
            let qpText = text.replace(/_/g, ' ');
            const bytes = [];
            for (let k = 0; k < qpText.length; k++) {
                const char = qpText[k];
                if (char === '=' && k + 2 < qpText.length) {
                    const hex = qpText.substring(k + 1, k + 3);
                    if (/^[0-9A-F]{2}$/i.test(hex)) {
                        bytes.push(parseInt(hex, 16));
                        k += 2;
                        continue;
                    }
                }
                bytes.push(qpText.charCodeAt(k));
            }
            return Buffer.from(bytes).toString('utf8');
        } else if (encoding.toUpperCase() === 'B') {
            try {
                const buffer = Buffer.from(text, 'base64');
                return buffer.toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'binary');
            } catch (e) {
                return text;
            }
        }
        return match;
    });
}

function decodeQuotedPrintable(qpText) {
    if (!qpText) return '';
    // Remove soft line breaks (soft breaks are represented by '=' at the end of a line)
    const cleaned = qpText.replace(/=\r?\n/g, '');
    
    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '=' && i + 2 < cleaned.length) {
            const hex = cleaned.substring(i + 1, i + 3);
            if (/^[0-9A-F]{2}$/i.test(hex)) {
                bytes.push(parseInt(hex, 16));
                i += 2;
                continue;
            }
        }
        bytes.push(cleaned.charCodeAt(i));
    }
    return Buffer.from(bytes).toString('utf8');
}

function parseEmail(rawText) {
    const lines = rawText.split(/\r?\n/);
    const headers = {};
    let body = '';
    let isHeaderSection = true;
    let lastKey = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isHeaderSection) {
            if (line.trim() === '') {
                isHeaderSection = false;
                continue;
            }
            
            // Check for header folding (continuation line starting with space or tab)
            if (line.startsWith(' ') || line.startsWith('\t')) {
                if (lastKey) {
                    headers[lastKey] += ' ' + line.trim();
                }
                continue;
            }

            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim().toLowerCase();
                const value = line.substring(colonIdx + 1).trim();
                headers[key] = value;
                lastKey = key;
            } else {
                lastKey = '';
            }
        } else {
            body += line + '\n';
        }
    }

    let decodedBody = body.trim();
    if (headers['content-transfer-encoding'] === 'quoted-printable') {
        decodedBody = decodeQuotedPrintable(decodedBody);
    }

    return {
        from: decodeMimeHeader(headers['from'] || ''),
        to: decodeMimeHeader(headers['to'] || ''),
        subject: decodeMimeHeader(headers['subject'] || '(No Subject)'),
        body: decodedBody,
        headers: headers
    };
}

module.exports = { startSmtpServer };
