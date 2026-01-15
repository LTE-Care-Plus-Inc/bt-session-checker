import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { firstName, lastName, email, phone } = await req.json();

    // 1. Format to "Last, First" for comparison
    const formattedInputName = `${lastName.trim()}, ${firstName.trim()}`.toLowerCase();

    // 2. Google Auth Setup
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
      range: "'Flagged_1/10'!A:AC", 
    });

    const rows = response.data.values; // <--- This was the missing line!
    
    if (!rows || rows.length === 0) {
      return Response.json({ error: "Sheet is empty or not found" }, { status: 500 });
    }

    // 4. Filter sessions
    const filteredSessions = rows.filter((row, index) => {
      if (index === 0) return false;

      // Using your specific indices: 9 (Name), 10 (Phone), 11 (Email)
      const sheetName = row[9]?.toString().toLowerCase().trim() || "";
      const sheetPhone = row[10]?.toString().replace(/\D/g, '');    
      const sheetEmail = row[11]?.toString().toLowerCase().trim(); 
      const inputPhone = phone.replace(/\D/g, '');

      return (
        sheetName === formattedInputName &&
        sheetEmail === email.toLowerCase().trim() &&
        sheetPhone.endsWith(inputPhone)
      );
    });

    if (filteredSessions.length === 0) {
      return Response.json({ error: "No matching records found." }, { status: 404 });
    }

    // 5. Generate Table Rows (Date: 7, Client: 8, Reason: 26)
    const tableRows = filteredSessions.map(s => `
      <tr>
        <td style="border-bottom:1px solid #ddd; padding:8px;">${s[7] || 'N/A'}</td>
        <td style="border-bottom:1px solid #ddd; padding:8px;">${s[8] || 'N/A'}</td>
        <td style="border-bottom:1px solid #ddd; padding:8px; color:#d32f2f;">${s[26] || 'Reason not listed'}</td>
      </tr>
    `).join('');

    // 6. Send Email
    await resend.emails.send({
      from: 'LTE Care Plus <reports@ltecareplus.org>',
      to: 'jseet@ltecareplus.org',
      subject: 'Urgent: Flagged Session Report',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Payroll Verification Report</h3>
          <p>Hello ${firstName},</p>
          <p>The following sessions were flagged in the current pay period:</p>
          <table style="width:100%; border-collapse: collapse;">
            <tr style="background:#f4f4f4; text-align: left;">
              <th style="padding:8px; border-bottom:2px solid #ddd;">Date</th>
              <th style="padding:8px; border-bottom:2px solid #ddd;">Client Name</th>
              <th style="padding:8px; border-bottom:2px solid #ddd;">Failure Reason</th>
            </tr>
            ${tableRows}
          </table>
        </div>
      `
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}