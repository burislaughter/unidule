from asyncio import gather, run
import asyncio
import base64
import cgi
import io
from json import decoder
import math
import os
from random import Random
from threading import Thread
import time
from urllib.parse import parse_qs, parse_qsl, urlparse
import uuid
import boto3
from googleapiclient.discovery import build
from boto3.dynamodb.conditions import Key, Attr
import json

import requests
import urllib
from lambda_function_update_dynamo import importVideoListDocument
from util import PATH_PARAMETER_AUTH, PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_INFORMATION, PATH_PARAMETER_SCHEDULE_TWEET, PATH_PARAMETER_SYSTEM, PATH_PARAMETER_VIDEO, PATH_PARAMETER_VIDEO_FORCE_UPDATE,PATH_PARAMETER_VIDEO_LIST, PATH_PARAMETER_VOICE, PATH_PARAMETER_RAW_VOICE, PATH_PARAMETER_RAW_VOICE_POOL
from util import decimal_default_proc
import youtubeAPI
import s3API
from requests.auth import HTTPBasicAuth

from datetime import datetime, timezone, timedelta

# 音声抽出用サーバーURL
VOICE_SERVER = 'https://unidule.net:34449/uwsgi_yt_dlp'



print('Loading function')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.resource('s3')

################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
#################################################################################################
def getVideoList(table, channel_owner, days=7):
    print('getVideoList start')

    table = dynamodb.Table(table)
    try:
        if channel_owner == 'all':
            date = datetime.now(timezone.utc) - timedelta(days=days)
            baseAt = date.isoformat()

            response = table.query(
                IndexName = 'dummy-startAt-index',
                KeyConditionExpression=Key('dummy').eq('dummy') & Key('startAt').gte(baseAt),
                ScanIndexForward=False
            )
            data = response['Items']

            # レスポンスに LastEvaluatedKey が含まれなくなるまでループ処理を実行する
            while 'LastEvaluatedKey' in response:
                print(response['LastEvaluatedKey']['uuid'])
                response = table.query(
                    IndexName = 'dummy-startAt-index',
                    KeyConditionExpression=Key('dummy').eq('dummy') & Key('startAt').gte(baseAt),
                    ScanIndexForward=False,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )

                if 'LastEvaluatedKey' in response:
                    print("LastEvaluatedKey: {}".format(response['LastEvaluatedKey']))
                data.extend(response['Items'])

            response['Items'] = sorted(data, key=lambda u: u["startAt"], reverse=True)
            print('getVideoList all finish')
        else:
            response = table.query(
                IndexName = 'channel-startAt-index',
                KeyConditionExpression=Key('channel').eq(channel_owner),
                ScanIndexForward=False
            )
            print(f'getVideoList {channel_owner} finish')

        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)


################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# video_id ... 動画ID
#################################################################################################
def getVideoOne(table, video_id):
    print('getVideoOne start')

    table = dynamodb.Table(table)
    try:
        response = table.query(
            KeyConditionExpression=Key('id').eq(video_id),
            ScanIndexForward=False
        )
        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)

    print('getVideoOne finish')    



################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# video_id ... 動画ID
#################################################################################################
def updateDynamoDBOne(table, item):
    print('updateDynamoDBOne ' + table +'start')

    table = dynamodb.Table(table)
    try:
        responce = table.put_item(
            Item = item
        )
        print('updateDynamoDBOne finish')    
        return responce
    except Exception as e:
        print('updateDynamoDBOne エラー')
        print(e)



################################################################################################
# DynamoDBからチャンネル情報を取得
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
# 戻り値 ... チャンネル情報
#################################################################################################
def getChannelInfoDocument(table):
    print('getChannelInfoDocument start')

    # cid = owner_to_cid(channel_owner)

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        response = table.scan()
        print('getChannelInfoDocument finish')

        return response['Items']
    except Exception as e:
        print('getChannelInfoDocument エラー')
        print(e)



################################################################################################
# DynamoDBからチャンネル情報を取得
# 戻り値 ... 予定表ツイート
#################################################################################################
def getScheduleTweetDocument(table):
    print('getScheduleTweetDocument start')
    dt_now = math.floor((datetime.now() + timedelta(days=-8)).timestamp())

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        response = table.query(
            KeyConditionExpression=Key('dummy').eq('dummy') & Key('createdAtTime').gt(dt_now),
            ScanIndexForward=False
        )

        print('getScheduleTweetDocument finish')

        return response['Items']
    except Exception as e:
        print('getScheduleTweetDocument エラー')
        print(e)

    

################################################################################################
# 動画ID指定でYoutubeから動画情報を取得
#################################################################################################
def getVideoItem(v_list, devKey):
    # youtube クライアントの作成
    youtube = build("youtube", "v3", developerKey = devKey)
    
    return youtubeAPI.get_video_items(v_list, youtube )




################################################################################################
# システムステータスの取得
#################################################################################################
def getSystemStatus():
    table = dynamodb.Table('system')
    try:
        response = table.scan()
        print('getSystemStatus finish')

        return response['Items']
    except Exception as e:
        print('getSystemStatus エラー')
        print(e)

################################################################################################
# インフォメーションの取得
# 現在時刻から開催中のお知らせを取得する
#################################################################################################
def getInformation():
    dt_limit = datetime.now(timezone.utc).isoformat()

    table = dynamodb.Table('information')
    try:
        # 開始と終了の日時から開催中のお知らせを取得する
        response = table.query(
            KeyConditionExpression=Key('dummy').eq('dummy') & Key('endAt').gte(dt_limit),
            ScanIndexForward=False,
            FilterExpression=Key('startAt').lte(dt_limit),
        )

        print('getInformation finish')

        return response['Items']
    except Exception as e:
        print('getInformation エラー')
        print(e)

    

################################################################################################
# 動画情報にチャンネル情報を付随させる
#################################################################################################
def extendChannelInfo(item, devKey):
    youtube = build("youtube", "v3", developerKey = devKey)
    ci = youtubeAPI.get_channel_info(youtube, item['snippet']['channelId'])
    item['snippet']['channelInfo'] = ci[0]
    return item



################################################################################################
# 音声ボタン用の
#################################################################################################
def getVoiceList():
    table = dynamodb.Table(os.environ['DYNAMO_DB_VOICE_LIST_TABLE'])
    try:
        # 音声リストはスキャン
        options = {
            'FilterExpression': Attr('isDeleted').ne('true'),
        }

        response = table.scan(**options)

        print('getVoiceList finish')

        return response['Items']
    except Exception as e:
        print('getVoiceList エラー')
        print(e)
 

################################################################################################
# DynamoDBからに音声情報を追加する
# item  ... voice情報
#################################################################################################
def putVoiceOne(item):
    print('putVoiceOne start')

    table = dynamodb.Table(os.environ['DYNAMO_DB_VOICE_LIST_TABLE'])
    try:
        responce = table.put_item(
            Item = item
        )
        print('putVoiceOne finish')    
        return responce
    except Exception as e:
        print('putVoiceOne エラー')
        print(e)
        return False



################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# uid ... VoiceID
#################################################################################################
def getVoiceOne(voice_uid):
    print('getVoiceOne start')

    table = dynamodb.Table(os.environ['DYNAMO_DB_VOICE_LIST_TABLE'])
    try:
        response = table.query(
            IndexName="uid-index",
            KeyConditionExpression=Key('uid').eq(voice_uid)
        )
        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)

    print('getVoiceOne finish')    


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
# イベントループを開始します
################################################################################################
def begin_ev_thread(loop: asyncio.AbstractEventLoop):
    asyncio.set_event_loop(loop)
    try:
        print('==> event loop start')
        loop.run_forever()
    finally:
        # 例外が出た場合は止める
        print('==> event loop close')
        loop.run_until_complete(loop.shutdown_asyncgens())
        loop.close()

################################################################################################
# オンプレ側Youtubeダウンロ―ダー呼び出しを非同期化したもの
################################################################################################
async def CallRawVideoDownloader(video_id, start, channel, uid):

    requests.get(
        VOICE_SERVER,
        params={
            'video_id':video_id,
            'start':start,
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
    pathParam = event['path']
    httpMethod = event['httpMethod']

    # チャンネルの動画リストを更新
    # Youtube -> DynamoDB

    # UPDATE_VIDEO_LIST  ... DynamoDB更新
    # GET_VIDEO_LIST ... DynamoDBから取得

    if pathParam == PATH_PARAMETER_VIDEO_LIST:    # チャンネルの動画リストを取得
        # https://api.unidule.jp/prd/video_list?channel=maru

        # maru ... 花ノ木まる
        # all ... 全員
        channel_owner = event['queryStringParameters']['channel']

        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoList(video_list_table, channel_owner)
        
        return createResponce(200,json.dumps(v_list, default=decimal_default_proc, ensure_ascii=False))
    
    elif pathParam == PATH_PARAMETER_VIDEO and httpMethod == "GET":    # チャンネルの動画を一つ取得
        # https://api.unidule.jp/prd/video?id=L_oVYEVYnI8
        print("GET REQUEST")

        video_id = event['queryStringParameters']['id']

        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoOne(video_list_table, video_id)
        
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': json.dumps(v_list, default=decimal_default_proc, ensure_ascii=False)
        }
        
    elif pathParam == PATH_PARAMETER_VIDEO and httpMethod == "DELETE":    # チャンネルの動画を論理削除
        # https://api.unidule.jp/prd/video?id=L_oVYEVYnI8

        print("DELETE REQUEST")

        video_id = event['queryStringParameters']['id']

        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoOne(video_list_table, video_id)

        item = v_list[0]
        item['isDeleted'] = 'true'

        updateDynamoDBOne(video_list_table, item)
        
        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
            },
            'body': json.dumps(item, default=decimal_default_proc, ensure_ascii=False)
        }
    elif pathParam == PATH_PARAMETER_CHANNEL_INFO:  # チャンネル情報の取得
        # https://api.unidule.jp/prd/channel_info
        video_list_table = os.environ['DYNAMO_DB_CHANNEL_INFO_TABLE']

        infos = getChannelInfoDocument(video_list_table)

        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': json.dumps(infos, default=decimal_default_proc, ensure_ascii=False)
        }        
    elif pathParam == PATH_PARAMETER_VIDEO_FORCE_UPDATE:  # Youtubeから特定IDの動画を取り直す

        # 対象動画ID
        video_id = event['queryStringParameters']['id']

        # 動画情報を入れるDynamoDB
        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']

        # チャンネルオーナー
        channel_owner = event['queryStringParameters']['channel']

        youtube = build("youtube", "v3", developerKey = os.environ['YOUTUBE_API_KEY'])
        video = youtubeAPI.get_video_items([video_id],youtube)

        importVideoListDocument(video, video_list_table, channel_owner)

        print('video force update ok',event)

        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    
    elif pathParam == PATH_PARAMETER_AUTH:  # 管理画面ログイン
        print(event)
        headers = event['headers']
        
        authorization = headers['Authorization']

        BASE_STR = "Basic " + os.environ['BASE_STR']
        if authorization == BASE_STR:
            API_KEY = os.environ['API_KEY']
            return {
                'statusCode': 200,
                'headers': {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": '*',
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                'body': API_KEY
            }            
        else:
            return {
                'statusCode': 401,
                'headers': {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": '*',
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                'body': "NGNG"
            }
    elif pathParam == PATH_PARAMETER_SCHEDULE_TWEET:

        # ツイッターから取得した予定表ツイートを取得する
        video_list_table = os.environ['DYNAMO_DB_TWITTER_TABLE']

        resurt = getScheduleTweetDocument(video_list_table)

        return {
                'statusCode': 200,
                'headers': {
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": '*',
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                'body': json.dumps(resurt, default=decimal_default_proc, ensure_ascii=False)
            }           

    # elif pathParam == PATH_PARAMETER_YOUTUBE_VIDEO:  # ビデオID直指定
    elif pathParam == PATH_PARAMETER_VIDEO and httpMethod == "POST":    # ビデオID直指定
        print('ビデオID直指定')
        
        own = 'other'  # その他のチャンネルに登録
        video_id = event['queryStringParameters']['video_id']

        # Youtubeから動画情報の取得
        # 動画情報をDynamoDBに入れる
        items = getVideoItem([video_id], os.environ['YOUTUBE_API_KEY'])
        items[0] = extendChannelInfo(items[0], os.environ['YOUTUBE_API_KEY'])
        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        importVideoListDocument(items, video_list_table, own)

        print('lambda finish',event,own)

        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'body': "OK"
        }
    elif pathParam == PATH_PARAMETER_SYSTEM and httpMethod == "GET":
        print('システムステータス')
        items = getSystemStatus()
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'body': json.dumps(items[0], default=decimal_default_proc, ensure_ascii=False)
            
        }
    elif pathParam == PATH_PARAMETER_INFORMATION and httpMethod == "GET":
        print('インフォメーション')
        items = getInformation()
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'body': json.dumps(items, default=decimal_default_proc, ensure_ascii=False)
            
        }
    elif pathParam == PATH_PARAMETER_VOICE and httpMethod == "GET":
        print('音声リスト')
        items = getVoiceList()
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'body': json.dumps(items, default=decimal_default_proc, ensure_ascii=False)
            
        }
    elif pathParam == PATH_PARAMETER_VOICE and httpMethod == "POST":
        print('音声追加リクエスト')
        print(json.dumps(event))

        headers = event['headers']
        body = event['body'].encode('utf-8')

        environ = {"REQUEST_METHOD": "POST"}
        headers = {
            "content-type": headers['content-type'],
            "content-length": len(body),
        }
        fp = io.BytesIO(body)
        form = cgi.FieldStorage(fp=fp, environ=environ, headers=headers) # FieldStorageを利用してForm Dataとして扱う
        url = form.getvalue('url')
        file = form.getvalue('file')

        # 保存するデータ
        item = {}
        item['isDenoise'] = False
        item['title'] =  form.getvalue('title')
        item['start'] = form.getvalue('start')
        item['tag'] = form.getvalue('tag')
        item['channel'] = form.getvalue('channel')
        item['comment'] = form.getvalue('comment')
        item['delete_key'] = form.getvalue('delete_key')
        item['uid'] = str(uuid.uuid4())


        # ゆにれいど以外の配信のURLが指定された
        if (len(item['title']) > 140):
            return createResponce(400,"タイトルが長すぎます。140文字以下にしてください")
        if (item['comment'] != None and len(item['comment']) > 500):
            return createResponce(400,"申し送り事項が長すぎます。もうXでDMしてください")

        if (file!= None and len(file) > 1024*1024*1.5):
            return createResponce(400,"添付されたファイルのサイズが大きすぎます")
      
      
        item['createdAt'] =  datetime.now(timezone.utc).isoformat()

        print("=== init Param =====================")
        print(item)

        # URLから動画IDを取得
        # 共有からの/live/が含まれるものの場合  https://www.youtube.com/live/0Z-VKmkb0wM?si=lQr7c3XgLbDFacxt
        if('/live/' in url):
            url = replaceLiveUrl(url)

        item['url'] = url

        o = parse_qsl(urlparse(url).query)
        video_id = o[0][1]

        # その動画がどのチャンネルの物か判定する
        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        video_list = getVideoOne(video_list_table, video_id)

        # ゆにれいど以外の配信のURLが指定された
        if (len(video_list) == 0):
            return createResponce(406,"ゆにれいど！関係以外のURLが指定されています")

        # チャンネル未選択の場合は、アーカイブのチャンネルを採用
        if (item['channel'] == None ) and (len(video_list) != 0):  # 動画があった
           # チャンネル
           item['channel'] = video_list[0]['channel']

        # ファイルがあればs3に置く
        if file != None:
            myUUID = uuid.uuid4()
            item['filename'] = video_id + '-' + str(myUUID) +'.mp3'

            bin = base64.b64decode(file)
            s3API.putFile(s3,'unidule-release','res/' + item['channel'] + '/' + item['filename'], bin )
        else:
            # 無ければ no_media フラグ\
            item['filename'] = ""
            item['no_media'] = True

        # dynamodbに登録 =============================================
        print(json.dumps(item))
        if(putVoiceOne(item) == False):
            return createResponce(500,"Internal Server Error")

        return createResponce(200,"OKOK")

    elif pathParam == PATH_PARAMETER_VOICE and httpMethod == "DELETE":
        print('音声削除リクエスト')
        print(json.dumps(event))

        param = parse_qs(event['body'])

        # dynamoDBのvoie_listテーブルをuidで検索
        v = getVoiceOne(param['uid'][0])
        if(v != None):
            item = v[0]
            if item['delete_key'] == param['delete_key'][0]:
                # 削除キーが照合できた場合は論理削除
                item['isDeleted'] = 'true'

                updateDynamoDBOne(os.environ['DYNAMO_DB_VOICE_LIST_TABLE'],item)
                print("delete ok")
            else:
                print("delete ng")
                return createResponce(403,"削除キーが合いませんでした")

        return createResponce(404,"削除対象が見つかりませんでした")
    
    elif pathParam == PATH_PARAMETER_RAW_VOICE and httpMethod == "GET":  # Youtubeから音声データを直接取得
        ev_loop = asyncio.get_event_loop()
        ev_thread = Thread(
            target = begin_ev_thread, args=(ev_loop,), daemon=False)
        ev_thread.start()

        # URLをデコード
        url = urllib.parse.unquote(event['queryStringParameters']['video_url'])

        if('/live/' in url):
            url = replaceLiveUrl(url)

        o = parse_qsl(urlparse(url).query)
        video_id = o[0][1]
        start = event['queryStringParameters']['start']
        channel = event['queryStringParameters']['channel']

        uid = str(uuid.uuid4())

        # スレッドを生成してそっちでAPIコールを行う
        asyncio.run_coroutine_threadsafe(CallRawVideoDownloader(video_id, start, channel, uid), ev_loop)

        # スレッド側のAPIコールが行われるのを待つ
        time.sleep(3)
        # ---------------------------------------------------
        # イベントループを停止
        # ---------------------------------------------------
        print('==> event loop stop')
        ev_loop.call_soon_threadsafe(ev_loop.stop)
        print('==> main-thread end')

        # 生成したuidを返却
        return createResponce(201, uid)




    # elif pathParam == PATH_PARAMETER_RAW_VOICE_POOL and httpMethod == "GET":  # Waveファイルのダウンロード
        
    #     # このuidをキーにs3を検索する
    #     uid = urllib.parse.unquote(event['queryStringParameters']['uid'])
    #     channel = urllib.parse.unquote(event['queryStringParameters']['channel'])

    #     s3 = boto3.client('s3')
    #     bin = s3API.getRawVideoFile(s3, channel + '/' + uid )

    #     return {
    #         'headers': { "Content-Type": "audio/wav" },
    #         'statusCode': 200,
    #         'body': base64.b64encode(bin).decode('utf-8'),
    #         'isBase64Encoded': True
    #     }
        
        
    elif pathParam == PATH_PARAMETER_RAW_VOICE_POOL and httpMethod == "GET":  # オンプレダウンローダーの監視
        
        # このuidをキーにs3を検索する
        uid = urllib.parse.unquote(event['queryStringParameters']['uid'])
        channel = urllib.parse.unquote(event['queryStringParameters']['channel'])

        s3 = boto3.client('s3')
        fileKey = s3API.getRawVideoFileKey(s3, channel + '/' + uid )

        dic = {}
        dic['uid'] = uid
        dic['channel'] = channel
        dic['filekey'] = fileKey

        return {
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'statusCode': 200,
            'body': json.dumps(dic, default=decimal_default_proc, ensure_ascii=False),
            'isBase64Encoded': False

        }


