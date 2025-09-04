# backend/app/routes/csv_import.py

import pandas as pd
from flask import Blueprint, jsonify
from app import db
from app.models.statestats import StateStats

csv_import_bp = Blueprint('csv_import', __name__)

@csv_import_bp.route('/state_stats', methods=['POST'])
def import_state_stats():
    df = pd.read_csv('data/statewise-covid-data.csv')
    df['state'] = df['regionData.region']
    df['active'] = df['regionData.activeCases']
    df['recovered'] = df['regionData.recovered']
    df['deaths'] = df['regionData.deceased']
    df['total_cases'] = df['totalCases']
    df['date'] = pd.to_datetime(df['lastUpdatedAtApify']).dt.date
    df_clean = df[['state', 'active', 'recovered', 'deaths', 'total_cases', 'date']]
    df_clean.dropna(inplace=True)
    df_clean['mortality_rate'] = df_clean['deaths'] / df_clean['total_cases']
    for _, row in df_clean.iterrows():
        stat = StateStats.query.filter_by(state=row['state'], date=row['date']).first()
        if stat:
            stat.confirmed = row['total_cases']
            stat.active = row['active']
            stat.recovered = row['recovered']
            stat.deaths = row['deaths']
            stat.mortality_rate = row['mortality_rate']
        else:
            stat = StateStats(
                state=row['state'],
                confirmed=row['total_cases'],
                active=row['active'],
                recovered=row['recovered'],
                deaths=row['deaths'],
                date=row['date'],
                mortality_rate=row['mortality_rate']
            )
            db.session.add(stat)
    db.session.commit()
    return jsonify({'message': 'State stats imported successfully'})
