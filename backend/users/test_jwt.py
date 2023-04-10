import requests

########      GET tokens   #############################################
headers = {}
json_data = {'username': 'felipe','password': 'cotonete22',}
response = requests.post('http://localhost:8000/api/token/', headers=headers, json=json_data)
print(response.json())


# ########   Check tokens   #############################################
# token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX3BrIjoxLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiY29sZF9zdHVmZiI6IuKYgyIsImV4cCI6MTIzNDU2LCJqdGkiOiJmZDJmOWQ1ZTFhN2M0MmU4OTQ5MzVlMzYyYmNhOGJjYSJ9.NHlztMGER7UADHZJlxNG0WSi22a2KaYSfd1S-AuT7lU'
# headers = {'Authorization': f'Bearer {token}',}
# response = requests.get('http://localhost:8000/api/some-protected-view/', headers=headers)


########   Refresh tokens   #############################################
# ## When token dies, you can refresh
# headers = {'Content-Type': 'application/json'}
# json_data = {'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX3BrIjoxLCJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImNvbGRfc3R1ZmYiOiLimIMiLCJleHAiOjIzNDU2NywianRpIjoiZGUxMmY0ZTY3MDY4NDI3ODg5ZjE1YWMyNzcwZGEwNTEifQ.aEoAYkSJjoWH1boshQAaTkf8G3yn0kapko6HFRt7Rh4',}
# response = requests.post('http://localhost:8000/api/token/refresh/', headers=headers, json=json_data)