

from lambda_function_update_videolist import lambda_handler



event = {}
event['queryStringParameters'] = {}

# UPDATE_VIDEO_LIST  ... DynamoDB更新
# GET_VIDEO_LIST ... DynamoDBから取得
event['queryStringParameters']['exec_mode'] = 'GET_VIDEO_LIST'

# maru ... 花ノ木まる
event['queryStringParameters']['channel'] = 'maru'


lambda_handler(event,None)