"""Request / response models for /api/analytics (finance + predictive risk)."""
import re
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated, List, Optional

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    PlainSerializer,
    StringConstraints,
)


class RiskTier(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"


class Confidence(str, Enum):
    """How much history stands behind a forecast. 'limited' = treat the numbers as a rough guide only."""
    ADEQUATE = "adequate"
    LIMITED = "limited"


# --------------------------------------------------------------------- types
def _two_places(value: Decimal) -> float:
    return float(round(value, 2))


# Money going OUT is a plain JSON number (charts can use it directly), rounded to cents.
MoneyOut = Annotated[Decimal, PlainSerializer(_two_places, return_type=float, when_used="json")]

# Money coming IN must be strictly positive, at most 2 decimal places and fit the database column.
PositiveMoney = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2)]
PositiveRate = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]

DepartmentName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


def _fiscal_period(value: str) -> str:
    if not re.fullmatch(r"\d{4}-Q[1-4]", value):
        raise ValueError("fiscal_period must look like 2026-Q4 (year, dash, Q1-Q4)")
    if not 2000 <= int(value[:4]) <= 2100:
        raise ValueError("fiscal_period year must be between 2000 and 2100")
    return value


FiscalPeriod = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True), AfterValidator(_fiscal_period)]


# -------------------------------------------------------------------- budget
class BudgetUpsert(BaseModel):
    """POST /api/analytics/budget. One budget per department per fiscal period (sending it again replaces it)."""
    department: DepartmentName
    allocated_budget: PositiveMoney
    hourly_rate_cap: PositiveRate
    fiscal_period: FiscalPeriod


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department: str
    fiscal_period: str
    allocated_budget: MoneyOut
    hourly_rate_cap: MoneyOut
    period_start: date
    period_end: date
    updated_at: datetime


# ------------------------------------------------------------------- finance
class DepartmentFinance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department: str
    fiscal_periods: List[str]
    allocated_budget: MoneyOut
    hourly_rate_cap: MoneyOut
    spent: MoneyOut                      # cost of hours logged inside the requested date range
    remaining: MoneyOut                  # allocated minus everything spent so far in the budget period(s)
    utilization_pct: float               # share of the allocation already used (period to date)
    burn_rate_per_day: MoneyOut          # spent / days in range
    projected_spend: MoneyOut            # where spend ends up at the end of the budget period at this pace
    budget_variance: MoneyOut            # projected_spend - allocated  (positive = overrun)
    logged_hours: float
    tasks_completed: int
    tasks_open: int
    cost_per_task: Optional[MoneyOut] = None   # spent / tasks_completed; null when nothing was completed


class FinancialTotals(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    allocated_budget: MoneyOut
    spent: MoneyOut
    remaining: MoneyOut
    utilization_pct: float
    burn_rate_per_day: MoneyOut
    projected_spend: MoneyOut
    budget_variance: MoneyOut
    logged_hours: float
    tasks_completed: int
    tasks_open: int
    cost_per_task: Optional[MoneyOut] = None


class FinancialSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    start_date: date
    end_date: date
    generated_at: datetime
    cached: bool = False
    totals: FinancialTotals
    departments: List[DepartmentFinance]


# ---------------------------------------------------------------------- risk
class RiskComponents(BaseModel):
    """How many of the 100 points each factor contributed."""
    model_config = ConfigDict(from_attributes=True)

    overdue: float
    blocked: float
    workload: float
    budget_burn: float
    schedule: float


class WorkloadEntry(BaseModel):
    """One assignee's load. load_pct 100 = at capacity (5 open tasks)."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    open_tasks: int
    load_pct: float


class RiskTelemetry(BaseModel):
    """The raw numbers behind a score."""
    model_config = ConfigDict(from_attributes=True)

    total_tasks: int
    completed_tasks: int                 # approved (done) or ended
    completion_pct: float
    open_tasks: int
    overdue_tasks: int                   # expired + open tasks already past their deadline
    expired_tasks: int
    overdue_open_tasks: int
    blocked_tasks: int
    overdue_ratio: float
    blocked_ratio: float
    workload_saturation: float
    assignees: int
    overloaded_assignees: int            # people at or above capacity
    workload: List[WorkloadEntry]        # the five busiest assignees
    approvals_in_window: int             # tasks approved in the last 14 days (the velocity sample)
    budget_utilization_pct: Optional[float] = None
    period_elapsed_pct: Optional[float] = None
    budget_burn_ratio: Optional[float] = None       # utilization / elapsed; above 1 means spending faster than time passes
    velocity_tasks_per_day: float
    estimated_hours_open: float


class RiskIndicators(BaseModel):
    """What leadership should act on."""
    model_config = ConfigDict(from_attributes=True)

    deadline: Optional[date] = None
    days_remaining: Optional[int] = None            # negative = deadline already passed
    projected_slippage_days: Optional[int] = None   # null when there is no deadline OR not enough history (see confidence)
    estimated_budget_variance: Optional[MoneyOut] = None  # department level; null when no budget is set
    drivers: List[str]


class RiskItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scope_type: str                  # "project" or "sprint_board"
    scope_id: str
    name: str
    department: Optional[str] = None
    score: float
    tier: RiskTier
    confidence: Confidence
    confidence_notes: List[str]
    components: RiskComponents
    telemetry: RiskTelemetry
    indicators: RiskIndicators


class RiskForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated_at: datetime
    cached: bool = False
    overall_score: float
    overall_tier: RiskTier
    overall_confidence: Confidence
    items: List[RiskItem]
