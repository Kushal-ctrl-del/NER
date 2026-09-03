import requests

segs = requests.get('http://127.0.0.1:8000/road-segments').json()
segment_id = segs[0]['id']

ml = requests.post(f'http://127.0.0.1:8000/ml/predict-risk/{segment_id}').json()
print("ML Prediction:", ml)
