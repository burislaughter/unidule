

from lambda_function_query_dynamo import lambda_handler as lambda_handler_query_dynamo
from lambda_function_update_dynamo import lambda_handler as lambda_handler_update_dynamo
from util import PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_VIDEO_LIST



event = {}


# GET_VIDEO_LIST ... DynamoDBから動画情報リストを取得
# GET_CHANNEL_INFO


# event['queryStringParameters']['video_id'] = "L_oVYEVYnI8"


event['exec_mode'] = 'UPDATE_VIDEO_ONE'
# event['exec_mode'] = 'UPDATE_VIDEO_LIST'
# event['exec_mode'] = 'UPDATE_CHANNEL_INFO'
event['channel'] = 'nagisa'
# event['video_id'] = 'Jb2yfMZZAp4'
lambda_handler_update_dynamo(event,None)


# UPDATE_VIDEO_LIST  ... 動画リストのDynamoDBを更新
# UPDATE_CHANNEL_INFO ...  チャンネル情報のDynamoDBを更新
# DELETE_VIDEO
# event['oath'] = {}
# event['queryStringParameters'] = {}
# event['path'] = PATH_PARAMETER_VIDEO_LIST
# event['queryStringParameters']['channel'] = 'nagisa'
# lambda_handler_query_dynamo(event,None)

