import os
from dotenv import load_dotenv
from deepgram_captions import DeepgramConverter, webvtt,srt
import logging, verboselogs
from datetime import datetime
import httpx
DEEPGRAM_API_KEY='da6f325ca0f783aaa2341b6f5dc9a476486416a2'
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    PrerecordedOptions,
    FileSource,
)

load_dotenv()

AUDIO_FILE = "preamble.wav"


def transcribe_to_webvtt(audio_path,vttfile):
    try:
        # STEP 1 Create a Deepgram client using the API key in the environment variables
        config: DeepgramClientOptions = DeepgramClientOptions(
            verbose=logging.SPAM,
        )
        deepgram: DeepgramClient = DeepgramClient("", config)
        # OR use defaults
        # deepgram: DeepgramClient = DeepgramClient()

        # STEP 2 Call the transcribe_file method on the prerecorded class
        with open(audio_path, "rb") as file:
            buffer_data = file.read()

        payload: FileSource = {
            "buffer": buffer_data,
        }

        options: PrerecordedOptions = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            utterances=True,
            punctuate=True,
            diarize=False,
        )

        before = datetime.now()
        response = deepgram.listen.prerecorded.v("1").transcribe_file(
            payload, options, timeout=httpx.Timeout(300.0, connect=10.0)
        )
        transcription = DeepgramConverter(response)
        captions = srt(transcription,10)
        with open(vttfile, "w") as file:
            file.write(captions)

        after = datetime.now()

        return captions

    except Exception as e:
        print(f"Exception: {e}")

