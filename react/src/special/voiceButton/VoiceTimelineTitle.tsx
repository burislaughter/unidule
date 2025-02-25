import { FormControl, TextField } from "@mui/material";
import { forwardRef, useEffect, useState } from "react";

type VoiceTimelineTitleProp = {
  onBlur: any;
  initValue: string;
};

export const VoiceTimelineTitle = forwardRef(({ onBlur, initValue }: VoiceTimelineTitleProp, ref) => {
  const [voiceTitle, setVoiceTitle] = useState("");

  useEffect(() => {
    setVoiceTitle(initValue);
  }, [initValue]);

  return (
    <FormControl sx={{ m: 1, minWidth: 200 }}>
      <TextField
        value={voiceTitle}
        id="standard-basic"
        label="音声のタイトル"
        variant="outlined"
        onChange={(event) => {
          setVoiceTitle(event.target.value);
        }}
        onBlur={(event) => {
          onBlur(event.target.value);
        }}
      />
    </FormControl>
  );
});
