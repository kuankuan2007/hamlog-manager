import fs from 'fs/promises';
async function getPage(callsign, cookie) {
    const response = await fetch(`https://www.qrz.com/db/${callsign}`, {
        method: 'GET',
        headers: {
            Cookie: cookie,
        },
    });
    return await response.text();
}
// from qrz.com source code
function showqem(cem) {
    let cl = new String('');
    let dem = new String('');
    let i;
    for (i = cem.length - 1; i > 0; i--) {
        const c = cem.charAt(i);
        if (c != '!') {
            cl = cl.concat(c);
        }
        else {
            break;
        }
    }
    i--;
    for (let x = 0; x < Number(cl); x++) {
        dem = dem.concat(cem.charAt(i));
        i -= 2;
    }
    return String(dem);
}
export async function callsign2email(callsign) {
    const qrzCookie = await fs.readFile('./data/qrzCookie.txt', 'utf-8');
    const page = await getPage(callsign, qrzCookie.trim());
    const qmailMatch = page.match(/\s*var\s+qmail\s*=\s*'([^']+)'/);
    if (!qmailMatch) {
        return null;
    }
    const qmail = qmailMatch[1];
    return qmail ? showqem(qmail) : null;
}
