import { Avatar, Box, Typography } from "@mui/material";
import { getOrder, getUniBgColor } from "../const";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import { VoiceButtonOne } from "./VoiceButtonOne";
import { Fragment } from "react/jsx-runtime";

export type ViewMemberProp = {
  voiceButtonList: any[];
  ciDataList: any[];

  volume: number;
  deleteKey: string;
  isDeleteMode: boolean;
  isAdmin: boolean;

  setReLoadCt: any;
  setSelectVoice: any;
  setYtPalyerShotState: any;
};

export const ViewMember = ({ voiceButtonList, ciDataList, volume, deleteKey, isDeleteMode, isAdmin, setReLoadCt, setSelectVoice, setYtPalyerShotState }: ViewMemberProp) => {
  return voiceButtonList?.map((x) => {
    const name = x.key;
    const item = x.value;

    // const name = getName(key);
    const key = getOrder(name);
    const ci = ciDataList.filter((x: any) => x.channel == name);
    return (
      <Box key={key} sx={{ position: "relative", lineHeight: "46px" }}>
        <Box
          sx={{
            marginBottom: 2,
            marginRight: 1,
            paddingTop: 1,
            paddingBottom: 1.5,
            paddingLeft: 4,
            backgroundColor: getUniBgColor(name),
            minHeight: "34px",
          }}
        >
          {item?.map((item_one: any, index: number) => {
            return (
              <VolumeContext.Provider value={volume} key={index}>
                <DeleteKeyContext.Provider value={deleteKey}>
                  <DeleteModeFlagContext.Provider value={isDeleteMode}>
                    <Box component="span" sx={{ marginX: "2px" }}>
                      <VoiceButtonOne
                        filename={item_one.filename}
                        title={item_one.title}
                        channel={item_one.channel}
                        isDenoise={item_one.isDenoise}
                        uid={item_one.uid}
                        reLoadFunc={setReLoadCt}
                        isAdmin={isAdmin}
                        selectVoice={setSelectVoice}
                        archiveUrl={item_one.url}
                        start={item_one.start}
                        end={item_one.end}
                        setYtPalyerShotState={setYtPalyerShotState}
                        tag={item_one.tag}
                      />
                    </Box>
                  </DeleteModeFlagContext.Provider>
                </DeleteKeyContext.Provider>
              </VolumeContext.Provider>
            );
          })}
        </Box>
        <Box
          sx={{
            justifyContent: " space-evenly",
            display: "flex",
            marginRight: "3px",
            position: "absolute",
            top: "-12px",
            left: "28px",
            "@media screen and (max-width:800px)": {
              left: 44,
            },
          }}
        >
          <Avatar
            src={ci[0]?.snippet?.thumbnails?.default?.url}
            sx={{
              width: 44,
              right: 44,
              boxShadow: 3,
            }}
          />
        </Box>
      </Box>
    );
  });
};
