import { Stack } from "@mui/material";
import { ChannelIconComp } from "./ChannelIconComp";
import { channelParams } from "./const";
import { ResetIconComp } from "./ResetIconComp";

export const getOrder = (channel: string): number => {
  const cid = channelParams[channel];
  return cid.order;
};
export const getFullName = (channel: string): string => {
  const cid = channelParams[channel];
  return cid.name;
};

type ChannelFillterProps = {
  channelInfo: any[]; // チャンネル情報
  fillterBtnClickCB: any; // フィルタボタンを押された時のコールバック

  sortSelect: Set<string>; // フィルター結果を保持する変数
  resetBtnClickCB: any; // リセットボタンを押したときのコールバック
};

export const ChannelFillter = ({ channelInfo, fillterBtnClickCB, sortSelect, resetBtnClickCB }: ChannelFillterProps) => {
  const channelIconsList: any[] = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let item of channelInfo) {
    const idx = getOrder(item.channel);
    const isSelected = sortSelect.size == 0 ? true : sortSelect.has(item.channel);

    channelIconsList[idx] = (
      <ChannelIconComp
        key={0 + "-" + item.channel}
        channel={item.channel}
        cb={fillterBtnClickCB}
        imgUrl={item.snippet.thumbnails.default.url}
        fullName={getFullName(item.channel)}
        isSelected={isSelected}
      ></ChannelIconComp>
    );
  }

  //  リセットボタン
  channelIconsList.push(<ResetIconComp key={0 + "-" + "reset"} channel={"reset"} cb={resetBtnClickCB}></ResetIconComp>);
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "flex-start",
        marginTop: "6px",
        flexWrap: "wrap",

        backgroundColor: "#f0f0f4",
        borderRadius: "8px",
        paddingTop: "8px",
        paddingLeft: "6px",
      }}
    >
      {channelIconsList}
    </Stack>
  );
};

export default ChannelFillter;
