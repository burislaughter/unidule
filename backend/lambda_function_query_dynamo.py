import os
import pprint
import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
from util import PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_VIDEO,PATH_PARAMETER_VIDEO_LIST
from util import decimal_default_proc


print('Loading function')
dynamodb = boto3.resource('dynamodb')


################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
#################################################################################################
def getVideoList(table, channel_owner):
    print('getVideoList start')

    table = dynamodb.Table(table)
    try:
        if channel_owner == 'all':
            response = table.scan()
            data = response['Items']

            # レスポンスに LastEvaluatedKey が含まれなくなるまでループ処理を実行する
            while 'LastEvaluatedKey' in response:
                print(response['LastEvaluatedKey']['uuid'])

                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
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
            print('getVideoList all finish')

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
    print('getVideoList start')

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

    print('getVideoList finish')    


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
        print('dynamodb import エラー')
        print(e)

    


################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):
    pathParam = event['path']

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
    
    if pathParam == PATH_PARAMETER_VIDEO:    # チャンネルの動画リストを取得
        # https://api.unidule.jp/prd/video_list?channel=maru

        # maru ... 花ノ木まる
        # all ... 全員
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
    
    elif pathParam == PATH_PARAMETER_CHANNEL_INFO:
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

    
