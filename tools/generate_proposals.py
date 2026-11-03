#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
🔱 AETERNA DIGITAL // HAUTE COMMERCIAL PROPOSALS GENERATOR v2.0
Ясни, разбираеми за всеки клиент оферти с реални, атрактивни цени:
  - ОФЕРТА 01: Бърз Старт & Фирмен Сайт (€890 EUR / 1,740 лв.)
  - ОФЕРТА 02: Премиум Бизнес Сайт & Бранд (€1,850 EUR / 3,620 лв.)
  - ОФЕРТА 03: 3D Пространствен Сайт & Ефекти (€3,900 EUR / 7,630 лв.)
  - ОФЕРТА 04: Специализирана Платформа & Магазин (€7,800 EUR / 15,250 лв.)
Включва:
  - Какво получава клиентът на достъпен език (без програмистки термини)
  - С какво сме по-добри от 90% от останалите уеб дизайнери
  - PayPal & Банков линк за директно плащане и автоматично издаване на фактура
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
        self.drawString(18*mm, h - 11*mm, "▲ AETERNA DIGITAL // ОФИЦИАЛНА ТЪРГОВСКА ОФЕРТА")
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawRightString(w - 18*mm, h - 11*mm, "ИЗРАБОТКА НА УЕБСАЙТ И ДИГИТАЛНО ПРИСЪСТВИЕ // 2026")

        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(18*mm, h - 13*mm, w - 18*mm, h - 13*mm)

        # Footer running line
        self.line(18*mm, 14*mm, w - 18*mm, 14*mm)
        self.setFont(SANS_FONT, 7)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(18*mm, 9*mm, "Aeterna Digital Studio • Поморие / София • Димитър Продромов • Тел: +359 888 888 888 • inquire@aeterna.digital")
        page_str = f"Страница {self._pageNumber} от {page_count}"
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
    style_title = ParagraphStyle('Title', fontName=SERIF_BOLD, fontSize=20, leading=24, textColor=COLOR_OBSIDIAN, spaceAfter=4)
    style_subtitle = ParagraphStyle('Subtitle', fontName=SERIF_FONT, fontSize=11, leading=15, textColor=COLOR_TEXT_MUTED, spaceAfter=10)
    style_h2 = ParagraphStyle('H2', fontName=SERIF_BOLD, fontSize=12, leading=15, textColor=COLOR_OBSIDIAN, spaceBefore=8, spaceAfter=4)
    style_body = ParagraphStyle('Body', fontName=SANS_FONT, fontSize=8.5, leading=12.5, textColor=COLOR_TEXT_BODY, spaceAfter=4)
    style_body_bold = ParagraphStyle('BodyBold', fontName=SANS_BOLD, fontSize=8.5, leading=12.5, textColor=COLOR_OBSIDIAN)
    style_cell = ParagraphStyle('Cell', fontName=SANS_FONT, fontSize=8, leading=11, textColor=COLOR_TEXT_BODY)
    style_cell_bold = ParagraphStyle('CellBold', fontName=SANS_BOLD, fontSize=8, leading=11, textColor=COLOR_OBSIDIAN)
    style_cell_green = ParagraphStyle('CellGreen', fontName=SANS_BOLD, fontSize=8, leading=11, textColor=COLOR_GREEN)

    story = []

    # Title & Header
    story.append(Paragraph(data['eyebrow'], style_eyebrow))
    story.append(Paragraph(data['title'], style_title))
    story.append(Paragraph(data['subtitle'], style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_GOLD, spaceBefore=0, spaceAfter=8))

    # Meta Quick Info Box
    meta_box = [
        [
            Paragraph("<b>За кого е подходящо:</b> " + data['target'], style_body),
            Paragraph("<b>Срок за изпълнение:</b> " + data['timeline'], style_body)
        ],
        [
            Paragraph("<b>Крайна цена (фиксирана):</b> <font color='#8c6f28'><b>" + data['price_eur'] + "</b> (" + data['price_bgn'] + ")</font>", style_body),
            Paragraph("<b>Включена поддръжка:</b> " + data['sla'], style_body)
        ]
    ]
    t_meta = Table(meta_box, colWidths=[87*mm, 87*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 6))

    # 1. Какво реално получавате (Plain human language)
    story.append(Paragraph("1. КАКВО РЕАЛНО ПОЛУЧАВАТЕ ВИЕ КАТО КЛИЕНТ (ЯСНО И ТОЧНО)", style_h2))
    story.append(Paragraph(data['what_you_get_intro'], style_body))

    deliv_rows = [[Paragraph("<b>#</b>", style_cell_bold), Paragraph("<b>Елемент от сайта</b>", style_cell_bold), Paragraph("<b>Каква е ползата за Вашия бизнес</b>", style_cell_bold)]]
    for i, (item, benefit) in enumerate(data['deliverables'], 1):
        deliv_rows.append([Paragraph(f"<b>{i:02d}</b>", style_cell_bold), Paragraph(item, style_cell_bold), Paragraph(benefit, style_cell)])
    t_deliv = Table(deliv_rows, colWidths=[10*mm, 52*mm, 112*mm])
    t_deliv.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_deliv)
    story.append(Spacer(1, 6))

    # 2. С какво сме по-добри от останалите (Comparison)
    story.append(Paragraph("2. С КАКВО СМЕ ПО-ДОБРИ ОТ 90% ОТ ОСТАНАЛИТЕ В БРАНША", style_h2))
    comp_rows = [
        [Paragraph("<b>Показател / Качество</b>", style_cell_bold), Paragraph("<b>Обикновени агенции (WordPress шаблони)</b>", style_cell_bold), Paragraph("<b>Aeterna Digital (Нашият стандарт)</b>", style_cell_bold)]
    ]
    for param, bad, good in data['comparison']:
        comp_rows.append([
            Paragraph(param, style_cell_bold),
            Paragraph(bad, style_cell),
            Paragraph(good, style_cell_green)
        ])
    t_comp = Table(comp_rows, colWidths=[42*mm, 66*mm, 66*mm])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 6))

    # 3. Етапи на изработка (Timeline)
    story.append(Paragraph("3. КАК ПРОТИЧА РАБОТАТА (ЕТАПИ И СРОКОВЕ)", style_h2))
    phase_rows = [[Paragraph("<b>Етап</b>", style_cell_bold), Paragraph("<b>Време</b>", style_cell_bold), Paragraph("<b>Какво правим и какво одобрявате Вие</b>", style_cell_bold)]]
    for p_name, p_time, p_desc in data['phases']:
        phase_rows.append([Paragraph(p_name, style_cell_bold), Paragraph(p_time, style_cell), Paragraph(p_desc, style_cell)])
    t_phase = Table(phase_rows, colWidths=[36*mm, 26*mm, 112*mm])
    t_phase.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_OBSIDIAN),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_CARD]),
    ]))
    story.append(t_phase)
    story.append(Spacer(1, 6))

    # 4. Цена, Плащане & Автоматична Фактура (PayPal Payment Link Integration)
    story.append(Paragraph("4. ЦЕНА, ОНЛАЙН ПЛАЩАНЕ И АВТОМАТИЧНО ИЗДАВАНЕ НА ФАКТУРА", style_h2))
    
    pay_content = (
        f"<b>Фиксирана крайна цена за целия проект:</b> <font color='#8c6f28' size='11'><b>{data['price_eur']} ({data['price_bgn']})</b></font><br/>"
        f"<b>Схема на плащане:</b> 50% авансово стартиране / 50% след като одобрите напълно готовия сайт.<br/>"
        f"<b>Официална фактура:</b> Издава се автоматично веднага с ДДС или без ДДС за фирма или физическо лице.<br/><br/>"
        f"<b>НАЧИНИ ЗА ПЛАЩАНЕ:</b><br/>"
        f"• <b>Онлайн с PayPal или банкова карта:</b> <font color='#003087'><u><a href='{data['paypal_link']}'>[ КЛИКНЕТЕ ТУК ЗА ДИРЕКТНО ОНЛАЙН ПЛАЩАНЕ / ИЗДАВАНЕ НА ФАКТУРА ]</a></u></font><br/>"
        f"• <b>Директен банков превод (IBAN/SEPA):</b> Получавате фактура-проформа по имейл с фирмени банкови данни.<br/>"
        f"• <b>100% Ваши права:</b> След финално плащане целият сайт, кодът и домейнът стават 100% Ваша собственост завинаги, без месечни абонаменти или скрити такси."
    )
    t_pay = Table([[Paragraph(pay_content, style_body)]], colWidths=[174*mm])
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_GOLD),
        ('PADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 8))

    # 5. Двустранен подпис
    sign_data = [
        [
            Paragraph("<b>ИЗПЪЛНИТЕЛ:</b><br/>Aeterna Digital Studio // Поморие HQ<br/>Димитър Продромов<br/>Тел: +359 888 888 888", style_body),
            Paragraph("<b>ПРИЕТО И ПОТВЪРДЕНО ОТ КЛИЕНТА:</b><br/>Име на фирмата: __________________________<br/>МОЛ / Подпис: ____________________________<br/>Дата: ________________________ 2026 г.", style_body)
        ]
    ]
    t_sign = Table(sign_data, colWidths=[87*mm, 87*mm])
    t_sign.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([t_sign]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[✓] Генериран PDF: {output_path} ({os.path.getsize(output_path):,} bytes)")


# ─────────────────────────────────────────────────────────────────────────────
# 4-ТЕ КАЛИБРИРАНИ ОФЕРТИ (ЧОВЕШКИ ЕЗИК, РЕАЛНИ ЦЕНИ)
# ─────────────────────────────────────────────────────────────────────────────

PROPOSALS_V2 = [
    {
        'filename': 'PROPOSAL_TIER_1_EXPRESS_START.pdf',
        'eyebrow': 'ОФЕРТА ЗА ИЗРАБОТКА НА УЕБСАЙТ // ВАРИАНТ 01 (БЪРЗ СТАРТ)',
        'title': 'ПАКЕТ "БЪРЗ СТАРТ" ЗА МАЛЪК И СРЕДЕН БИЗНЕС',
        'subtitle': 'Модерен, светкавично бърз фирмен уебсайт (до 5 страници) • Готов само за 7 до 10 дни',
        'target': 'Магазини, лекари, адвокати, салони за красота, ресторанти, занаятчии, стартиращи фирми',
        'timeline': '7 – 10 работни дни',
        'price_eur': '€890 EUR',
        'price_bgn': '1,740 лв.',
        'sla': '3 месеца безплатна поддръжка',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=papica777@gmail.com&currency_code=EUR&amount=890&item_name=Aeterna+Web+Development+Package+1+Express+Start',
        'what_you_get_intro': (
            'Този пакет е създаден за всеки бизнес, който иска да има чист, професионален и надежден уебсайт, '
            'без да плаща хиляди левове и без да чака с месеци. Получавате готов работещ инструмент за привличане на клиенти.'
        ),
        'deliverables': [
            ('Модерен фирмен сайт (до 5 страници)', 'Начало, За нас, Услуги/Цени, Галерия/Портфолио и Контакти.'),
            ('Перфектен изглед на всички телефони', 'Над 80% от хората влизат от телефон. Вашият сайт ще изглежда безупречно на iPhone и Android.'),
            ('Светкавично зареждане (под 1 сек)', 'Клиентите не обичат да чакат. Бързият сайт задържа хората и увеличава поръчките.'),
            ('Директна връзка по Телефон и WhatsApp/Viber', 'Бутони с 1 клик за незабавно обаждане или съобщение от сайта.'),
            ('Форма за запитвания и оферти', 'Клиентите ви пишат директно от сайта, а съобщенията пристигат веднага на вашия имейл.'),
            ('Качване и индексиране в Google', 'Регистрация в Google Search Console и Google Maps за намиране от местни клиенти.'),
            ('Служебен имейл и безплатен хостинг', 'Настройка на фирмени пощи (напр. office@vashatafirma.com).'),
        ],
        'comparison': [
            ('Скорост на зареждане', 'Бавно (по 4–8 секунди заради тежки плъгини)', 'Светкавично (под 0.8 секунди)'),
            ('Поддръжка и сигурност', 'Постоянно се чупи при ъпдейти на WordPress', 'Здрав код без вируси и без нужда от плъгини'),
            ('Собственост на сайта', 'Често ви обвързват с месечни такси и хостинги', '100% Ваша собственост завинаги'),
            ('Удобство за телефон', 'Често разместени текстове и счупени бутони', 'Перфектна мобилна адаптация'),
        ],
        'phases': [
            ('Етап 1: Дизайн и структура', '2 дни', 'Уточняваме текстовете, цветовете и логото. Показваме ви как ще изглежда.'),
            ('Етап 2: Програмиране и тестове', '4 дни', 'Изграждаме сайта, настройваме формите за контакт и скоростта.'),
            ('Етап 3: Пускане на живо', '1–2 дни', 'Пускаме сайта на вашия домейн, свързваме пощите и ви показваме как се ползва.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_2_BUSINESS_PRO.pdf',
        'eyebrow': 'ОФЕРТА ЗА ИЗРАБОТКА НА УЕБСАЙТ // ВАРИАНТ 02 (ПРЕМИУМ БИЗНЕС)',
        'title': 'ПАКЕТ "ПРЕМИУМ БИЗНЕС & АВТОРСКИ БРАНД"',
        'subtitle': 'Цялостен корпоративен уебсайт с уникален авторски дизайн, пълно Google SEO и панел за управление',
        'target': 'Утвърдени фирми, клиники, хотели, агенции за имоти, архитектурни бюра, производствени компании',
        'timeline': '14 – 20 работни дни',
        'price_eur': '€1,850 EUR',
        'price_bgn': '3,620 лв.',
        'sla': '6 месеца пълна техническа грижа',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=papica777@gmail.com&currency_code=EUR&amount=1850&item_name=Aeterna+Web+Development+Package+2+Business+Pro',
        'what_you_get_intro': (
            'Пакет "Бизнес Про" превръща Вашия уебсайт в най-силния Ви търговски представител. '
            'Създаден е специално за фирми, които искат да изглеждат солидно, престижно и да вдъхват доверие на заможни клиенти.'
        ),
        'deliverables': [
            ('Цялостен корпоративен сайт (до 10-12 страници)', 'Всички нужни секции за детайлно представяне на услуги, проекти, екип и сертификати.'),
            ('100% Уникален авторски дизайн', 'Без безплатни шаблони. Дизайнът се рисува по поръчка за Вашата фирмена идентичност.'),
            ('Лесен контролен панел за вас', 'Можете сами с 2 клика да сменяте снимки, цени, текстове или да качвате нови статии.'),
            ('Пълна SEO оптимизация за Google', 'Структурирани данни, за да излизате напред в Google при търсене на вашите услуги.'),
            ('Интерактивни анимации и плавен скрол', 'Сайтът се движи плавно и изглежда модерно като скъп международен бранд.'),
            ('Калкулатор за запитвания или филтри', 'Възможност за изчисляване на цени или филтриране на проекти и продукти.'),
            ('Интеграция с Google Analytics и реклами', 'Виждате точно колко хора влизат и откъде идват.'),
        ],
        'comparison': [
            ('Визия и усещане', 'Шаблонно, изглеждащо като още 1000 други сайта', 'Премиум авторски стил, отличаващ ви веднага'),
            ('Класиране в Google', 'Основно базови заглавия без SEO структура', 'Пълна Google оптимизация за реални резултати'),
            ('Управление на съдържание', 'Сложно, изискващо постоянно плащане на дизайнер', 'Интуитивно и лесно за 1 минута от телефона'),
            ('Сигурност и защита', 'Уязвим на хакване и спам във формите', 'Защитени форми със спам филтри и криптиране'),
        ],
        'phases': [
            ('Етап 1: Стратегия и прототип', '4 дни', 'Анализ на конкурентите ви, изготвяне на визуална концепция и одобрение.'),
            ('Етап 2: Програмиране и анимации', '10 дни', 'Пълно кодиране на сайта, панел за редакция, SEO оптимизация.'),
            ('Етап 3: Тестване и пускане', '3–4 дни', 'Обучение за вас, качване на реалния домейн и активиране на анализите.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_3_SPATIAL_3D.pdf',
        'eyebrow': 'ОФЕРТА ЗА ИЗРАБОТКА НА УЕБСАЙТ // ВАРИАНТ 03 (3D СПАТИАЛ & ЛУКС)',
        'title': 'ПАКЕТ "3D ИНТЕРАКТИВЕН СПАТИАЛ УЕБ & КИНО ЕФЕКТИ"',
        'subtitle': '3D интерактивност в реално време, живи златни и обсидианови шейдъри, кино фоново видео и пространствен дизайн',
        'target': 'Луксозни часовници, скъпа бижутерия, имоти ново строителство, суперколи, иновативни брандове',
        'timeline': '25 – 35 работни дни',
        'price_eur': '€3,900 EUR',
        'price_bgn': '7,630 лв.',
        'sla': '12 месеца персонален консиерж и поддръжка',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=papica777@gmail.com&currency_code=EUR&amount=3900&item_name=Aeterna+Web+Development+Package+3+Spatial+3D',
        'what_you_get_intro': (
            'Това е висшата лига в уеб технологиите. Вашият сайт няма да прилича на обикновена интернет страница, '
            'а на дигитално произведение на изкуството. Клиентите могат да въртят продуктите ви в 3D, да виждат метални отражения '
            'и да изживеят бранда ви на нивото на Rolex, Apple или Ferrari.'
        ),
        'deliverables': [
            ('3D Пространствен енджин в браузъра', 'Вграден 3D модел, който се върти с мишката или пръст на телефона без инсталация.'),
            ('Жив фон с течни златни шейдъри', 'Специални визуални ефекти с течно злато, отражения и студийно осветление.'),
            ('Фоново видео с кино качество (Loop)', 'Безшевно видео с висока резолюция, зареждащо се мигновено без накъсване.'),
            ('Експлозивен изглед на детайли', 'Възможност продуктът да се разглобява в 3D пространството за показване на частите.'),
            ('Гарантирани 60–120 кадъра в секунда (FPS)', 'Изключително плавно движение дори на стандартни телефони.'),
            ('Интерактивен дискретен звук', 'Фини звукови ефекти при преминаване и интеракция за луксозно усещане.'),
            ('12 месеца пълен VIP инженеринг', 'Ние се грижим за всичко technical по сайта цяла година без допълнителни разходи.'),
        ],
        'comparison': [
            ('Въздействие върху клиента', 'Обикновени статични снимки', 'Незабравимо 3D преживяване, което спира дъха'),
            ('Технологично ниво', 'Стари стандартни CSS таблици', 'Авангарден WebGL / 3D енджин от най-ново поколение'),
            ('Усещане за лукс', 'Стандартно и евтино', 'Абсолютен хай-енд лукс, вдъхващ усещане за милионен бранд'),
            ('Конверсия при скъпи стоки', 'Трудно се доказва високата цена', 'Оправдава високите цени на вашите продукти моментално'),
        ],
        'phases': [
            ('Етап 1: 3D Моделиране и текстури', '8 дни', 'Подготовка на 3D моделите, материалите от злато, стомана, стъкло.'),
            ('Етап 2: Интеграция в уеб енджина', '14 дни', 'Свързване на 3D интеракцията, видео фона, скрола и интерфейса.'),
            ('Етап 3: Оптимизация за телефони', '6–8 дни', 'Тестове на всякакви мобилни устройства за супер плавност.'),
        ]
    },
    {
        'filename': 'PROPOSAL_TIER_4_ENTERPRISE_ECOMMERCE.pdf',
        'eyebrow': 'ОФЕРТА ЗА ИЗРАБОТКА НА УЕБСАЙТ // ВАРИАНТ 04 (ПЛАТФОРМА & Е-ТЪРГОВИЯ)',
        'title': 'ПАКЕТ "СПЕЦИАЛИЗИРАНА ПЛАТФОРМА, ОНЛАЙН МАГАЗИН ИЛИ ПОРТАЛ"',
        'subtitle': 'Автоматизиран онлайн магазин или клиентски портал с плащания, автоматични фактури и пълна независимост',
        'target': 'Е-търговци, платформи за резервации, клиники с досиета, B2B портали, софтуерни платформи',
        'timeline': '30 – 45 работни дни',
        'price_eur': '€7,800 EUR',
        'price_bgn': '15,250 лв.',
        'sla': '24 месеца пълна денонощна гаранция и поддръжка',
        'paypal_link': 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=papica777@gmail.com&currency_code=EUR&amount=7800&item_name=Aeterna+Web+Development+Package+4+Enterprise+Platform',
        'what_you_get_intro': (
            'Това не е обикновен сайт, а цялостна машина за бизнес и автоматизация. '
            'Включва пълен онлайн магазин или клиентски портал с автоматично приемане на плащания (карти, PayPal, EasyPay), '
            'мигновено издаване на фактури, товарителници за куриери и интеграция със счетоводство.'
        ),
        'deliverables': [
            ('Пълна платформа за продажби и поръчки', 'Неограничен брой продукти, филтри по размери/цветове/цени, количка и чекаут.'),
            ('Всички видове плащания в България и чужбина', 'Директни картови плащания (myPOS, Stripe, Борика), PayPal, Apple Pay, наложен платеж.'),
            ('Автоматично издаване на фактури', 'След всяка поръчка клиентът получава готова валидна фактура по имейл без ваша намеса.'),
            ('Интеграция със Спиди и Еконт', 'Генериране на товарителници с 1 клик, изчисляване на точна доставка до адрес или офис.'),
            ('Клиентски профили и история на поръчките', 'Потребителите виждат своите покупки, фактури и статус на доставката.'),
            ('100% Без месечни комисионни към платформи', 'Спестявате хиляди левове годишно от такси, които Shopify или WooCommerce прибират.'),
            ('24 Месеца денонощен технически съпорт', 'Постоянен мониторинг срещу сривове, ежедневни резервни копия и бърза реакция.'),
        ],
        'comparison': [
            ('Комисионни от продажби', 'Плащате по 2–3% от всеки оборот на чужди платформи', '0% комисионна — всички пари отиват директно при вас'),
            ('Скорост при хиляди продукти', 'Забавяне, грешки в базата данни и бъгове', 'Светкавична скорост, издържаща десетки хиляди клиенти'),
            ('Фактуриране и куриери', 'Ръчно писане на фактури с часове всеки ден', 'Напълно автоматизирано за 0 секунди'),
            ('Контрол над бизнеса', 'Ако платформата реши, може да ви блокира профила', 'Пълен суверенитет и контрол над вашите пари и данни'),
        ],
        'phases': [
            ('Етап 1: Архитектура на базата и поръчките', '8 дни', 'Проектиране на каталога, плащанията, доставките и данъчните изисквания.'),
            ('Етап 2: Програмиране и интеграция на плащания', '18 дни', 'Свързване на банкови терминали, PayPal, автоматични фактури, Спиди/Еконт.'),
            ('Етап 3: Тестове с реални поръчки и пускане', '8–10 дни', 'Тестови плащания, проверка на сигурността, обучение на персонала ви.'),
        ]
    }
]


def main():
    target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "proposals")
    os.makedirs(target_dir, exist_ok=True)
    print("=" * 80)
    print("🔱 GENERATING 4 AETERNA COMMERCIAL PROPOSALS (HUMAN-READABLE, CALIBRATED PRICES)")
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
