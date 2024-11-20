import os
from urllib.parse import  parse_qsl, urlparse
import uuid

import urllib
import requests
from requests.auth import HTTPBasicAuth


################################################################################################
# レスポンスの作成
#################################################################################################
def createResponce(status,messsage):
    return {
        'statusCode': status,
        'headers': {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        'body': messsage
    }



# 音声抽出用サーバーURL
VOICE_SERVER = 'https://unidule.net:34449/uwsgi_yt_dlp'

################################################################################################
# https://www.youtube.com/live/xxxxx のURLを 
# https://www.youtube.com/watch?v=xxxx のURLに変更する
#################################################################################################
def replaceLiveUrl(url):
    p = urlparse(url)
    # print(p[2])
    url = p[2].replace('/live/', 'https://www.youtube.com/watch?v=')
    return url


################################################################################################
# オンプレ側Youtubeダウンロ―ダー呼び出しを非同期化したもの
################################################################################################
def CallRawVideoDownloader(video_id, start, end, channel, uid):

    requests.get(
        VOICE_SERVER,
        params={
            'video_id':video_id,
            'start':start,
            'end':end,
            'channel':channel,
            'uid':uid,
        },
        auth=HTTPBasicAuth(
            os.environ['RAW_VIDEO_USER_ID'], 
            os.environ['RAW_VIDEO_PASSWORD']
        )
    )


################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):

    video_id =event['video_id']
    start = event['start']
    end = event['end']
    channel = event['channel']
    uid = event['uid']

    # スレッドを生成してそっちでAPIコールを行う
    CallRawVideoDownloader(video_id, start, end, channel, uid)


    # 生成したuidを返却
    return createResponce(201, uid)





