import subprocess

def create_video_from_url(url, savepath):
    result = subprocess.run(
        ['node', 'server.js', url, savepath],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("Recording completed successfully")
        print(result.stdout)
    else:
        print("Error during recording")
        print(result.stderr)

# Example usage
url = "https://github.com/CopilotKit/CopilotKit?utm_source=manuagi.beehiiv.com&utm_medium=referral&utm_campaign=top-trending-open-source-github-projects-this-week-decentralized-ai-agents-to-coding-assistants"
audio_length = 300  # in seconds
savepath = "output.mp4"

create_video_from_url(url, savepath)
