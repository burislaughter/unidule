import decimal
import os
import pprint
import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
from decimal import Decimal

import importlib
# from lambda_function_query_dynamo import getVideoList
from util import owner_to_cid, owner_to_member_only, owner_to_pid, channelParams
import youtubeAPI
from googleapiclient.discovery import build
import pandas as pd

print('Loading function')
dynamodb = boto3.resource('dynamodb')


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
            if 'liveStreamingDetails' in item and 'actualStartTime' in item['liveStreamingDetails']:
                return item['liveStreamingDetails']['actualStartTime']
            return item['snippet']['publishedAt']
        else:  # live or upcoming           
            if 'scheduledStartTime' in item['liveStreamingDetails']:
                return item['liveStreamingDetails']['scheduledStartTime']
            elif 'actualStartTime' in item['liveStreamingDetails']: # ゲリラ配信枠
                return item['liveStreamingDetails']['actualStartTime']
            else:
                return '未定-' + item['id']  # 枠だけ立って予定がない

    
    except Exception as e:
        print('getStartAt エラー')
        print(item['id'])
        print(e)


################################################################################################
# YoutubeからAPI経由で新着動画リストを取得
# devKey ... APIキー
# table ... Youtubeから取得した動画IDの取得済IDを入れるテーブル名
# channel_owner ... チャンネル所有者名
# force ... 処理済の重複チェックをせず全IDを取得
#################################################################################################
def getVideoListFromYT(devKey, table, channel_owner,is_force, is_once=True):
    print('getVideoListFromYT start')
    p_list_id = owner_to_pid(channel_owner)
    
    # チャンネルが見つからない場合
    if p_list_id == None:
        print('不明なチャンネル所有者' + channel_owner)

    # youtube クライアントの作成
    youtube = build("youtube", "v3", developerKey = devKey)

    # チャンネルの新着動画ID一覧の取得
    v_id_list = youtubeAPI.get_video_id_in_playlist(p_list_id, youtube, is_once)

    # メン限
    p_list_mem = owner_to_member_only(channel_owner)
    # チャンネルの新着動画ID一覧の取得
    v_id_list_mem = youtubeAPI.get_video_id_in_playlist(p_list_mem, youtube, is_once)

    # メン限の動画IDをマージ
    if v_id_list_mem:
        v_id_list = v_id_list + v_id_list_mem

    # 全てを対象とする場合
    if is_force:
        # 動画詳細を取得
        return  youtubeAPI.get_video_items(v_id_list, youtube )


    ids = getVideoIdsDocument(table)

    # dynamo_pd_tmp = pd.DataFrame(ids, columns=['id'])
    dynamo_pd = pd.DataFrame(ids, columns=['id','ignore'])
    youtube_pd = pd.DataFrame({'id':v_id_list})

    diff = youtube_pd[~youtube_pd['id'].isin(dynamo_pd['id'])]

    # DynamoDBの中で配信ステータスが live または upcoming の物を取得し更新対象とする
    diff_ids = liveStatusIds(os.environ['DYNAMO_DB_VIDEO_LIST_TABLE'], channel_owner)

    # ID配列に変換
    for index, row in diff.iterrows():
        diff_ids.append(row.id)

    # その動画IDが更新対象外の場合は省く
    ignore_ids = dynamo_pd[dynamo_pd['ignore']==True]['id'].to_list()
    if len(ignore_ids) != 0:
        ignore_id_pd = pd.DataFrame({'id':ignore_ids})
        diff_id_pd = pd.DataFrame({'id':diff_ids})
        diff_id_pd = diff_id_pd[~diff_id_pd['id'].isin(ignore_id_pd['id'])]

        diff_ids = diff_id_pd['id'].to_list()
        print(diff_ids)

        v_id_pd = pd.DataFrame({'id':v_id_list})
        v_id_pd = v_id_pd[~v_id_pd['id'].isin(ignore_id_pd['id'])]
        v_id_list = v_id_pd['id'].to_list()
        

    # 更新漏れがあるので、保険で配信中の物を書き込む
    tmp = youtubeAPI.get_video_items(v_id_list[0:10], youtube )
    append = liveStatusVIdeos(tmp)


    # 新着が0件なら処理しない
    if len(diff_ids) != 0:
        importVideoIdsDocument(diff_ids, channel_owner, table)
        ret =  youtubeAPI.get_video_items(diff_ids, youtube )        
        print('getVideoListFromYT finish')
        return ret + append
    
    # 0件の時に
    print("Update 0")
    return append







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
def importVideoListDocument(v_list, table, channel_owner, is_force=False):
    print('importVideoListDocument start')

    # 重複していた場合に削除
    v_list = pd.DataFrame({'id':v_list}).drop_duplicates()['id'].values.tolist()

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        with table.batch_writer() as batch:
            for item in v_list:
                # DynamoDB用のフィールドを追加
                # channel
                item['dummy'] = 'dummy'  # ダミーパーティションキー
                # atartAt
                item['channel'] = channel_owner
                item['snippet']['description'] = item['snippet']['description'][0:32]
                item['snippet']['thumbnails']['default']={}
                # item['snippet']['thumbnails']['medium']={}
                item['snippet']['thumbnails']['high']={}
                item['snippet']['thumbnails']['standard']={}
                # item['snippet']['thumbnails']['maxres']={}
                startAt = getStartAt(item)

                # 配信ステータスを平滑化
                item['liveBroadcastContent'] = item['snippet']['liveBroadcastContent']

                # 終了時刻を平滑化
                if ('liveStreamingDetails' in item) and ('actualEndTime' in item['liveStreamingDetails']):
                    item['endAt'] = item['liveStreamingDetails']['actualEndTime']
                else:
                    item['endAt'] = ''

                # メン限判定判定フラグ
                item['isMemberOnly'] = (item["status"]["privacyStatus"] == "public") and (not "viewCount" in item["statistics"])

                # 限定公開は追加しない
                # ただし途中で限定公開になったことを考慮し、endAtがある場合は更新する
                if item["status"]["privacyStatus"] == "unlisted" and is_force == False:
                    if (not 'statistics' in item) or int(item['statistics']['likeCount']) < 10:
                        continue

                # 配信予定のない枠だけを取得した場合
                if startAt:
                    item['startAt'] = startAt
                    print("[writeing]: " + item['id'])
                    batch.put_item(Item=item)

    except Exception as e:
        print('dynamodb import エラー')
        print(e)




    print('importVideoListDocument finish')



################################################################################################
# DynamoDBにチャンネル情報を追加
# channel_infos ... チャンネル情報
# table ... 対象テーブル
# channel_owner ... チャンネルオーナー
#################################################################################################
def importChannelInfoDocument(channel_infos, table, channel_owner):
    print('importChannelInfoDocument start')

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        with table.batch_writer() as batch:
            for item in channel_infos:
                item['channel'] = channel_owner
                batch.put_item(Item=item)

    except Exception as e:
        print('dynamodb import エラー')
        print(e)

    print('importChannelInfoDocument finish')


################################################################################################
# DynamoDBに取得したYoutbeの動画IDを追加
# table ... 対象テーブル
#################################################################################################
def importVideoIdsDocument(ids, channel, table):
    print('importVideoIdsDocument start')

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:
        with table.batch_writer() as batch:
            for id in ids:
                batch.put_item(Item={
                    'id':id,
                    'channel':channel
                })

    except Exception as e:
        print('dynamodb import エラー')
        print(e)

    print('importVideoIdsDocument finish')


################################################################################################
# DynamoDBから保存済Youtbeの動画IDを全件取得
# table ... 対象テーブル
#################################################################################################
def getVideoIdsDocument(table):
    print('getVideoIdsDocument start')

    # dynamoDBで検索する用の情報を付随する
    table = dynamodb.Table(table)
    try:

        response = table.scan()
        data = response['Items']

        # レスポンスに LastEvaluatedKey が含まれなくなるまでループ処理を実行する
        while 'LastEvaluatedKey' in response:
            print(response['LastEvaluatedKey']['uuid'])

            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            if 'LastEvaluatedKey' in response:
                print("LastEvaluatedKey: {}".format(response['LastEvaluatedKey']))
            data.extend(response['Items'])

        return data

    except Exception as e:
        print('getVideoIdsDocument エラー')
        print(e)


################################################################################################
# 配信済または廃止に予定の配信の情報を取り直す
#################################################################################################
def liveStatusIds(table, channel_owner):
    table = dynamodb.Table(table)
    response = table.query(
        IndexName = 'liveBroadcastContent-index',
        KeyConditionExpression=Key('liveBroadcastContent').eq('live'),
        ScanIndexForward=False
    )
    data = response['Items']

    response = table.query(
        IndexName = 'liveBroadcastContent-index',
        KeyConditionExpression=Key('liveBroadcastContent').eq('upcoming'),
        ScanIndexForward=False
    )
    data.extend(response['Items'])


    df = pd.DataFrame(data,columns=['id','channel'])

    ids = []
    for index, row in df.iterrows():
        # 現在の更新対象のチャンネル以外を省く
        if row['channel'] == channel_owner:
            ids.append(row.id)

    return ids
    

################################################################################################
# 配信中または配信予定の動画をリストから探す
#################################################################################################
def liveStatusVIdeos(v_list):
    lists = []
    for item in v_list:

        # 配信ステータスを平滑化
        if item['snippet']['liveBroadcastContent'] == 'live' or item['snippet']['liveBroadcastContent'] == 'upcoming':
            lists.append(item)

    return lists
    


    
def check_delete_video():
    # 一日分の動画を取得
    table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']

    query_dynamo = importlib.import_module('lambda_function_query_dynamo') 
    v_list = query_dynamo.getVideoList(table,'all',1)
    v_ids = get_ids(v_list)

    # Youtubeに動画DIを問い合わせ
    # youtube クライアントの作成
    youtube = build("youtube", "v3", developerKey = os.environ['YOUTUBE_API_KEY'])
    youtbe_videos = youtubeAPI.get_video_ids(v_ids, youtube )
    y_ids = get_ids(youtbe_videos)

    # 問い合わせ内容の比較し削除
    for vid in v_ids:
        if not (vid in y_ids):
            table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
            v_list = query_dynamo.getVideoOne(table, vid)
            item = v_list[0]
            item['isDeleted'] = 'true'
            query_dynamo.updateDynamoDBOne(table, item)


def get_ids(items):
    ids = []
    for item in items:
        if not 'isDeleted' in item.keys():
            ids.append(item['id'])

    return ids



################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):

    # チャンネルの動画リストを更新
    # Youtube -> DynamoDB

    # UPDATE_VIDEO_LIST  ... DynamoDB更新
    # GET_VIDEO_LIST ... DynamoDBから取得
    exec_mode = event['exec_mode']

    if exec_mode == 'UPDATE_VIDEO_LIST':
        # maru ... 花ノ木まる
        channel_owner = event['channel']

        is_force = event['force'] if 'force' in event else ""
        is_once = event['once'] if 'once' in event else True

        # Youtubeから動画情報の取得
        v_list = getVideoListFromYT(os.environ['YOUTUBE_API_KEY'],os.environ['DYNAMO_DB_IDS_TABLE'], channel_owner, is_force, is_once)

        if len(v_list) != 0:
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

    elif exec_mode == 'UPDATE_CHANNEL_INFO':  
        channel_owner = event['channel']
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
    
    elif exec_mode == 'DELETE_VIDEO':  # 物理削除
        channel_owner = event['channel']
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

    elif exec_mode == 'UPDATE_VIDEO_ONE': # デバッグ用

        id = event['queryStringParameters']['video_id']
        table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
        table = dynamodb.Table(table)
        responce = table.get_item(
            Key={
                'id': id
            }            
        )

        responce['Item']['liveBroadcastContent'] = 'none'

        responce = table.put_item(
            Item = responce['Item']
        )

        return {
            'statusCode': 203,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    elif exec_mode == 'UPDATE_VIDEO_LIST_ALL':  # 全てのユニメンチャンネル
        is_force = event['force'] if 'force' in event else ""
        
        for (own , c_id, p_id, mem ) in channelParams:
            if not own == 'uniraid' and not own == 'uniraid_cut':
                # Youtubeから動画情報の取得
                v_list = getVideoListFromYT(os.environ['YOUTUBE_API_KEY'],os.environ['DYNAMO_DB_IDS_TABLE'], own, is_force)

                if len(v_list) != 0:
                    # 動画情報をDynamoDBに入れる
                    table = os.environ['DYNAMO_DB_VIDEO_LIST_TABLE']
                    importVideoListDocument(v_list, table, own)

                    print('lambda finish',event,own)

        # 削除チェック
        check_delete_video()

        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    elif exec_mode == 'CHECK_DELETE_VIDEO':  # 削除された動画/配信をチェック

        check_delete_video()
        return {
            'statusCode': 201,
            'headers': {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": '*',
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': "OK"
        }
    elif exec_mode == 'UPDATE_CHAT':  # チャット情報を取得
        # 最後に取得した日時から現在時刻の1時間前に終わった配信を対象に動画情報を取得する
        table = os.environ['DYNAMO_DB_CHAT_TABLE']
        is_force = event['force'] if 'force' in event else ""

        query_dynamo = importlib.import_module('lambda_function_query_dynamo') 
        v_list = query_dynamo.getVideoList(os.environ['DYNAMO_DB_VIDEO_LIST_TABLE'],'all',2)

        v_list = list(filter(lambda v: v['liveBroadcastContent'] == 'none'  , v_list))
        v_ids = get_ids(v_list)

        for v in v_ids:
            query_dynamo.UpdateChat(v,is_force)

        return 'okok'





