import asyncio
from dotenv import load_dotenv
import logging, verboselogs

from deepgram import (
    DeepgramClient,
    ClientOptionsFromEnv,
    SpeakOptions,
)

load_dotenv()






async def generateAudio(text,outfilename,model="aura-asteria-en"):
    SPEAK_OPTIONS = {"text": text}
    filename = outfilename
    try:
        # STEP 1 Create a Deepgram client using the API key from environment variables
        deepgram = DeepgramClient(api_key="", config=ClientOptionsFromEnv())

        # STEP 2 Call the save method on the asyncspeak property
        options = SpeakOptions(
            model=model,
        )

        response = await deepgram.asyncspeak.v("1").save(
            filename, SPEAK_OPTIONS, options
        )
        print(response.to_json(indent=4))

    except Exception as e:
        print(f"Exception: {e}")
