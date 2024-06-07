/** @jsxImportSource @emotion/react */
import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import axios, { AxiosResponse } from "axios";
import dummyVideoList from "./_dummy/maru_v_list.json"; // ローカル用ダミーjson
import dummyChannelInfo from "./_dummy/maru_c_info.json"; // ローカル用ダミーjson
import { MediaCard } from "./MediaCard";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  addHours,
  compareAsc,
  compareDesc,
} from "date-fns";

const objectStyle = css({
  padding: "10px",
  overflow: "hidden",
});

const HeaderBox = styled(Box)({
  padding: 8,
  marginTop: 4,
  marginBottom: 4,
  width: "100%",
  color: "#FFFFFF",
  backgroundColor: "#1976d2",
  borderRadius: 2,
  fontSize: "0.875rem",
  fontWeight: "700",
  textAlign: "center",
});

function App() {
  // ローカルのダミーファイルを読む場合はtrue
  const isLocal = true;
  const { useState, useEffect } = React;

  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<any>();

  // const [videoList, setVideoList] = useState<any[]>([]);

  // 本日の配信予定 or 配信済み
  const [videoTodayList, setVideoTodayList] = useState<any[]>([]);
  // 未来の配信予定 or 公開予定
  const [videoFutureList, setVideoFutureList] = useState<any[]>([]);
  // 過去の配信 or 配信済み
  const [videoArchiveList, setVideoArchiveList] = useState<any[]>([]);

  const CHANNEL_MARU_URL = "http://127.0.0.1:5000/maru";

  useEffect(() => {
    const controller = new AbortController();
    const seasonsArchiveList: React.SetStateAction<any[]> = [];
    const seasonsFutureList: React.SetStateAction<any[]> = [];
    const seasonsTodayList: React.SetStateAction<any[]> = [];

    if (!isLocal) {
      axios.defaults.baseURL = "http://localhost:3000";
      axios.defaults.headers.post["Content-Type"] =
        "application/json;charset=utf-8";
      axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

      const axiosInstance = axios.create({
        withCredentials: false,
        headers: {
          "Content-Type": "application/json",
        },
      });

      axiosInstance
        .get(CHANNEL_MARU_URL, {
          signal: controller.signal,
        })
        .then((res: AxiosResponse<any[]>) => {
          const { data, status } = res;
          console.log(data);
          // 取得した動画一覧をリストに格納
          // data.forEach((obj, index) => {
          //   seasonsList.push(<li key={index}>{obj.title}</li>);
          // });
          // setVideoList(seasonsList);

          setLoaded(true);
          console.log("read ok");
        })
        .catch((error) => {
          console.log("失敗");
          console.log(error.status);
        });
    } else {
      // ローカルのファイルを読む場合
      const ci = dummyChannelInfo[0];

      // チャンネル情報
      setChannelInfo(dummyChannelInfo[0]);

      dummyVideoList.forEach((obj, index) => {
        // 本日は04:00まで
        let isToday = false;
        let isFuture = false;
        let isArchive = false;

        const scheduledStartTime = obj.liveStreamingDetails?.scheduledStartTime;
        const startDateTime = obj.liveStreamingDetails?.actualStartTime;
        const endDateTime = obj.liveStreamingDetails?.actualEndTime;
        const publishedAt = obj.snippet.publishedAt;

        // 判定の日付を統一する
        let dtStr: string;
        // 配信中または配信予定
        if (obj.snippet.liveBroadcastContent != "none") {
          // 配信開始予定の日時を採用
          // 配信の枠はあるが、予定が立っていない場合は表示しない
          dtStr = scheduledStartTime ?? "";
        } else {
          // アーカイブ or 動画
          // 配信開始予定があるなら、配信開始予定、なければ公開日
          dtStr = scheduledStartTime ? scheduledStartTime : publishedAt;
        }

        console.log(dtStr);
        // 開始時刻が有効な場合
        if (dtStr) {
          // 本日の配信か、もっと未来の配信予定か、アーカイブor動画か
          const now = new Date();
          // 日付変更を跨いでいた場合は昨日からカウント
          const ofsDay = now.getHours() <= 4 ? -1 : 0;

          const startDt = addHours(startOfDay(addDays(now, ofsDay)), 4); // 本日の午前4時を取得
          const endDt = addDays(startDt, 1); // 本日の午前4時に1日を加算して本日の終わりを取得

          const dt = new Date(dtStr);

          if (startDt.getTime() > dt.getTime()) {
            // 過去
            isArchive = true;
          } else if (endDt.getTime() < dt.getTime()) {
            // 未来
            isFuture = true;
          } else {
            // 本日
            isToday = true;
          }
          const card = (
            <Grid item sm={4} md={3} lg={2} key={index}>
              <MediaCard
                imgUrl={obj.snippet.thumbnails.medium.url}
                videoId={obj.id}
                title={obj.snippet.title}
                channelTitle={ci.snippet.title}
                startDateTime={format(new Date(dt), "yyyy/MM/dd HH:mm")}
                status="none"
                key={index}
              ></MediaCard>
            </Grid>
          );

          if (isArchive) {
            seasonsArchiveList.push(card);
          } else if (isFuture) {
            seasonsFutureList.push(card);
          } else if (isToday) {
            seasonsTodayList.push(card);
          }
        }

        // seasonsList.push();
      });

      setVideoArchiveList(seasonsArchiveList);
      setVideoFutureList(seasonsFutureList);
      setVideoTodayList(seasonsTodayList);

      // 配信/動画リスト
      // setVideoList(seasonsList);
      setLoaded(true);
      console.log("read local ok");
    }

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <div css={objectStyle}>
        <Typography variant="h1" component="h2" mt={2}>
          ゆにじゅ～る(仮設)
        </Typography>

        {isLoaded && (
          <>
            {/* チャンネル情報 */}
            <Stack direction="row">
              <Box>
                <Link
                  target="_blank"
                  href={
                    "https://www.youtube.com/" + channelInfo.snippet.customUrl
                  }
                >
                  <Avatar
                    alt={channelInfo.snippet.title}
                    src={channelInfo.snippet.thumbnails.default.url}
                    sx={{
                      width: channelInfo.snippet.thumbnails.default.width,
                      height: channelInfo.snippet.thumbnails.default.height,
                    }}
                  />
                </Link>
              </Box>
              <Box py={1}>
                <Typography my={0}>{channelInfo.snippet.title}</Typography>
                <Typography my={0}>{channelInfo.snippet.customUrl}</Typography>
              </Box>{" "}
            </Stack>

            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#00C070 !important" }}>
              本日の配信
            </HeaderBox>
            {/* 本日の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoTodayList}
              </Grid>
            </Box>

            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox>明日以降の配信 / プレミア公開</HeaderBox>
            {/* 本日以降の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoFutureList}
              </Grid>
            </Box>
            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#F28020 !important" }}>
              アーカイブ / 動画
            </HeaderBox>
            {/* 過去のの配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoArchiveList}
              </Grid>
            </Box>
          </>
        )}
      </div>
    </>
  );
}

export default App;
