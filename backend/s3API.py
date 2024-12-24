import json

# s3 = boto3.resource('s3')

BUCKET_NAME_INPUT = 'unidule-input'
BUCKET_NAME_RES = 'unidule-release'

####################################################
####################################################
def getVideoListFromS3(s3, doc_key):
    bucket = s3.Bucket(BUCKET_NAME_INPUT)
    obj = bucket.Object(doc_key)
    response = obj.get()    
    body = response['Body'].read()
    return json.loads(body.decode('utf-8'))

####################################################
# 
####################################################
def getRawVideoFile(s3, find_key):
    info = s3.list_objects(
            Bucket=BUCKET_NAME_RES,
            Prefix='raw/' + find_key)

    # あれば Contents のキーがある
    if 'Contents' not in info:
        return None

    # obj = bucket.Object(doc_key)
    item_key = info['Contents'][0]['Key']
    response = s3.get_object(Bucket=BUCKET_NAME_RES, Key=item_key)

    body = response['Body'].read()
    return body

####################################################
# s3を検索してフルパスを返す
####################################################
def getRawVideoFileKey(s3, find_key):
    info = s3.list_objects(
            Bucket=BUCKET_NAME_RES,
            Prefix='raw/' + find_key)

    # あれば Contents のキーがある
    if 'Contents' not in info:
        return None

    return info['Contents'][0]['Key']


####################################################
# s3を検索してフルパスを返す
####################################################
def finds3Key(s3, find_key):
    info = s3.list_objects(
            Bucket=BUCKET_NAME_RES,
            Prefix= find_key)

    # あれば Contents のキーがある
    if 'Contents' not in info:
        return None

    return info['Contents'][0]['Key']



####################################################
####################################################
def putFile(s3, bucket,key, body, minetype):
    bucket = s3.Bucket(bucket)
    
    bucket.put_object(
        Key = key,
        Body = body,
        ContentType=minetype
    )
    


####################################################
####################################################
def putObject(s3Client,bucket, key, body, minetype):
    
    s3Client.put_object(
        Key = key,
        Bucket = bucket,
        Body = body,
        ContentType=minetype
    )
    