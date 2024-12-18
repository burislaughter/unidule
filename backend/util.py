from decimal import Decimal

PATH_PARAMETER_CHANNEL_INFO = '/channel_info'
PATH_PARAMETER_VIDEO_LIST = '/video_list'
PATH_PARAMETER_VIDEO = '/video'
PATH_PARAMETER_VIDEO_FORCE_UPDATE = '/video_force_update'
PATH_PARAMETER_AUTH = '/auth'
PATH_PARAMETER_SCHEDULE_TWEET = '/schedule_tweet'
PATH_PARAMETER_YOUTUBE_VIDEO = '/youtube_video'
PATH_PARAMETER_SYSTEM = '/system'
PATH_PARAMETER_INFORMATION = '/information'
PATH_PARAMETER_VOICE = '/voice'
PATH_PARAMETER_RAW_VOICE = '/raw_voice'
PATH_PARAMETER_RAW_VOICE_POOL = '/raw_voice_pool'

# チャンネル情報の定数
# チャンネルオーナー、チャンネルID、新着動画プレイリストID
channelParams = [
    ('maru','UCmB1E78Kdgd9z6hN3ONRKow','UUmB1E78Kdgd9z6hN3ONRKow','UUMOmB1E78Kdgd9z6hN3ONRKow'),
    ('nagisa','UCe5mbpYA9Yym4lZTdj06G6Q','UUe5mbpYA9Yym4lZTdj06G6Q','UUMOe5mbpYA9Yym4lZTdj06G6Q'),
    ('nanase','UCFfKS52xZaus6HunxP3Owsw','UUFfKS52xZaus6HunxP3Owsw','UUMOFfKS52xZaus6HunxP3Owsw'),

    ('ida','UC7Ft50QAmUGWE6-ZfrHOG5Q','UU7Ft50QAmUGWE6-ZfrHOG5Q','UUMO7Ft50QAmUGWE6-ZfrHOG5Q'),
    ('ran','UCVuVw2WDKIYCj9HABYVuREg','UUVuVw2WDKIYCj9HABYVuREg','UUMOVuVw2WDKIYCj9HABYVuREg'),
    ('roman','UCbdOhaCW0Ti1qVCb9PKvmxg','UUbdOhaCW0Ti1qVCb9PKvmxg','UUMObdOhaCW0Ti1qVCb9PKvmxg'),

    ('uniraid','UCKofJjNEmQ3LwERp3pRVxtw','UUKofJjNEmQ3LwERp3pRVxtw','UUMOKofJjNEmQ3LwERp3pRVxtw'),
    ('uniraid_cut','UCohnUVLcGInaC0l-2A95I5A','UUohnUVLcGInaC0l-2A95I5A','UUMOohnUVLcGInaC0l-2A95I5A'),

    ('other','','','')  # その他の他枠の動画情報のみを持つ物

]

# Json dumps時にDecimalを変換するときのモジュール
def decimal_default_proc(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


#################################################
# チャンネルオーナー名からチャンネルIDを引く
#################################################
def owner_to_cid(channel_owner):
    for (own , c_id, p_id, mem ) in channelParams:
        if own == channel_owner:
            return c_id

#################################################
# チャンネルオーナー名から新着プレイリストIDを引く
#################################################
def owner_to_pid(channel_owner):
    for (own , c_id, p_id, mem ) in channelParams:
        if own == channel_owner:
            return p_id
        
#################################################
# チャンネルオーナー名から新着プレイリストIDを引く
#################################################
def owner_to_member_only(channel_owner):
    for (own , c_id, p_idm, mem ) in channelParams:
        if own == channel_owner:
            return mem


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