

from lambda_function_update_videolist import lambda_handler



event = {}
event['queryStringParameters'] = {}

# UPDATE_VIDEO_LIST  ... 動画リストのDynamoDBを更新
# GET_VIDEO_LIST ... DynamoDBから動画情報リストを取得
# UPDATE_CHANNEL_LIST ...  チャンネル情報のDynamoDBを更新
# GET_CHANNEL_INFO
# DELETE_VIDEO
event['queryStringParameters']['exec_mode'] = 'GET_VIDEO_LIST'

# maru ... 花ノ木まる
event['queryStringParameters']['channel'] = 'maru'

# event['queryStringParameters']['video_id'] = "L_oVYEVYnI8"


lambda_handler(event,None)