import subprocess
from .urltoscreenshot import get_screenshot
import os
import base64

async def create_video_from_url(url, savepath):
    if False:
        result = subprocess.run(
            ['node', 'helpers/recordBrowser.js', url, savepath],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("Recording completed successfully")
            print(result.stdout)
        else:
            print("Error during recording")
            print(result.stderr)
    print(url)
    if False:
        screenshot = await get_screenshot(
                {'url': url,
                'width': 1280,
                'height': 1280,
                'format': 'png',
                'full_size':1,
                'response_type': 'json',
                'delay_time': 2000,
                'timeout': 60000})
        screenshot_path = None
        if screenshot is not None:
            base64_image = screenshot['image'].split(',', maxsplit=1)[1]
            screenshot_path = 'screenshot.png'
            image_file = open(screenshot_path, 'wb')
            image_file.write(base64.b64decode(base64_image))
            image_file.close()
    video_length = 0
    if os.path.exists(savepath):
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', savepath],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            video_length = float(result.stdout.strip())
    return 'asdas'
    
    # Generate HTML response
    html_response = f"""
    <html>
    <head>
        <title>Video Recording Result</title>
    </head>
    <body>
        <h1>Video Recording Result</h1>
        <p>Video length: {video_length} seconds</p>
        """
    
    if screenshot_path:
        # Convert screenshot path to base64
        with open(screenshot_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        html_response += f"""
        <h2>Screenshot:</h2>
        <img src="data:image/png;base64,{encoded_string}" alt="Screenshot" />
        """
    
    html_response += """
    </body>
    </html>
    """
    
    return html_response,video_length,screenshot_path,savepath

# Example usage
# url = "https://github.com/CopilotKit/CopilotKit?utm_source=manuagi.beehiiv.com&utm_medium=referral&utm_campaign=top-trending-open-source-github-projects-this-week-decentralized-ai-agents-to-coding-assistants"
# audio_length = 300  # in seconds
# savepath = "output.mp4"

#create_video_from_url(url, savepath)
