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
# YoutubeからAPI経由で取得
# devKey ... APIキー
# channel_owner ... チャンネル所有者名
#################################################################################################
def getVideoListFromYT(devKey, channel_owner):
    print('getVideoListFromYT start')
    p_list_ud = None
    for (own , c_id, p_id ) in channelParams:
        if own == channel_owner:
            p_list_ud = p_id
            break
    
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
# DynamoDBに動画情報を追加
# 動画情報
# channel_owner ... チャンネル所有者名
#################################################################################################
def importVideoListDocument(v_list, table, channel_owner):
    print('importDocumentFromYT start')

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

    print('importDocumentFromYT finish')


################################################################################################
# DynamoDBから動画リストの取得
#################################################################################################
def getVideoList(table, channel_owner):
    print('getVideoList start')

    table = dynamodb.Table(table)
    try:
        response = table.query(
            KeyConditionExpression=Key('channel').eq(channel_owner),
            ScanIndexForward=False
        )
        return response['Items']

    except Exception as e:
        print('dynamodb get エラー')
        print(e)

    print('getVideoList finish')

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
    channel = event['queryStringParameters']['channel']

    if exec_mode == 'UPDATE_VIDEO_LIST':
        # Youtubeから動画情報の取得
        devKey = os.environ['YOUTUBE_API_KEY']
        v_list = getVideoListFromYT(devKey, channel)

        # with open('v_list.json', 'w',encoding='utf-8') as f:
        #     # f.write(json.dump(v_list))
        #     json.dump(v_list, f, indent=2, ensure_ascii=False)

        # with open('v_list.json', 'r',encoding='utf-8') as f:
        #     v_list = json.load(f)

        # 動画情報をDynamoDBに入れる
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        importVideoListDocument(v_list, table, channel)

        print('lambda finish',event)

        return {
            'statusCode': 201,
            'body': "OK"
        }
    
    elif exec_mode == 'GET_VIDEO_LIST':    # チャンネルの動画リストを更新
        # https://0htlivqys9.execute-api.ap-northeast-1.amazonaws.com/default/youtube_to_dynamoDB/maru?exec_mode=GET_VIDEO_LIST&channel=maru

        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        v_list = getVideoList(table, channel)
        
        return {
            'statusCode': 200,
            'body': json.dumps(v_list, default=decimal_default_proc, ensure_ascii=False)
        }

def decimal_default_proc(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError