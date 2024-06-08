import decimal
import os
import pprint
import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
from decimal import Decimal
import youtubeAPI
from googleapiclient.discovery import build

channelParams = [
    ('maru','UCmB1E78Kdgd9z6hN3ONRKow','UUmB1E78Kdgd9z6hN3ONRKow',),
    ('nagisa','UCe5mbpYA9Yym4lZTdj06G6Q','UUe5mbpYA9Yym4lZTdj06G6Q')
]



print('Loading function')
dynamodb = boto3.resource('dynamodb')


# バケット名,オブジェクト名
BUCKET_NAME = 'unidule-input'
OBJECT_KEY_NAME = 'maru_v_list.json'

TABLE_NAME = 'channel_video_list'

def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': err.message if err else json.dumps(res),
        'headers': {
            'Content-Type': 'application/json',
        },
    }


def convert_json_dict(json_file_name):
   with open(json_file_name) as json_file:
       d = json.load(json_file, parse_float=decimal.Decimal)

   return d


# Partition Key（SerialNumber）での絞込検索
def query_SerialNumber(table, videoId):
  response = table.query(
    KeyConditionExpression=Key('id').eq(videoId)
  )
  return response['Items']

# Partition Key + Sort Key（SerialNumber + BuildingId）での絞込検索
def query_SerialNumber_BuildingId(table, channel, publishedAt):
  response = table.query(
    KeyConditionExpression=
      Key('channel').eq(channel) & Key('snippet#publishedAt').eq(publishedAt)
  )
  return response['Items']



####################################################
# スケジュールの開始日時の取得
# item ... 動画情報
def getStartAt(item):
    try:
        # 配信でなかったら公開日時
        if item['snippet']['liveBroadcastContent'] == 'none':
            # 配信が終わったものは配信予定の日時のままにする
            if 'liveStreamingDetails' in item and 'scheduledStartTime' in item['liveStreamingDetails']:
                return item['liveStreamingDetails']['scheduledStartTime']
            return item['snippet']['publishedAt']
        else:
            if 'scheduledStartTime' in item['liveStreamingDetails']:
                return item['liveStreamingDetails']['scheduledStartTime']
            else:
                # 配信予定のない配信枠
                ""
    
    except Exception as e:
        print('getStartAt エラー')
        print(item['id'])
        print(e)


################################################################################################
# YoutubeからAPI経由で新着動画リストを取得
# devKey ... APIキー
# channel_owner ... チャンネル所有者名
#################################################################################################
def getVideoListFromYT(devKey, channel_owner):
    print('getVideoListFromYT start')
    p_list_ud = owner_to_pid(channel_owner)
    
    # チャンネルが見つからない場合
    if p_list_ud == None:
        print('不明なチャンネル所有者' + channel_owner)
    

    # youtube クライアントの作成
    youtube = build("youtube", "v3", developerKey = devKey)

    # チャンネルの新着動画ID一覧の取得
    v_list = youtubeAPI.get_video_id_in_playlist(p_list_ud, youtube)

    # TODO: 動画一覧のIDは保存しておいて、get_video_itemsで動画詳細を取得するときに、それを省いて絞り込む
    # 動画ID一覧から動画詳細を取得
    ret =  youtubeAPI.get_video_items(v_list, youtube )

    print('getVideoListFromYT finish')

    return ret


################################################################################################
# YoutubeからAPI経由でチャンネル情報を取得
# devKey ... APIキー
# channel_owner ... チャンネル所有者名
#################################################################################################
def getChannelInfoFromYT(devKey, channel_owner):
    print('getChannelInfoFromYT start')

    c_id = owner_to_cid(channel_owner)
    youtube = build("youtube", "v3", developerKey = devKey)
    
    info = youtubeAPI.get_channel_info(youtube, c_id)
    print('getChannelInfoFromYT finish')

    return info 

################################################################################################
# DynamoDBに動画情報を追加
# v_list ... 動画情報
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
#################################################################################################
def importVideoListDocument(v_list, table, channel_owner):
    print('importVideoListDocument start')

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        with table.batch_writer() as batch:
            for item in v_list:
                # DynamoDB用のフィールドを追加
                # channnel
                # atartAt
                item['channel'] = channel_owner
                startAt = getStartAt(item)

                # 配信予定のない枠だけを取得した場合
                if startAt:
                    item['startAt'] = startAt
                    batch.put_item(Item=item)

    except Exception as e:
        print('dynamodb import エラー')
        print(e)

    print('importVideoListDocument finish')


################################################################################################
# DynamoDBから動画リストの取得
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
#################################################################################################
def getVideoList(table, channel_owner):
    print('getVideoList start')

    table = dynamodb.Table(table)
    try:
        response = table.query(
            IndexName = 'channel-startAt-index',
            KeyConditionExpression=Key('channel').eq(channel_owner),
            ScanIndexForward=False
        )
        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)

    print('getVideoList finish')

################################################################################################
# DynamoDBにチャンネル情報を追加
# channel_infos ... チャンネル情報
# table ... 対象テーブル
#################################################################################################
def importChannelInfoDocument(channel_infos, table):
    print('importChannelInfoDocument start')

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        with table.batch_writer() as batch:
            for item in channel_infos:
                batch.put_item(Item=item)

    except Exception as e:
        print('dynamodb import エラー')
        print(e)

    print('importDocumentFromYT finish')


################################################################################################
# DynamoDBからチャンネル情報を取得
# table ... 対象テーブル
# channel_owner ... チャンネル所有者名
# 戻り値 ... チャンネル情報
#################################################################################################
def getChannelInfoDocument(table):
    print('importChannelInfoDocument start')

    # cid = owner_to_cid(channel_owner)

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        response = table.scan(        )
        return response['Items']
    except Exception as e:
        print('dynamodb import エラー')
        print(e)

    print('importDocumentFromYT finish')


################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):

    # チャンネルの動画リストを更新
    # Youtube -> DynamoDB

    # UPDATE_VIDEO_LIST  ... DynamoDB更新
    # GET_VIDEO_LIST ... DynamoDBから取得
    exec_mode = event['queryStringParameters']['exec_mode']

    # maru ... 花ノ木まる
    channel_owner = event['queryStringParameters']['channel']

    if exec_mode == 'UPDATE_VIDEO_LIST':
        # Youtubeから動画情報の取得
        v_list = getVideoListFromYT(os.environ['YOUTUBE_API_KEY'], channel_owner)

        # 動画情報をDynamoDBに入れる
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        importVideoListDocument(v_list, table, channel_owner)

        print('lambda finish',event)

        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }

    elif exec_mode == 'GET_VIDEO_LIST':    # チャンネルの動画リストを更新
        # https://api.unidule.jp/default/youtube_to_dynamoDB/maru?exec_mode=GET_VIDEO_LIST&channel=maru

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
    
    elif exec_mode == 'UPDATE_CHANNEL_INFO':  
        # ユニークIDで検索したときも配列で帰って来る
        channel_info = getChannelInfoFromYT(os.environ['YOUTUBE_API_KEY'], channel_owner)
        table = os.environ['DYNAMO_DB_CHANNEL_INFO_TABLE']
        # チャンネル情報の更新
        # 配列で渡す
        importChannelInfoDocument(channel_info, table, channel_owner)

        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    
    elif exec_mode == 'GET_CHANNEL_INFO':
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
    elif exec_mode == 'DELETE_VIDEO':
        id = event['queryStringParameters']['video_id']
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        table = dynamodb.Table(table)
        table.delete_item(Key={"channel": channel_owner, "startAt": "2024-06-08T14:45:13Z"})


        return {
            'statusCode': 203,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    
# Json dumps時にDecimalを変換するときのモジュール
def decimal_default_proc(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


#################################################
# チャンネルオーナー名からチャンネルIDを引く
#################################################
def owner_to_cid(channel_owner):
    for (own , c_id, p_id ) in channelParams:
        if own == channel_owner:
            return c_id

#################################################
# チャンネルオーナー名から新着プレイリストIDを引く
#################################################
def owner_to_pid(channel_owner):
    for (own , c_id, p_id ) in channelParams:
        if own == channel_owner:
            return p_id