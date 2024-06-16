import speech_recognition as sr

# Initialize the recognizer
recognizer = sr.Recognizer()

# Load the converted WAV file
with sr.AudioFile('out.wav') as source:
    audio_data = recognizer.record(source)  # read the entire audio file

# Use Google Web Speech API to recognize speech
try:
    # Using Google Web Speech API for recognition (requires internet)
    text = recognizer.recognize_google(audio_data)
    print("Google Web Speech API thinks you said:")
    print(text)
except sr.UnknownValueError:
    # The speech is unintelligible
    print("Google Web Speech API could not understand the audio")
except sr.RequestError as e:
    # API was unreachable or unresponsive
    print(f"Could not request results from Google Web Speech API service; {e}")

# Optionally, use offline recognition with PocketSphinx (if installed)
try:
    text_sphinx = recognizer.recognize_sphinx(audio_data)
    print("PocketSphinx thinks you said:")
    print(text_sphinx)
except sr.UnknownValueError:
    print("PocketSphinx could not understand the audio")
except sr.RequestError as e:
    print(f"Could not request results from PocketSphinx service; {e}")
