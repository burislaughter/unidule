import datetime
from googleapiclient.discovery import build


####################################################################
# チャンクに分割する
def chunks(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


####################################################################
# ID一覧から動画の詳細を取得
def get_video_items(video_id_list, youtube):
    video_items = []

    chunk_list = list(chunks(video_id_list, 50)) # 50個のIDに分割してリクエスト
    for chunk in chunk_list:
        video_ids = ",".join(chunk)
        request = youtube.videos().list(
            part="snippet,statistics,liveStreamingDetails",
            id=video_ids,
            fields="items(id,snippet(title,channelId,description,liveBroadcastContent,publishedAt,thumbnails),statistics(viewCount,likeCount),liveStreamingDetails(scheduledStartTime,scheduledEndTime,scheduledEndTime,actualStartTime,actualEndTime))"
        )
        response = request.execute()
        video_items.extend(response["items"])

    return video_items




# 再生リストからID一覧を取得
# コスト1
def get_video_id_in_playlist(playlistId, youtube):
    video_id_list = []

    request = youtube.playlistItems().list(
        part="snippet",
        maxResults=50,
        playlistId=playlistId,
        fields="nextPageToken,items/snippet/resourceId/videoId"
    )

    while request:
        response = request.execute()
        video_id_list.extend(list(map(lambda item: item["snippet"]["resourceId"]["videoId"], response["items"])))
        request = youtube.playlistItems().list_next(request, response)

    return video_id_list



# search.list から検索
# コスト100 
def get_new_youtube_video_list(channel_id, youtube):
    # 1週間前から取得
    time_threshold = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
    time_threshold = time_threshold.isoformat()
    
    video_id_list = []

    response = youtube.search().list(
        part = "snippet",
        channelId = channel_id,
        maxResults = 10, 
        order = "date", 
        publishedAfter=time_threshold,
        type="video"
    ).execute()

    for item in response["items"]:
        video_id_list.append({
            'id':item['id']['videoId'],
            'title':item['snippet']['title'],
        })
    return video_id_list




####################################################################
# チャンネル自体の情報を取得
####################################################################
def get_channel_info(youtube, channel_id):
    request = youtube.channels().list(
        part="snippet",
        maxResults=50,
        id=channel_id
    )
    response = request.execute()
    return response["items"]

