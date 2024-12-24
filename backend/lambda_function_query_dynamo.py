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

import urllib
from lambda_function_update_dynamo import importVideoListDocument
from util import PATH_PARAMETER_AUTH, PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_INFORMATION, PATH_PARAMETER_SCHEDULE_TWEET, PATH_PARAMETER_SYSTEM, PATH_PARAMETER_VIDEO, PATH_PARAMETER_VIDEO_FORCE_UPDATE,PATH_PARAMETER_VIDEO_LIST, PATH_PARAMETER_VOICE, PATH_PARAMETER_RAW_VOICE, PATH_PARAMETER_RAW_VOICE_POOL, PATH_PARAMETER_WAV_TO_MP3, PATH_PARAMETER_GET_CHAT, PATH_PARAMETER_SEARCH_CHAT
from util import decimal_default_proc
from util import splite_time

import youtubeAPI
import s3API
import requests
from requests.auth import HTTPBasicAuth

from datetime import datetime, timezone, timedelta
import pandas as pd
import pytchat


# 音声抽出用サーバーURL
# VOICE_SERVER = 'https://unidule.net:34449/'
VOICE_SERVER = 'https://60.39.85.91:34449/'



print('Loading function')
dynamodb = boto3.resource('dynamodb')

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
# DynamoDBから音声情報を取得
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
# DynamoDBからvideo_idがコメント取得を処理済かチェック
# viceo_id
#################################################################################################
def getChatVideoID(viceo_id):
    print('getChatVideoID start')

    table = dynamodb.Table(os.environ['DYNAMO_DB_CHAT_VIDEO_IDS_TABLE'])
    try:
        response = table.query(
            # IndexName="uid-index",
            KeyConditionExpression=Key('id').eq(viceo_id)
        )
        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)

    print('getChatVideoID finish')    


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
# https://www.youtube.com/live/xxxxx と
# https://www.youtube.com/shorts/xxxx のURLを 
# https://www.youtube.com/watch?v=xxxx のURLに変更する
#################################################################################################
def replaceLiveUrl(url):
    p = urlparse(url)
    url = p[2].replace('/live/', 'https://www.youtube.com/watch?v=').replace('/shorts/', 'https://www.youtube.com/watch?v=')
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
        verify=False,
        auth=HTTPBasicAuth(
            os.environ['RAW_VIDEO_USER_ID'], 
            os.environ['RAW_VIDEO_PASSWORD']
        )
    )



################################################################################################
# チャットテーブル検索
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
#################################################################################################
def getChatList(channel_id):
    print('getChatList start')

    table = dynamodb.Table(os.environ['DYNAMO_DB_CHAT_TABLE'])
    try:
        response = table.query(
            IndexName = 'channel_id-datetime-index',
            # KeyConditionExpression=Key('channel_id').eq(channel_id) & Key('endAt').gte(baseAt),
            KeyConditionExpression=Key('channel_id').eq(channel_id),
            ScanIndexForward=False
        )
        data = response['Items']

        # レスポンスに LastEvaluatedKey が含まれなくなるまでループ処理を実行する
        while 'LastEvaluatedKey' in response:
            print(response['LastEvaluatedKey']['uuid'])
            response = table.query(
                IndexName = 'channel_id-datetime-index',
                KeyConditionExpression=Key('channel_id').eq(channel_id),
                ScanIndexForward=False,
                ExclusiveStartKey=response['LastEvaluatedKey']
            )

            if 'LastEvaluatedKey' in response:
                print("LastEvaluatedKey: {}".format(response['LastEvaluatedKey']))
            data.extend(response['Items'])

        result = sorted(data, key=lambda u: u["datetime"], reverse=True)
        print('getChatList all finish')


        return result

    except Exception as e:
        print('getChatList エラー')
        print(e)

################################################################################################
# チャットテーブル検索
# video_ids ... 動画id配列
#################################################################################################
def getViceoInfos(video_ids):
    print('getViceoInfos start')

    def split_list(l, n):
        """
        リストをサブリストに分割する
        :param l: リスト
        :param n: サブリストの要素数
        :return: 
        """
        for idx in range(0, len(l), n):
            yield l[idx:idx + n]

    # with table.batch_get_item() as batch:
    maps = []
    for x in video_ids:
        maps.append({'id':x})

    # 100件ずつ分割
    splits = split_list(maps,100)
    data = []
    table_name = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
    try:
        for spl in splits:
            response = dynamodb.batch_get_item(
                RequestItems={
                    table_name: {
                        'Keys':spl
                        }
                }
            )
            data.extend(response['Responses']['channel_video_list'])

        result = sorted(data, key=lambda u: u["startAt"], reverse=True)
        print('getViceoInfos all finish')


        return result

    except Exception as e:
        print('getViceoInfos エラー')
        print(e)


################################################################################################
# チャットテーブル検索
# video_ids ... 動画id
#################################################################################################
def UpdateChat(video_id, is_force = False):
    print('GET_CHAT start :: '+video_id)

    if len(getChatVideoID(video_id)) != 0 and is_force == False:
        return createResponce(202, video_id)
    
    # dynamoDBからvideoID指定で配信/動画除法の取得
    video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
    v_list = getVideoOne(video_list_table, video_id)

    if len(v_list) == 0:
        print('GET_CHAT not found video' + video_id)
        return createResponce(404, video_id)

    item = v_list[0]
    if(item['liveBroadcastContent'] != 'none'):
        print('GET_CHAT liveBroadcastContent is not none = ' + item['liveBroadcastContent'] + ':' + video_id)
        return createResponce(400, "Status not none = " + item['liveBroadcastContent'] + ':' + video_id)

    title = item['snippet']['title']
    # PytchatCoreオブジェクトの取得
    try:
        livechat = pytchat.create(video_id = video_id, force_replay=True)

        # Youtubeからチャット情報の取得 + dynamoDBにPush
        print('waiting',end='')
        result_chat = []
        is_first = True
        while livechat.is_alive():
            # チャットデータの取得
            chatdata = livechat.get()

            if len(chatdata.items) == 0 and is_first:
                print('chatdata notfound : ' + video_id )
                return
            
            for c in chatdata.items:
                # c.json()
                result_chat.append({
                    "video_id": video_id,
                    "video_title": title,
                    "id": c.id,
                    "datetime": c.datetime,
                    "channel_id": c.author.channelId,
                    "author_name": c.author.name,
                    "message": c.message,
                    "amountString": c.amountString,
                })
            is_first = False
            print('.',end='')
            time.sleep(2)
        print('get ok',end='')

    except Exception as e:
        print('pytchat エラー')
        print(e)
        return

   

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(os.environ['DYNAMO_DB_CHAT_TABLE'])
    try:
        with table.batch_writer() as batch:
            for item in result_chat:
                # 配信予定のない枠だけを取得した場合
                batch.put_item(Item=item)
        
    except Exception as e:
        print('dynamodb import エラー :: '+video_id)
        print(e)

    # 処理の終わったテーブルを保存
    updateDynamoDBOne(os.environ['DYNAMO_DB_CHAT_VIDEO_IDS_TABLE'],{'id':video_id,'title':title })



################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):
    pathParam = event['path']
    httpMethod = event['httpMethod']

    print('=== query =============================================================')
    print(event)

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

        importVideoListDocument(video, video_list_table, channel_owner, True)

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
        waveBuffer = form.getvalue('waveBuffer')  # カットされたWaveファイル


        # 保存するデータ
        item = {}
        item['isDenoise'] = False
        item['title'] =  form.getvalue('title')
        item['start'] = form.getvalue('start')
        item['end'] = form.getvalue('end')
        item['tag'] = form.getvalue('tag')
        item['channel'] = form.getvalue('channel')
        item['comment'] = form.getvalue('comment')
        item['delete_key'] = form.getvalue('delete_key')
        item['user_id'] = form.getvalue('user_id')
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
        # 共有からの/live/か/shorts/が含まれるものの場合
        #   https://www.youtube.com/live/0Z-VKmkb0wM?si=lQr7c3XgLbDFacxt
        #   https://www.youtube.com/shorts/DkAoIdue3HE
        if('/live/' in url or '/shorts/' in url):
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
        if waveBuffer != None and waveBuffer != "":
            myUUID = uuid.uuid4()
            item['filename'] = video_id + '-' + str(myUUID) +'.wav'

            print('===============================================================================')
            # data:audio/wav;base64,UklGRtStCgBXQVZF
            # print(waveBuffer)
            print('===============================================================================')
            if waveBuffer.startswith('data:audio/wav;base64,'):
                print("remove removeprefix")
                waveBuffer = waveBuffer.removeprefix('data:audio/wav;base64,')
                print(waveBuffer[:64])
            else:
                print("non-remove removeprefix")

            bin = base64.b64decode(waveBuffer)
            s3_client = boto3.client('s3')
            s3_key = 'res/' + item['channel'] + '/' + item['filename']
            s3API.putObject(s3_client, 'unidule-release', s3_key, bin, 'audio/wav')

        elif file != None:
            myUUID = uuid.uuid4()
            item['filename'] = video_id + '-' + str(myUUID) +'.mp3'

            bin = base64.b64decode(file)

            s3_client = boto3.client('s3')
            s3_key = 'res/' + item['channel'] + '/' + item['filename']
            s3API.putObject(s3_client, 'unidule-release', s3_key, bin, 'audio/mpeg')
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
        # URLをデコード
        url = urllib.parse.unquote(event['queryStringParameters']['video_url'])

        if('/live/' in url or '/shorts/' in url):
            url = replaceLiveUrl(url)

        o = parse_qsl(urlparse(url).query)
        video_id = o[0][1]

        # その動画がどのチャンネルの物か判定する
        video_list_table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        video_list = getVideoOne(video_list_table, video_id)

        # ゆにれいど以外の配信のURLが指定された
        if (len(video_list) == 0):
            return createResponce(406,"ゆにれいど！関係以外のURLが指定されています")
        
        start = event['queryStringParameters']['start'].strip()
        end = event['queryStringParameters']['end'].strip()
        channel = event['queryStringParameters']['channel']

        if channel == "" or channel == None:
            channel = video_list[0]['channel']

        uid = str(uuid.uuid4())

        try:
            hour, minute, second = splite_time(start)
        except Exception as e:
            return createResponce(400,"開始時間の解析に失敗しました")

        start_sec = int(timedelta(hours=hour, minutes=minute, seconds=second).total_seconds())


        if end == None or end == "":
            end_sec = start_sec + 10
        else:
            try:
                hour, minute, second = splite_time(end)
            except Exception as e:
                # 開始時間の解析に失敗
                end_sec = start_sec + 10

        end_sec = int(timedelta(hours=hour, minutes=minute, seconds=second).total_seconds())

        if end_sec - start_sec > 60:
            return createResponce(400,"時間の指定が長すぎます。60秒以内にしてください")
        
        # もし開始と終了が一緒だったら終了に1秒足す
        if end_sec - start_sec == 0:
            hour, minute, second = splite_time(end)
            end = str(hour) + ":" + str(minute)  + ":" + str(second + 1)

        # スレッドを生成してそっちでAPIコールを行う
        # 引数
        input_event = {
            "video_id": video_id,
            "start": start,
            "end": end,
            "channel": channel,
            "uid": uid,
        }

        Payload = json.dumps(input_event) # jsonシリアライズ
        print("--- Payload:", Payload)
        
        # 非同期Lambda呼び出し
        response = boto3.client('lambda').invoke(
            FunctionName='lambda_function_generate_voice_clip',
            InvocationType='Event',
            Payload=Payload
        )
        print("--- response:", response)


        # スレッド側のAPIコールが行われるのを待つ
        time.sleep(1)

        # 生成したuidを返却
        return createResponce(201, uid)
        
        
    elif pathParam == PATH_PARAMETER_RAW_VOICE_POOL and httpMethod == "GET":  # オンプレダウンローダーの監視
        
        # このuidをキーにs3を検索する
        uid = urllib.parse.unquote(event['queryStringParameters']['uid'])
        channel = urllib.parse.unquote(event['queryStringParameters']['channel'])

        s3_client = boto3.client('s3')
        fileKey = s3API.getRawVideoFileKey(s3_client, channel + '/' + uid )

        dic = {}
        dic['uid'] = uid
        dic['channel'] = channel
        dic['filekey'] = fileKey

        try:
            # VOICE_SERVER = 'https://unidule.net:34449'
            res = requests.get(
                VOICE_SERVER,
                verify=False,
                auth=HTTPBasicAuth(
                    os.environ['RAW_VIDEO_USER_ID'], 
                    os.environ['RAW_VIDEO_PASSWORD']
                )
            )
            
            if res.status_code == 200:
                dic['progress'] = res.text
            else:
                dic['progress'] = str(res.status_code) + ':' + res.reason

        except Exception as e:
            print('=== yt_dlp_status Error =============')
            print(e)


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


    elif pathParam == PATH_PARAMETER_WAV_TO_MP3 and httpMethod == "GET":  # Wav登録の音声をmp3登録にする
        print('WAV_TO_MP3 start')

        uid = urllib.parse.unquote(event['queryStringParameters']['uid'])

        # dynamoDBから音声の情報を取得
        vo = getVoiceOne(uid)
        if len(vo) == 0:
          return createResponce(404, uid)
        
        # 最初
        vo = vo[0]
        channel = vo['channel']
        filename = vo['filename'].replace(".wav",".mp3")

        # 音声のUIDからMP3の存在をチェック
        s3_client = boto3.client('s3')
        fileKey = s3API.finds3Key(s3_client, 'res/' + channel + '/' + filename )

        # MP3ファイルがない
        if fileKey == None:
          return createResponce(404, uid)

        # dynamoDBの内容を更新
        vo['filename'] = filename
        vo['isDenoise'] = True

        updateDynamoDBOne(os.environ['DYNAMO_DB_VOICE_LIST_TABLE'],vo)

        return {
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'statusCode': 200,
            'body': "UPDATE OK",
            'isBase64Encoded': False

        }
    elif pathParam == PATH_PARAMETER_SEARCH_CHAT and httpMethod == "GET":  # チャット検索
        channel_id = urllib.parse.unquote(event['queryStringParameters']['id'])
        # dynamoDBで検索する用の情報を付随する
        items = getChatList(channel_id)

        # 配信情報を付随
        df = pd.DataFrame(items)
        # 動画IDで
        ids = df['video_id'].unique()
        video = getViceoInfos(ids)
        body = {
            'items':items,
            'video':video
        }

        return createResponce(200,json.dumps(body, default=decimal_default_proc, ensure_ascii=False))


    
    elif pathParam == PATH_PARAMETER_GET_CHAT and httpMethod == "GET":  # 配信のチャットをYoutubeから取得する
        UpdateChat(urllib.parse.unquote(event['queryStringParameters']['id']))
        return {
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
            },
            'statusCode': 200,
            'body': 'OK',
            'isBase64Encoded': False
        }


