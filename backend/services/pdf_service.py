from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import json
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

    def _to_str(self, value) -> str:
        """Safely convert any value (dict, list, etc.) to a string for ReportLab."""
        if value is None:
            return "N/A"
        if isinstance(value, str):
            return value
        if isinstance(value, list):
            return ", ".join(str(item) for item in value)
        if isinstance(value, dict):
            # Format dict as readable key-value pairs
            parts = []
            for k, v in value.items():
                parts.append(f"<b>{k}:</b> {self._to_str(v)}")
            return "<br/>".join(parts)
        return str(value)

    def generate_report(self, data: dict, output_path: str = "report.pdf"):
        """Generate a PDF report from structured data."""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        story = []

        # Title
        idea = self._to_str(data.get('startup_idea', 'Startup Analysis'))
        story.append(Paragraph(f"Startup Analysis: {idea}", self.custom_title_style))
        story.append(Spacer(1, 12))

        # Executive Summary
        story.append(Paragraph("Executive Summary", self.section_header_style))
        story.append(Paragraph(self._to_str(data.get('executive_summary', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Market Analysis
        story.append(Paragraph("Market Analysis", self.section_header_style))
        story.append(Paragraph(self._to_str(data.get('market_analysis', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Competitor Landscape
        story.append(Paragraph("Competitor Landscape", self.section_header_style))
        story.append(Paragraph(self._to_str(data.get('competitor_landscape', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Strategy
        story.append(Paragraph("Strategy", self.section_header_style))
        story.append(Paragraph(self._to_str(data.get('strategy', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        # Recommendations
        story.append(Paragraph("Recommendations", self.section_header_style))
        story.append(Paragraph(self._to_str(data.get('recommendations', 'N/A')), self.styles['BodyText']))
        story.append(Spacer(1, 12))

        doc.build(story)
        return output_path

pdf_service = PDFService()
