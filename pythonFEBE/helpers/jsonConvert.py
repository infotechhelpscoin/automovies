import json

def convertToFormat(jsonReq):
    # Load the JSON data from format A
    data_a = json.loads(jsonReq)

    # Create a new dictionary for format B
    data_b = {'key_segments': []}

    # Extract the introToTopic as the first key segment
    intro_segment = {
        'start': '00:00:00',
        'end': '00:00:15',
        'description': data_a['introToTopic']
    }
    data_b['key_segments'].append(intro_segment)

    # Iterate over each announcement and its subDetails
    for announcement in data_a['announcements']:
        for sub_detail in announcement['subDetails']:
            segment = {
                'start': sub_detail['from'],
                'end': sub_detail['to'],
                'description': f"{announcement['announcement']}: {sub_detail['pointer']}. {sub_detail['excitedNarration']}"
            }
            data_b['key_segments'].append(segment)

    # Return the converted data as JSON
    return json.dumps(data_b, indent=2)