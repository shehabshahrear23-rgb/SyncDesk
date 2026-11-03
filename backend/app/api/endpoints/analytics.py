"""Finance + predictive risk analytics for leadership.

    GET  /api/analytics/finance        budgets, burn rate, cost per task
    POST /api/analytics/budget         create / replace a department budget
    GET  /api/analytics/risk-forecast  Low / Moderate / High / Critical per project and sprint board

Everything here needs the CEO, a department head (team lead) or a project manager - see require_leadership.
Snapshots are cached in Redis for 5 minutes; if Redis is down the data is simply recomputed.
"""
import logging
from contextlib import contextmanager
from datetime import date, datetime, timezone
from typing import Iterator, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_leadership
from app.db import models
from app.schemas.analytics import (
    BudgetOut,
    BudgetUpsert,
    FinancialSummaryOut,
    RiskForecastOut,
)
from app.services import analytics_queries as queries
from app.services.redis_client import ANALYTICS_CACHE_PREFIX, cache_get, cache_invalidate, cache_set
from app.services.risk_engine import fiscal_period_bounds, fiscal_period_for
from app.services.task_lifecycle import expire_overdue_tasks

router = APIRouter(dependencies=[Depends(require_leadership)])  # every route is leadership-only

CACHE_PREFIX = ANALYTICS_CACHE_PREFIX
logger = logging.getLogger(__name__)


@contextmanager
def safe_errors(db: Session) -> Iterator[None]:
    """Unexpected failures (database down, bug) become a plain 500 with a generic message.
    The real error goes to the server log only, and the transaction is rolled back so the session stays usable."""
    try:
        yield
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("Analytics request failed")
        raise HTTPException(500, "The analytics service could not complete this request. Please try again later.")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _now().date()


def date_range(
    start_date: Optional[date] = Query(None, description="First day, YYYY-MM-DD. Default: start of the current fiscal quarter."),
    end_date: Optional[date] = Query(None, description="Last day, YYYY-MM-DD. Default: end of the current fiscal quarter."),
) -> Tuple[date, date]:
    """Validates the date filter before any database work happens."""
    quarter_start, quarter_end = fiscal_period_bounds(fiscal_period_for(_today()))
    start, end = start_date or quarter_start, end_date or quarter_end
    if end < start:
        raise HTTPException(422, "end_date must not be earlier than start_date.")
    return start, end


@router.get("/finance", response_model=FinancialSummaryOut)
def read_finance(
    dates: Tuple[date, date] = Depends(date_range),
    department: Optional[str] = Query(None, min_length=1, max_length=80),
    db: Session = Depends(get_db),
):
    start, end = dates
    key = f"{CACHE_PREFIX}finance:{start}:{end}:{(department or '*').strip().lower()}"
    snapshot = cache_get(key)
    if snapshot is not None:
        return FinancialSummaryOut.model_validate({**snapshot, "cached": True})

    with safe_errors(db):
        summary = FinancialSummaryOut(
            start_date=start, end_date=end, generated_at=_now(), cached=False,
            **queries.finance_summary(db, start, end, _today(), department),
        )
    cache_set(key, summary.model_dump(mode="json"))
    return summary


@router.post("/budget", response_model=BudgetOut)
def upsert_budget(
    body: BudgetUpsert,
    response: Response,
    db: Session = Depends(get_db),
    me: models.User = Depends(require_leadership),
):
    """Creates the budget (201) or replaces the one already set for that department + period (200).
    The department must already exist (404 otherwise): at least one person or project has to belong to it."""
    with safe_errors(db):
        if not queries.department_exists(db, body.department):
            raise HTTPException(404, "Department not found.")
        period_start, period_end = fiscal_period_bounds(body.fiscal_period)

        def find() -> Optional[models.Budget]:
            return db.execute(select(models.Budget).where(
                func.lower(models.Budget.department) == body.department.lower(),
                models.Budget.fiscal_period == body.fiscal_period,
            )).scalar_one_or_none()

        budget, created = find(), False
        if budget is None:
            budget, created = models.Budget(fiscal_period=body.fiscal_period, period_start=period_start,
                                            period_end=period_end), True
            db.add(budget)
        budget.department = body.department
        budget.allocated_budget = body.allocated_budget
        budget.hourly_rate_cap = body.hourly_rate_cap
        budget.updated_by_id = me.id
        budget.updated_at = _now().replace(tzinfo=None)
        try:
            db.commit()
        except IntegrityError:          # two people saved the same department + period at the same moment
            db.rollback()
            budget, created = find(), False
            if budget is None:
                raise
            budget.allocated_budget, budget.hourly_rate_cap = body.allocated_budget, body.hourly_rate_cap
            budget.updated_by_id = me.id
            db.commit()
        db.refresh(budget)

    cache_invalidate(CACHE_PREFIX)  # figures changed: drop every cached snapshot
    response.status_code = 201 if created else 200
    return budget


@router.get("/risk-forecast", response_model=RiskForecastOut)
def read_risk_forecast(
    department: Optional[str] = Query(None, min_length=1, max_length=80),
    project_id: Optional[int] = Query(None, gt=0),
    db: Session = Depends(get_db),
):
    with safe_errors(db):
        if project_id is not None and queries.get_project(db, project_id) is None:
            raise HTTPException(404, "Project not found.")
        if department is not None and not queries.department_exists(db, department):
            raise HTTPException(404, "Department not found.")

    key = f"{CACHE_PREFIX}risk:{(department or '*').strip().lower()}:{project_id or '*'}"
    snapshot = cache_get(key)
    if snapshot is not None:
        return RiskForecastOut.model_validate({**snapshot, "cached": True})

    with safe_errors(db):
        expire_overdue_tasks(db)    # same housekeeping the task board does, so "expired" is up to date
        forecast = RiskForecastOut(
            generated_at=_now(), cached=False,
            **queries.risk_forecast(db, _today(), _now(), department, project_id),
        )
    cache_set(key, forecast.model_dump(mode="json"))
    return forecast
