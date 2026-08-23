import os
from datetime import datetime


class ReportGenerator:

    def __init__(self):
        pass

    def generate(self, landing_features, risk_data):
        features = landing_features or {}
        valgus = features.get("knee_valgus", 0.0)
        symmetry = features.get("landing_symmetry", 50.0)
        knee_flexion = features.get("knee_flexion", 0.0)

        risk_label = str(risk_data.get("label", risk_data.get("risk", "Low"))).upper()
        confidence = risk_data.get("confidence", 0.0)
        risk_score = risk_data.get("risk_percentage", risk_data.get("risk_score", 0.0))

        # 1. Recommendations
        recommendations = []

        if valgus >= 10.0:
            recommendations.append({
                "type": "warning",
                "title": "Reduce Knee Valgus",
                "description": f"Elevated inward knee valgus ({round(valgus, 1)}°) detected during landing. Focus on hip abductor and core strength to stabilize frontal plane alignment."
            })
        else:
            recommendations.append({
                "type": "success",
                "title": "Optimal Frontal Plane Alignment",
                "description": f"Knee valgus angle ({round(valgus, 1)}°) remains within normal biomechanical limits during movement."
            })

        if knee_flexion > 0 and knee_flexion < 45.0:
            recommendations.append({
                "type": "warning",
                "title": "Soft Landing & Flexion Training",
                "description": f"Stiff landing pattern observed ({round(knee_flexion, 1)}° knee flexion). Practice softer landings with deeper hip and knee flexion to dissipate impact forces."
            })
        else:
            recommendations.append({
                "type": "success",
                "title": "Strength & Neuromuscular Training",
                "description": "Continue hamstring, gluteal, and quadriceps conditioning to support dynamic knee stability during decelerations."
            })

        if symmetry < 45.0 or symmetry > 55.0:
            recommendations.append({
                "type": "warning",
                "title": "Bilateral Landing Control",
                "description": f"Bilateral landing asymmetry detected ({round(symmetry, 1)}% left vs {round(100 - symmetry, 1)}% right). Practice symmetric two-leg landings to equalize load distribution."
            })
        else:
            recommendations.append({
                "type": "success",
                "title": "Symmetric Landing Technique",
                "description": f"Bilateral landing symmetry is well-balanced ({round(symmetry, 1)}%). Maintain coordinated deceleration mechanics."
            })

        recommendations.append({
            "type": "warning" if "HIGH" in risk_label else "success",
            "title": "Continue Monitoring",
            "description": "Reassess biomechanical parameters and landing mechanics following structured corrective training sessions."
        })

        # 2. Findings & Summary Text
        findings = []
        if valgus >= 10.0:
            findings.append(f"increased knee valgus ({round(valgus, 1)}°)")
        if symmetry < 45.0 or symmetry > 55.0:
            findings.append(f"bilateral landing asymmetry ({round(symmetry, 1)}%)")
        if knee_flexion > 0 and knee_flexion < 45.0:
            findings.append(f"reduced knee flexion ({round(knee_flexion, 1)}°)")

        if findings:
            findings_text = f"{' and '.join(findings)} were observed during the landing phase."
        else:
            findings_text = "Symmetric landing mechanics and stable joint alignment were observed throughout the movement."

        primary_recommendation = "Routine Monitoring"
        if "HIGH" in risk_label:
            primary_recommendation = "Corrective Training"
        elif valgus >= 10.0:
            primary_recommendation = "Frontal Plane Alignment"
        elif symmetry < 45.0 or symmetry > 55.0:
            primary_recommendation = "Bilateral Landing Drills"
        elif knee_flexion > 0 and knee_flexion < 45.0:
            primary_recommendation = "Flexion Mechanics Training"
        elif "MODERATE" in risk_label:
            primary_recommendation = "Neuromuscular Conditioning"

        summary_text = f"The athlete demonstrates {risk_label.lower()} ACL injury risk. {findings_text}"

        analysis_summary = {
            "risk_level": risk_label,
            "confidence": f"{round(confidence, 1)}%",
            "risk_percentage": round(risk_score, 1),
            "primary_recommendation": primary_recommendation,
            "summary_text": summary_text,
            "findings": findings
        }

        return {
            "recommendations": recommendations,
            "analysis_summary": analysis_summary
        }

    def generate_pdf(self, analysis_data, output_pdf_path):
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
        except ImportError:
            print("reportlab is not installed. PDF generation unavailable.")
            return None

        os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)

        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=15
        )

        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=12,
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )

        badge_style = ParagraphStyle(
            'Badge',
            parent=styles['Normal'],
            fontSize=14,
            leading=16,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            alignment=1
        )

        story = []

        # Header
        story.append(Paragraph("ACL Analyzer — Biomechanical Analysis Report", title_style))
        story.append(Paragraph("AI-Assisted ACL Injury Risk Screening & Kinematic Assessment", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=15))

        # Session Metadata
        analysis_id = analysis_data.get("analysis_id", "N/A")
        filename = analysis_data.get("filename", analysis_data.get("video", {}).get("filename", "video.mp4"))
        date_str = analysis_data.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        frames = analysis_data.get("frames", analysis_data.get("video", {}).get("frames", 0))
        fps = analysis_data.get("fps", analysis_data.get("video", {}).get("fps", 0))
        duration = analysis_data.get("duration", analysis_data.get("video", {}).get("duration", 0))

        meta_data = [
            [Paragraph(f"<b>Analysis ID:</b> {analysis_id}", body_style), Paragraph(f"<b>Date / Time:</b> {date_str}", body_style)],
            [Paragraph(f"<b>Video File:</b> {filename}", body_style), Paragraph(f"<b>Duration:</b> {duration}s ({frames} frames @ {fps} FPS)", body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[260, 260])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 14))

        # Risk Classification Banner
        risk = analysis_data.get("risk", {})
        risk_level = str(risk.get("label", risk.get("risk", "Low"))).upper()
        risk_score = risk.get("risk_percentage", risk.get("risk_score", 0))
        confidence = risk.get("confidence", 0)

        risk_bg = colors.HexColor('#DC2626') if "HIGH" in risk_level else (colors.HexColor('#D97706') if "MODERATE" in risk_level else colors.HexColor('#16A34A'))

        risk_card_data = [
            [Paragraph(f"OVERALL RISK: {risk_level}", badge_style), Paragraph(f"Risk Score: {risk_score}%", badge_style), Paragraph(f"Confidence: {confidence}%", badge_style)]
        ]
        risk_table = Table(risk_card_data, colWidths=[180, 170, 170])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), risk_bg),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 14))

        # Biomechanical Metrics Table
        story.append(Paragraph("Biomechanical Kinematics (Landing Phase)", section_title_style))

        landing_features = analysis_data.get("landing_features") or analysis_data.get("features") or {}
        knee_flexion = landing_features.get("knee_flexion", 0)
        knee_valgus = landing_features.get("knee_valgus", 0)
        hip_flexion = landing_features.get("hip_flexion", 0)
        trunk_inclination = landing_features.get("trunk_inclination", 0)
        ankle_dorsiflexion = landing_features.get("ankle_dorsiflexion", 0)
        landing_symmetry = landing_features.get("landing_symmetry", 50)

        def get_status(val, norm_min, norm_max):
            if val < norm_min:
                return "Low"
            if val > norm_max:
                return "Elevated"
            return "Optimal"

        metrics_table_data = [
            [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Measured Value</b>", body_style), Paragraph("<b>Target Range</b>", body_style), Paragraph("<b>Status</b>", body_style)],
            [Paragraph("Knee Flexion", body_style), Paragraph(f"{round(knee_flexion, 1)}°", body_style), Paragraph("45° – 90°", body_style), Paragraph(get_status(knee_flexion, 45, 120), body_style)],
            [Paragraph("Knee Valgus (Inward)", body_style), Paragraph(f"{round(knee_valgus, 1)}°", body_style), Paragraph("< 10°", body_style), Paragraph("Elevated" if knee_valgus >= 10 else "Optimal", body_style)],
            [Paragraph("Hip Flexion", body_style), Paragraph(f"{round(hip_flexion, 1)}°", body_style), Paragraph("30° – 80°", body_style), Paragraph(get_status(hip_flexion, 30, 100), body_style)],
            [Paragraph("Trunk Inclination", body_style), Paragraph(f"{round(trunk_inclination, 1)}°", body_style), Paragraph("< 30°", body_style), Paragraph("Elevated" if trunk_inclination > 30 else "Optimal", body_style)],
            [Paragraph("Ankle Dorsiflexion", body_style), Paragraph(f"{round(ankle_dorsiflexion, 1)}°", body_style), Paragraph("20° – 45°", body_style), Paragraph(get_status(ankle_dorsiflexion, 20, 50), body_style)],
            [Paragraph("Landing Symmetry", body_style), Paragraph(f"{round(landing_symmetry, 1)}%", body_style), Paragraph("45% – 55%", body_style), Paragraph("Asymmetric" if (landing_symmetry < 45 or landing_symmetry > 55) else "Optimal", body_style)],
        ]

        metrics_table = Table(metrics_table_data, colWidths=[150, 120, 130, 120])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF5FF')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 14))

        # Recommendations
        story.append(Paragraph("AI Recommendations", section_title_style))
        recs = analysis_data.get("recommendations", [])
        if not recs:
            gen_data = self.generate(landing_features, risk)
            recs = gen_data.get("recommendations", [])

        for rec in recs:
            title = rec.get("title", "Recommendation")
            desc = rec.get("description", "")
            rec_type = rec.get("type", "success")
            bullet_color = "#DC2626" if rec_type == "warning" else "#16A34A"
            story.append(Paragraph(f"<font color='{bullet_color}'><b>• {title}:</b></font> {desc}", body_style))
            story.append(Spacer(1, 4))

        story.append(Spacer(1, 10))

        # Summary Paragraph
        story.append(Paragraph("Summary & Findings", section_title_style))
        summary = analysis_data.get("analysis_summary", {})
        summary_text = summary.get("summary_text") if isinstance(summary, dict) else str(summary)
        if not summary_text:
            gen_data = self.generate(landing_features, risk)
            summary_text = gen_data.get("analysis_summary", {}).get("summary_text", "")
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 14))

        # Clinical Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#94A3B8'),
            alignment=1
        )
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
        story.append(Paragraph("<b>Notice:</b> This report is generated by an AI biomechanical screening system and is intended for athletic training, movement analysis, and risk screening purposes. It is not a medical diagnostic device.", disclaimer_style))

        doc.build(story)
        return output_pdf_path
