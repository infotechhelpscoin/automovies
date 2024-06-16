from helpers.STT import transcribe_to_webvtt
from helpers.YTVid import download_yt_vid
from helpers.llm import getBestParts
from helpers.jsonConvert import convertToFormat
from helpers.vidManager import runVidGen
import asyncio
import json
# URL, output video file path, and output audio file path
url = 'https://www.youtube.com/watch?v=RXeOiIDNNek'
video_path = 'output_video.mp4'
prompt='''Please help provide top announcements with from and to time in a json format
also please add subdetail pointers in format { "announcement": "",[{"sub detail Pointers":"", "from": "", "to": "01:41:45,925" },...]}'''
# audio_path = 'output_audio.wav'
audio_path = 'out.mp3'
if False:
    # Call the function to download the video and extract the audio
    title= download_yt_vid(url, video_path, audio_path)

    # Call the transcription function with the correct name
    captions= transcribe_to_webvtt(audio_path, 'output_file.vtt')

    response= getBestParts(title,captions,'bestparts.json')
    print(response)
jsonSample='''{
  "key_segments": [
    {
      "start": "00:00:00",
      "end": "00:00:15",
      "description": "The speaker introduces the ambitious goal of achieving a trillion transistors on a single chip by the end of the decade, emphasizing that Moore's Law is still very much alive."
    },
    {
      "start": "00:00:23",
      "end": "00:00:36",
      "description": "Highlighting Taiwan's pivotal role, the speaker discusses Intel's long-standing relationship with Taiwan and teases a 40-year anniversary celebration at Computex next year."
    },
    {
      "start": "00:00:46",
      "end": "00:00:53",
      "description": "A heartfelt thank you to partners for their collaboration over the decades, culminating in significant innovations and world-changing advancements."
    },
    {
      "start": "00:01:01",
      "end": "00:01:37",
      "description": "The speaker elaborates on Intel's integral role in driving AI advances, from bridging the gap between humans and AI to fostering innovation in various sectors like PC and data centers."
    },
    {
      "start": "00:01:55",
      "end": "00:02:45",
      "description": "Discussing the AI era's transformative impact, the speaker compares it to the rise of the Internet, predicting that every device and company will become AI-centric, fueling the semiconductor industry and global economy."
    }
  ]
}'''
json2='''
{
  "introToTopic": "Get ready to embark on an extraordinary journey as we unveil groundbreaking advancements across Apple's ecosystem, revolutionizing the way you interact with your devices and unleashing a new era of innovation!",
  "announcements": [
    {
      "announcement": "Apple TV Plus celebrates 5th anniversary with upcoming lineup of shows",
      "subDetails": [
        {
          "excitedNarration": "Get ready to be amazed! Apple TV Plus has been delivering the highest rated originals for three years straight!",
          "pointer": "Apple TV Plus has been recognized for delivering the highest rated originals in the industry for 3 years running",
          "from": "00:02:30,310",
          "to": "00:02:44,895"
        },
        {
          "excitedNarration": "Hold on to your seats, because the upcoming Apple TV Plus lineup is going to blow your mind!",
          "pointer": "Preview of upcoming Apple TV Plus lineup",
          "from": "00:03:29,100",
          "to": "00:05:04,770"
        }
      ]
    },
    {
      "announcement": "Introduction of Vision OS 2 for Apple Vision Pro",
      "subDetails": [
        {
          "excitedNarration": "Can you believe it? Over 2,000 apps have already been created specifically for the incredible Apple Vision Pro!",
          "pointer": "Over 2,000 apps created specifically for Apple Vision Pro",
          "from": "00:06:51,265",
          "to": "00:06:56,705"
        },
        {
          "excitedNarration": "VisionOS 2 is here to revolutionize your experience with amazing new ways to connect, be productive, and unleash your creativity!",
          "pointer": "VisionOS 2 introduces new ways to connect with memories, enhancements to productivity, and new developer APIs",
          "from": "00:07:09,335",
          "to": "00:07:34,910"
        },
        {
          "excitedNarration": "The excitement is going global! Apple Vision Pro is expanding to 8 more countries, bringing the future of technology to even more people!",
          "pointer": "Apple Vision Pro expanding to 8 more countries",
          "from": "00:13:49,340",
          "to": "00:14:12,145"
        }
      ]
    },
    {
      "announcement": "iOS 18 features for customization, staying connected, and Photos app redesign",
      "subDetails": [
        {
          "excitedNarration": "Get ready to unleash your creativity like never before with iOS 18's incredible new ways to customize your app icons and home screen!",
          "pointer": "New ways to customize app icons and home screen",
          "from": "00:14:51,455",
          "to": "00:16:22,930"
        },
        {
          "excitedNarration": "Control Center just got a major upgrade! With new controls and a customizable gallery, you'll have everything you need at your fingertips!",
          "pointer": "Updates to Control Center and new controls gallery",
          "from": "00:16:32,225",
          "to": "00:17:49,330"
        },
        {
          "excitedNarration": "Your privacy is our priority! iOS 18 introduces game-changing features to keep your apps, contacts, and accessories more secure than ever!",
          "pointer": "New privacy features for apps, contacts, and accessories",
          "from": "00:18:25,160",
          "to": "00:20:26,420"
        },
        {
          "excitedNarration": "Get ready to fall in love with messaging all over again! The Messages app in iOS 18 is packed with exciting enhancements to keep you connected like never before!",
          "pointer": "Enhancements to Messages app",
          "from": "00:20:33,035",
          "to": "00:22:48,245"
        },
        {
          "excitedNarration": "Say goodbye to email overload and hello to a whole new way of staying organized! The Mail app in iOS 18 introduces game-changing categorization and a revolutionary digest view!",
          "pointer": "Updates to Mail app including categorization and digest view",
          "from": "00:22:49,525",
          "to": "00:24:06,870"
        },
        {
          "excitedNarration": "Introducing the Journal app - your new best friend for self-reflection and personal growth! Get ready to embark on an exciting journey of self-discovery!",
          "pointer": "Introduction of Journal app",
          "from": "00:25:14,455",
          "to": "00:25:40,445"
        },
        {
          "excitedNarration": "The Photos app has undergone a stunning redesign that will take your breath away! Get ready to rediscover and relive your most precious memories like never before!",
          "pointer": "Redesigned Photos app",
          "from": "00:26:42,520",
          "to": "00:29:53,975"
        }
      ]
    },
    {
      "announcement": "Updates to AirPods and Apple TV (tvOS)",
      "subDetails": [
        {
          "excitedNarration": "AirPods Pro just got even more magical with mind-blowing gesture controls and crystal-clear voice isolation!",
          "pointer": "New gesture controls and voice isolation for AirPods Pro",
          "from": "00:31:29,975",
          "to": "00:32:20,275"
        },
        {
          "excitedNarration": "Gamers, rejoice! AirPods are about to take your gaming experience to a whole new level with personalized spatial audio that will blow your mind!",
          "pointer": "Personalized spatial audio for gaming with AirPods",
          "from": "00:32:20,275",
          "to": "00:32:48,930"
        },
        {
          "excitedNarration": "Apple TV is getting a major upgrade with a host of new features that will revolutionize your viewing experience! Get ready for Insight, enhanced dialogue, and screensavers that will leave you in awe!",
          "pointer": "New features for Apple TV including Insight, enhanced dialogue, and screensavers",
          "from": "00:32:54,565",
          "to": "00:35:28,190"
        }
      ]
    },
    {
      "announcement": "watchOS 11 updates for fitness, health, and staying connected",
      "subDetails": [
        {
          "excitedNarration": "Introducing the revolutionary training load feature - your ultimate fitness companion that will help you take your workouts to the next level!",
          "pointer": "Introduction of training load feature for workouts",
          "from": "00:36:22,935",
          "to": "00:37:17,725"
        },
        {
          "excitedNarration": "The groundbreaking Vitals app is here to change the game of health monitoring! Get ready to unlock a whole new understanding of your body and well-being!",
          "pointer": "New Vitals app for monitoring health metrics",
          "from": "00:38:10,285",
          "to": "00:39:26,580"
        },
        {
          "excitedNarration": "Attention all expecting mothers! The cycle tracking feature in watchOS 11 just got even better with exciting updates tailored specifically for your pregnancy journey!",
          "pointer": "Cycle tracking updates for pregnancy",
          "from": "00:39:32,515",
          "to": "00:39:48,825"
        },
        {
          "excitedNarration": "Stay connected and in the know like never before with the incredible updates to Smart Stack and the game-changing new translate app!",
          "pointer": "Smart Stack updates and new translate app",
          "from": "00:40:19,970",
          "to": "00:41:36,175"
        },
        {
          "excitedNarration": "Get ready to be amazed by the power of machine learning as it revolutionizes the way you personalize your watch face with the most stunning photos!",
          "pointer": "Machine learning used to identify best photos for watch face",
          "from": "00:41:56,210",
          "to": "00:42:44,950"
        }
      ]
    },
    {
      "announcement": "iPadOS 18 enhancements including changes to apps, Apple Pencil updates, and Calculator app",
      "subDetails": [
        {
          "excitedNarration": "Get ready to experience your favorite apps like never before with the stunning new design featuring a floating tab bar and sidebar!",
          "pointer": "New design for apps with floating tab bar and sidebar",
          "from": "00:44:06,725",
          "to": "00:45:04,550"
        },
        {
          "excitedNarration": "SharePlay and Freeform are getting even better with exciting updates that will take your collaboration and entertainment to the next level!",
          "pointer": "Updates to SharePlay and Freeform",
          "from": "00:45:08,950",
          "to": "00:45:48,515"
        },
        {
          "excitedNarration": "The wait is finally over! The Calculator app has arrived on iPad, and it's going to change the game for math lovers everywhere!",
          "pointer": "Introduction of Calculator app for iPad",
          "from": "00:45:51,895",
          "to": "00:48:37,115"
        },
        {
          "excitedNarration": "Prepare to be amazed by the revolutionary smart script experience in the Notes app, making your handwritten notes more magical than ever!",
          "pointer": "New smart script experience in Notes app",
          "from": "00:48:43,835",
          "to": "00:50:20,925"
        }
      ]
    },
    {
      "announcement": "macOS Sequoia features including iPhone mirroring, Safari updates, and gaming improvements",
      "subDetails": [
        {
          "excitedNarration": "Get ready to have your mind blown by the incredible iPhone mirroring feature on your Mac! It's like having your phone and computer merged into one seamless experience!",
          "pointer": "Introduction of iPhone mirroring on Mac",
          "from": "00:52:44,175",
          "to": "00:55:18,365"
        },
        {
          "excitedNarration": "Multitasking on your Mac just got a major upgrade with the revolutionary new window tiling and video conferencing enhancements!",
          "pointer": "New window tiling and video conferencing enhancements",
          "from": "00:55:28,965",
          "to": "00:56:15,660"
        },
        {
          "excitedNarration": "Say hello to the game-changing Passwords app - your one-stop destination for securely storing and managing all your login credentials across devices!",
          "pointer": "Introduction of Passwords app",
          "from": "00:56:28,190",
          "to": "00:57:01,950"
        },
        {
          "excitedNarration": "Safari is getting a major overhaul with mind-blowing updates including highlights, reader, and viewer - taking your browsing experience to a whole new level!",
          "pointer": "Safari updates including highlights, reader, and viewer",
          "from": "00:57:12,335",
          "to": "00:59:20,800"
        },
        {
          "excitedNarration": "Attention all gaming enthusiasts! With the groundbreaking Game Porting Toolkit 2 and a flood of new title announcements, your Mac is about to become the ultimate gaming powerhouse!",
          "pointer": "Gaming improvements with Game Porting Toolkit 2 and new title announcements",
          "from": "00:59:25,825",
          "to": "01:03:19,870"
        }
      ]
    },
    {
      "announcement": "Introduction of Apple Intelligence, a new AI system for iPhone, iPad and Mac",
      "subDetails": [
        {
          "excitedNarration": "Prepare to be blown away by the awe-inspiring capabilities and groundbreaking architecture of Apple Intelligence - the AI system that will redefine your iPhone, iPad, and Mac experience!",
          "pointer": "Overview of Apple Intelligence capabilities and architecture",
          "from": "01:07:40,185",
          "to": "01:16:00,400"
        },
        {
          "excitedNarration": "Siri is about to get a whole lot smarter and more helpful than ever before, thanks to the incredible power of Apple Intelligence!",
          "pointer": "Updates to Siri powered by Apple Intelligence",
          "from": "01:16:05,955",
          "to": "01:23:04,205"
        },
        {
          "excitedNarration": "Get ready to experience the magic of Apple Intelligence in every corner of your device, from writing tools to notifications and beyond!",
          "pointer": "Apple Intelligence in system experiences like writing tools, notifications, and Mail",
          "from": "01:23:09,270",
          "to": "01:27:42,450"
        },
        {
          "excitedNarration": "Unleash your creativity like never before with the mind-blowing image generation capabilities of Genmoji and Image Playground!",
          "pointer": "Image generation capabilities with Genmoji and Image Playground",
          "from": "01:27:49,090",
          "to": "01:31:22,285"
        },
        {
          "excitedNarration": "Prepare to be amazed by the way Apple Intelligence transforms your favorite apps, from Notes to Photos and beyond, making them smarter and more intuitive than ever!",
          "pointer": "Apple Intelligence in apps like Notes, Photos, and memory movies",
          "from": "01:31:30,000",
          "to": "01:35:26,580"
        },
        {
          "excitedNarration": "The world's most advanced AI is coming to your iPhone, iPad, and Mac with the game-changing integration of ChatGPT into Siri and writing tools!",
          "pointer": "Integration of ChatGPT into Siri and writing tools",
          "from": "01:36:35,720",
          "to": "01:38:41,795"
        },
        {
          "excitedNarration": "Attention all developers! Get ready to harness the incredible power of Apple Intelligence with a suite of revolutionary tools and APIs that will take your apps to the next level!",
          "pointer": "Developer tools and APIs to integrate Apple Intelligence",
          "from": "01:38:50,260",
          "to": "01:40:30,630"
        },
        {
          "excitedNarration": "The wait is almost over! Apple Intelligence will be available to users starting this summer, marking the beginning of a new era in personal computing!",
          "pointer": "Availability of Apple Intelligence starting this summer",
          "from": "01:40:55,955",
          "to": "01:41:45,925"
        }
      ]
    }
  ]
}'''
jsonFromFile = open("out.json", "r").read()
json_b = convertToFormat(jsonFromFile)
print(json_b)
parsed_data = json.loads(json_b)
count = len(parsed_data['key_segments'])
print(count)
asyncio.run(runVidGen(json_b,count, video_path))

