import json
import subprocess
import os
import asyncio
from .TTS import generateAudio
from .jsonConvert import convertToFormat
from moviepy.editor import VideoFileClip, concatenate_videoclips, AudioFileClip

async def create_clips(json_req, video_path):
    # Load JSON data from the string
    data = json_req
    
    # Loop through each segment and create video and audio clips
    for index, segment in enumerate(data['key_segments']):
        start = segment['start']
        end = segment['end']
        description = segment['description']

        # Define paths for the video and audio files
        video_clip_path = f"{index + 1}.mp4"
        audio_clip_path = f"{index + 1}.mp3"

        # Create video clip using ffmpeg
        clip_command = [
            'ffmpeg',
            '-ss', start,           # Start time
            '-to', end,             # End time
            '-i', video_path,       # Input file
            '-c', 'copy','-y',           # Copy codec settings
            video_clip_path         # Output file path
        ]
        subprocess.run(clip_command, check=True)

        # Generate audio from the description
        await generateAudio(text= description,outfilename= audio_clip_path)

def file_exists(file_path):
    if not os.path.exists(file_path):
        raise Exception(f"File not found: {file_path}")

def merge_audio_video(num_clips):
    final_parts = []

    for i in range(1, num_clips + 1):
        video_clip_path = f"{i}.mp4"
        intro_video_path = f"intro_video_{i}.mp4"
        final_clip_path = f"final_clip_{i}.mp4"

        # Ensure video clips are present
        file_exists(video_clip_path)

        # Concatenation lists
        concat_list_path = f'concat_list_{i}.txt'
        with open(concat_list_path, 'w') as f:
            f.write(f"file '{intro_video_path}'\n")
            f.write(f"file '{video_clip_path}'\n")

        # Check if intro videos are created
        file_exists(intro_video_path)

        # Concatenate intro and main video
        subprocess.run([
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_list_path,
            '-c', 'copy','-y',
            final_clip_path
        ], check=True)

        # Ensure final clip was created
        file_exists(final_clip_path)

        final_parts.append(final_clip_path)

    # Final concatenation of all parts
    final_output = 'final_output.mp4'
    with open('final_concat_list.txt', 'w') as f:
        for part in final_parts:
            f.write(f"file '{part}'\n")

    subprocess.run([
        'ffmpeg',
        '-f', 'concat',
        '-safe', '0',
        '-i', 'final_concat_list.txt',
        '-c', 'copy','-y',
        final_output
    ], check=True)

    # Check final output
    file_exists(final_output)

    # Cleanup
    os.remove('final_concat_list.txt')
    for i in range(1, num_clips + 1):
        os.remove(f'concat_list_{i}.txt')
def generate_intro_videos(num_clips, video_path):
    for i in range(1, num_clips + 1):
        video_clip_path = f"{i}.mp4"
        audio_clip_path = f"{i}.mp3"
        intro_video_path = f"intro_video_{i}.mp4"
#ffmpeg -i 1.mp4 -i 1.mp3 -c:v copy','-map','0:v:0','-map','1:a:0','-shortest','intro1.mp4
        # subprocess.run([
        #     'ffmpeg',
        #     '-i', video_clip_path,
        #     '-i', audio_clip_path,
        #     '-c:v', 'copy','-map','0:v:0','-map','1:a:0','-shortest','-y',
        #     intro_video_path
        # ], check=True)

        subprocess.run([ # with loop
            'ffmpeg',
            '-stream_loop', '-1',
            '-i', video_clip_path,
            '-i', audio_clip_path,
            '-c:v', 'copy',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            '-y',
            intro_video_path
        ], check=True)

def merge_all_segments(num_clips):

    # Create a text file with the list of all segments
    with open('final_concat_list.txt', 'w') as final_list:
        for i in range(1, num_clips + 1):
            final_list.write(f"file 'intro_video_{i}.mp4'\n")
            final_list.write(f"file '{i}.mp4'\n")

    # Use ffmpeg to concatenate all segments into the final video
    subprocess.run([
        'ffmpeg',
        '-f', 'concat',
        '-safe', '0',
        '-i', 'final_concat_list.txt',
        '-c', 'copy','-y',
        'final_output_simple.mp4'
        ], check=True) 

    # Check final output
    if not os.path.exists('final_output.mp4'):
        raise Exception("Final output video not found.")

    # Cleanup temporary files
    subprocess.run(['rm'] + [f'concat_list_{i}.txt' for i in range(1, num_clips + 1)] + ['final_concat_list.txt'], check=True)


def merge_all_segments2(num_clips):
    final_clips = []

    # Collect all intro and original video clips
    for i in range(1, num_clips + 1):
        intro_video_path = f"intro_video_{i}.mp4"
        original_video_path = f"{i}.mp4"

        intro_clip = VideoFileClip(intro_video_path)
        original_clip = VideoFileClip(original_video_path)

        final_clips.extend([intro_clip, original_clip])

    # Concatenate all collected video clips
    final_video = concatenate_videoclips(final_clips, method="compose")

    # Write the final video to a file
    final_video.write_videofile("final_output_simple.mp4", codec='libx264', audio_codec='aac')

    # Cleanup temporary files
    for i in range(1, num_clips + 1):
        os.remove(f'intro_video_{i}.mp4')

# Example usage


def runVidGen(json_path,video_path,outVideoPath):
    jsonFromFile = open(json_path, "r").read()
    json_b = convertToFormat(jsonFromFile)
    parsed_data = json.loads(json_b)
    count = len(parsed_data['key_segments'])
    # num_clips = 5
    # video_path = 'output_video.mp4'
    if False:
        asyncio.run(create_clips(parsed_data,video_path))
        generate_intro_videos(count, video_path)  # Ensure intro videos are generated
   # merge_audio_video(num_clips)  # Then merge them as previously defined
    merge_all_segments2(3)  
    return count
      

#runVidGen('out2.json','video1.mp4','finalVidPath.mp4')
