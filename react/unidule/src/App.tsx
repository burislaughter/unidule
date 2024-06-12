/** @jsxImportSource @emotion/react */
import * as React from "react";
import { Avatar, Box, Button, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { ThemeProvider, css } from "@emotion/react";
import axios from "axios";
import { MediaCard } from "./MediaCard";
import { format, parse, addDays, subDays, startOfDay, addHours, subHours, compareAsc, compareDesc } from "date-fns";
import { channelParams } from "./const";
import { ChannelIconComp } from "./ChannelIconComp";
import { ResetIconComp } from "./ResetIconComp";
import theme from "./theme";

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

  const VIDEO_LIST_URL = "https://api.unidule.jp/prd/video_list?channel=all";
  const CHANNEL_INFO_URL = "https://api.unidule.jp/prd/channel_info";

  const [sortSelect, setSortSelect] = useState<Set<string>>(new Set([]));

  const createSukedule = (ci_list: any, v_lost: any[]) => {
    const archiveListMaster: React.SetStateAction<any[]> = [];
    const futureListMaster: React.SetStateAction<any[]> = [];
    const seasonsTodayList: React.SetStateAction<any[]> = [];
    const seasonsTodayFinishList: React.SetStateAction<any[]> = [];

    console.log(sortSelect);

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
              isToday={isToday}
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

  // フィルター系ボタンが押された時のコールバック
  const fillterBtnClickCB = React.useCallback(
    (channel: string) => {
      if (sortSelect.has(channel)) {
        sortSelect?.delete(channel);
      } else {
        sortSelect?.add(channel);
      }
      setSortSelect(sortSelect);

      if (sortSelect.size == 0) {
        resetBtnClickCB();
      } else {
        // フィルタイング結果を反映
        const vl = videoTodayListRef!.current!;
        setVideoTodayList(vl.filter((x) => sortSelect.has(x.key.split("-")[1])));
        const fl = videoFutureLListRef!.current!;
        setVideoFutureList(fl.filter((x) => sortSelect.has(x.key.split("-")[1])));
        const al = videoArchiveListRef!.current!;
        setVideoArchiveList(al.filter((x) => sortSelect.has(x.key.split("-")[1])));
      }

      console.log("sortBtnClickCB:" + channel);
    },
    [videoTodayListMaster, videoFutureListMaster, videoArchiveListMaster]
  );

  // フィルターリセット
  const resetBtnClickCB = React.useCallback(() => {
    setVideoTodayList((vl) => videoTodayListRef!.current!);
    setVideoFutureList((fl) => videoFutureLListRef!.current!);
    setVideoArchiveList((vl) => videoArchiveListRef!.current!);

    setSortSelect((_s) => {
      _s.clear();
      return _s;
    });
  }, []);

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
        <Typography align="center" fontFamily="'RocknRoll One'" mx={1} sx={{ fontSize: "14vw" }}>
          ゆにじゅ～る
        </Typography>
        <Typography sx={{ textAlign: "right" }}>[非公式]ファンメイドスケジューラー</Typography>
        <Typography sx={{ textAlign: "right", fontSize: "0.75rem" }}>build 2024.06.12</Typography>
        <Typography sx={{ textAlign: "right", fontSize: "0.75rem", marginBottom: "4px" }}>
          お問い合わせ <Link href="https://x.com/distant_zz">@distant_zz</Link>
        </Typography>

        {isLoaded && (
          <>
            {/* チャンネル情報 */}
            {(function () {
              const channelIconsList: any[] = [0, 0, 0, 0, 0, 0, 0, 0];
              for (let item of channelInfo) {
                const idx = getOrder(item.channel);
                const isSelected = sortSelect.size == 0 ? true : sortSelect.has(item.channel);

                channelIconsList[idx] = (
                  <ChannelIconComp
                    key={idx + "-" + item.channel}
                    channel={item.channel}
                    cb={fillterBtnClickCB}
                    imgUrl={item.snippet.thumbnails.default.url}
                    fullName={getFullName(item.channel)}
                    isSelected={isSelected}
                  ></ChannelIconComp>
                );
              }

              channelIconsList.push(<ResetIconComp key={0 + "-" + '"reset"'} channel={"reset"} cb={resetBtnClickCB}></ResetIconComp>);
              return (
                <Stack direction="row" sx={{ alignItems: "flex-start", marginTop: "6px", flexWrap: "wrap" }}>
                  {channelIconsList}
                </Stack>
              );
            })()}

            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#00C070 !important" }}>本日の配信</HeaderBox>
            {/* 本日の配信、動画リスト */}
            {videoTodayList.length != 0 && (
              <Box sx={{ flexGrow: 1, width: "100%", margin: "0px auto", minHeight: "40px" }}>
                <Grid container spacing={4}>
                  {videoTodayList}
                </Grid>
              </Box>
            )}
            {videoTodayList.length == 0 && (
              <Box sx={{ minHeight: "140px" }}>
                <Typography sx={{ fontSize: "0.75rem" }}>そこ(Youtube)に無ければ(ゆにじゅ～るには)無いですね</Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>神白ななせさんの朝活を見たら、誰かの予定がわかるかも？</Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>もしくは各自のX(旧Twitter)にはあるかもしれません</Typography>
              </Box>
            )}

            <HeaderBox>明日以降の配信 / プレミア公開</HeaderBox>
            {/* 本日以降の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoFutureList}
              </Grid>
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
