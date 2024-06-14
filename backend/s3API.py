import json

# s3 = boto3.resource('s3')

BUCKET_NAME = 'unidule-input'
####################################################
# スケジュールの開始日時の取得
# item ... 


def getVideoListFromS3(s3, doc_key):
    bucket = s3.Bucket(BUCKET_NAME)
    obj = bucket.Object(doc_key)
    response = obj.get()    
    body = response['Body'].read()
    return json.loads(body.decode('utf-8'))