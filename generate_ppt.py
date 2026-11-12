import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Reference Deck Pastel Color Palette
    C_BG = RGBColor(245, 246, 245)            # Warm soft off-white canvas
    C_CARD_WHITE = RGBColor(255, 255, 255)    # Clean White Card
    C_BORDER = RGBColor(226, 232, 240)        # Subtle Hairline Border
    
    C_BRAND_DARK = RGBColor(28, 46, 36)       # Deep forest charcoal (#1C2E24)
    C_TEXT_DARK = RGBColor(30, 41, 59)        # Body text (#1E293B)
    C_TEXT_MUTED = RGBColor(71, 85, 105)      # Slate muted (#475569)
    C_DIVIDER = RGBColor(35, 56, 43)          # Dark line divider (#23382B)
    C_CU_RED = RGBColor(190, 18, 24)          # Chandigarh University Red

    # Pastel Accents matching reference deck
    C_PASTEL_GREEN_CLOUD = RGBColor(218, 240, 212) # Soft green highlighter cloud (#DAF0D4)
    C_PASTEL_PURPLE = RGBColor(237, 233, 254)      # Lavender (#EDE9FE)
    C_PURPLE_TEXT = RGBColor(91, 33, 182)          # (#5B21B6)
    C_PASTEL_MINT = RGBColor(220, 252, 231)        # Mint (#DCFCE7)
    C_MINT_TEXT = RGBColor(22, 101, 52)            # (#166534)
    C_PASTEL_AMBER = RGBColor(254, 243, 199)       # Amber/Peach (#FEF3C7)
    C_AMBER_TEXT = RGBColor(146, 64, 14)           # (#92400E)
    C_PASTEL_BLUE = RGBColor(224, 242, 254)        # Pastel Blue (#E0F2FE)
    C_BLUE_TEXT = RGBColor(7, 89, 133)             # (#075985)
    C_PASTEL_YELLOW_HEADER = RGBColor(254, 240, 138) # (#FEF08A)

    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG
        bg.line.fill.background()
        return bg

    def add_cu_badge(slide):
        badge = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(12.1), Inches(0.4), Inches(0.75), Inches(0.95))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_CU_RED
        badge.line.fill.background()
        tf = badge.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = "CU"
        p1.font.bold = True
        p1.font.size = Pt(14)
        p1.font.color.rgb = RGBColor(255, 255, 255)
        p1.alignment = PP_ALIGN.CENTER
        
        p2 = tf.add_paragraph()
        p2.text = "CHANDIGARH\nUNIVERSITY"
        p2.font.bold = True
        p2.font.size = Pt(5.5)
        p2.font.color.rgb = RGBColor(255, 255, 255)
        p2.alignment = PP_ALIGN.CENTER

    def add_title(slide, text):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.0), Inches(0.8))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = C_BRAND_DARK

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Matches Page 1 of Reference)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)
    add_cu_badge(s1)

    tb_title = s1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.0), Inches(1.2))
    tf_t = tb_title.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "Student Workspace"
    p_t.font.bold = True
    p_t.font.size = Pt(44)
    p_t.font.color.rgb = C_BRAND_DARK

    tb_sub = s1.shapes.add_textbox(Inches(0.8), Inches(2.7), Inches(11.0), Inches(0.7))
    tf_s = tb_sub.text_frame
    p_s = tf_s.paragraphs[0]
    p_s.text = "Offline-first academic workspace with embedded SQLite, task prioritization, SGPA forecasting, and Pomodoro study tools"
    p_s.font.size = Pt(17)
    p_s.font.color.rgb = C_TEXT_DARK

    # Horizontal Divider
    line = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(3.6), Inches(10.8), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C_DIVIDER
    line.line.fill.background()

    # Team Members Section
    tb_team = s1.shapes.add_textbox(Inches(0.8), Inches(4.0), Inches(10.8), Inches(2.8))
    tf_tm = tb_team.text_frame
    tf_tm.word_wrap = True

    p_tm_head = tf_tm.paragraphs[0]
    p_tm_head.text = "Project Team & Evaluation Details:"
    p_tm_head.font.bold = True
    p_tm_head.font.size = Pt(15)
    p_tm_head.font.color.rgb = C_BRAND_DARK
    p_tm_head.space_after = Pt(10)

    p_m1 = tf_tm.add_paragraph()
    p_m1.text = "Abhishek Kumar & Ankit Raj"
    p_m1.font.bold = True
    p_m1.font.size = Pt(14)
    p_m1.font.color.rgb = C_TEXT_DARK
    p_m1.space_after = Pt(4)

    p_role = tf_tm.add_paragraph()
    p_role.text = "Department of Computer Science & Engineering • Object Oriented Programming"
    p_role.font.size = Pt(11)
    p_role.font.color.rgb = C_TEXT_MUTED
    p_role.space_after = Pt(10)

    p_cu = tf_tm.add_paragraph()
    p_cu.text = "Chandigarh University"
    p_cu.font.bold = True
    p_cu.font.size = Pt(13)
    p_cu.font.color.rgb = C_BRAND_DARK

    p_dep = tf_tm.add_paragraph()
    p_dep.text = "Live App: https://asususerabhishek-alt.github.io/studentworkspace/"
    p_dep.font.size = Pt(10)
    p_dep.font.color.rgb = C_MINT_TEXT
    p_dep.space_before = Pt(4)

    # =========================================================================
    # SLIDE 2: VALUE PROPOSITION (Green Cloud Container)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_cu_badge(s2)

    cloud = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.2), Inches(3.2))
    cloud.fill.solid()
    cloud.fill.fore_color.rgb = C_PASTEL_GREEN_CLOUD
    cloud.line.fill.background()
    
    tf_c = cloud.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = Inches(0.6)
    tf_c.margin_right = Inches(0.6)
    tf_c.margin_top = Inches(0.5)
    p_c = tf_c.paragraphs[0]
    p_c.text = "Student Workspace is designed as an offline-first academic management suite with clean, distraction-free UI for university students, transforming chaotic deadlines, grade predictions, and study intervals into actionable, focused productivity for academic excellence."
    p_c.font.size = Pt(20)
    p_c.font.color.rgb = C_BRAND_DARK
    p_c.font.bold = False

    tb_b = s2.shapes.add_textbox(Inches(0.9), Inches(5.0), Inches(11.0), Inches(1.5))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.text = "Powered by an embedded local SQLite engine (WebAssembly sql.js) with zero external server dependencies, providing assignment tracking, SGPA forecasting, Pomodoro focus blocks, and active recall flashcards."
    p_b.font.size = Pt(17)
    p_b.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 3: PROBLEM STATEMENT & OPPORTUNITY
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_cu_badge(s3)
    add_title(s3, "Where can this improve student productivity?")

    rows = [
        ("Disorganized task overload", "Scattered assignment deadlines, lab submissions, and term papers across disparate portals cause missed deadlines, poor prioritization, and last-minute panic."),
        ("Manual GPA calculation", "Calculating weighted SGPA and forecasting required grades across 10-point scales is tedious, causing students to lose visibility into honors eligibility."),
        ("Study burnout & fragmentation", "Unstructured study sessions lead to procrastination, while revision notes remain fragmented instead of leveraging scientifically proven active recall flashcards.")
    ]

    for i, (left_title, right_desc) in enumerate(rows):
        top_pos = 1.6 + (i * 1.7)
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top_pos), Inches(11.6), Inches(1.4))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_WHITE
        card.line.color.rgb = C_BORDER
        card.line.width = Pt(1)

        tb_l = s3.shapes.add_textbox(Inches(1.1), Inches(top_pos + 0.35), Inches(3.2), Inches(0.7))
        tf_l = tb_l.text_frame
        tf_l.word_wrap = True
        p_l = tf_l.paragraphs[0]
        p_l.text = left_title
        p_l.font.bold = True
        p_l.font.size = Pt(14)
        p_l.font.color.rgb = C_BRAND_DARK

        tb_r = s3.shapes.add_textbox(Inches(4.5), Inches(top_pos + 0.25), Inches(7.6), Inches(0.9))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True
        p_r = tf_r.paragraphs[0]
        p_r.text = right_desc
        p_r.font.size = Pt(12)
        p_r.font.color.rgb = C_TEXT_MUTED

    # =========================================================================
    # SLIDE 4: FEATURES (2x2 Pastel Grid)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_title(s4, "Core Capabilities of Student Workspace")

    feature_cards = [
        ("Assignments & Deadlines Tracker",
         "Priority queues (High/Medium/Low), dynamic subject search filter, due date countdowns, urgency badges, and quick completion toggles.",
         C_PASTEL_PURPLE, C_PURPLE_TEXT, 0.8, 1.6),
        ("Interactive SGPA & CGPA Engine",
         "Automated 10-point university grading scale, weighted credit points, dynamic honors classification (Distinction), and target grade simulator.",
         C_PASTEL_MINT, C_MINT_TEXT, 6.9, 1.6),
        ("Pomodoro Focus Study Timer",
         "25-minute deep focus sprints, 5m/15m breaks, live animated circular SVG progress clock, audio completion cues, and session streak tracking.",
         C_PASTEL_AMBER, C_AMBER_TEXT, 0.8, 4.3),
        ("Active Recall Revision Flashcards",
         "3D flip-card revision mechanism, mastery categorization, subject filtering, and instant keyboard shortcuts for pre-exam retention.",
         C_PASTEL_BLUE, C_BLUE_TEXT, 6.9, 4.3)
    ]

    for title, desc, bg_col, text_col, left, top in feature_cards:
        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(5.6), Inches(2.4))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_col
        card.line.fill.background()

        tb = s4.shapes.add_textbox(Inches(left + 0.4), Inches(top + 0.35), Inches(4.8), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(15)
        p1.font.color.rgb = text_col
        p1.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = C_TEXT_DARK

    # =========================================================================
    # SLIDE 5: HOW IT SOLVES PROBLEMS (Yellow Header Tabs)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_title(s5, "How Student Workspace Solves Core Academic Friction")

    sol_cards = [
        ("Zero Database Overhead",
         "Runs locally via embedded WebAssembly SQLite (sql.js). No external database accounts, credentials, or remote servers required."),
        ("Unified Academic Workspace",
         "Eliminates tool switching by merging assignment tracking, grade simulation, focus timer, and revision into one unified workspace."),
        ("Actionable Grade Forecasting",
         "Instantly forecasts required grades across semester modules, giving students clear clarity on where to invest study hours.")
    ]

    for i, (header_text, body_text) in enumerate(sol_cards):
        left_pos = 0.8 + (i * 4.0)
        
        card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left_pos), Inches(1.6), Inches(3.7), Inches(5.1))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_WHITE
        card.line.color.rgb = C_BORDER
        card.line.width = Pt(1)

        head_tab = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left_pos), Inches(1.6), Inches(3.7), Inches(0.9))
        head_tab.fill.solid()
        head_tab.fill.fore_color.rgb = C_PASTEL_YELLOW_HEADER
        head_tab.line.fill.background()
        
        tf_ht = head_tab.text_frame
        tf_ht.word_wrap = True
        tf_ht.margin_left = Inches(0.2)
        tf_ht.margin_right = Inches(0.2)
        p_ht = tf_ht.paragraphs[0]
        p_ht.text = header_text
        p_ht.font.bold = True
        p_ht.font.size = Pt(13)
        p_ht.font.color.rgb = C_BRAND_DARK
        p_ht.alignment = PP_ALIGN.LEFT

        tb_body = s5.shapes.add_textbox(Inches(left_pos + 0.25), Inches(2.7), Inches(3.2), Inches(3.8))
        tf_bd = tb_body.text_frame
        tf_bd.word_wrap = True
        p_bd = tf_bd.paragraphs[0]
        p_bd.text = body_text
        p_bd.font.size = Pt(12)
        p_bd.font.color.rgb = C_TEXT_MUTED

    # =========================================================================
    # SLIDE 6: APP UI SHOWCASE (Browser Window Mockup)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)

    tb_ui_head = s6.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(4.2), Inches(4.5))
    tf_uh = tb_ui_head.text_frame
    tf_uh.word_wrap = True
    
    p_uh1 = tf_uh.paragraphs[0]
    p_uh1.text = "Student Workspace\nDesigned for Focus\n& Clarity"
    p_uh1.font.bold = True
    p_uh1.font.size = Pt(28)
    p_uh1.font.color.rgb = C_BRAND_DARK
    p_uh1.space_after = Pt(12)

    p_uh2 = tf_uh.add_paragraph()
    p_uh2.text = "Academic Workspace • Offline-First Architecture"
    p_uh2.font.size = Pt(13)
    p_uh2.font.color.rgb = C_TEXT_MUTED
    p_uh2.space_after = Pt(14)

    p_uh3 = tf_uh.add_paragraph()
    p_uh3.text = "• Embedded WebAssembly SQLite (sql.js) for true local relational persistence.\n• Dual deployment support: 100% static on GitHub Pages and serverless on Vercel.\n• Unseeded initial state ensuring complete user control and zero data bloat."
    p_uh3.font.size = Pt(10.5)
    p_uh3.font.color.rgb = C_TEXT_DARK
    p_uh3.space_after = Pt(16)

    p_uh4 = tf_uh.add_paragraph()
    p_uh4.text = "Supported Deployments:\nGitHub Pages & Vercel"
    p_uh4.font.bold = True
    p_uh4.font.size = Pt(11)
    p_uh4.font.color.rgb = C_MINT_TEXT

    # Browser Mockup Frame
    browser_frame = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.2), Inches(0.9), Inches(7.5), Inches(5.8))
    browser_frame.fill.solid()
    browser_frame.fill.fore_color.rgb = C_CARD_WHITE
    browser_frame.line.color.rgb = C_BORDER
    browser_frame.line.width = Pt(1)

    addr_bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.2), Inches(0.9), Inches(7.5), Inches(0.45))
    addr_bar.fill.solid()
    addr_bar.fill.fore_color.rgb = RGBColor(241, 245, 249)
    addr_bar.line.fill.background()
    
    tf_ab = addr_bar.text_frame
    p_ab = tf_ab.paragraphs[0]
    p_ab.text = "● ● ●    https://student-workspace.local/workspace"
    p_ab.font.size = Pt(9)
    p_ab.font.color.rgb = C_TEXT_MUTED
    p_ab.alignment = PP_ALIGN.LEFT

    preview_img = "screenshots/web_assignments.png"
    if os.path.exists(preview_img):
        s6.shapes.add_picture(preview_img, Inches(5.25), Inches(1.4), width=Inches(7.4), height=Inches(5.2))

    # =========================================================================
    # SLIDE 7: PRACTICAL STUDENT WORKFLOWS
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_title(s7, "Project Use Cases & Practical Student Workflows")

    # Left Workflow Card: SGPA & GPA
    card_w1 = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2))
    card_w1.fill.solid()
    card_w1.fill.fore_color.rgb = C_CARD_WHITE
    card_w1.line.color.rgb = C_BORDER
    
    tb_w1 = s7.shapes.add_textbox(Inches(1.0), Inches(1.75), Inches(5.2), Inches(1.0))
    tf_w1 = tb_w1.text_frame
    p_w1a = tf_w1.paragraphs[0]
    p_w1a.text = "1. Grade Forecasting & Target Analysis"
    p_w1a.font.bold = True
    p_w1a.font.size = Pt(14)
    p_w1a.font.color.rgb = C_BLUE_TEXT
    p_w1b = tf_w1.add_paragraph()
    p_w1b.text = "Students model semester grade points and compute the required GPA needed across remaining modules to achieve Honors status."
    p_w1b.font.size = Pt(10)
    p_w1b.font.color.rgb = C_TEXT_MUTED

    if os.path.exists("screenshots/web_gpa.png"):
        s7.shapes.add_picture("screenshots/web_gpa.png", Inches(1.0), Inches(2.9), width=Inches(5.2), height=Inches(3.7))

    # Right Workflow Card: Pomodoro & Flashcards
    card_w2 = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.6), Inches(5.6), Inches(5.2))
    card_w2.fill.solid()
    card_w2.fill.fore_color.rgb = C_CARD_WHITE
    card_w2.line.color.rgb = C_BORDER

    tb_w2 = s7.shapes.add_textbox(Inches(7.1), Inches(1.75), Inches(5.2), Inches(1.0))
    tf_w2 = tb_w2.text_frame
    p_w2a = tf_w2.paragraphs[0]
    p_w2a.text = "2. Deep Focus Intervals & Active Recall"
    p_w2a.font.bold = True
    p_w2a.font.size = Pt(14)
    p_w2a.font.color.rgb = C_MINT_TEXT
    p_w2b = tf_w2.add_paragraph()
    p_w2b.text = "25-minute Pomodoro sprints combined with digital 3D flip-cards prevent study fatigue and boost pre-exam concept retention."
    p_w2b.font.size = Pt(10)
    p_w2b.font.color.rgb = C_TEXT_MUTED

    if os.path.exists("screenshots/web_pomodoro.png"):
        s7.shapes.add_picture("screenshots/web_pomodoro.png", Inches(7.1), Inches(2.9), width=Inches(5.2), height=Inches(3.7))

    # =========================================================================
    # SLIDE 8: CONCLUSION, FUTURE SCOPE & BIBLIOGRAPHY
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_title(s8, "Conclusion, Future Scope & Bibliography")

    card_c1 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2))
    card_c1.fill.solid()
    card_c1.fill.fore_color.rgb = C_CARD_WHITE
    card_c1.line.color.rgb = C_BORDER

    tb_c1 = s8.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(5.2), Inches(4.8))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True

    p_ch1 = tf_c1.paragraphs[0]
    p_ch1.text = "Project Summary & Future Scope"
    p_ch1.font.bold = True
    p_ch1.font.size = Pt(14)
    p_ch1.font.color.rgb = C_BRAND_DARK
    p_ch1.space_after = Pt(10)

    points_c = [
        ("Embedded SQLite Architecture: ", "Proves that lightweight in-browser SQLite delivers true database reliability without cloud dependency."),
        ("Immediate Practical Value: ", "Solves the core challenges of student life: deadline tracking, grade forecasting, and focused study sprints."),
        ("Cloud Sync & Mobile App: ", "Future iterations will introduce optional end-to-end encrypted multi-device synchronization."),
        ("Timetable & Calendar Sync: ", "Support for importing .ics university timetable feeds directly into the task scheduler.")
    ]
    for b_txt, n_txt in points_c:
        p = tf_c1.add_paragraph()
        r1 = p.add_run()
        r1.text = "✓ " + b_txt
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = C_TEXT_DARK
        r2 = p.add_run()
        r2.text = n_txt
        r2.font.size = Pt(10)
        r2.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(8)

    card_c2 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.6), Inches(5.6), Inches(5.2))
    card_c2.fill.solid()
    card_c2.fill.fore_color.rgb = C_CARD_WHITE
    card_c2.line.color.rgb = C_BORDER

    tb_c2 = s8.shapes.add_textbox(Inches(7.1), Inches(1.8), Inches(5.2), Inches(4.8))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True

    p_ch2 = tf_c2.paragraphs[0]
    p_ch2.text = "Academic Research & Bibliography"
    p_ch2.font.bold = True
    p_ch2.font.size = Pt(14)
    p_ch2.font.color.rgb = C_PURPLE_TEXT
    p_ch2.space_after = Pt(10)

    bib_items = [
        ("[1] Francesco Cirillo", "The Pomodoro Technique: The Acclaimed Time-Management System That Has Transformed How We Work, Currency Books."),
        ("[2] Karpicke & Blunt", "Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping, Science 331(6018)."),
        ("[3] Richard Hipp", "SQLite Architecture and Embedded Database Engines, SQLite Development Team."),
        ("[4] Mozilla Developer Network", "WebAssembly & Client-Side Storage: High-performance in-browser database execution, MDN.")
    ]
    for author, cite in bib_items:
        p = tf_c2.add_paragraph()
        r1 = p.add_run()
        r1.text = author + ": "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = C_PURPLE_TEXT
        r2 = p.add_run()
        r2.text = cite
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(8)

    # Save submission presentation
    out_name = "presentation.pptx"
    prs.save(out_name)
    print(f"Presentation generated at {out_name}")

if __name__ == "__main__":
    create_presentation()
