import { Box, FormHelperText, Button, Typography, TextField, FormGroup, Stack } from "@mui/material";
import Switch from "@mui/material/Switch";

export type VoiceDeleteFormProps = {
  deleteMode: any;
  deleteModeChangeFunc: any;
  setDeleteKey: any;
  reDrawFunc: any;
};

export const fileToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.result instanceof ArrayBuffer || reader.result == null) {
        reject(new Error("FileReader result is not an string"));
      } else {
        resolve(reader.result);
      }
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
};

export const VoiceDeleteForm = ({ deleteMode, deleteModeChangeFunc, setDeleteKey, reDrawFunc }: VoiceDeleteFormProps) => {
  return (
    <Box maxWidth="sm" sx={{ pt: 1, pb: 2 }}>
      <Typography
        align="center"
        variant="h2"
        sx={{
          fontSize: "3rem",
          "@media screen and (max-width:800px)": {
            fontSize: "2rem",
          },
        }}
      >
        音声ボタンの削除
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", textAlign: "right" }}>自分で追加した削除キーがわかるもののみ削除できます。</Typography>

      <Box
        sx={{
          borderRadius: "12px",
          backgroundColor: "#E8FAF0",
          padding: 2,
          marginTop: 1,
        }}
      >
        <FormGroup>
          <Stack my={2} direction="row" justifyContent="end" spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
              <Box>
                <FormGroup>
                  <TextField label={"削除キー"} color="success" onChange={(event) => setDeleteKey(event.target.value)} />
                  <FormHelperText sx={{ marginLeft: 2 }}>音声を削除するには、追加時に設定した削除キーが必要です</FormHelperText>
                </FormGroup>
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="end"
                  spacing={1}
                  sx={{ bgcolor: "#ffce93", padding: 1, paddingLeft: 2, borderColor: "#FF9000", borderWidth: "2px", borderStyle: "solid" }}
                  borderRadius={"4px"}
                >
                  <Typography sx={{ fontSize: "1.0rem", marginTop: "8px", lineHeight: "38px", color: "rgb(80,80,80)", fontWeight: 500 }}>削除モード</Typography>
                  <Switch
                    color="warning"
                    inputProps={{ "aria-label": "voice delete" }}
                    onChange={() => {
                      console.log("Switch on change");
                      deleteModeChangeFunc((_mode: boolean) => {
                        // 呼び出し元音声ボタン群を更新
                        reDrawFunc((_c: number) => {
                          return _c + 1;
                        });

                        if (_mode) {
                          return false;
                        } else {
                          return true;
                        }
                      });
                    }}
                  ></Switch>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </FormGroup>
      </Box>
      {/* <Typography sx={{ fontSize: "0.6rem" }}>すぐ追加できるかわかりませんが、なるはやで頑張ります</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>いつまでたっても追加されない場合は、時間の指定等が間違っている可能性がありますので再申請するか、Xで管理者に聞いてみてください</Typography> */}
    </Box>
  );
};
