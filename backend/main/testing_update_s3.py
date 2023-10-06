import requests
import json

base_url = 'http://localhost:8000/api/main/'
product_name = 'forestmask'
username = 'felipe'
password = 'cotonete22'

session = requests.Session()

token_url = base_url + 'token/'
token_data = {
    'username': username,
    'password': password,
}
token_response = session.post(token_url, data=token_data)

if token_response.status_code == 200:
    access_token = token_response.json().get('access')
    # print(f"Access Token: {access_token}")

    update_url = base_url + 'update_tiles_from_s3/'
    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    
    # response = session.post(update_url, headers=headers)

    data = {
        'product': product_name,
    }
    response = session.post(update_url, headers=headers, data=data)


    if response.status_code == 201:
        print("Tiles updated successfully.")
    else:
        print(f"Failed to update tiles. Status code: {response.status_code}")
        print(response.json())

else:
    print("Authentication failed.")
    print(token_response.json())