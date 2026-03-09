from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os
from typing import Any

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.custom_title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=20,
            alignment=1  # Center
        )
        self.section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor("#334155"),
            spaceBefore=15,
            spaceAfter=10,
            borderPadding=5
        )

    def _ensure_string(self, val: Any) -> str:
        """Ensure the input is a string suitable for a ReportLab Paragraph."""
        if val is None:
            return "N/A"
        if isinstance(val, (dict, list)):
            try:
                # If it's a list of strings, join them
                if isinstance(val, list) and all(isinstance(x, str) for x in val):
                    return "\n".join(val)
                # Otherwise, just dump it as pretty JSON or a string representation
                import json
                return json.dumps(val, indent=2)
            except:
                return str(val)
        return str(val)

    def generate_report(self, data: dict, output_path: str = "report.pdf"):
        """Generate a PDF report from structured data."""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        story = []

        # Title
        story.append(Paragraph(f"Startup Analysis: {self._ensure_string(data.get('startup_idea', 'Unknown'))}", self.custom_title_style))
        story.append(Spacer(1, 12))

        # Executive Summary
        story.append(Paragraph("Executive Summary", self.section_header_style))
        story.append(Paragraph(self._ensure_string(data.get('executive_summary', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Market Analysis
        story.append(Paragraph("Market Analysis", self.section_header_style))
        story.append(Paragraph(self._ensure_string(data.get('market_analysis', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Competitor Landscape
        story.append(Paragraph("Competitor Landscape", self.section_header_style))
        story.append(Paragraph(self._ensure_string(data.get('competitor_landscape', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Strategy & Recommendations
        story.append(Paragraph("Strategy & Recommendations", self.section_header_style))
        story.append(Paragraph(self._ensure_string(data.get('strategy', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        doc.build(story)
        return output_path

pdf_service = PDFService()
