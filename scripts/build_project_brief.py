from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, Rect
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


PAGE_WIDTH, PAGE_HEIGHT = A4
NAVY = colors.HexColor("#0A1024")
DEEP_NAVY = colors.HexColor("#111832")
TEAL = colors.HexColor("#6FDDCD")
BLUE = colors.HexColor("#8197D6")
WHITE = colors.HexColor("#F4F7FF")
MUTED = colors.HexColor("#A9B7DC")
DANGER = colors.HexColor("#FF7894")


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=32,
        textColor=WHITE,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=23,
        textColor=TEAL,
        spaceBefore=4,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=16,
        textColor=MUTED,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        "Lead",
        parent=styles["Body"],
        fontSize=12,
        leading=19,
        textColor=WHITE,
    )
)
styles.add(
    ParagraphStyle(
        "Eyebrow",
        parent=styles["Body"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=TEAL,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        "Footer",
        parent=styles["Body"],
        fontSize=8,
        leading=10,
        textColor=BLUE,
        alignment=TA_CENTER,
    )
)


class Panel(Flowable):
    def __init__(self, width, height, fill=None, stroke=None):
        super().__init__()
        self.width = width
        self.height = height
        self.fill = fill
        self.stroke = stroke

    def draw(self):
        if self.fill is not None:
            self.canv.setFillColor(self.fill)
        if self.stroke is not None:
            self.canv.setStrokeColor(self.stroke)
            self.canv.setLineWidth(1)
        self.canv.roundRect(0, 0, self.width, self.height, 8, stroke=1 if self.stroke else 0, fill=1 if self.fill else 0)


class ProofFlow(Flowable):
    def __init__(self, width, height):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        canvas = self.canv
        labels = [
            ("1. Operator", "EVM wallet + policy input"),
            ("2. Sepolia", "RiskSignalRecorded event"),
            ("3. Attestcoin", "Inclusion + continuity proof"),
            ("4. Creditcoin", "Native verification + decision"),
        ]
        box_width = 102
        gap = (self.width - box_width * 4) / 3
        y = 24
        canvas.setFillColor(DEEP_NAVY)
        canvas.setStrokeColor(colors.HexColor("#41508b"))
        canvas.setLineWidth(1)
        for index, (title, subtitle) in enumerate(labels):
            x = index * (box_width + gap)
            canvas.roundRect(x, y, box_width, 54, 8, stroke=1, fill=1)
            canvas.setFillColor(TEAL if index in (0, 3) else WHITE)
            canvas.setFont("Helvetica-Bold", 9)
            canvas.drawCentredString(x + box_width / 2, y + 32, title)
            canvas.setFillColor(MUTED)
            canvas.setFont("Helvetica", 7.5)
            canvas.drawCentredString(x + box_width / 2, y + 18, subtitle)
            if index < 3:
                arrow_x = x + box_width + 4
                canvas.setStrokeColor(TEAL)
                canvas.setFillColor(TEAL)
                canvas.line(arrow_x, y + 27, arrow_x + gap - 10, y + 27)
                canvas.line(arrow_x + gap - 14, y + 30, arrow_x + gap - 9, y + 27)
                canvas.line(arrow_x + gap - 14, y + 24, arrow_x + gap - 9, y + 27)
        canvas.setFillColor(BLUE)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawCentredString(self.width / 2, 6, "No backend, no centralized oracle, no custody")


def page_background(canvas, document):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#222f5d"))
    canvas.rect(0, 0, PAGE_WIDTH, 4 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(colors.Color(TEAL.red, TEAL.green, TEAL.blue, alpha=0.2))
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 14 * mm, PAGE_WIDTH - 20 * mm, 14 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(BLUE)
    canvas.drawString(20 * mm, 8 * mm, "Attest AI - Verified Agent Guard")
    canvas.drawRightString(PAGE_WIDTH - 20 * mm, 8 * mm, f"Page {document.page}")
    canvas.restoreState()


def title_page(canvas, document):
    page_background(canvas, document)
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#18244a"))
    canvas.roundRect(24 * mm, 42 * mm, PAGE_WIDTH - 48 * mm, 170 * mm, 12, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#41508b"))
    canvas.roundRect(24 * mm, 42 * mm, PAGE_WIDTH - 48 * mm, 170 * mm, 12, stroke=1, fill=0)
    canvas.setFillColor(TEAL)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(36 * mm, 180 * mm, "BUIDL CTC 2026 FALL - AI TRACK")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 32)
    canvas.drawString(36 * mm, 146 * mm, "Attest AI")
    canvas.setFont("Helvetica-Bold", 24)
    canvas.setFillColor(TEAL)
    canvas.drawString(36 * mm, 116 * mm, "Verified Agent Guard")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 11.5)
    text = (
        "Deterministic AI policy. Cryptographically proven source events. "
        "An auditable allow/deny registry on Creditcoin CC3 Testnet."
    )
    canvas.drawString(36 * mm, 90 * mm, text)
    canvas.setFillColor(BLUE)
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(36 * mm, 58 * mm, "Attestcoin Protocol | Sepolia | Creditcoin CC3 Testnet")
    canvas.drawString(36 * mm, 48 * mm, "DoraHacks submission brief - September 2026")
    canvas.restoreState()


def build(output_path):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(output_path),
        pagesize=A4,
        title="Attest AI - Project Brief",
        author="Zac Lou",
        subject="Attestcoin Protocol and Creditcoin CC3 Testnet",
    )
    frame = Frame(20 * mm, 20 * mm, PAGE_WIDTH - 40 * mm, PAGE_HEIGHT - 34 * mm, id="normal")
    doc.addPageTemplates(
        [
            PageTemplate(id="title", frames=[frame], onPage=title_page),
            PageTemplate(id="content", frames=[frame], onPage=page_background),
        ]
    )

    story = [
        NextPageTemplate("content"),
        PageBreak(),
        Paragraph("Why AI agents need a guardrail", styles["H2"]),
        Paragraph(
            "Autonomous agents increasingly trigger payments, credit actions, and infrastructure calls. "
            "Most safety layers ask users to trust a model's explanation or a centralized oracle. Attest AI "
            "separates explanation from proof: the AI policy is deterministic and versioned, while Attestcoin "
            "cryptographically proves that the policy result really happened on Sepolia.",
            styles["Lead"],
        ),
        Spacer(1, 6),
        Paragraph("Operator problem", styles["H2"]),
        Paragraph(
            "An agent operator must prove to auditors that an action was based on an actual source-chain event, "
            "not a fabricated or stale model output. Current logs are mutable, oracle statements are opaque, and "
            "LLM explanations cannot be used as on-chain evidence.",
            styles["Body"],
        ),
        Paragraph("Solution", styles["H2"]),
        Paragraph(
            "The browser computes Policy v1 from the intended recipient and notional value. The operator signs a "
            "RiskSignalRecorded event on Sepolia. After Attestcoin attestation, the app submits the proof to "
            "AttestGuard on CC3. The contract verifies the source receipt, emitter, score, evidence hash, policy "
            "version, and duplicate intent before recording the final decision.",
            styles["Body"],
        ),
        PageBreak(),
        Paragraph("Architecture and trust model", styles["H2"]),
        ProofFlow(PAGE_WIDTH - 40 * mm, 84),
        Spacer(1, 10),
    ]
    trust_data = [
        ["Fact", "Attest AI treatment"],
        ["Source event", "Verified by Attestcoin inclusion and continuity proof"],
        ["Risk score", "Recomputed by Solidity from the proved event"],
        ["Evidence hash", "Recomputed and compared on CC3"],
        ["AI explanation", "Generated off-chain, but not relied on for trust"],
        ["Target decision", "Public mapping and event on Creditcoin"],
    ]
    trust_table = Table(trust_data, colWidths=[45 * mm, 110 * mm])
    trust_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DEEP_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 1), (-1, -1), MUTED),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
                ("FONT", (0, 1), (-1, -1), "Helvetica", 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#41508b")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([trust_table, PageBreak()])
    story.append(Paragraph("Deterministic policy v1", styles["H2"]))
    policy_data = [
        ["Input", "Score impact"],
        ["Base policy", "20"],
        ["Value above 0.05 ETH", "+30"],
        ["Value above 0.5 ETH", "+30"],
        ["Recipient equals signer", "+15"],
        ["Zero-value intent", "+10"],
        ["Final score at or below 60", "Allow"],
        ["Final score above 60", "Deny and record for audit"],
    ]
    policy_table = Table(policy_data, colWidths=[75 * mm, 80 * mm])
    policy_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DEEP_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 1), (-1, -1), MUTED),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
                ("FONT", (0, 1), (-1, -1), "Helvetica", 8.5),
                ("TEXTCOLOR", (0, 7), (-1, 7), DANGER),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#41508b")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend(
        [
            policy_table,
            Spacer(1, 12),
            Paragraph(
                "The same constants are implemented in TypeScript and Solidity. Contract tests compare the "
                "source and target implementations for low, mid, high, self-directed, and zero-value inputs. "
                "The target recomputes the score and evidence hash, so a tampered event cannot pass.",
                styles["Body"],
            ),
            PageBreak(),
        ]
    )
    story.append(Paragraph("Implementation and verification", styles["H2"]))
    implementation_data = [
        ["Layer", "Implementation"],
        ["Source", "SourceRiskSignal.sol on Sepolia"],
        ["Target", "AttestGuard.sol with ASCBase and native verifier"],
        ["Client", "React 19, TypeScript strict, ethers v6"],
        ["Proofs", "Official Attestcoin proof-builder API"],
        ["Testing", "24 automated tests across TypeScript and Solidity"],
        ["Build", "npm run typecheck, npm test, npm run build, forge test"],
    ]
    implementation_table = Table(implementation_data, colWidths=[38 * mm, 117 * mm])
    implementation_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DEEP_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 1), (-1, -1), MUTED),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8.5),
                ("FONT", (0, 1), (-1, -1), "Helvetica", 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#41508b")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([implementation_table, Spacer(1, 10), Paragraph("Security checks", styles["H2"])])
    security_items = [
        "Failed source receipts are rejected.",
        "Untrusted emitters are rejected.",
        "Malformed event topics are rejected.",
        "Tampered scores and evidence hashes are rejected.",
        "Duplicate intents are rejected.",
        "Only the contract owner can register the trusted source emitter.",
    ]
    for item in security_items:
        story.append(Paragraph(f"- {item}", styles["Body"]))
    story.append(PageBreak())
    story.append(Paragraph("Current testnet evidence", styles["H2"]))
    evidence_data = [
        ["Artifact", "Value"],
        ["Sepolia source contract", "0x7CFC5C06aFfBe46c55b9d5313A9ab2A5faa1a2BD"],
        ["Deployment transaction", "0x0bc6fbe5979818906e1587fa32112a999afff19c5f87bb72470cab54e047ca22"],
            ["High-risk signal", "0x6302b379257c1a6aa700b210fd8234b672e4b465805f4d928f3de9555195ce9f"],
            ["Signal score", "80 / 100 - expected deny"],
            ["Official proof", "Saved at docs/evidence/high-risk-proof.json"],
            ["Low-risk signal", "0xd9fe599bbf2f870314d2884250359113998c73ed0b473832db0ab7efca853ef4"],
            ["Low-risk score", "20 / 100 - expected allow"],
            ["Low-risk proof", "Saved at docs/evidence/low-risk-proof.json"],
            ["Current-stage low-risk signal", "0xa25f30cf1f9809e299b9af09d6679a37056f1074ba34a3cf0f3f6e518b77a960"],
            ["Current-stage official proof", "Saved at docs/evidence/stage-low-risk-proof.json"],
            ["Interim demo video", "https://attest-ai-livid.vercel.app/demo/attest-ai-stage-demo.mp4"],
            ["CC3 guard", "Pending official Discord testnet faucet"],
    ]
    evidence_table = Table(evidence_data, colWidths=[42 * mm, 113 * mm])
    evidence_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DEEP_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 1), (-1, -1), MUTED),
                ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 8),
                ("FONT", (0, 1), (-1, -1), "Helvetica", 7.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#41508b")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend(
        [
            evidence_table,
            Spacer(1, 12),
            Paragraph("Submission status", styles["H2"]),
            Paragraph(
                "Source, contracts, client, tests, README, this brief, the public Vercel application, the current-stage "
                "Attestcoin proof, and a 2m19s 1080p interim demo are complete. Full CC3 decisions and the final "
                "end-to-end video are scheduled as soon as the official faucet delivers testnet CTC. All final "
                "transaction links will be written into the repository README and the DoraHacks submission form.",
                styles["Body"],
            ),
        ]
    )
    doc.build(story)



if __name__ == "__main__":
    build("output/pdf/Attest-AI-Project-Brief.pdf")
