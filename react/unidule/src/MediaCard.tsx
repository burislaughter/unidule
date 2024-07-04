import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Avatar, Box, Link } from "@mui/material";
import styled from "@emotion/styled";
import { format } from "date-fns";
import "./MediaCard.css";

type Props = {
  imgUrl: string;
  videoId: string;
  title: string;
  description: string;

  startDateTime: string; // 実際の開始時間
  status: string; // ステータス  live （ライブ配信中）       upcoming　（ライブ配信予約）    none　（ライブ配信終了） published　（動画公開）       premier プレミア
  isTodayFinished: boolean; // 本日の終了した配信
  isTodayUpload: boolean; // 本日アップロードされた動画
  isToday: boolean; // 本日のもの
  channelInfo: any;
};

const CardContentEx = styled(CardContent)`
  padding: 4px;
  word-break: break-all;
  &:last-child {
    padding: 0;
  }
`;

export const MediaCard = ({
  imgUrl,
  videoId,
  title,
  description,

  startDateTime,
  status,
  isTodayFinished,
  isTodayUpload,
  isToday,
  channelInfo,
}: Props) => {
  let startDateStr = "";
  let startTimeStr = "";
  let startDateTimeStateStr = "";

  if (startDateTime.indexOf("未定") == 0) {
    startDateStr = "未定";
  } else {
    startDateStr = format(new Date(startDateTime), "yyyy/MM/dd");
    startTimeStr = format(new Date(startDateTime), "HH:mm");

    if (status == "upcoming") {
      // 配信予定
      startDateTimeStateStr = " に配信予定";
    } else if (status == "live") {
      // 配信中
      startDateTimeStateStr = " から配信中";
    } else if (isTodayFinished) {
      startDateTimeStateStr = " に配信終了";
    } else if (isTodayUpload) {
      startDateTimeStateStr = " に公開";
    } else if (status == "none") {
      startDateTimeStateStr = " に配信";
    } else {
      startDateTimeStateStr = " に公開";
    }

    if (isToday || isTodayUpload) {
      startDateStr = format(new Date(startDateTime), "M月dd日");
    }
  }

  // ショート動画かどうか
  const youtubeUrl = "https://www.youtube.com/";
  const linkBaseUrl = title.indexOf("#shorts") == -1 ? youtubeUrl + "watch?v=" : youtubeUrl + "shorts/";

  // 配信時間の表示スタイル
  const timeStyle =
    status == "live" || status == "upcoming"
      ? {
          fontSize: "1rem",
          color: "#000",
          fontWeight: 700,
        }
      : {
          fontSize: "1rem",
        };

  return (
    <Box sx={{ position: "relative" }}>
      <Card className={(status == "live" ? "Now-border" : "") + (isTodayFinished ? " Now-border finished" : "") + (status == "upcoming" && isToday ? " Now-border upcoming" : "") + " Card-parent"}>
        <Link target="_brank" href={linkBaseUrl + videoId}>
          <CardMedia image={imgUrl} component="img" loading="lazy" />
        </Link>
        <CardContentEx>
          <Typography variant="body2" gutterBottom component="div" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {channelInfo?.snippet?.title}
          </Typography>

          {startDateStr && ( // 配信済または動画
            <Typography variant="body2" color="text.secondary">
              <Typography component="span" sx={{ marginRight: "2px", fontSize: "0.875rem" }}>
                {startDateStr}
              </Typography>
              <Typography component="span" sx={timeStyle}>
                {startTimeStr}
              </Typography>
              {startDateTimeStateStr}
            </Typography>
          )}
          {status == "live" && <Typography className="Now-icon">LIVE!</Typography>}

          {isTodayFinished && <Typography className="Now-icon finished">FINISHED</Typography>}

          {isTodayUpload && <Typography className="Now-icon upload">Release</Typography>}
        </CardContentEx>

        <Box sx={{ paddingBottom: 1 }}>
          <Typography className="description-area">{description}</Typography>
        </Box>
      </Card>

      <Box sx={{ justifyContent: " space-evenly", display: "flex", marginRight: "3px", position: "absolute", top: "-12px", right: "-18px" }}>
        <Link target="_brank" href={youtubeUrl + "channel/" + channelInfo?.id}>
          <Avatar
            src={channelInfo?.snippet?.thumbnails?.default?.url}
            sx={{
              width: 44,
              height: 44,
              boxShadow: 3,
            }}
          />
        </Link>
      </Box>
    </Box>
  );
};
