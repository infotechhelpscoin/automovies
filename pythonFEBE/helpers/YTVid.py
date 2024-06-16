# YTvid.py
from pytube import YouTube
import subprocess
import os


def download_yt_vid(url, out_filename, audio_filename):
    # Download the video using pytube
    try:
        yt = YouTube(url)
        video = yt.streams.get_highest_resolution()
        video_title = yt.title
        # Download the video to a temporary file
        temp_path = video.download(filename='tempVid')
        print(f"Video downloaded to tempVid")
        # Rename the downloaded video file
        os.rename(temp_path, out_filename)
        print(f"Video downloaded to {out_filename}")

        # Convert the video to WAV using ffmpeg
        command = [
            'ffmpeg',
            '-i', out_filename,          # Input file
            #'-acodec', 'adpcm_ms',       # ADPCM codec for some compression
            #'-acodec', 'pcm_s16le',      # Audio codec
            '-codec:a','libmp3lame','-b:a','128k', # mp3
            '-ar', '44100',              # Audio sample rate
            audio_filename               # Output file
        ]

        subprocess.run(command, check=True)

        print(f"Video downloaded and audio extracted to {audio_filename}")
        return video_title

    except Exception as e:
        print(f"An error occurred: {e}")



#download_yt_vid('https://www.youtube.com/watch?v=Q_EYoV1kZWk','video.mp4','audio.mp3')
