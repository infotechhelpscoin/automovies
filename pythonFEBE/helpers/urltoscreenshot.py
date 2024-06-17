#!/usr/bin/python3
import base64
import requests


async def get_screenshot(params):
    headers = {"Content-type": "application/x-www-form-urlencoded",
               "Accept": "text/plain",
               "userkey": "IAAIEYKBJAMIG76IQ3GROBJOXO"}

    try:
        r = requests.post('https://api.site-shot.com/', headers=headers, data=params)

        if (r.status_code == requests.codes.ok):
            return r.json()
        elif (r.status_code == 404):
            print("Screenshot hasn't been generated. The error: " + r.json().error)
        elif (r.status_code == 401):
            print("Invalid authentication token")
        elif (r.status_code == 403):
            print("Active subscription hasn't been found")

    except requests.exceptions.RequestException as e:
        print('Screenshot generation has failed, the error: ' + str(e))


# def main():
#     screenshot = get_screenshot(
#         {'url': 'https://github.com/OthersideAI/self-operating-computer/',
#          'width': 1280,
#          'height': 1280,
#          'format': 'png',
#          'full_size':1,
#          'response_type': 'json',
#          'delay_time': 2000,
#          'timeout': 60000})

#     if screenshot is not None:
#         base64_image = screenshot['image'].split(',', maxsplit=1)[1]
#         image_file = open('screenshot.png', 'wb')
#         image_file.write(base64.b64decode(base64_image))
#         image_file.close()


# main()