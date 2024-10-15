import math
import os
import pprint
import boto3
from googleapiclient.discovery import build
from boto3.dynamodb.conditions import Key, Attr
import json
from lambda_function_update_dynamo import importVideoListDocument
from util import PATH_PARAMETER_AUTH, PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_INFORMATION, PATH_PARAMETER_SCHEDULE_TWEET, PATH_PARAMETER_SYSTEM, PATH_PARAMETER_VIDEO, PATH_PARAMETER_VIDEO_FORCE_UPDATE,PATH_PARAMETER_VIDEO_LIST, PATH_PARAMETER_YOUTUBE_VIDEO
from util import decimal_default_proc
import youtubeAPI
from datetime import datetime, timezone, timedelta


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
def updateVideoOne(table, item):
    print('updateVideoOne start')

    table = dynamodb.Table(table)
    try:
        responce = table.put_item(
            Item = item
        )
        print('updateVideoOne finish')    
        return responce
    except Exception as e:
        print('updateVideoOne エラー')
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

        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoList(table, channel_owner)
        
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': json.dumps(v_list, default=decimal_default_proc, ensure_ascii=False)
        }
    
    elif pathParam == PATH_PARAMETER_VIDEO and httpMethod == "GET":    # チャンネルの動画を一つ取得
        # https://api.unidule.jp/prd/video?id=L_oVYEVYnI8
        print("GET REQUEST")

        video_id = event['queryStringParameters']['id']

        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoOne(table, video_id)
        
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

        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoOne(table, video_id)

        item = v_list[0]
        item['isDeleted'] = 'true'

        updateVideoOne(table, item)
        
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
        table = os.environ['DYNAMO_DB_CHANNEL_INFO_TABLE']

        infos = getChannelInfoDocument(table)

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
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']

        # チャンネルオーナー
        channel_owner = event['queryStringParameters']['channel']

        youtube = build("youtube", "v3", developerKey = os.environ['YOUTUBE_API_KEY'])
        video = youtubeAPI.get_video_items([video_id],youtube)

        importVideoListDocument(video, table, channel_owner)

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
        table = os.environ['DYNAMO_DB_TWITTER_TABLE']

        resurt = getScheduleTweetDocument(table)

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
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        importVideoListDocument(items, table, own)

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
