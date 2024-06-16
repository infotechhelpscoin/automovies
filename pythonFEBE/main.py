from flask import Flask, request, jsonify, render_template
from helpers.STT import transcribe_to_webvtt
from helpers.YTVid import download_yt_vid
from helpers.llm import getBestParts
from helpers.vidManager import runVidGen
import asyncio
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-video', methods=['POST'])
def process_video():
    # Get the form data from the request
    url = request.form.get('youtubeUrl')
    video_path = request.form.get('outputVideoPath')
    audio_path = request.form.get('outputAudioPath')
    transcription_path = request.form.get('transcriptionPath')
    best_parts_path = request.form.get('bestPartsPath')
    finalGenVideo = request.form.get('finalGenVideo')
    download_video = request.form.get('downloadVideo') == 'on'
    generate_captions = request.form.get('generateCaptions') == 'on'
    generate_best_parts = request.form.get('generateBestParts') == 'on'

    # Call the functions based on the selected options
    title = ''
    captions = ''
    print(download_video,generate_captions,generate_best_parts)
    if download_video:
        title = download_yt_vid(url, video_path, audio_path)
        return 'success'
    if generate_captions:  
        print('generate_captions')
        captions = transcribe_to_webvtt(audio_path, transcription_path)
        return f'''
            <div>
                <button onclick="copyContent()">Copy</button>
                <p id="content" style="display: none;">{captions}</p>
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
    if False:

        if  generate_best_parts:
            
            
            asyncio.run(runVidGen(parsed_data, count, finalGenVideo))
            return f'''{count} '''
            # response = getBestParts(title, captions, best_parts_path)
            # print(response)
    

    
    


    # Return HTML content
    html_response = f"""
    <div>
        <p>Video processing completed successfully.</p>
        <p>URL: {url}</p>
        <p>Video Path: {video_path}</p>
        <p>Audio Path: {audio_path}</p>
        <p>Transcription Path: {transcription_path}</p>
        <p>Best Parts Path: {best_parts_path}</p>
        <p>finalGenVideo: {finalGenVideo}</p>
        <p>Download Video: {download_video}</p>
        <p>Generate Captions: {generate_captions}</p>
        <p>Generate Best Parts: {generate_best_parts}</p>
    </div>
    """
    return html_response

if __name__ == '__main__':
    app.run(debug=True)
