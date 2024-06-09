from decimal import Decimal

PATH_PARAMETER_CHANNEL_INFO = '/channel_info'
PATH_PARAMETER_VIDEO_LIST = '/video_list'
PATH_PARAMETER_VIDEO = '/video'


# チャンネル情報の定数
# チャンネルオーナー、チャンネルID、新着動画プレイリストID
channelParams = [
    ('maru','UCmB1E78Kdgd9z6hN3ONRKow','UUmB1E78Kdgd9z6hN3ONRKow'),
    ('nagisa','UCe5mbpYA9Yym4lZTdj06G6Q','UUe5mbpYA9Yym4lZTdj06G6Q'),
    ('nanase','UCFfKS52xZaus6HunxP3Owsw','UUFfKS52xZaus6HunxP3Owsw'),

    ('ida','UC7Ft50QAmUGWE6-ZfrHOG5Q','UU7Ft50QAmUGWE6-ZfrHOG5Q'),
    ('ran','UCVuVw2WDKIYCj9HABYVuREg','UUVuVw2WDKIYCj9HABYVuREg'),
    ('roman','UCbdOhaCW0Ti1qVCb9PKvmxg','UUbdOhaCW0Ti1qVCb9PKvmxg'),

    ('uniraid','UCKofJjNEmQ3LwERp3pRVxtw','UUKofJjNEmQ3LwERp3pRVxtw'),
    ('uniraid_cut','UCohnUVLcGInaC0l-2A95I5A','UUohnUVLcGInaC0l-2A95I5A')

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
    for (own , c_id, p_id ) in channelParams:
        if own == channel_owner:
            return c_id

#################################################
# チャンネルオーナー名から新着プレイリストIDを引く
#################################################
def owner_to_pid(channel_owner):
    for (own , c_id, p_id ) in channelParams:
        if own == channel_owner:
            return p_id