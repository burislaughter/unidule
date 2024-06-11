/** @jsxImportSource @emotion/react */
import * as React from "react";
import { Avatar, Box, Button, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import axios, { AxiosResponse } from "axios";
import { MediaCard } from "./MediaCard";
import { format, parse, addDays, subDays, startOfDay, addHours, subHours, compareAsc, compareDesc } from "date-fns";
import { channelParams } from "./const";
import ChannelIconObj from "./ChannelIconObj";

const objectStyle = css({
  padding: "10px",
  overflow: "hidden",
});

const HeaderBox = styled(Box)({
  padding: 8,
  marginTop: 4,
  marginBottom: 4,
  width: "99%",
  color: "#FFFFFF",
  backgroundColor: "#1976d2",
  borderRadius: 2,
  fontSize: "0.875rem",
  fontWeight: "700",
  textAlign: "center",
});

export const getChannelInfo = (cis: any[], channel: string): any => {
  const cid = channelParams[channel];
  return cis.find((x) => x.id == cid.uid);
};

export const getFullName = (channel: string): string => {
  const cid = channelParams[channel];
  return cid.name;
};
export const getOrder = (channel: string): number => {
  const cid = channelParams[channel];
  return cid.order;
};

function App() {
  const { useState, useEffect } = React;

  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<any>();

  // const [videoList, setVideoList] = useState<any[]>([]);

  // 本日の配信予定 or 配信済み
  const [videoTodayList, setVideoTodayList] = useState<any[]>([]);
  // 明日以降
  const [videoFutureList, setVideoFutureList] = useState<any[]>([]);
  // 過去の配信 or 配信済み
  const [videoArchiveList, setVideoArchiveList] = useState<any[]>([]);

  // フィルタリング時のマスター
  const [videoTodayListMaster, setVideoTodayListMaster] = useState<any[]>([]);
  const [videoFutureListMaster, setVideoFutureListMaster] = useState<any[]>([]);
  const [videoArchiveListMaster, setVideoArchiveListMaster] = useState<any[]>([]);

  // コールバック中に参照したいのでrefオブジェクトを作成
  const videoTodayListRef = React.useRef<any[]>();
  const videoFutureLListRef = React.useRef<any[]>();
  const videoArchiveListRef = React.useRef<any[]>();
  videoTodayListRef.current = videoTodayListMaster;
  videoFutureLListRef.current = videoFutureListMaster;
  videoArchiveListRef.current = videoArchiveListMaster;

  const [channelIconObjs, setChannelIconObjs] = useState<any[]>();

  const VIDEO_LIST_URL = "https://api.unidule.jp/prd/video_list?channel=all";
  const CHANNEL_INFO_URL = "https://api.unidule.jp/prd/channel_info";

  const [sortSelect, setSortSelect] = useState<Set<string>>(new Set([]));

  const createSukedule = (ci_list: any, v_lost: any[]) => {
    const archiveListMaster: React.SetStateAction<any[]> = [];
    const futureListMaster: React.SetStateAction<any[]> = [];
    const seasonsTodayList: React.SetStateAction<any[]> = [];
    const seasonsTodayFinishList: React.SetStateAction<any[]> = [];

    v_lost.forEach((obj: any, index: number) => {
      // 本日は04:00まで
      let isToday = false;
      let isTodayFinished = false;
      let isFuture = false;
      let isArchive = false;
      let isTodayUpload = false;

      // 開始時刻が有効な場合
      if (obj.startAt) {
        // 本日の配信か、もっと未来の配信予定か、アーカイブor動画か
        const now = new Date();
        // 日付変更を跨いでいた場合は昨日からカウント
        // 3:59 まで
        const ofsDay = now.getHours() < 4 ? -1 : 0;

        const startDt = addHours(startOfDay(addDays(now, ofsDay)), 4); // 本日の午前4時を取得
        const endDt = addDays(startDt, 1); // 本日の午前4時に1日を加算して本日の終わりを取得

        let dt = new Date(obj.startAt);

        if (startDt.getTime() > dt.getTime()) {
          // 過去
          isArchive = true;
        } else if (endDt.getTime() < dt.getTime()) {
          // 未来
          isFuture = true;
        } else if (obj.liveBroadcastContent == "none" && obj.liveStreamingDetails != undefined) {
          // 本日の終了分
          dt = new Date(obj.liveStreamingDetails.actualEndTime);
          isTodayFinished = true;
        } else if (obj.liveStreamingDetails == undefined) {
          // 本日アップロードされた動画
          isTodayUpload = true;
        } else {
          // 本日
          isToday = true;
        }

        // 動画とチャンネル情報の照合
        const ci = getChannelInfo(ci_list, obj.channel);

        const card = (
          <Grid item sm={4} md={3} lg={2} key={index + "-" + obj.channel}>
            <MediaCard
              key={index}
              imgUrl={obj.snippet.thumbnails.maxres?.url ? obj.snippet.thumbnails.maxres?.url : obj.snippet.thumbnails.medium?.url}
              videoId={obj.id}
              title={obj.snippet?.title}
              description={obj.snippet?.description}
              channelTitle={ci.snippet?.title}
              startDateTime={format(new Date(dt), "yyyy/MM/dd HH:mm")}
              status={obj.liveBroadcastContent}
              isTodayFinished={isTodayFinished}
              isTodayUpload={isTodayUpload}
            ></MediaCard>
          </Grid>
        );

        if (isArchive) {
          archiveListMaster.push(card);
        } else if (isFuture) {
          futureListMaster.unshift(card);
        } else if (isTodayFinished) {
          seasonsTodayFinishList.unshift(card);
        } else if (isTodayUpload) {
          seasonsTodayFinishList.push(card);
        } else {
          seasonsTodayList.unshift(card);
        }
      }
    });

    const todayListMaster = seasonsTodayList.concat(seasonsTodayFinishList);
    return { archiveListMaster, futureListMaster, todayListMaster };
  };
  useEffect(() => {}, [sortSelect.size]);

  // ソートボタンが押された時のコールバック
  const sortBtnClickCB = React.useCallback(
    (channel: string) => {
      sortSelect?.add(channel);
      setSortSelect(sortSelect);

      // フィルタイング結果を反映

      const vl = videoTodayListRef!.current!;
      setVideoTodayList(vl.filter((x) => sortSelect.has(x.key.split("-")[1])));

      const fl = videoFutureLListRef!.current!;
      setVideoFutureList(fl.filter((x) => sortSelect.has(x.key.split("-")[1])));

      const al = videoArchiveListRef!.current!;
      setVideoArchiveList(al.filter((x) => sortSelect.has(x.key.split("-")[1])));

      console.log("sortBtnClickCB:" + channel);
    },
    [videoTodayListMaster, videoFutureListMaster, videoArchiveListMaster]
  );

  useEffect(() => {
    const controller = new AbortController();

    axios.defaults.baseURL = "https://api.unidule.jp/";
    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const promise1 = axiosInstance.get(CHANNEL_INFO_URL, {
      signal: controller.signal,
    });
    const promise2 = axiosInstance.get(VIDEO_LIST_URL, {
      signal: controller.signal,
    });

    Promise.all([promise1, promise2]).then(function (values) {
      const { data: ci_data, status: ci_status } = values[0];
      // チャンネル情報
      setChannelInfo(ci_data);

      // 初めに固定長で確保
      const channelIconsList: any[] = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let item of ci_data) {
        const idx = getOrder(item.channel);
        channelIconsList[idx] = ChannelIconObj(item, idx, sortBtnClickCB);
      }
      setChannelIconObjs(channelIconsList);

      const { data: v_data, status: v_status } = values[1];

      const tmp_v_date = v_data.filter((item: any) => {
        const t1 = new Date(item.startAt);
        const t2 = subDays(new Date(), 7);
        return t1 > t2;
      });

      // 取得した動画一覧をリストに格納
      const { archiveListMaster, futureListMaster, todayListMaster } = createSukedule(ci_data, tmp_v_date);

      // 件数を減らす
      // 直近一週間分
      const c = todayListMaster.concat();
      setVideoTodayListMaster(todayListMaster.concat());
      setVideoFutureListMaster(futureListMaster.concat());
      setVideoArchiveListMaster(archiveListMaster.concat());
      // 本日の配信は先行でこの時点で入れる
      setVideoTodayList(todayListMaster);
      setVideoFutureList(futureListMaster);
      setVideoArchiveList(archiveListMaster);

      setLoaded(true);
      console.log("read ok");
    });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <div css={objectStyle}>
        <Typography variant="h1" component="h2" mt={2} sx={{ fontSize: "10vw" }}>
          ゆにじゅ～る(仮設)
        </Typography>
        <Typography sx={{ textAlign: "right" }}>[非公式]ファンメイドスケジューラー</Typography>
        <Typography sx={{ textAlign: "right", fontSize: "0.75rem" }}>
          お問い合わせ <Link href="https://x.com/distant_zz">@distant_zz</Link>
        </Typography>

        {isLoaded && (
          <>
            {/* チャンネル情報 */}
            <Stack direction="row" sx={{ alignItems: "flex-start", marginTop: "6px" }}>
              {" "}
              {channelIconObjs!.slice(0, 6)}
            </Stack>
            <Stack direction="row">{channelIconObjs!.slice(6, 8)}</Stack>

            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#00C070 !important" }}>本日の配信</HeaderBox>
            {/* 本日の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "0px auto" }}>
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

            <HeaderBox sx={{ backgroundColor: "#F28020 !important" }}>過去7日分のアーカイブ / 動画</HeaderBox>
            {/* 過去の配信、動画リスト */}
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
