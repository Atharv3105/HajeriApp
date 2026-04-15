import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export const reportService = {
  /**
   * Generates a monthly attendance PDF report in Marathi
   */
  /**
   * Generates a monthly attendance PDF report in Marathi
   */
  async generateMonthlyReport(schoolInfo: any, className: string, monthLabel: string, students: any[], totalSessions: number) {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #1f2937; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            .school-name { font-size: 26px; font-weight: bold; color: #065f46; margin-bottom: 5px; }
            .udise { font-size: 14px; color: #6b7280; }
            h2 { text-align: center; margin-top: 20px; color: #111827; text-transform: uppercase; letter-spacing: 1px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background-color: #f0fdfa; borderRadius: 8px; border: 1px solid #ccfbf1; font-weight: bold; color: #0d9488; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #e5e7eb; }
            th, td { border: 1px solid #d1d5db; padding: 12px 8px; text-align: center; font-size: 13px; }
            th { background-color: #f9fafb; color: #374151; font-weight: bold; }
            .left { text-align: left; padding-left: 15px; }
            .status-regular { color: #10b981; font-weight: bold; }
            .status-irregular { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; padding-top: 20px; }
            .sign { width: 45%; text-align: center; border-top: 1.5px dashed #9ca3af; padding-top: 10px; color: #4b5563; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${schoolInfo.name || 'जिल्हा परिषद प्राथमिक शाळा'}</div>
            <div class="udise">UDISE: ${schoolInfo.udise_code || '---'} | तालुका: ${schoolInfo.taluka || '---'} | जिल्हा: ${schoolInfo.district || '---'}</div>
          </div>
          
          <h2>मासिक उपस्थिती अहवाल (Monthly Report)</h2>
          <div style="text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold;">महिना: ${monthLabel}</div>
          
          <div class="meta">
            <div>इयत्ता (Class): ${className}</div>
            <div>एकूण कार्य दिवस (Working Days): ${totalSessions}</div>
            <div>एकूण विद्यार्थी (Total Students): ${students.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">अ.क्र.</th>
                <th style="width: 60px;">हजेरी</th>
                <th class="left">विद्यार्थ्याचे नाव (Student Name)</th>
                <th>हजर (Present)</th>
                <th>टक्के ( % )</th>
                <th>अभिप्राय (Remark)</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${s.roll_number}</td>
                  <td class="left">${s.name}</td>
                  <td>${s.present_count}</td>
                  <td style="font-weight: bold;">${s.attendance_percent}%</td>
                  <td class="${s.attendance_percent >= 75 ? 'status-regular' : 'status-irregular'}">
                    ${s.attendance_percent >= 75 ? 'नियमित' : 'अनियमित'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="sign">वर्गशिक्षकाची स्वाक्षरी<br>(Teacher's Sign)</div>
            <div class="sign">मुख्याध्यापकाची स्वाक्षरी व शिक्का<br>(HM's Sign & Stamp)</div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated at:', uri);
      
      try {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } catch (shareError) {
        console.warn('Native sharing not available:', shareError);
        // Fallback for web or environments without sharing
        alert('अहवाल तयार झाला आहे: ' + uri);
      }
    } catch (e) {
      console.error('PDF Generation Error:', e);
    }
  }
};
