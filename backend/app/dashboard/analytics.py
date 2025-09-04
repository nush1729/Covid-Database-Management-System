# backend/app/dashboard/analytics.py

from app import db
from app.models.statestats import StateStats
from sqlalchemy import func

def get_state_totals():
    """Aggregate confirmed, recovered, deaths, and active cases for each state."""
    stats = (
        db.session.query(
            StateStats.state,
            func.max(StateStats.confirmed).label('confirmed'),
            func.max(StateStats.recovered).label('recovered'),
            func.max(StateStats.deaths).label('deaths'),
            func.max(StateStats.active).label('active')
        )
        .group_by(StateStats.state)
        .all()
    )
    return [
        {
            "state": s[0],
            "confirmed": s[1],
            "recovered": s[2],
            "deaths": s[3],
            "active": s[4],
        }
        for s in stats
    ]


def get_national_total():
    """Aggregate country total for latest available date."""
    subquery = (
        db.session.query(
            StateStats.date
        )
        .order_by(StateStats.date.desc())
        .limit(1)
        .subquery()
    )
    stats = (
        db.session.query(
            func.sum(StateStats.confirmed),
            func.sum(StateStats.recovered),
            func.sum(StateStats.deaths),
            func.sum(StateStats.active)
        )
        .filter(StateStats.date == subquery)
        .first()
    )
    return {
        "confirmed": stats[0],
        "recovered": stats[1],
        "deaths": stats[2],
        "active": stats[3]
    }


def get_cases_time_series(state=None):
    """Get timeline of daily cases for a state (or all states if None)."""
    q = db.session.query(StateStats.date, func.sum(StateStats.confirmed))
    if state:
        q = q.filter(StateStats.state == state)
    q = q.group_by(StateStats.date).order_by(StateStats.date)
    series = q.all()
    return {
        "dates": [r[0].strftime("%Y-%m-%d") for r in series],
        "confirmed": [r[1] for r in series],
    }
