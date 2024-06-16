from openai import OpenAI
import anthropic

prompt1='''
**Task Description:** The task is to analyze subtitles from a video provided in WebVTT format to determine the most insightful or critical segments. The goal is to identify five distinct time ranges within the video where key discussions occur, and provide a succinct, podcast-ready description for each segment.

**Input Specifications:**
1. **Subtitles File:** A .vtt file with timestamps and text for each segment of dialogue in the video.
2. **Topic of Discussion:** The main topic covered in the video, guiding the analysis of the subtitles.

**Expected Output:**
- The output should be a JSON object containing a list of five time ranges, each accompanied by a description that is formatted to be easily used in a spoken context like a podcast.

**Output Format:**
json
{
  "key_segments": [
    {
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "description": "A concise summary or key point from this segment, phrased in a way suitable for podcast narration."
    },
    {
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "description": "A concise summary or key point from this segment, phrased in a way suitable for podcast narration."
    },
    {
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "description": "A concise summary or key point from this segment, phrased in a way suitable for podcast narration."
    },
    {
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "description": "A concise summary or key point from this segment, phrased in a way suitable for podcast narration."
    },
    {
      "start": "HH:MM:SS",
      "end": "HH:MM:SS",
      "description": "A concise summary or key point from this segment, phrased in a way suitable for podcast narration."
    }
  ]
}

**Criteria for Time Range and Description Selection:**
- Relevance to the specified topic.
- Density of key terms and concepts.
- Engagement levels, indicated by linguistic markers like questions, exclamations, or technical terminology.

**Description Guidance:**
- Each description should encapsulate the essence of the discussion within the specified time range, phrased in an engaging and informative style suitable for listeners of a podcast.

**Example Scenario:**
- For a video discussing "Artificial Intelligence in Healthcare," identify segments discussing the latest AI tools in diagnostics, ethical debates, integration challenges, success stories, and future trends, providing a ready-to-narrate summary for each.

**Additional Considerations:**
- Ensure that each description is self-contained and provides enough context to be understood independently of the video content.

---

This prompt now specifies the need for each time range to come with a ready-to-speak description, making it ideal for direct use in spoken media such as podcasts or presentations.'''
prompt2="Please provide a JSON format that includes:\n1. An overall topic that encompasses all the announcements\n2. Top announcements with their respective \"from\" and \"to\" timestamps\n3. For each announcement, include sub-detail pointers with the following format:\n\n{\n  \"topic\": \"\",\n  \"announcements\": [\n    {\n      \"announcement\": \"\",\n      \"subDetails\": [\n        {\n          \"excitedNarration\": \"\",\n          \"pointer\": \"\",\n          \"from\": \"\",\n          \"to\": \"\"\n        },\n        {\n          \"excitedNarration\": \"\",\n          \"pointer\": \"\",\n          \"from\": \"\",\n          \"to\": \"\"\n        },\n        ...\n      ]\n    },\n    {\n      \"announcement\": \"\",\n      \"subDetails\": [\n        {\n          \"excitedNarration\": \"\",\n          \"pointer\": \"\",\n          \"from\": \"\",\n          \"to\": \"\"\n        },\n        {\n          \"excitedNarration\": \"\",\n          \"pointer\": \"\",\n          \"from\": \"\",\n          \"to\": \"\"\n        },\n        ...\n      ]\n    },\n    ...\n  ]\n}\n\nThe \"topic\" should be a high-level description that covers all the announcements.\nEach \"announcement\" should be a top-level announcement with its corresponding \"from\" and \"to\" timestamps.\n\"subDetails\" should contain an array of sub-detail pointers related to each announcement, including:\n- \"excitedNarration\": A brief, exciting narration for the sub-detail pointer\n- \"pointer\": A description of the specific sub-detail\n- \"from\" and \"to\": The timestamps for the sub-detail pointer\n\nPlease ensure that the JSON format is valid and properly structured."
def getBestParts(title,vttcontent,outputfile):
    client = OpenAI(api_key='sk-proj-aTyxruex40y8aot6bTI5T3BlbkFJMvU8omxuzfLQqPFIcAwP')
    response = client.chat.completions.create(
    model="gpt-4o",
    response_format={ "type": "json_object" },
    messages=[
        {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
        {"role": "user", "content": prompt2 + "title:"+title + ", vtt: "+ vttcontent}
    ]
    )
    try:
        with open(outputfile, "w") as file:
            file.write(response.choices[0].message.content)
        return response.choices[0].message.content
    except:
        return ''

def getDataClaude(title,vttcontent,outputfile):

  client = anthropic.Anthropic(
      # defaults to os.environ.get("ANTHROPIC_API_KEY")
      api_key="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",
  )
  message = client.messages.create(
      model="claude-3-opus-20240229",
      #max_tokens=4000,
      temperature=0,
      system=vttcontent,
      messages=[
          {
              "role": "user",
              "content": [
                  {
                      "type": "text",
                      "text": prompt2
                  }
              ]
          }
      ]
  )
  print(message.content)