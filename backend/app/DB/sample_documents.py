"""Sample Document Vault documents, so the library is never empty on a fresh database."""
from datetime import date

from sqlalchemy.orm import Session

from app.db import models

SAMPLE_DOCUMENTS = [
    # The four documents that were already in the Document Vault (src/data/mockData.js).
    # Their categories are kept as they were; linkedProject became a one-item linked_context.
    dict(title="SyncDesk Q3 Strategic Growth & Revenue Roadmap.pdf", category="Executive Strategy",
         linked_context=["Predictive Analytics"], upload_date=date(2026, 8, 2), file_size="4.8 MB",
         author="David Kim", starred=True),
    dict(title="System Architecture & Digital Twin Node Specification v3.2.docx", category="Engineering",
         linked_context=["Digital Twin Engine"], upload_date=date(2026, 7, 29), file_size="12.4 MB",
         author="Elena Rostova", starred=True),
    dict(title="Enterprise Dark Design Tokens & Component Standard Guidelines.fig", category="Design",
         linked_context=["Design System"], upload_date=date(2026, 8, 1), file_size="42.1 MB",
         author="Sophia Lin", starred=False),
    dict(title="SOC2 Type II Audit & Infrastructure Security Attestation Report.pdf", category="Compliance",
         linked_context=["Security Mesh"], upload_date=date(2026, 7, 15), file_size="8.2 MB",
         author="Marcus Vance", starred=True),

    # HR
    dict(title="Employee Onboarding Guide.pdf", category="HR",
         linked_context=["Onboarding"], upload_date=date(2026, 10, 1), file_size="2.4 MB",
         author="Hasan Rahman", starred=True),
    dict(title="Dental & Vision Benefits Plan 2026.pdf", category="HR",
         linked_context=["Benefits", "HR Policy"], upload_date=date(2026, 9, 18), file_size="1.1 MB",
         author="Hasan Rahman", starred=False),
    dict(title="Annual Leave & Remote Work Policy.docx", category="HR",
         linked_context=["HR Policy"], upload_date=date(2026, 9, 5), file_size="640 KB",
         author="Hasan Rahman", starred=False),

    # IT
    dict(title="IT Equipment & Laptop Setup Checklist.pdf", category="IT",
         linked_context=["Onboarding", "Q3 Project"], upload_date=date(2026, 9, 28), file_size="980 KB",
         author="System Admin", starred=False),
    dict(title="VPN & Password Security Standard.pdf", category="IT",
         linked_context=["Security Policy"], upload_date=date(2026, 9, 12), file_size="1.6 MB",
         author="System Admin", starred=True),

    # Legal
    dict(title="Mutual Non-Disclosure Agreement Template.docx", category="Legal",
         linked_context=["Contracts"], upload_date=date(2026, 8, 22), file_size="210 KB",
         author="Sara Chowdhury", starred=False),
    dict(title="Data Privacy & GDPR Compliance Handbook.pdf", category="Legal",
         linked_context=["Compliance", "Data Privacy"], upload_date=date(2026, 9, 2), file_size="3.7 MB",
         author="Sara Chowdhury", starred=False),

    # SOPs
    dict(title="Travel & Expense Reimbursement SOP.pdf", category="SOPs",
         linked_context=["Expense Policy"], upload_date=date(2026, 9, 25), file_size="870 KB",
         author="Tanvir Ahmed", starred=False),
    dict(title="Dental Claim Submission Procedure.pdf", category="SOPs",
         linked_context=["Benefits", "Expense Policy"], upload_date=date(2026, 9, 20), file_size="450 KB",
         author="Nadia Islam", starred=False),
    dict(title="Incident Response Runbook.pdf", category="SOPs",
         linked_context=["Security Policy", "Q3 Project"], upload_date=date(2026, 8, 30), file_size="2.0 MB",
         author="Tanvir Ahmed", starred=True),
]

def add_sample_documents(db: Session) -> int:
    """Adds every sample document whose title is not in the table yet. Returns how many were added."""
    added = 0
    for data in SAMPLE_DOCUMENTS:
        exists = db.query(models.Document).filter(models.Document.title == data["title"]).first()
        if exists:
            continue
        db.add(models.Document(**data))
        added += 1
    db.commit()
    return added

def add_sample_documents_if_empty(db: Session) -> int:
    """Used at server start: only fills a completely empty documents table."""
    if db.query(models.Document).first() is not None:
        return 0
    return add_sample_documents(db)
