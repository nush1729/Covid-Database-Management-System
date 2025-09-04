import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from app.models.statestats import StateStats
from app import db

def forecast_cases(state, days=7):
    query = StateStats.query.filter_by(state=state).order_by(StateStats.date).all()
    if len(query) < 5:
        return None
    df = pd.DataFrame([{'date': r.date, 'confirmed': r.confirmed} for r in query])
    df['day_num'] = np.arange(len(df))
    X = df[['day_num']]
    y = df['confirmed']
    model = LinearRegression()
    model.fit(X, y)
    future_x = np.arange(len(df), len(df)+days).reshape(-1,1)
    predictions = model.predict(future_x)
    dates = [(df['date'].iloc[-1] + pd.Timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(days)]
    return {'dates': dates, 'predictions': predictions.tolist()}
