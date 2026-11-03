#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
🔱 AETERNA DIGITAL // HAUTE COMMERCIAL PROPOSALS GENERATOR
Generates 3 Official Executive PDF Proposals for Website & Spatial Engineering:
  - TIER I:   Haute Identity & Bespoke Digital Presence (€4,800 EUR)
  - TIER II:  3D Spatial Web & Living PBR Shader Reality (€14,500 EUR)
  - TIER III: Sovereign Enterprise HUD & Mission-Critical Terminal (€38,000 EUR)
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Register Unicode fonts from Windows
FONT_DIR = r"C:\Windows\Fonts"
try:
    pdfmetrics.registerFont(TTFont('Georgia', os.path.join(FONT_DIR, 'georgia.ttf')))
    pdfmetrics.registerFont(TTFont('Georgia-Bold', os.path.join(FONT_DIR, 'georgiab.ttf')))
    pdfmetrics.registerFont(TTFont('Arial', os.path.join(FONT_DIR, 'arial.ttf')))
    pdfmetrics.registerFont(TTFont('Arial-Bold', os.path.join(FONT_DIR, 'arialbd.ttf')))
    SERIF_FONT = 'Georgia'
    SERIF_BOLD = 'Georgia-Bold'
    SANS_FONT = 'Arial'
    SANS_BOLD = 'Arial-Bold'
except Exception as e:
    print(f"[!] Warning registering fonts: {e}")
    SERIF_FONT = 'Times-Roman'
    SERIF_BOLD = 'Times-Bold'
    SANS_FONT = 'Helvetica'
    SANS_BOLD = 'Helvetica-Bold'

# Color Palette: Luxury Obsidian & 24K Bullion Gold
COLOR_OBSIDIAN = colors.HexColor('#0a0b0e')
COLOR_DARK_SURFACE = colors.HexColor('#13151a')
COLOR_GOLD = colors.HexColor('#c5a34e')
COLOR_GOLD_LIGHT = colors.HexColor('#dfc376')
COLOR_GOLD_DARK = colors.HexColor('#8c6f28')
COLOR_TEXT_WHITE = colors.HexColor('#ffffff')
COLOR_TEXT_BODY = colors.HexColor('#2c2f35')
COLOR_TEXT_MUTED = colors.HexColor('#6b707b')
COLOR_BG_CARD = colors.HexColor('#f7f8fa')
COLOR_BORDER = colors.HexColor('#e3e6ec')
COLOR_SUCCESS = colors.HexColor('#1e7e34')


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for total page count & luxury corporate header/footer"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        w, h = A4

        # Top luxury gold accent line
        self.setFillColor(COLOR_GOLD)
        self.rect(0, h - 4*mm, w, 4*mm, fill=1, stroke=0)

        # Header running text
        self.setFont(SANS_BOLD, 7)
        self.setFillColor(COLOR_GOLD_DARK)
        self.drawString(20*mm, h - 11*mm, "▲ AETERNA DIGITAL // HAUTE WEB ARCHITECTURE")
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawRightString(w - 20*mm, h - 11*mm, "OFFICIAL COMMERCIAL PROPOSAL // 2026")

        # Thin header divider line
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(20*mm, h - 13*mm, w - 20*mm, h - 13*mm)

        # Footer running text
        self.line(20*mm, 15*mm, w - 20*mm, 15*mm)
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(20*mm, 10*mm, "Aeterna Digital Atelier • Pomorie HQ • Dimitar Prodromov • Confidential Client Dispatch")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(w - 20*mm, 10*mm, page_str)

        self.restoreState()


def create_proposal_pdf(output_path, data):
    """Builds a complete multi-page branded luxury PDF proposal"""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=22*mm
    )

    styles = getSampleStyleSheet()

    # Custom Luxury Styles
    style_eyebrow = ParagraphStyle(
        'Eyebrow',
        fontName=SANS_BOLD,
        fontSize=8,
        leading=10,
        textColor=COLOR_GOLD_DARK,
        textTransform='uppercase',
        spaceAfter=4
    )
    style_title = ParagraphStyle(
        'ProposalTitle',
        fontName=SERIF_BOLD,
        fontSize=22,
        leading=26,
        textColor=COLOR_OBSIDIAN,
        spaceAfter=6
    )
    style_subtitle = ParagraphStyle(
        'ProposalSubtitle',
        fontName=SERIF_FONT,
        fontSize=12,
        leading=16,
        textColor=COLOR_TEXT_MUTED,
        spaceAfter=14
    )
    style_h2 = ParagraphStyle(
        'Heading2',
        fontName=SERIF_BOLD,
        fontSize=13,
        leading=17,
        textColor=COLOR_OBSIDIAN,
        spaceBefore=12,
        spaceAfter=6
    )
    style_body = ParagraphStyle(
        'BodyDark',
        fontName=SANS_FONT,
        fontSize=9,
        leading=13.5,
        textColor=COLOR_TEXT_BODY,
        spaceAfter=6
    )
    style_body_bold = ParagraphStyle(
        'BodyDarkBold',
        fontName=SANS_BOLD,
        fontSize=9,
        leading=13.5,
        textColor=COLOR_OBSIDIAN
    )
    style_table_cell = ParagraphStyle(
        'TableCell',
        fontName=SANS_FONT,
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXT_BODY
    )
    style_table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName=SANS_BOLD,
        fontSize=8.5,
        leading=12,
        textColor=COLOR_OBSIDIAN
    )
    style_investment_num = ParagraphStyle(
        'InvestmentNum',
        fontName=SERIF_BOLD,
        fontSize=24,
        leading=28,
        textColor=COLOR_GOLD_DARK,
        alignment=1
    )

    story = []

    # Title & Metadata
    story.append(Paragraph(data['eyebrow'], style_eyebrow))
    story.append(Paragraph(data['title'], style_title))
    story.append(Paragraph(data['subtitle'], style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_GOLD, spaceBefore=0, spaceAfter=12))

    # Meta Info Grid Table
    meta_data = [
        [
            Paragraph("<b>Target Sector:</b> " + data['sector'], style_body),
            Paragraph("<b>Timeline:</b> " + data['timeline'], style_body)
        ],
        [
            Paragraph("<b>Indicative Investment:</b> " + data['investment_short'], style_body),
            Paragraph("<b>SLA & Sovereignty:</b> " + data['sla_short'], style_body)
        ],
    ]
    t_meta = Table(meta_data, colWidths=[85*mm, 85*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 1. Executive Summary
    story.append(Paragraph("1. EXECUTIVE SUMMARY & STRATEGIC MISSION", style_h2))
    story.append(Paragraph(data['exec_summary'], style_body))
    story.append(Spacer(1, 6))

    # 2. Architectural Stack & Capabilities Table
    story.append(Paragraph("2. ARCHITECTURAL STACK & PERFORMANCE ENGINE", style_h2))
    stack_rows = [[Paragraph("<b>Component / Layer</b>", style_table_cell_bold), Paragraph("<b>Technology & Specifications</b>", style_table_cell_bold)]]
    for layer, tech in data['stack']:
        stack_rows.append([Paragraph(layer, style_table_cell_bold), Paragraph(tech, style_table_cell)])
    t_stack = Table(stack_rows, colWidths=[50*mm, 120*mm])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_WHITE),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 8))

    # 3. Deliverables & Production Modules
    story.append(Paragraph("3. SCOPE OF DELIVERABLES & CORE MODULES", style_h2))
    deliv_rows = [[Paragraph("<b>#</b>", style_table_cell_bold), Paragraph("<b>Module / Specification</b>", style_table_cell_bold), Paragraph("<b>Scope & Deliverable Description</b>", style_table_cell_bold)]]
    for i, (mod, desc) in enumerate(data['deliverables'], 1):
        deliv_rows.append([Paragraph(f"<b>{i:02d}</b>", style_table_cell_bold), Paragraph(mod, style_table_cell_bold), Paragraph(desc, style_table_cell)])
    t_deliv = Table(deliv_rows, colWidths=[10*mm, 55*mm, 105*mm])
    t_deliv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_WHITE),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_deliv)
    story.append(Spacer(1, 8))

    # 4. Phased Milestones & Delivery Roadmap
    story.append(Paragraph("4. ROADMAP & DELIVERY PHASES", style_h2))
    phase_rows = [[Paragraph("<b>Phase</b>", style_table_cell_bold), Paragraph("<b>Duration</b>", style_table_cell_bold), Paragraph("<b>Key Milestones & Verification Protocol</b>", style_table_cell_bold)]]
    for phase, dur, desc in data['phases']:
        phase_rows.append([Paragraph(phase, style_table_cell_bold), Paragraph(dur, style_table_cell), Paragraph(desc, style_table_cell)])
    t_phase = Table(phase_rows, colWidths=[30*mm, 25*mm, 115*mm])
    t_phase.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_WHITE),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_phase)
    story.append(Spacer(1, 8))

    # 5. Commercial Investment & Payment Schedule
    story.append(Paragraph("5. COMMERCIAL INVESTMENT & COMMISSION STRUCTURE", style_h2))
    
    inv_box = [
        [
            Paragraph("<b>TOTAL FIXED INVESTMENT TIER</b>", style_body_bold),
            Paragraph("<b>DEPLOYMENT TERMS</b>", style_body_bold)
        ],
        [
            Paragraph(f"<font color='{COLOR_GOLD_DARK.hexval()}'><b>{data['total_investment']}</b></font><br/><font size='7' color='#6b707b'>{data['total_bgn']}</font>", style_title),
            Paragraph(data['payment_terms'], style_body)
        ]
    ]
    t_inv = Table(inv_box, colWidths=[85*mm, 85*mm])
    t_inv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_GOLD),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_inv)
    story.append(Spacer(1, 8))

    # 6. Intellectual Property & Sovereign SLA Guarantees
    story.append(Paragraph("6. IP OWNERSHIP & SOVEREIGN GUARANTEES", style_h2))
    story.append(Paragraph(
        "<b>100% Client Intellectual Property:</b> Upon final milestone release, all source code, WebGL shaders, 3D assets, design systems, and documentation are transferred in full to the client without third-party vendor lock-in.<br/>"
        "<b>Zero Dependency Bloat:</b> Hand-crafted architecture with 0 unnecessary npm bloat, guaranteed 100/100 Lighthouse performance, sub-second edge distribution, and guaranteed sub-16ms render frames (60-120 FPS).<br/>"
        "<b>Executive SLA:</b> Includes dedicated priority engineering support, monthly security patches, and direct architectural concierge access.",
        style_body
    ))
    story.append(Spacer(1, 10))

    # 7. Signature Block
    sign_table_data = [
        [
            Paragraph("<b>ISSUED BY:</b><br/>Aeterna Digital Haute Atelier<br/>Dimitar Prodromov, Principal Architect<br/>Pomorie HQ // Global Digital Network", style_body),
            Paragraph("<b>ACCEPTED & CONFIRMED BY:</b><br/>Principal Client Signature / Corporate Seal<br/><br/>___________________________________<br/>Date: ________________________", style_body)
        ]
    ]
    t_sign = Table(sign_table_data, colWidths=[85*mm, 85*mm])
    t_sign.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(KeepTogether([t_sign]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[✓] Generated: {output_path} ({os.path.getsize(output_path):,} bytes)")


# ─────────────────────────────────────────────────────────────────────────────
# PROPOSAL DATA DICTIONARIES
# ─────────────────────────────────────────────────────────────────────────────

PROPOSALS = [
    {
        'filename': 'PROPOSAL_TIER_1_HAUTE_PRESENCE.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // TIER I',
        'title': 'HAUTE IDENTITY & BESPOKE WEB PRESENCE',
        'subtitle': 'Editorial Luxury Aesthetics • Sub-Second Edge Performance • Bespoke Corporate Presence',
        'sector': 'Luxury Boutiques, Private Medical & Legal Practices, Haute Architecture',
        'timeline': '14 – 21 Business Days',
        'investment_short': '€4,800 EUR Fixed',
        'sla_short': '6 Months Dedicated SLA Included',
        'total_investment': '€4,800 EUR',
        'total_bgn': 'Equivalent: 9,388 BGN (Excl. VAT)',
        'payment_terms': '• 40% Mobilization Deposit<br/>• 30% Mid-Phase Delivery<br/>• 30% Final Launch & Edge Cutover',
        'exec_summary': (
            'Tier I is engineered for luxury brands and executive practices that reject boilerplate WordPress templates '
            'and bloated frameworks. We architect a custom, hand-coded digital flagship combining high-fashion editorial typography, '
            'cinematic micro-interactions, silky smooth scrolling physics, and instant sub-second edge delivery. '
            'The result is an enduring digital asset that commands immediate prestige and delivers 100/100 Lighthouse benchmark scores.'
        ),
        'stack': [
            ('Frontend Architecture', 'Hand-Crafted HTML5 / TypeScript / Modular ESNext (Zero Framework Bloat)'),
            ('Motion & Physics', 'Lenis Smooth Scroll Engine, GPU-accelerated CSS Matrix Transforms, Custom Micro-Ripples'),
            ('Typography & Editorial', 'Haute Couture Typography (Playfair / Cormorant / Cinzel / Bespoke Serifs)'),
            ('Edge & Performance', 'Cloudflare Edge / Vercel Global Edge Network with Sub-250ms TTFB Globally'),
            ('SEO & Social OpenGraph', '100/100 Structured JSON-LD Schema, Dynamic High-Res OpenGraph Preview Cards'),
            ('Inquiry & CRM Gateway', 'Encrypted Client Brief Dispatch with Email / WhatsApp / Direct API Hook'),
        ],
        'deliverables': [
            ('Bespoke Brand Digital Identity', 'High-fashion UI design system, custom iconography, luxury dark/light palette curation.'),
            ('Responsive Multi-Screen Flagship', 'Pixel-perfect fluid layouts across UltraWide 4K monitors, MacBook Retina, and mobile.'),
            ('Interactive Service Showcase', 'High-impact grid showcase presenting services, case studies, and brand narrative.'),
            ('Encrypted Brief & Inquiries', 'Custom inquiry modal with NDA verification, corporate email dispatch, and instant lead capture.'),
            ('Sub-Second Performance Hardening', 'Asset compression, WebP/AVIF vector pipelines, 100/100 Lighthouse certification.'),
            ('Production Edge Deployment', 'DNS configuration, SSL certificate issuance, automated CI/CD pipeline setup.'),
        ],
        'phases': [
            ('Phase 1: Architecture & UI', '5 Days', 'Design system definition, typography pairing, interactive Figma prototype sign-off.'),
            ('Phase 2: Code & Interaction', '10 Days', 'Hand-coded frontend implementation, smooth physics integration, responsive QA.'),
            ('Phase 3: Hardening & Deploy', '6 Days', 'Lighthouse 100/100 optimization, edge routing, DNS switchover, handover documentation.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_2_SPATIAL_3D.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // TIER II (FEATURED)',
        'title': '3D SPATIAL WEB & LIVING PBR SHADER REALITY',
        'subtitle': 'Real-Time WebGL / WebGPU Pipelines • 4D Molten Gold & Obsidian • Interactive Product Spatialization',
        'sector': 'Haute Horlogerie, Fine High Jewelry, Luxury Supercars, High-Tech Showcases',
        'timeline': '30 – 45 Business Days',
        'investment_short': '€14,500 EUR Fixed',
        'sla_short': '12 Months Dedicated SLA Included',
        'total_investment': '€14,500 EUR',
        'total_bgn': 'Equivalent: 28,360 BGN (Excl. VAT)',
        'payment_terms': '• 35% Initiation Advance<br/>• 35% Interactive Shader Alpha<br/>• 30% Final Edge Deployment',
        'exec_summary': (
            'Tier II represents the pinnacle of modern web innovation: an interactive 3D spatial world executed entirely in-browser '
            'without external plugins. We deploy real-time WebGL and WebGPU shader engines featuring living molten metals, '
            'anisotropic gold foil, deep obsidian lacquer, physical glass caustics, and full 360° product configurators. '
            'Designed for luxury houses and technology pioneers seeking an unforgettable digital centerpiece.'
        ),
        'stack': [
            ('3D Graphics Substrate', 'WebGL 2.0 / WebGPU Pipeline with Custom GLSL Shaders & Raymarching'),
            ('Physical Material Shaders', 'Conductor Fresnel 24K Gold, Obsidian Piano Lacquer, Clearcoat Glass Caustics'),
            ('Kinetic Physics & Audio', 'Spring Damping Physics, Spatial 3D Audio synthesis, Micro-Haptic Visual Feedback'),
            ('Frame Budget & Optimization', 'Strict 60-120 FPS frame timing, dynamic resolution scaling, zero thermal throttling'),
            ('Asset Compression Pipeline', 'Draco Mesh Geometry & KTX2 Texture compression for sub-second 3D model streaming'),
            ('CMS & Asset Management', 'Headless CMS for effortless updates to 3D showcases, case studies, and media assets'),
        ],
        'deliverables': [
            ('Full-Bleed 3D Living Background', 'Procedural GPU fluid vortex, molten gold tendrils, floating mirror spheres with drop shadows.'),
            ('Interactive 3D Product Atelier', 'Real-time 360° rotation, parts disassembly/explosion view, micron-level metal reflections.'),
            ('Cinematic Full-Page Transitions', 'Seamless spatial transitions between sections without traditional page reloads.'),
            ('Curated Case Study Showcase', 'Continuous autoplay 4K video cards, high-contrast typography, metrics HUD overlays.'),
            ('Bespoke Soundscape Integration', 'Subtle, ultra-luxury interactive audio feedback designed to accompany touch & hover.'),
            ('Full Device Parity Guarantee', 'Optimized fallback for low-power mobile GPUs ensuring zero stutter across all devices.'),
        ],
        'phases': [
            ('Phase 1: 3D Art & Shaders', '12 Days', '3D model topology optimization, custom GLSL shader synthesis, material look-dev.'),
            ('Phase 2: Spatial Integration', '18 Days', 'Interactive camera controls, Lenis scroll braiding, product configurator logic.'),
            ('Phase 3: FPS Optimization', '12 Days', 'GPU draw-call batching, multi-browser stress testing, edge deployment & training.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_3_SOVEREIGN_ENTERPRISE.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // TIER III',
        'title': 'SOVEREIGN ENTERPRISE HUD & HIGH-TECH TERMINAL',
        'subtitle': 'Full-Stack Sovereign Web Platform • Real-Time WebSockets • Post-Quantum Cryptography & High-Throughput Engine',
        'sector': 'Private Wealth Terminals, Biotech & Clinical Platforms, Decentralized Networks, Institutional Portals',
        'timeline': '60 – 90 Business Days',
        'investment_short': '€38,000 EUR Fixed',
        'sla_short': '24 Months Enterprise SLA Included',
        'total_investment': '€38,000 EUR',
        'total_bgn': 'Equivalent: 74,320 BGN (Excl. VAT)',
        'payment_terms': '• 30% Inception & Architecture<br/>• 30% Functional Core Alpha<br/>• 20% Beta & Security Audit<br/>• 20% Production Go-Live',
        'exec_summary': (
            'Tier III is a sovereign mission-critical software portal engineered to enterprise defense-grade standards. '
            'Combining high-frequency WebSockets telemetry, dark obsidian HUD interface paradigms, cryptographic zero-knowledge '
            'authentication, and high-performance Rust/WASM or Go microservices. Tailored for family offices, private asset management, '
            'biomedical research institutions, and decentralized networks requiring absolute data sovereignty.'
        ),
        'stack': [
            ('High-Speed Substrate', 'Rust Backend Engine with Actix-Web / Axum, WASM / WebGPU Frontend Acceleration'),
            ('Real-Time Data Pipeline', 'Sub-millisecond WebSocket Telemetry, Redis In-Memory Ring Buffers, Zero-Copy WAL'),
            ('Security & Cryptography', 'Post-Quantum Cryptography (ML-KEM / Dilithium), Mutual TLS, Hardware Key / Biometrics'),
            ('Database & Persistence', 'TimescaleDB / RocksDB for microsecond historical time-series telemetry caching'),
            ('Resilience & Sovereignty', 'Zero Third-Party Cloud Lock-In, Docker/Kubernetes or Bare-Metal Dedicated Deployment'),
            ('Compliance & Hardening', 'SOC-2 Type II, GDPR, HIPAA-compliant encryption at rest and in transit'),
        ],
        'deliverables': [
            ('Sovereign Multi-Node HUD', 'Dark obsidian command portal with live streaming telemetry, interactive charts, and node health.'),
            ('Biometric / Cryptographic Auth', 'Hardware key (FIDO2 / WebAuthn), Knox-grade security, enterprise role-based access control (RBAC).'),
            ('Real-Time Data Visualizer', 'Dynamic WebGL/Canvas2D charts rendering 100,000+ data points at 60 FPS without UI freezing.'),
            ('Automated Reporting Engine', 'Instant server-side vector PDF generation for executive statements, audit logs, and compliance.'),
            ('Full Penetration & Security Audit', 'External vulnerability assessment, zero-day threat analysis, code freeze certification.'),
            ('Institutional White-Glove SLA', '24/7 critical incident response, redundant failover management, dedicated engineer hotline.'),
        ],
        'phases': [
            ('Phase 1: Security & Architecture', '20 Days', 'System specification, cryptographic threat modeling, database schema & API contracts.'),
            ('Phase 2: Core Engine & Telemetry', '35 Days', 'High-throughput Rust/WebSocket service, WebGL dashboard rendering, auth layer.'),
            ('Phase 3: Hardening, Audit & Go-Live', '25 Days', 'Security penetration testing, failover drill, institutional handover & staff training.'),
        ]
    }
]


def main():
    target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "proposals")
    os.makedirs(target_dir, exist_ok=True)
    print("=" * 80)
    print("🔱 GENERATING AETERNA HAUTE COMMERCIAL PDF PROPOSALS")
    print(f"Destination: {os.path.abspath(target_dir)}")
    print("=" * 80)

    for p in PROPOSALS:
        out_file = os.path.join(target_dir, p['filename'])
        create_proposal_pdf(out_file, p)

    print("=" * 80)
    print("[✓] ALL 3 PROPOSALS GENERATED SUCCESSFULLY")
    print("=" * 80)


if __name__ == '__main__':
    main()
