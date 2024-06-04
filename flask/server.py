import datetime
import os
import pprint
from flask import Flask, Response, json
from flask import request, make_response, jsonify
from flask_cors import cross_origin 
from googleapiclient.discovery import build

from dotenv import load_dotenv
load_dotenv()



app = Flask(__name__)
cross_origin(app)

@app.route("/", methods=['GET'])
def index():
  

    return "text parser:)"



@app.route("/maru", methods=['GET'])
# @cross_origin(origins=["http://127.0.0.1:3000"], methods=["GET"])
def hananoki_maru():

    useDummy = True

    if useDummy:
        v_list = [
            {
                "id": "UR7qfIGjYik",
                "title": "花ノ木まるおすすめコンテンツ紹介 #shorts  #vtuber #花ノ木まる #配信切り抜き #朗読1"
            },
            {
                "id": "MYfROAuKi6I",
                "title": "【 朝活 】おはよ～～～！月曜から元気与えますよ☀【 花ノ木まる / ゆにれいど！ 】"
            },
            {
                "id": "J7671sfvY0s",
                "title": "最上級に可愛いの！歌ってみた #shorts #最上級に可愛いの #vtuber #歌ってみた"
            },
            {
                "id": "wLcUlx7tAAk",
                "title": "【 歌枠 】今日もぼちぼちうたいます【 花ノ木まる / ゆにれいど！ 】"
            },
            {
                "id": "c9fplvc5kTQ",
                "title": "【 minecraft 】ま～まったりやりますか～⛏【 花ノ木まる / ゆにれいど！ 】"
            },
            {
                "id": "FMK5zsQvhgQ",
                "title": "【 飲酒雑談 】飲みながらチル雑【 花ノ木まる / ゆにれいど！ 】"
            },
            {
                "id": "j927AztoTeU",
                "title": "花ノ木まる流サムネ作る工程✨　#shorts #vtuber  #花ノ木まる"
            },
            {
                "id": "vuR7khrrfgg",
                "title": "【 minecraft 】きみたち、起きなさい。【 花ノ木まる / ゆにれいど！ 】"
            },
            {
                "id": "yaPjIhxaHqY",
                "title": "【 ムベンベラジオ 】この見た目でホラゲ【 花ノ木まる / ゆにれいど！ 】"
            }
        ]
    else:
        developerKey = os.environ['YOUTUBE_API_KEY_2']
        channel_id = os.environ['CHANNEL_ID_MARU']
        print('channel_id = ' + channel_id)

        v_list = get_new_youtube_video_list(channel_id, developerKey)
        pprint.pprint(json.dumps(v_list))


    response = Response(
        response=json.dumps(v_list),
        content_type="application/json"
    )
    response.headers['Access-Control-Allow-Origin'] = '*'
    # オリジンを制限する場合
    # response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:3000'

    # response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    # response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')

    return response


def get_new_youtube_video_list(channel_id, developerKey):
    # 1週間前から取得
    time_threshold = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
    time_threshold = time_threshold.isoformat()
    
    video_id_list = []
    youtube = build("youtube", "v3", developerKey=developerKey)

    response = youtube.search().list(
        part = "snippet",
        channelId = channel_id,
        maxResults = 10, 
        order = "date", 
        publishedAfter=time_threshold,
        type="video"
    ).execute()

    for item in response["items"]:
        video_id_list.append({
            'id':item['id']['videoId'],
            'title':item['snippet']['title'],
        })
    return video_id_list


if __name__ == "__main__":
    app.debug = True
    app.run(host='127.0.0.1', port=5000)