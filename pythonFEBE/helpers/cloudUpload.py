import cloudinary
import asyncio
import cloudinary.uploader

cloudinary.config(
  cloud_name = 'dj3qabx11',  # Replace with your cloud name
  api_key = '533762782692462',        # Replace with your API key
  api_secret = 'YcvSAvEFsEu-rZyhKmLnI3bQ5KQ'   # Replace with your API secret
)

# cloudinary.config({
#   cloud_name: 'doyry0ttt',
#   api_key: '447229656995129',
#   api_secret: 'cZVTKK_zWBLpi3eeML6PcDKS2E4'
# })

def upload_image(image_path):
    """ Uploads an image to Cloudinary """
    response = cloudinary.uploader.upload(image_path)
    url=response.get('url')
    return url
