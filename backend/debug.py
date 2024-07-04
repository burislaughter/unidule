

from lambda_function_query_dynamo import lambda_handler as lambda_handler_query_dynamo
from lambda_function_update_dynamo import lambda_handler as lambda_handler_update_dynamo
from lambda_function_webhook import lambda_handler as lambda_function_webhook

from util import PATH_PARAMETER_AUTH, PATH_PARAMETER_CHANNEL_INFO, PATH_PARAMETER_SCHEDULE_TWEET, PATH_PARAMETER_VIDEO, PATH_PARAMETER_VIDEO_FORCE_UPDATE, PATH_PARAMETER_VIDEO_LIST, PATH_PARAMETER_YOUTUBE_VIDEO



event = {}


# GET_VIDEO_LIST ... DynamoDBから動画情報リストを取得
# GET_CHANNEL_INFO


# event['queryStringParameters']['video_id'] = "L_oVYEVYnI8"


# event['exec_mode'] = 'UPDATE_VIDEO_ONE'
# event['exec_mode'] = 'UPDATE_VIDEO_LIST'
# event['exec_mode'] = 'UPDATE_CHANNEL_INFO'
# event['exec_mode'] = 'UPDATE_VIDEO_LIST_ALL'
# event['channel'] = 'nanase'
# event['force'] = False
# event['force'] = True
# event['body'] =  "{\n\"UserName\":\"distant_zz\",\n\"UserImageUrl\":\"https://pbs.twimg.com/profile_images/1641483674989498374/Km-j_3te_normal.jpg\",\n\"FirstLinkUrl\":\"https://twitter.com/distant_zz/status/1802719571507659164/photo/1\",\n\"LinkToTweet\":\"https://twitter.com/distant_zz/status/1802719571507659164\",\n\"CreatedAt\":\"June 18, 2024 at 12:06AM\",\"TweetEmbedCode\":\"%3Cblockquote+class%3D%22twitter-tweet%22%3E%0A++%3Cp+lang%3D%22ja%22+dir%3D%22ltr%22%3E%E3%83%86%E3%82%B9%E3%83%88%0A%0A%23%E3%82%86%E3%81%AB%E3%81%98%E3%82%85%EF%BD%9E%E3%82%8B+https%3A%2F%2Ft.co%2FwAq2coF6z2%3C%2Fp%3E%0A++%26mdash%3B+%E9%9B%B6%E8%B7%9D%E9%9B%A2%F0%9F%91%BE.%F0%9F%90%88%F0%9F%92%AE.%F0%9F%90%B2%F0%9F%92%9A.%F0%9F%8D%86+(%40distant_zz)%0A++%3Ca+href%3D%22https%3A%2F%2Ftwitter.com%2Fdistant_zz%2Fstatus%2F1802719571507659164%22%3EJun+17%2C+2024%3C%2Fa%3E%0A%3C%2Fblockquote%3E%0A%3Cscript+async+src%3D%22https%3A%2F%2Fplatform.twitter.com%2Fwidgets.js%22+charset%3D%22utf-8%22%3E%3C%2Fscript%3E%0A\"}\n"


# event['video_id'] = 'Jb2yfMZZAp4'
# lambda_function_webhook(event,None)


# UPDATE_VIDEO_LIST  ... 動画リストのDynamoDBを更新
# UPDATE_CHANNEL_INFO ...  チャンネル情報のDynamoDBを更新
# DELETE_VIDEO
# event['auth'] = {}
# event['queryStringParameters'] = {}
# event['path'] = PATH_PARAMETER_VIDEO_LIST
# event['path'] = PATH_PARAMETER_VIDEO
# event['path'] = PATH_PARAMETER_VIDEO_FORCE_UPDATE
# event['path'] = PATH_PARAMETER_SCHEDULE_TWEET

# event['queryStringParameters']['channel'] = 'nagisa'
# event['queryStringParameters']['id'] = 'uqVkIwgk0-4'
# event['httpMethod'] = 'GET'
# event['httpMethod'] = 'DELETE'
 
# event['path'] = PATH_PARAMETER_AUTH

event['httpMethod'] = 'POST'
event['path'] = PATH_PARAMETER_YOUTUBE_VIDEO
event['queryStringParameters'] = {}
event['queryStringParameters']['video_id'] = 'bZrV33y2kmQ'

lambda_handler_query_dynamo(event,None)

# # VideoID指定でInsert
# event['exec_mode'] = 'INSERT_VIDEO_ONE'
# event['queryStringParameters'] = {}
# event['queryStringParameters']['video_id'] = 'bZrV33y2kmQ'
# lambda_handler_update_dynamo(event,None)


