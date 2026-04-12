import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export const reportService = {
  /**
   * Generates a monthly attendance PDF report in Marathi
   */
  async generateMonthlyReport(schoolInfo: any, className: string, month: string, students: any[]) {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica'; padding: 30px; color: #1f2937; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .udise { font-size: 14px; color: #4b5563; }
            h2 { text-align: center; margin-top: 10px; text-decoration: underline; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
            th { background-color: #f3f4f6; }
            .left { text-align: left; padding-left: 12px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .sign { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${schoolInfo.name || 'जिल्हा परिषद प्राथमिक शाळा'}</div>
            <div class="udise">UDISE कोड: ${schoolInfo.udise_code || '---'} | जिल्हा: ${schoolInfo.district || '---'}</div>
          </div>
          
          <h2>मासिक उपस्थिती पत्रक (महिना: ${month})</h2>
          
          <div class="meta">
            <div>इयत्ता: ${className}</div>
            <div>एकूण विद्यार्थी: ${students.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>अ.क्र.</th>
                <th>हजेरी क्र.</th>
                <th class="left">विद्यार्थ्याचे नाव</th>
                <th>एकूण दिवस</th>
                <th>उपस्थिती</th>
                <th>टक्केवारी</th>
                <th>शेरा</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${s.roll_number}</td>
                  <td class="left">${s.name}</td>
                  <td>25</td>
                  <td>${Math.round((s.attendance_percent / 100) * 25)}</td>
                  <td>${s.attendance_percent}%</td>
                  <td>${s.attendance_percent >= 75 ? 'नियमित' : 'अनियमित'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="sign">वर्गशिक्षक स्वाक्षरी</div>
            <div class="sign">मुख्याध्यापक स्वाक्षरी व शिक्का</div>
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
