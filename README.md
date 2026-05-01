# SmartBuildingManagementHub

fill the last 24h with a reading every 15 minutes (good baseline for graphs)
# python simulate_data.py --mode backfill --hours 24 --interval-min 15

longer history for trend visualization
# python simulate_data.py --mode backfill --hours 168 --interval-min 30   # 1 week


frontend:
	## npm start

backend:
	## python simulate_data.py --mode live --interval-sec 30
	## python main.py
