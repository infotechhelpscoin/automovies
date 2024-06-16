# YTvid.py
import os
import subprocess
from pytube import YouTube
import json

def download_yt_vid(url, out_filename, audio_filename):
    try:
        yt = YouTube(url)
        video = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        video_info = {
            "title": yt.title,
            "description": yt.description,
            "thumbnail_url": yt.thumbnail_url
        }
        
        # Download the video to a temporary file
        temp_path = video.download(filename='tempVid')
        
        # Convert the video using FFmpeg
        video_command = [
            'ffmpeg',
            '-i', temp_path,            # Input file
            '-c:v', 'libx264',          # Video codec (H.264)
            '-preset', 'medium',        # Encoding preset
            '-crf', '23',               # Constant Rate Factor (quality)
            '-c:a', 'aac',              # Audio codec (AAC)
            '-b:a', '128k',             # Audio bitrate
            '-movflags', '+faststart','-y',  # Optimize for streaming
            out_filename                # Output file
        ]
        subprocess.run(video_command, check=True)
        
        # Remove the temporary video file
        os.remove(temp_path)
        
        print(f"Video downloaded and converted: {out_filename}")
        
        # Extract the audio using FFmpeg
        audio_command = [
            'ffmpeg',
            '-i', out_filename,         # Input file
            '-vn',                      # Disable video
            '-acodec', 'libmp3lame',    # Audio codec (MP3)
            '-b:a', '128k',             # Audio bitrate
            '-ar', '44100', '-y',            # Audio sample rate
            audio_filename              # Output file
        ]
        subprocess.run(audio_command, check=True)
        
        print(f"Audio extracted: {audio_filename}")
        
        # Convert the video information to JSON
        video_json = json.dumps(video_info)
        
        return video_json
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None



#download_yt_vid('https://www.youtube.com/watch?v=Q_EYoV1kZWk','video.mp4','audio.mp3')
