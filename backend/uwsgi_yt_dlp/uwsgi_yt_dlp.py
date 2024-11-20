from datetime import time
import datetime
import os
import shutil
import boto3
import yt_dlp

from yt_dlp.utils import download_range_func
from urllib.parse import urlparse
from urllib.parse import parse_qsl
import tempfile
from dateutil import parser

# dynamodb = boto3.resource('dynamodb')

# tmp_save_dir = '/home/masanori.nakajima/'
tmp_save_dir = ''

class TimeSpliteException(Exception):
    pass

def splite_time(time_str):
    time_split = time_str.split(':')
    hour = 0
    minute = 0
    second = 0

    try:
        if(len(time_split) == 3) :
            hour, minute, second = map(int, time_split)
        elif(len(time_split) == 2) :
            minute, second = map(int, time_split)
        elif(len(time_split) == 1) :
            # 秒だけ指定
            second = int(time_split[0])
        else:
            raise TimeSpliteException('開始時間の設定に問題があります 31:52 や 4:01:32 のような書き方でお願いします')
    except Exception as e:
        print(e)
        raise TimeSpliteException('開始時間の設定に問題があります 31:52 や 4:01:32 のような書き方でお願いします')
    
    return hour, minute, second


def getParamForKey(params,key):
    for item in params:
         if item[0] == key:
              return item[1]
    return None

def application(env, start_response):
    print('exec application')
    # print(env)

    s3Access = env['AWS_S3_ACCESS']
    s3Secret = env['AWS_S3_SECRET']
    if s3Access == None or s3Secret == None:
        start_response('500 Internal Server Error', [('Content-Type','text/html')])
        return [b'500 Internal Server Error']

    param = parse_qsl(env['QUERY_STRING'])
    video_id = getParamForKey(param, 'video_id')  # video_id
    start_time_str = getParamForKey(param, 'start')  # start
    end_time_str = getParamForKey(param, 'end')  # end
    channel = getParamForKey(param, 'channel')  # channel
    uid = getParamForKey(param, 'uid')  # uid
    
    try:
        hour, minute, second = splite_time(start_time_str)
    except Exception as e:
        print(e.message)
    
        start_response('400 Bad Request', [('Content-Type','text/html')])
        return [e.message]
    start = int(datetime.timedelta(hours=hour, minutes=minute, seconds=second).total_seconds())
    
    # endの解析に失敗したらstart+10秒
    try:
        hour, minute, second = splite_time(end_time_str)
        end = int(datetime.timedelta(hours=hour, minutes=minute, seconds=second).total_seconds())
    except Exception as e:
        print(e)
        end = start + 10

    # 1分以上はNG
    if end - start > 60:
        start_response('400 Bad Request', [('Content-Type','text/html')])
        return ["Time length is too long"]



    url =  "https://www.youtube.com/watch?v=" + video_id


    # o = parse_qsl(urlparse(url).query)
    # video_id = o[0][1]
    output_name = video_id + '-' + str(start) + '-' + str(end)

    # 一時ディレクトリを作って、使い終わったら破棄する
    with tempfile.TemporaryDirectory() as tmpdir:

        f_path = os.path.join(tmpdir, output_name)
        print(tmpdir)
        print(f_path)

        option = {
            "download_ranges": download_range_func(None, [(start, end)]),
            'force_keyframes_at_cuts': True, # for yt links
            'outtmpl': f_path + '.%(ext)s',
            'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'wav',
            }],
            'postprocessor_args': [
                '-ar', '44100',
                '-ac', '2'
            ],
            'prefer_ffmpeg': True
        }

        # /opt/bin/ffmpeg
        with yt_dlp.YoutubeDL(option) as ydl:
            ydl.download([url])

        full_name = f_path + ".wav"

        # デバッグ: Homeディレクトリにコピー
        if tmp_save_dir != '':
            shutil.copy2( full_name, tmp_save_dir ) # 引数はコピー元、コピー先の順

        print( full_name )

        # s3にアップロード ##############################################################
        s3 = boto3.resource('s3', aws_access_key_id=s3Access, aws_secret_access_key=s3Secret, region_name='ap-northeast-1')
        bucket = 'unidule-release'
        path = 'raw/' + channel + '/' + uid + '_' + output_name + ".wav"
        bucket = s3.Bucket(bucket)

        with open(full_name,'rb') as f:
            data = f.read()
            bucket.put_object(Key=path, Body = data)



    start_response('200 OK', [('Content-Type','text/html')])
    return [path.encode()]


