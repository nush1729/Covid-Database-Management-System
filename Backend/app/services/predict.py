import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import numpy as np
from flask import Blueprint, request, jsonify
from ..config import Config

bp = Blueprint("predict", __name__, url_prefix="/api/predict")

# Assumes CSV columns: state, date, confirmed, recovered, active, deaths
@bp.get("/states")
def list_states():
    # Auto-detect delimiter; normalize columns
    df = pd.read_csv(Config.PREDICT_CSV_PATH, sep=None, engine="python")
    cols = {c.strip().lower(): c for c in df.columns}
    if "state" not in cols and "region" in cols:
        df = df.rename(columns={cols["region"]: "state"})
    elif "state" not in df.columns:
        df["state"] = "Unknown"
    states = sorted(set(df["state"].dropna().astype(str)))
    return jsonify({"states": states})

@bp.get("/state/<state>")
def forecast_state(state: str):
    horizon = int(request.args.get("days", 14))
    df = pd.read_csv(Config.PREDICT_CSV_PATH, sep=None, engine="python")
    cols = {c.strip().lower(): c for c in df.columns}
    if "state" not in cols and "region" in cols:
        df = df.rename(columns={cols["region"]: "state"})
    df = df[df["state"].astype(str).str.lower() == state.lower()].copy()
    if df.empty:
        return jsonify({"error":"State not found in dataset"}), 404
    # If date exists, aggregate duplicates by (state,date); else synthesize time index per state
    if "date" in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        # Normalize column names we care about
        val_cols = {}
        for k in ['confirmed','recovered','active','deaths','death','totalinfected']:
            if k in cols:
                val_cols[k] = cols[k]
        # Group by date to collapse multiple entries per state
        grp = df.groupby(['state','date'], as_index=False)
        agg_map = {v: 'sum' for v in val_cols.values()}
        df = grp.agg(agg_map)
    else:
        # No dates: treat file order as time; create synthetic dates per state
        df = df.reset_index(drop=True)
        df['__idx'] = df.groupby('state').cumcount()
        start = pd.Timestamp.today().normalize() - pd.Timedelta(days=df['__idx'].max() + horizon + 30)
        df['date'] = df['__idx'].apply(lambda i: (start + pd.Timedelta(days=int(i))))
        df = df.sort_values('date')
    df = df.sort_values('date')
    lower_cols = {c.strip().lower(): c for c in df.columns}

    def pick(col_names):
        for cand in col_names:
            if cand in lower_cols:
                return lower_cols[cand]
        return None

    series_map = {
        "recovered": pick(["recovered","recovery","recovered_cases"]),
        "active": pick(["active","activecases"]),
        "deaths": pick(["deaths","death"]),
        "confirmed": pick(["confirmed","totalinfected"]) ,
    }

    results = {}
    analysis_lines: list[str] = []
    last_date = df['date'].max()
    dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon, freq='D')

    for label, col in series_map.items():
        if not col:
            continue
        s = pd.to_numeric(df[col], errors='coerce').fillna(method='ffill').fillna(0.0)
        if len(s) < 5:
            continue
        try:
            # If series looks cumulative (mostly non-decreasing), forecast daily changes then re-accumulate
            cumulative_like = label in ["recovered","confirmed","deaths"] and s.is_monotonic_increasing
            if cumulative_like and len(s) >= 6:
                ds = s.diff().dropna()
                ds = ds.clip(lower=0)
                model = ARIMA(ds, order=(1,0,1))
                fit = model.fit()
                fc_diff = fit.forecast(steps=horizon)
                lvl = float(s.iloc[-1])
                acc = np.cumsum(fc_diff) + lvl
                series_fc = acc
            else:
                model = ARIMA(s, order=(1,1,1))
                fit = model.fit()
                series_fc = fit.forecast(steps=horizon)

            results[label] = [{"date": d.date().isoformat(), label: float(v)} for d, v in zip(dates, series_fc)]

            # Detailed analysis: last value, 7-day avg change, pct change, volatility, trend strength
            recent = s.tail(min(14, len(s)))
            last_val = float(recent.iloc[-1])
            last7 = recent.tail(min(7, len(recent)))
            prev7 = recent.head(max(0, len(recent)-len(last7)))
            avg_change = float(last7.diff().mean() or 0)
            pct_change = float(((last7.mean() - (prev7.mean() if len(prev7) else last7.mean())) / max(1e-6, (prev7.mean() if len(prev7) else last7.mean()))) * 100)
            vol = float(last7.diff().std() or 0)
            x = np.arange(len(recent))
            if len(recent) >= 2:
                slope, intercept = np.polyfit(x, recent.values, 1)
                y_hat = slope * x + intercept
                ss_res = float(np.sum((recent.values - y_hat) ** 2))
                ss_tot = float(np.sum((recent.values - np.mean(recent.values)) ** 2)) or 1.0
                r2 = 1 - ss_res / ss_tot
            else:
                slope = 0.0; r2 = 0.0
            direction = "increasing" if slope > 0 else ("decreasing" if slope < 0 else "stable")
            analysis_lines.append(
                f"{label.capitalize()}: last={last_val:.0f}, avg Δ7d={avg_change:.2f}, pct Δ≈{pct_change:.1f}%, volatility≈{vol:.2f}, trend {direction} (R²={r2:.2f})."
            )
        except Exception:
            continue

    if not results:
        return jsonify({"error":"No valid series to forecast"}), 400

    return jsonify({
        "state": state,
        "horizon": horizon,
        "series": results,
        "analysis": " ".join(analysis_lines)
    })
