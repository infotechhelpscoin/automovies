#!/usr/bin/python3
import base64
import requests
import json
from .cloudUpload import upload_image
import asyncio

async def get_screenshot(params,screenshot_path):
    headers = {"Content-type": "application/x-www-form-urlencoded",
               "Accept": "text/plain",
               "userkey": "IAAIEYKBJAMIG76IQ3GROBJOXO"}
    print('11')
    try:
        r = requests.post('https://api.site-shot.com/', headers=headers, data=params)

        if (r.status_code == requests.codes.ok):
            screenshot=r.json()
            if screenshot is not None:
                base64_image = screenshot['image'].split(',', maxsplit=1)[1]
                image_file = open(screenshot_path, 'wb')
                image_file.write(base64.b64decode(base64_image))
                image_file.close()
            url = upload_image(screenshot_path)
            print("URL of the uploaded image:", url)            
            return url
        elif (r.status_code == 404):
            print("Screenshot hasn't been generated. The error: " + r.json().error)
        elif (r.status_code == 401):
            print("Invalid authentication token")
        elif (r.status_code == 403):
            print("Active subscription hasn't been found")

    except requests.exceptions.RequestException as e:
        print('Screenshot generation has failed, the error: ' + str(e))
    
            



# asyncio.run( get_screenshot(
#         {'url': 'https://github.com/OthersideAI/self-operating-computer/',
#          'width': 1280,
#          'height': 1280,
#          'format': 'png',
#          'full_size':1,
#          'response_type': 'json',
#          'delay_time': 2000,
#          'timeout': 60000},'screenshot2.png'))

#     if screenshot is not None:
#         base64_image = screenshot['image'].split(',', maxsplit=1)[1]
#         image_file = open('screenshot.png', 'wb')
#         image_file.write(base64.b64decode(base64_image))
#         image_file.close()


# main()