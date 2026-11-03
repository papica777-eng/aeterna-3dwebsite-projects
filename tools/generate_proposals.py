#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
🔱 AETERNA DIGITAL // HAUTE COMMERCIAL PROPOSALS GENERATOR v4.0 (USD / GLOBAL)
Bespoke, transparent proposals with calibrated pricing & interactive add-on catalog:
  - TIER 01: Express Business Presence ($1,500 USD / €1,390 EUR)
  - TIER 02: Premium Brand & Corporate Pro ($2,800 USD / €2,590 EUR)
  - TIER 03: 3D Spatial Experience & Luxury ($4,900 USD / €4,550 EUR)
  - TIER 04: Enterprise Platform & E-Commerce ($8,900 USD / €8,250 EUR)
Core Terms:
  - 100% Client Code, Repository & Asset Ownership (zero vendor lock-in)
  - First 3 Months of Comprehensive Care & Backups Included ($0)
  - Ongoing Care starting Month 4: $200/mo (Standard) or $500/mo (with Active SEO)
  - Optional Add-ons: Domain Registration (+$50), Dedicated SSL (+$70), etc.
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

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
    SERIF_FONT = 'Times-Roman'
    SERIF_BOLD = 'Times-Bold'
    SANS_FONT = 'Helvetica'
    SANS_BOLD = 'Helvetica-Bold'

COLOR_OBSIDIAN = colors.HexColor('#0a0b0e')
COLOR_GOLD = colors.HexColor('#c5a34e')
COLOR_GOLD_DARK = colors.HexColor('#8c6f28')
COLOR_TEXT_BODY = colors.HexColor('#2c2f35')
COLOR_TEXT_MUTED = colors.HexColor('#6b707b')
COLOR_BG_CARD = colors.HexColor('#f8f9fb')
COLOR_BORDER = colors.HexColor('#e2e5eb')
COLOR_GREEN = colors.HexColor('#16833b')
COLOR_PAYPAL_BLUE = colors.HexColor('#003087')


class NumberedCanvas(canvas.Canvas):
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

        # Top Gold Strip
        self.setFillColor(COLOR_GOLD)
        self.rect(0, h - 4*mm, w, 4*mm, fill=1, stroke=0)

        # Header running line
        self.setFont(SANS_BOLD, 7)
        self.setFillColor(COLOR_GOLD_DARK)
        self.drawString(18*mm, h - 11*mm, "▲ AETERNA DIGITAL // OFFICIAL COMMERCIAL PROPOSAL")
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawRightString(w - 18*mm, h - 11*mm, "BESPOKE WEB ARCHITECTURE & DIGITAL FLAGSHIPS // 2026")

        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(18*mm, h - 13*mm, w - 18*mm, h - 13*mm)

        # Footer running line
        self.line(18*mm, 14*mm, w - 18*mm, 14*mm)
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(18*mm, 9*mm, "AETERNA Technologies EOOD • Dimitar Stavrev Prodromov • Pomorie HQ • Direct Tel: +359 884 638 640 / +359 896 849 882 • dimitar@aeterna.website")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(w - 18*mm, 9*mm, page_str)

        self.restoreState()


def create_proposal_pdf(output_path, data):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=18*mm,
        rightMargin=18*mm,
        topMargin=18*mm,
        bottomMargin=18*mm
    )

    style_eyebrow = ParagraphStyle('Eyebrow', fontName=SANS_BOLD, fontSize=8, leading=10, textColor=COLOR_GOLD_DARK)
    style_title = ParagraphStyle('Title', fontName=SERIF_BOLD, fontSize=19, leading=23, textColor=COLOR_OBSIDIAN, spaceAfter=3)
    style_subtitle = ParagraphStyle('Subtitle', fontName=SERIF_FONT, fontSize=10.5, leading=14.5, textColor=COLOR_TEXT_MUTED, spaceAfter=8)
    style_h2 = ParagraphStyle('H2', fontName=SERIF_BOLD, fontSize=11.5, leading=14.5, textColor=COLOR_OBSIDIAN, spaceBefore=7, spaceAfter=3)
    style_body = ParagraphStyle('Body', fontName=SANS_FONT, fontSize=8.5, leading=12, textColor=COLOR_TEXT_BODY, spaceAfter=3)
    style_body_bold = ParagraphStyle('BodyBold', fontName=SANS_BOLD, fontSize=8.5, leading=12, textColor=COLOR_OBSIDIAN)
    style_cell = ParagraphStyle('Cell', fontName=SANS_FONT, fontSize=8, leading=11, textColor=COLOR_TEXT_BODY)
    style_cell_bold = ParagraphStyle('CellBold', fontName=SANS_BOLD, fontSize=8, leading=11, textColor=COLOR_OBSIDIAN)
    style_cell_green = ParagraphStyle('CellGreen', fontName=SANS_BOLD, fontSize=8, leading=11, textColor=COLOR_GREEN)

    story = []

    # Title & Header
    story.append(Paragraph(data['eyebrow'], style_eyebrow))
    story.append(Paragraph(data['title'], style_title))
    story.append(Paragraph(data['subtitle'], style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_GOLD, spaceBefore=0, spaceAfter=6))

    # Meta Quick Info Box
    meta_box = [
        [
            Paragraph("<b>Target Audience:</b> " + data['target'], style_body),
            Paragraph("<b>Delivery Timeline:</b> " + data['timeline'], style_body)
        ],
        [
            Paragraph("<b>Base Fixed Price:</b> <font color='#8c6f28'><b>" + data['price_usd'] + "</b> (" + data['price_eur'] + ")</font>", style_body),
            Paragraph("<b>Code Ownership:</b> 100% Client Permanent Property", style_body)
        ],
        [
            Paragraph("<b>Complimentary Warranty:</b> First 3 Months Included Free ($0)", style_body),
            Paragraph("<b>Ongoing Care (Month 4+):</b> $200/mo (Standard) or $500/mo (with Active SEO)", style_body)
        ]
    ]
    t_meta = Table(meta_box, colWidths=[87*mm, 87*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 4.5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 5))

    # 1. What You Actually Receive
    story.append(Paragraph("1. WHAT YOU RECEIVE AS A CLIENT (CLEAR DELIVERABLES)", style_h2))
    story.append(Paragraph(data['what_you_get_intro'], style_body))

    deliv_rows = [[Paragraph("<b>#</b>", style_cell_bold), Paragraph("<b>Website Feature</b>", style_cell_bold), Paragraph("<b>Real Business Value & Client Benefit</b>", style_cell_bold)]]
    for i, (item, benefit) in enumerate(data['deliverables'], 1):
        deliv_rows.append([Paragraph(f"<b>{i:02d}</b>", style_cell_bold), Paragraph(item, style_cell_bold), Paragraph(benefit, style_cell)])
    t_deliv = Table(deliv_rows, colWidths=[9*mm, 53*mm, 112*mm])
    t_deliv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_deliv)
    story.append(Spacer(1, 5))

    # 2. Add-Ons & Extras Catalog
    story.append(Paragraph("2. POPULAR ADD-ONS & EXTRAS CATALOG (SELECTABLE UPON CHECKOUT)", style_h2))
    addon_rows = [
        [Paragraph("<b>Add-On / Feature</b>", style_cell_bold), Paragraph("<b>Description & Specification</b>", style_cell_bold), Paragraph("<b>Price (One-Time)</b>", style_cell_bold)],
        [Paragraph("<b>Custom Domain Name</b>", style_cell_bold), Paragraph("Annual registration (.com / .eu / .bg) + complete Cloudflare DNS configuration", style_cell), Paragraph("<b>+$50 USD</b>", style_cell_green)],
        [Paragraph("<b>Dedicated SSL Certificate</b>", style_cell_bold), Paragraph("Military-grade HTTPS encryption, HSTS headers & security lock", style_cell), Paragraph("<b>+$70 USD</b>", style_cell_green)],
        [Paragraph("<b>Multi-Language Expansion</b>", style_cell_bold), Paragraph("Full translation engine and localized navigation (+1 additional language)", style_cell), Paragraph("<b>+$350 USD</b>", style_cell_green)],
        [Paragraph("<b>Booking / Calendar Engine</b>", style_cell_bold), Paragraph("Interactive appointment scheduler synced with Google Calendar / Outlook", style_cell), Paragraph("<b>+$400 USD</b>", style_cell_green)],
        [Paragraph("<b>Core Web Vitals Hyper-Tuning</b>", style_cell_bold), Paragraph("Edge CDN caching, AVIF image compression, guaranteed &lt; 0.5s global latency", style_cell), Paragraph("<b>+$300 USD</b>", style_cell_green)],
        [Paragraph("<b>Live WhatsApp / AI Chat Widget</b>", style_cell_bold), Paragraph("Automated lead capture answering client inquiries 24/7", style_cell), Paragraph("<b>+$250 USD</b>", style_cell_green)],
    ]
    t_addon = Table(addon_rows, colWidths=[48*mm, 96*mm, 30*mm])
    t_addon.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_addon)
    story.append(Spacer(1, 5))

    # 3. Why We Outperform 90% of Traditional Agencies
    story.append(Paragraph("3. WHY WE OUTPERFORM 90% OF TRADITIONAL AGENCIES & FREELANCERS", style_h2))
    comp_rows = [
        [Paragraph("<b>Criteria / Metric</b>", style_cell_bold), Paragraph("<b>Standard Agency (Bloated WordPress / Themes)</b>", style_cell_bold), Paragraph("<b>Aeterna Digital (Bespoke Engineered Standard)</b>", style_cell_bold)]
    ]
    for param, bad, good in data['comparison']:
        comp_rows.append([
            Paragraph(param, style_cell_bold),
            Paragraph(bad, style_cell),
            Paragraph(good, style_cell_green)
        ])
    t_comp = Table(comp_rows, colWidths=[40*mm, 67*mm, 67*mm])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 5))

    # 4. Terms, Pricing & Instant Checkout
    story.append(Paragraph("4. OWNERSHIP COVENANT, TAX INVOICING & INSTANT SETTLEMENT (STRIPE & PAYPAL)", style_h2))
    
    pay_content = (
        f"<b>Base Turnkey Investment:</b> <font color='#8c6f28' size='10.5'><b>{data['price_usd']} ({data['price_eur']})</b></font><br/>"
        f"<b>100% Code & Asset Ownership:</b> Upon project completion and final settlement, the entire codebase, domain, and database become 100% your unrestricted legal and technical property with zero licensing fees or platform lock-in.<br/>"
        f"<b>Warranty & Ongoing Care:</b> First 3 months are included free ($0). Starting month 4, ongoing maintenance is optionally $200/month (Standard Maintenance) or $500/month (Enterprise Maintenance + Active Monthly Google SEO).<br/>"
        f"<b>Payment Milestone:</b> Flexible choice: 50% upfront deposit to initiate production (50% on final delivery) or 100% full turnkey settlement.<br/>"
        f"<b>Official Tax Invoice:</b> Issued automatically immediately to your email via Stripe & PayPal Merchant Services.<br/><br/>"
        f"<b>SECURE ONLINE CHECKOUT (CREDIT CARDS, APPLE PAY & PAYPAL):</b><br/>"
        f"• <b>Stripe 50% Upfront Deposit:</b> <font color='#003087'><u><a href='{data.get('stripe_dep_link', '#')}'>[ PAY 50% DEPOSIT VIA STRIPE ]</a></u></font><br/>"
        f"• <b>Stripe 100% Full Settlement:</b> <font color='#003087'><u><a href='{data.get('stripe_full_link', '#')}'>[ PAY 100% FULL SETTLEMENT VIA STRIPE ]</a></u></font><br/>"
        f"• <b>PayPal Official Checkout:</b> <font color='#003087'><u><a href='{data['paypal_link']}'>[ PAY VIA PAYPAL & DEBIT/CREDIT CARDS ]</a></u></font><br/>"
        f"• <b>Corporate Wire Transfer (SEPA / SWIFT):</b> Available upon request; pro-forma issued to your corporate billing department."
    )
    t_pay = Table([[Paragraph(pay_content, style_body)]], colWidths=[174*mm])
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_GOLD),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 6))

    # 5. Bilateral Agreement Block
    sign_data = [
        [
            Paragraph("<b>EXECUTED BY STUDIO:</b><br/>AETERNA Technologies EOOD // Pomorie HQ<br/>Dimitar Stavrev Prodromov (EU PIC: 865986222)<br/>UIC / VAT: BG101327948<br/>Trapezitsa St. No. 6, 8200 Pomorie, Bulgaria<br/>Direct Tel: +359 884 638 640 / +359 896 849 882<br/>Official Email: billing@aeterna.website", style_body),
            Paragraph("<b>ACCEPTED & CONFIRMED BY CLIENT:</b><br/>Company Name: __________________________<br/>Authorized Signatory: ___________________<br/>Date: ________________________ 2026", style_body)
        ]
    ]
    t_sign = Table(sign_data, colWidths=[87*mm, 87*mm])
    t_sign.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(KeepTogether([t_sign]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[✓] Generated PDF: {output_path} ({os.path.getsize(output_path):,} bytes)")


# ─────────────────────────────────────────────────────────────────────────────
# 4 CALIBRATED COMMERCIAL TIERS (LOWEST = $1,500 USD AS MANDATED)
# ─────────────────────────────────────────────────────────────────────────────

PROPOSALS_V2 = [
    {
        'filename': 'PROPOSAL_TIER_1_EXPRESS_START.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // PACKAGE 01 (EXPRESS BUSINESS)',
        'title': 'EXPRESS BUSINESS PRESENCE PACKAGE',
        'subtitle': 'A sleek, lightning-fast business website (up to 5 pages) • Live in just 7 to 10 days',
        'target': 'Boutiques, medical practices, legal counsel, fine dining, artisans, and expanding startups',
        'timeline': '7 – 10 business days',
        'price_usd': '$1,500 USD',
        'price_eur': '€1,390 EUR',
        'sla': 'First 3 months free, then $200/mo (or $500/mo with SEO)',
        'stripe_full_link': 'https://buy.stripe.com/9B6cMZga86Qa9IE8gDfAc00',
        'stripe_dep_link': 'https://buy.stripe.com/dRm5kx7DCcau5soeF1fAc06',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=billing@aeterna.website&currency_code=USD&amount=1500&item_name=Aeterna+Web+Development+Package+1+Express+Start',
        'what_you_get_intro': (
            'Engineered for businesses that need a clean, authoritative, and rock-solid digital presence without '
            'overpaying or waiting months. You receive a high-converting digital asset that turns casual visitors into paying customers.'
        ),
        'deliverables': [
            ('Modern Corporate Website (up to 5 pages)', 'Home, About Us, Services & Pricing, Showcase/Portfolio, and Contact/Inquiry.'),
            ('Flawless Mobile Responsive Design', 'Over 80% of your clients browse on smartphones. Your site will look immaculate on iPhone & Android.'),
            ('Sub-Second Load Speed (< 0.8s)', 'Nobody waits for slow websites. Instant loading keeps customers engaged and multiplies conversions.'),
            ('1-Click Direct WhatsApp & Phone Call', 'Immediate call and message buttons allow clients to reach you in 1 touch.'),
            ('Direct Client Inquiry Form', 'Inquiries land straight into your personal email inbox instantly with zero spam.'),
            ('Google Search & Maps Indexing', 'Full setup in Google Search Console and Google Maps so local and global customers can find you.'),
            ('Corporate Email & Cloud Deployment', 'Configuration of branded professional mailboxes (e.g. office@yourcompany.com).'),
        ],
        'comparison': [
            ('Page Load Latency', 'Sluggish (4–8 seconds due to bloated plugins)', 'Sub-second speed (< 0.8s globally)'),
            ('Stability & Security', 'Prone to crashes on every WordPress update', 'Rock-solid bespoke code with 0 attack surface'),
            ('Asset Ownership', 'Locked into endless monthly builder subscriptions', '100% your permanent property with zero royalties'),
            ('Mobile Ergonomics', 'Misaligned text, awkward menus, broken buttons', 'Pixel-perfect precision tailored to every screen size'),
        ],
        'phases': [
            ('Phase 1: Concept & Content Alignment', '2 days', 'Review copy, typography, color palette, and corporate identity.'),
            ('Phase 2: Bespoke Engineering & Testing', '4 days', 'Full-code implementation, mobile optimization, and forms setup.'),
            ('Phase 3: Domain Launch & Handoff', '1–2 days', 'Domain deployment, SSL certificate issuance, and analytics activation.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_2_BUSINESS_PRO.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // PACKAGE 02 (PREMIUM BRAND PRO)',
        'title': 'PREMIUM BRAND & CORPORATE PRO PACKAGE',
        'subtitle': 'Comprehensive corporate digital flagship with bespoke luxury design, full Google SEO, and CMS control',
        'target': 'Established firms, private clinics, luxury hospitality, premier real estate, and architectural ateliers',
        'timeline': '14 – 20 business days',
        'price_usd': '$2,800 USD',
        'price_eur': '€2,590 EUR',
        'sla': 'First 3 months free, then $200/mo (or $500/mo with SEO)',
        'stripe_full_link': 'https://buy.stripe.com/9B614hcXW4I25sodAXfAc01',
        'stripe_dep_link': 'https://buy.stripe.com/8x27sF1fegqKg72eF1fAc07',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=billing@aeterna.website&currency_code=USD&amount=2800&item_name=Aeterna+Web+Development+Package+2+Business+Pro',
        'what_you_get_intro': (
            'Package 02 establishes your company as an undisputed industry leader. '
            'Designed specifically for brands that want to command prestige, justify premium pricing, and attract high-net-worth clientele.'
        ),
        'deliverables': [
            ('Comprehensive Flagship (up to 10-12 pages)', 'Complete layout detailing services, case studies, team dossiers, credentials, and news.'),
            ('100% Bespoke Architectural Design', 'Zero generic templates. Handcrafted layout sculpted specifically around your brand ethos.'),
            ('Intuitive Content Management', 'Effortlessly update texts, images, case studies, or publish articles in 2 clicks from any phone.'),
            ('Full Semantic Google SEO Architecture', 'Structured schema data and keyword optimization to rank on page 1 of Google searches.'),
            ('Cinematic Scroll Motion & Transitions', 'Silky, fluid navigation reminiscent of premier Swiss and Parisian luxury houses.'),
            ('Interactive Quote Calculator / Filter', 'Empowers clients to configure inquiries or filter through your past projects with ease.'),
            ('Advanced Google Analytics & Lead Tracking', 'Complete visibility into where your leads come from, conversions, and visitor behaviour.'),
        ],
        'comparison': [
            ('Visual Impression', 'Cookie-cutter theme looking like 1,000 other sites', 'Distinctive signature aesthetic that commands trust'),
            ('Google Visibility', 'Basic meta tags with zero indexing depth', 'Full semantic schema markup driving organic search traffic'),
            ('Content Updates', 'Complex and fragile, requiring paid developer help', 'Intuitive and seamless, update in 60 seconds from your phone'),
            ('Form Security', 'Vulnerable to spam and injection exploits', 'Hardened endpoints with cryptographic spam shielding'),
        ],
        'phases': [
            ('Phase 1: Brand Strategy & Prototype', '4 days', 'Competitor analysis, layout wireframing, and design sign-off.'),
            ('Phase 2: Code Synthesis & Motion Engineering', '10 days', 'Frontend development, CMS integration, and SEO optimization.'),
            ('Phase 3: Quality Audit & Live Deployment', '3–4 days', 'Cross-browser testing, staff training, and live public launch.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_3_SPATIAL_3D.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // PACKAGE 03 (3D SPATIAL & LUXURY)',
        'title': '3D SPATIAL EXPERIENCE & LUXURY FLAGSHIP',
        'subtitle': 'Real-time WebGL interactive 3D, liquid gold and obsidian shaders, cinematic video backgrounds, and spatial audio',
        'target': 'Haute horlogerie, high jewelry, luxury real estate, supercars, and high-tech innovation flagships',
        'timeline': '25 – 35 business days',
        'price_usd': '$4,900 USD',
        'price_eur': '€4,550 EUR',
        'sla': 'First 3 months free, then $200/mo (or $500/mo with SEO)',
        'stripe_full_link': 'https://buy.stripe.com/9B6cMZ5vub6q0840ObfAc02',
        'stripe_dep_link': 'https://buy.stripe.com/fZu3cp7DC0rMdYU0ObfAc08',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=billing@aeterna.website&currency_code=USD&amount=4900&item_name=Aeterna+Web+Development+Package+3+Spatial+3D',
        'what_you_get_intro': (
            'The highest echelon of digital craft. Your website ceases to be an ordinary page and becomes an interactive digital showpiece. '
            'Clients can rotate your creations in full 3D, inspect micron-level metallic reflections, and experience your brand on par with Apple, Rolex, or Cartier.'
        ),
        'deliverables': [
            ('Real-Time Browser 3D Spatial Engine', 'Embedded interactive 3D model rotated via mouse or touchscreen with zero plugins or downloads.'),
            ('Procedural Liquid Gold Shaders', 'Bespoke WebGL visual shaders simulating liquid obsidian, gold reflections, and studio lighting.'),
            ('Seamless 4K Cinematic Background Video', 'Custom-looped video background with instant streaming and zero stutter.'),
            ('Exploded 3D Component Inspection', 'Allows customers to disassemble mechanisms or architectural plans in spatial 3D.'),
            ('Guaranteed 60–120 FPS Fluidity', 'Ultra-optimized rendering engine ensuring butter-smooth motion on any modern smartphone.'),
            ('Curated Interactive Micro-Soundscape', 'Subtle haptic-like sound feedback on interactions for an immersive luxury tactile feel.'),
            ('VIP Concierge Engineering', 'Complete care, continuous optimization, and instant changes throughout the entire year.'),
        ],
        'comparison': [
            ('Client Emotional Impact', 'Static 2D photos that fail to evoke desire', 'Breathtaking 3D spatial world that captivates and converts'),
            ('Technological Caliber', 'Standard 10-year-old CSS grids', 'Cutting-edge WebGL / WebGPU spatial real-time rendering'),
            ('Brand Perception', 'Ordinary and commoditized', 'Unmistakable haute luxury elevating your brand value exponentially'),
            ('High-Ticket Conversion', 'Struggles to justify high price tags', 'Instantly justifies premium price points of $10k–$500k products'),
        ],
        'phases': [
            ('Phase 1: 3D Asset Modeling & Materials', '8 days', 'Optimizing 3D geometry, gold/glass/steel physical shaders.'),
            ('Phase 2: Spatial Canvas & UI Integration', '14 days', 'WebGL engine hookup, cinematic video loop, and smooth scroll mechanics.'),
            ('Phase 3: Mobile GPU Tuning & Deployment', '6–8 days', 'Frame-rate stabilization across iOS/Android and global CDN distribution.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_4_ENTERPRISE_ECOMMERCE.pdf',
        'eyebrow': 'COMMERCIAL PROPOSAL // PACKAGE 04 (ENTERPRISE PLATFORM)',
        'title': 'ENTERPRISE PLATFORM & GLOBAL E-COMMERCE',
        'subtitle': 'Full-scale automated commercial engine: global payments, automated tax invoicing, courier APIs, and zero platform rent',
        'target': 'E-commerce brands, subscription platforms, private medical networks, B2B portals, and SaaS services',
        'timeline': '30 – 45 business days',
        'price_usd': '$8,900 USD',
        'price_eur': '€8,250 EUR',
        'sla': 'First 3 months free, then $200/mo (or $500/mo with SEO)',
        'stripe_full_link': 'https://buy.stripe.com/aFa5kx8HG1vQ7AwbsPfAc03',
        'stripe_dep_link': 'https://buy.stripe.com/4gMaERga80rMcUQ0ObfAc09',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=billing@aeterna.website&currency_code=USD&amount=8900&item_name=Aeterna+Web+Development+Package+4+Enterprise+Platform',
        'what_you_get_intro': (
            'Not just a website, but an autonomous revenue machine. '
            'Includes a full-fledged global store or member portal with multi-currency checkout, automated tax invoicing, '
            'shipping label generation, customer dashboards, and zero monthly fees to middleman platforms.'
        ),
        'deliverables': [
            ('Full-Scale E-Commerce / Portal Architecture', 'Unlimited products, multi-parameter filtering (sizes, colors, specs), fast cart, and 1-page checkout.'),
            ('Worldwide Payment Processing', 'Native credit card processing (Stripe, myPOS, Apple Pay, Google Pay), PayPal, and Cash on Delivery.'),
            ('Instant Automated Tax Invoicing', 'Every transaction immediately triggers a compliant PDF invoice to the buyer with no manual labor.'),
            ('Integrated Courier & Shipping Automation', 'Automatic shipping cost calculation and 1-click waybill generation for global carriers.'),
            ('Customer Accounts & Order Tracking', 'Members manage orders, download historical invoices, and track live deliveries.'),
            ('0% Monthly Platform Commissions', 'Save tens of thousands annually by bypassing the 2–3% cut that Shopify and marketplace platforms take.'),
            ('24/7 Dedicated Infrastructure Support', 'High-availability server infrastructure with automated backups and instant DDoS mitigation.'),
        ],
        'comparison': [
            ('Platform Rake & Fees', 'Paying 2–3% of all gross sales forever', '0% revenue tax — 100% of revenue stays in your bank account'),
            ('High-Volume Scale', 'Laggy databases crashing under flash sales', 'Sub-second performance handling 50,000+ concurrent visitors'),
            ('Invoicing & Logistics', 'Hours spent writing manual invoices daily', '100% hands-free autonomous invoicing in 0.0 seconds'),
            ('Business Sovereignty', 'Risk of platform bans and frozen payouts', 'Total independence and absolute control over your financial engine'),
        ],
        'phases': [
            ('Phase 1: Architecture, Data Schema & Tax Specs', '8 days', 'Mapping catalog taxonomy, payment gateways, and tax rules.'),
            ('Phase 2: Core Platform Development & Integrations', '18 days', 'Stripe, PayPal, automated invoicing, customer portal, and courier APIs.'),
            ('Phase 3: Live Transaction Stress Tests & Training', '8–10 days', 'Live test transactions, security audits, staff onboarding, and deployment.'),
        ]
    }
]


def main():
    target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "proposals")
    os.makedirs(target_dir, exist_ok=True)
    print("=" * 80)
    print("🔱 GENERATING 4 AETERNA COMMERCIAL PROPOSALS (USD / LOWEST $1,500 / ADD-ONS / OWNERSHIP)")
    print(f"Destination: {os.path.abspath(target_dir)}")
    print("=" * 80)

    for p in PROPOSALS_V2:
        out_file = os.path.join(target_dir, p['filename'])
        create_proposal_pdf(out_file, p)

    print("=" * 80)
    print("[✓] ALL 4 PROPOSALS SUCCESSFULLY GENERATED WITH PAYPAL INVOICE LINKS")
    print("=" * 80)


if __name__ == '__main__':
    main()
