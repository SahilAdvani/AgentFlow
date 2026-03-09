import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

    def send_report(self, to_email: str, pdf_path: str, startup_name: str):
        """Send the generated PDF report via Gmail SMTP."""
        if not self.smtp_user or not self.smtp_password:
            print("Email skipped: SMTP credentials not provided.")
            return None

        msg = MIMEMultipart()
        msg['From'] = self.smtp_user
        msg['To'] = to_email
        msg['Subject'] = f"Startup Analysis Report: {startup_name}"

        body = f"Hello!\n\nAttached is your AI-generated startup analysis report for {startup_name}."
        msg.attach(MIMEText(body, 'plain'))

        # Attachment
        with open(pdf_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f"attachment; filename= {startup_name}_Analysis.pdf")
            msg.attach(part)

        # Send
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

email_service = EmailService()

email_service = EmailService()
