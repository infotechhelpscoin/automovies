import subprocess
from .urltoscreenshot import get_screenshot
import os
import base64

async def create_video_from_url(url, savepath,wordsPerMin=160):
    # screenshot_path = 'screenshot.png'
    # screenshot = 'http://res.cloudinary.com/dj3qabx11/image/upload/v1718625872/unvuiirkbw5lymasrwyg.png'
    # video_length=72.5
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

    await get_screenshot(
            {'url': url,
            'width': 1280,
            'height': 1280,
            'format': 'png',
            'full_size':1,
            'response_type': 'json',
            'delay_time': 2000,
            'timeout': 60000})
    
    video_length = 0
    if os.path.exists(savepath):
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', savepath],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            video_length = float(result.stdout.strip())
            print(video_length)
    
    video_length_minutes = video_length_seconds / 60
    words_needed = video_length_minutes * wordsPerMin
    return int(words_needed)
    
    # Generate HTML response
    html_response = f"""
               <h1>Video Recording Result</h1>
        <p>Video length: {video_length} seconds</p>
        <p>words needed: {words_needed} seconds</p>

    <div class="image-container">
        <img src="{screenshot}" alt="Image Preview">
    </div>

        """
    
    return html_response

# Example usage
# url = "https://github.com/CopilotKit/CopilotKit?utm_source=manuagi.beehiiv.com&utm_medium=referral&utm_campaign=top-trending-open-source-github-projects-this-week-decentralized-ai-agents-to-coding-assistants"
# audio_length = 300  # in seconds
# savepath = "output.mp4"

#create_video_from_url(url, savepath)
