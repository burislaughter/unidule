import os

import yt_dlp
import shutil
from yt_dlp.utils import download_range_func
from urllib.parse import urlparse
from urllib.parse import parse_qsl
import tempfile

print('Loading function')
# dynamodb = boto3.resource('dynamodb')



################################################################################################
# Lambdaヘッダー
#################################################################################################
def lambda_handler(event, context):

    url =  "https://www.youtube.com/watch?v=pFa-jpqGlxo"
    start = 927
    end = start + 6

    o = parse_qsl(urlparse(url).query)
    video_id = o[0][1]
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
                    'preferredcodec': 'mp3',
            }],
            'postprocessor_args': [
                '-ar', '44100',
                '-ac', '2',
                '-ab', '256k',
                '-acodec', 'libmp3lame',
                '-f', 'mp3', #for other platforms which uses .m4a
            ],
            'prefer_ffmpeg': True
        }

        # /opt/bin/ffmpeg
        with yt_dlp.YoutubeDL(option) as ydl:
            ydl.download([url])


        # shutil.copy2( f_path + ".mp3", '/home/masanori.nakajima/') # 引数はコピー元、コピー先の順
        print( f_path + ".mp3" )


    return (f_path + ".mp3").encode()


