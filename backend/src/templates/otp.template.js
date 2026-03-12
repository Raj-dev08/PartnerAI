export const otpEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333;">Your Verification Code</h2>
      <p>Use the following OTP to complete your registration:</p>
      <h1 style="text-align: center; color: #007bff;">${otp}</h1>
      <p style="color: #555;">This code will expire in 5 minutes.</p>
      <hr>
      <p style="font-size: 12px; color: #999;">If you did not request this, please ignore this email.</p>
    </div>
  `;
};