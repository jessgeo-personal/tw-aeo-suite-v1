const { Resend } = require('resend');

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email Service
 * 
 * TO CUSTOMIZE EMAIL COPY:
 * 1. Find the template function you want to edit (e.g., getOTPEmailTemplate)
 * 2. Edit the text content inside the HTML template
 * 3. Save the file
 * 4. Restart your server
 * 
 * Environment variables used:
 * - EMAIL_FROM_NAME: The sender name (e.g., "AEO Suite by Thatworkx")
 * - FROM_EMAIL: The sender email address (e.g., "noreply@thatworkx.com")
 */

/**
 * OTP Email Template
 * Matches thatworkx.com email branding
 */
function getOTPEmailTemplate(otp, email) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AEO Suite Verification Code</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Merriweather', Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with Black Background -->
          <tr>
            <td style="background-color: #000000; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">
                thatworkx.
              </h1>
              <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 3px; font-weight: 300;">
                AEO SUITE
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0; font-weight: 400;">
                Hello,
              </h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for your interest in the AEO Suite. To complete your verification and access your analysis results, please use the verification code below.
              </p>
              
              <!-- OTP Box - VERY PROMINENT -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="background-color: #f8f8f8; border: 2px solid #00d4ff; border-radius: 8px; padding: 30px;">
                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 400;">
                      Your Verification Code
                    </p>
                    <p style="color: #000000; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </p>
                    <p style="color: #999999; font-size: 13px; margin: 15px 0 0 0;">
                      Valid for 10 minutes
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Simply copy this code and paste it into the verification field on the AEO Suite to view your analysis results.
              </p>
              
              <!-- Security Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>Security Note:</strong> This code was requested for ${email}. If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 10px 0;">
                Need help? Feel free to reach out to us.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                All the best,<br>
                <span style="color: #999999; font-style: italic;">The AEO Suite Team</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px 40px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; text-align: center;">
                Thatworkx Solutions LLC-FZ, Meydan Free Zone, Dubai, Dubai, United Arab Emirates, +971529342175
              </p>
              <p style="color: #999999; font-size: 13px; margin: 0; text-align: center;">
                <a href="https://aeo.thatworkx.com" style="color: #00d4ff; text-decoration: none;">Visit AEO Suite</a> · 
                <a href="https://thatworkx.com" style="color: #00d4ff; text-decoration: none;">Thatworkx</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send OTP Email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - Resend API response
 */
async function sendOTPEmail(email, otp) {
  try {
    const fromName = process.env.EMAIL_FROM_NAME || 'AEO Suite by Thatworkx';
    const fromEmail = process.env.FROM_EMAIL || 'noreply@thatworkx.com';
    
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: `Your AEO Suite Verification Code: ${otp}`,
      html: getOTPEmailTemplate(otp, email)
    });
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Analysis Report Email (for future use)
 * You can add this functionality later
 */
async function sendAnalysisReportEmail(email, reportData) {
  // TODO: Implement when ready
  console.log('Analysis report email not yet implemented');
  return { success: false, message: 'Not implemented' };
}

module.exports = {
  sendOTPEmail,
  sendAnalysisReportEmail,
  // Export template functions if you need to customize them elsewhere
  getOTPEmailTemplate
};