import { google } from 'googleapis';

// -----------------------------
// Helpers
// -----------------------------
function toInitials(name) {
  if (!name) return "N/A";

  const raw = name.toString().trim();
  if (!raw) return "N/A";

  // If format is "Last, First ..."
  if (raw.includes(",")) {
    const [lastPart, firstPart] = raw.split(",", 2);
    const last = (lastPart || "").trim();
    const first = (firstPart || "").trim();

    const firstInitial = first ? first[0].toUpperCase() : "";
    const lastInitial = last ? last[0].toUpperCase() : "";

    if (firstInitial && lastInitial) return `${firstInitial}.${lastInitial}.`;
    if (firstInitial) return `${firstInitial}.`;
    if (lastInitial) return `${lastInitial}.`;
    return "N/A";
  }

  // Otherwise assume "First Last ..."
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return `${parts[0][0].toUpperCase()}.`;

  const firstInitial = parts[0][0].toUpperCase();
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstInitial}.${lastInitial}.`;
}


function encodeMessage(message) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ✅ Normalize US phone numbers to 11 digits starting with "1"
function normalizeUSPhone(value) {
  const d = (value ?? "").toString().replace(/\D/g, "");
  if (d.length === 10) return "1" + d;
  if (d.length === 11 && d.startsWith("1")) return d;
  return d;
}

async function sendViaGmail({ from, to, subject, html }) {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: from,
  });

  const gmail = google.gmail({ version: "v1", auth });

  const rawMessage =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
    html;

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodeMessage(rawMessage) },
  });
}

const norm = v => (v ?? "").toString().toLowerCase().trim();

// -----------------------------
// API Handler
// -----------------------------
export async function POST(req) {
  try {
    const { firstName, lastName, email, phone } = await req.json();

    console.log("---- DEBUG: Incoming Request ----");
    console.log("firstName:", firstName);
    console.log("lastName:", lastName);
    console.log("email:", email);
    console.log("phone (raw):", phone);

    // 1. Format to "Last, First"
    const formattedInputName =
      `${lastName.trim()}, ${firstName.trim()}`.toLowerCase();

    const inputEmail = norm(email);

    // ✅ Auto-add leading "1" when input is 10 digits
    const inputPhone = normalizeUSPhone(phone);

    console.log("formattedInputName:", formattedInputName);
    console.log("inputEmail:", inputEmail);
    console.log("inputPhone (normalized):", inputPhone);

    // 2. Google Sheets Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 3. Fetch Data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Flagged 1/18'!A:AC",
    });

    const rows = response.data.values;

    console.log("Rows returned:", rows?.length || 0);

    if (!rows || rows.length === 0) {
      return Response.json(
        { error: "Sheet is empty or not found" },
        { status: 500 }
      );
    }

    // 🔍 DEBUG: inspect first few rows
    console.log("---- DEBUG: Sheet Preview (first 5 rows) ----");
    rows.slice(1, 6).forEach((r, i) => {
      console.log(`Row ${i + 2}`, {
        sheetName: norm(r[10]),
        sheetPhone: normalizeUSPhone(r[12]),
        sheetEmail: norm(r[12]),
        date: r[7],
        client: r[11],
        reason: r[14],
      });
    });

    // 4. Filter sessions (INDEX-BASED)
    const filteredSessions = rows.filter((row, index) => {
      if (index === 0) return false;

      const sheetName  = norm(row[10]);
      const sheetPhone = normalizeUSPhone(row[12]);
      const sheetEmail = norm(row[13]);


      const nameMatch  = sheetName === formattedInputName;
      const emailMatch = sheetEmail === inputEmail;

      // ✅ Strict match after normalization
      const phoneMatch = sheetPhone === inputPhone;

      // 🔍 DEBUG: show near-matches
      if (nameMatch || emailMatch || phoneMatch) {
        console.log("Candidate row", index + 1, {
          sheetName,
          sheetEmail,
          sheetPhone,
          nameMatch,
          emailMatch,
          phoneMatch,
        });
      }

      return nameMatch && emailMatch && phoneMatch;
    });

    console.log("Filtered sessions count:", filteredSessions.length);

    if (filteredSessions.length === 0) {
      return Response.json(
        {
          error: "No matching records found.",
          debug: {
            formattedInputName,
            inputEmail,
            inputPhone,
            note:
              "Phones are normalized to US 11-digit format (leading 1). " +
              "Check Staff Name (col 9), Phone (col 11), Email (col 12).",
          },
        },
        { status: 404 }
      );
    }

    // 5. Generate Table Rows
    const tableRows = filteredSessions.map(s => `
      <tr>
        <td style="border-bottom:1px solid #ddd; padding:8px;">
          ${s[7] || 'N/A'}
        </td>
        <td style="border-bottom:1px solid #ddd; padding:8px;">
          ${toInitials(s[11])}
        </td>
        <td style="border-bottom:1px solid #ddd; padding:8px; color:#d32f2f;">
          ${s[15] || 'Reason not listed'}
        </td>
      </tr>
    `).join('');

    // 6. Send Email
    await sendViaGmail({
      from: 'report@ltecareplus.org',
      to: email,
      subject: 'Urgent: Flagged Session Report',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Payroll Verification Report</h3>
          <p>Hello ${firstName},</p>
          <p>The following sessions were flagged in the current pay period:</p>

          <table style="width:100%; border-collapse: collapse;">
            <tr style="background:#f4f4f4; text-align: left;">
              <th style="padding:8px; border-bottom:2px solid #ddd;">Date</th>
              <th style="padding:8px; border-bottom:2px solid #ddd;">Client Initials</th>
              <th style="padding:8px; border-bottom:2px solid #ddd;">Failure Reason</th>
            </tr>
            ${tableRows}
          </table>
        </div>
      `,
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
