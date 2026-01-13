/**
 * Email Service using Resend
 * Handles OTP emails and report delivery
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send OTP verification email
 */
async function sendOTPEmail(email, otp, firstName = '') {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  try {
    const data = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: [email],
      subject: 'Your AEO Audit Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">AEO Audit Suite</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #111827; margin-top: 0;">Verification Code</h2>
            
            <p style="color: #4b5563; font-size: 16px;">${greeting},</p>
            
            <p style="color: #4b5563; font-size: 16px;">
              Thank you for using the AEO Audit Suite! Your verification code is:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              AEO Audit Suite - Answer Engine Optimization Tools<br>
              © ${new Date().getFullYear()} Thatworkx Solutions
            </p>
          </div>
          
        </body>
        </html>
      `,
    });

    console.log(`✓ OTP email sent to ${email}: ${data.id}`);
    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('✗ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send analysis report email
 */
async function sendReportEmail(email, url, reportData, firstName = '') {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  try {
    const data = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: [email],
      subject: `Your AEO Audit Results for ${url}`,
      html: generateReportHTML(url, reportData, greeting),
    });

    console.log(`✓ Report email sent to ${email}: ${data.id}`);
    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('✗ Error sending report email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML for report email
 */
function generateReportHTML(url, reportData, greeting) {
  const { tool, overallScore, analyzedAt } = reportData;
  
  // Score color
  const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">AEO Audit Suite</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Analysis Results</p>
      </div>
      
      <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #111827; margin-top: 0;">${tool}</h2>
        
        <p style="color: #4b5563; font-size: 16px;">${greeting},</p>
        
        <p style="color: #4b5563; font-size: 16px;">
          Here are the results of your AEO audit for:
        </p>
        
        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <a href="${url}" style="color: #667eea; text-decoration: none; word-break: break-all;">${url}</a>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Overall Score</h3>
          <div style="font-size: 64px; font-weight: bold; color: ${scoreColor}; margin: 10px 0;">
            ${overallScore}
          </div>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">out of 100</p>
        </div>
        
        <p style="color: #4b5563; font-size: 16px;">
          <strong>Analyzed on:</strong> ${new Date(analyzedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            💡 <strong>Tip:</strong> For detailed recommendations and the full report, visit the AEO Audit Suite and run the analysis again.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          AEO Audit Suite - Answer Engine Optimization Tools<br>
          © ${new Date().getFullYear()} Thatworkx Solutions
        </p>
      </div>
      
    </body>
    </html>
  `;
}

module.exports = {
  sendOTPEmail,
  sendReportEmail,
};
