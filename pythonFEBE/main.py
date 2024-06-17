from flask import Flask, request, jsonify, render_template
from helpers.STT import transcribe_to_webvtt
from helpers.YTVid import download_yt_vid
from helpers.llm import getBestParts
from helpers.vidManager import runVidGen,genAudAndMergeVid
from helpers.scrollVid import create_video_from_url
import asyncio
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-video', methods=['POST'])
async def process_video():
    # Get the form data from the request
    url = request.form.get('youtubeUrl')
    video_path = request.form.get('outputVideoPath')
    audio_path = request.form.get('outputAudioPath')
    transcription_path = request.form.get('transcriptionPath')
    bestPartsjson = request.form.get('bestPartsjson')
    finalGenVideoPath = request.form.get('finalGenVideoPath')
    download_video = request.form.get('downloadVideo') == 'on'
    generate_captions = request.form.get('generateCaptions') == 'on'
    generate_best_parts = request.form.get('generateBestParts') == 'on'

    # Call the functions based on the selected options
    title = ''
    captions = ''
    print(download_video,generate_captions,generate_best_parts)
    if is_youtube_url(url):
        if download_video:
            title = download_yt_vid(url, video_path, audio_path)
            return 'success'
            
        if generate_captions:  
            print('generate_captions')
            captions = transcribe_to_webvtt(audio_path, transcription_path)
            return f'''
                <div>
                    <button onclick="copyContent()">Copy</button>
                    <p id="content">{captions}</p>
                </div>

                <script>
                function copyContent() {{
                    var content = document.getElementById("content");
                    var range = document.createRange();
                    range.selectNode(content);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    window.getSelection().removeAllRanges();
                    alert("Content copied to clipboard!");
                }}
                </script>
            '''

        if  generate_best_parts:
            await runVidGen(bestPartsjson, video_path, finalGenVideoPath)
            return f''' as'''
            # response = getBestParts(title, captions, bestPartsjson)
            # print(response)
    if is_github_url(url):
        if download_video:
            html_response =await create_video_from_url(url,video_path)
            #html_response,video_length,screenshot_path,savepath =await create_video_from_url(url,video_path)
            return html_response
        if  generate_best_parts:
 #          print(bestPartsjson,audio_path,video_path,finalGenVideoPath)
            url= await genAudAndMergeVid(bestPartsjson,audio_path,video_path,finalGenVideoPath)
            return f'''
             <h1>MP4 Video Player</h1>
            <video width="640" height="360" controls>
                <source src="{url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>'''
    
    # Return HTML content
    html_response = f"""
    <div>
        <p>Video processing completed successfully.</p>
        <p>URL: {url}</p>
        <p>Video Path: {video_path}</p>
        <p>Audio Path: {audio_path}</p>
        <p>Transcription Path: {transcription_path}</p>
        <p>Best Parts Path: {bestPartsjson}</p>
        <p>finalGenVideoPath: {finalGenVideoPath}</p>
        <p>Download Video: {download_video}</p>
        <p>Generate Captions: {generate_captions}</p>
        <p>Generate Best Parts: {generate_best_parts}</p>
    </div>
    """
    return html_response


@app.route('/process-GithubVideo', methods=['POST'])
async def process_video2():
    # Get the form data from the request
    url = request.form.get('githubUrl')
    video_path = request.form.get('outputVideoPath')
    completeScriptPath = request.form.get('completeScriptPath')
    audio_path = request.form.get('outputAudioPath')
    transcription_path = request.form.get('transcriptionPath')
    finalGenVideoPath = request.form.get('finalGenVideoPath')
    
    # Call the functions based on the selected options
    title = ''
    captions = ''
    print(download_video,generate_captions,generate_best_parts)
    if download_video:
        title,snapshotpath,vidLength = recordGithubURL(url, video_path)
        return f'success {vidLength}'
    if generate_captions:  
        print('generate_captions')
        audio_path= genAudio(title,snapshotpath,vidLength)
        captions = transcribe_to_webvtt(audio_path, transcription_path)
        return f'''
            <div>
                <button onclick="copyContent()">Copy</button>
                <p id="content">{captions}</p>
            </div>

            <script>
            function copyContent() {{
                var content = document.getElementById("content");
                var range = document.createRange();
                range.selectNode(content);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand("copy");
                window.getSelection().removeAllRanges();
                alert("Content copied to clipboard!");
            }}
            </script>
        '''

    if  generate_best_parts:
        await mergeVidAud(video_path,audio_path,finalGenVideoPath)
        return f''' as'''
        # response = getBestParts(title, captions, bestPartsjson)
        # print(response)
    

    
    


    # Return HTML content
    html_response = f"""
    <div>
        <p>Video processing completed successfully.</p>
        <p>URL: {url}</p>
        <p>Video Path: {video_path}</p>
        <p>Audio Path: {audio_path}</p>
        <p>Transcription Path: {transcription_path}</p>
        <p>Best Parts Path: {bestPartsjson}</p>
        <p>finalGenVideoPath: {finalGenVideoPath}</p>
        <p>Download Video: {download_video}</p>
        <p>Generate Captions: {generate_captions}</p>
        <p>Generate Best Parts: {generate_best_parts}</p>
    </div>
    """
    return html_response


def is_youtube_url(url):
    return 'youtube.com' in url or 'youtu.be' in url

def is_github_url(url):
    return 'github.com' in url

if __name__ == '__main__':
    app.run(debug=True)
