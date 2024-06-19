import os
import boto3
import json
import urllib.parse
import datetime
import math

dynamodb = boto3.resource('dynamodb')



def UpdateTweet(table, body):

    table = dynamodb.Table(table)

    item = {}
    item["dummy"] = 'dummy' # パーティションキーは使わない
    createdAt = body["CreatedAt"]

    # June 18, 2024 at 12:32AM
    # %B %d, %Y at %I:%M%p
    dt = datetime.datetime.strptime(createdAt, '%B %d, %Y at %I:%M%p')
    # item["createdAtTime"] = math.floor(float(dt.strftime('%Y%m%d%H%M%S')))
    item["createdAtTime"] = math.floor(dt.timestamp())

    item["UserName"] = body["UserName"]
    item["UserImageUrl"] = body["UserImageUrl"]
    item["FirstLinkUrl"] = body["FirstLinkUrl"]
    item["TweetEmbedCode"] = urllib.parse.unquote_plus(body["TweetEmbedCode"])
    item["LinkToTweet"] = body["LinkToTweet"]
    item["CreatedAt"] = dt.strftime('%Y年%m月%d日 %H時%M分')

    responce = table.put_item(
        Item = item
    )
    
    return responce

################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):
    print("Webhook request")
    print(json.dumps(event))

    body = event['body']
    responce = UpdateTweet(os.environ['DYNAMO_DB_TWITTER_TABLE'], json.loads(body))
    print(responce)

    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        'body': "OK"
    }


