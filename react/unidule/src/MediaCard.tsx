import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link } from "@mui/material";
import styled from "@emotion/styled";
import { format } from "date-fns";

type Props = {
  imgUrl: string;
  videoId: string;
  title: string;
  channelTitle: string;

  startDateTime: string; // 実際の開始時間
  status: string; // ステータス  live （ライブ配信中）       upcoming　（ライブ配信予約）    none　（ライブ配信終了） published　（動画公開）       premier プレミア
};

const CardContentEx = styled(CardContent)`
  &:last-child {
    padding: 0;
  }
`;

export const MediaCard = ({
  imgUrl,
  videoId,
  title,
  channelTitle,

  startDateTime,
  status,
}: Props) => {
  let startDateTimeStr = "";
  let startDateTimeStateStr = "";

  // startDateTimeStr = format(new Date(startDateTime), "yyyy/MM/dd HH:mm");

  if (status == "upcoming") {
    // 配信予定
    startDateTimeStateStr = "配信予定";
  } else if (status == "live") {
    // 配信中
    startDateTimeStateStr = "配信中";
  } else if (status == "none") {
    startDateTimeStateStr = "配信";
  } else {
    startDateTimeStateStr = "公開";
  }

  return (
    <Card sx={{ maxWidth: 240 }}>
      <Link target="_brank" href={"https://www.youtube.com/watch?v=" + videoId}>
        <CardMedia sx={{ height: 140 }} image={imgUrl} />
      </Link>
      <CardContentEx>
        <Typography
          variant="body2"
          gutterBottom
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {channelTitle}
        </Typography>

        {startDateTimeStr && ( // 配信済または動画
          <Typography variant="body2" color="text.secondary">
            {startDateTimeStr}に{startDateTimeStateStr}
          </Typography>
        )}
      </CardContentEx>
    </Card>
  );
};
