import styled from "@emotion/styled";
import { TabPanel } from "@mui/lab";
import { Box } from "@mui/material";

export const HeaderBox = styled(Box)({
  paddingTop: 8,
  paddingBottom: 8,
  marginTop: 4,
  marginBottom: 8,
  width: "100%",
  color: "#FFFFFF",
  backgroundColor: "#1976d2",
  borderRadius: 2,
  fontSize: "0.875rem",
  fontWeight: "700",
  textAlign: "center",
});

export const TabPanelEx = styled(TabPanel)({
  padding: 0,
});

export const HeaderBoxGroups = styled(Box)({
  paddingTop: 8,
  paddingBottom: 8,
  marginTop: 4,
  width: "100%",
  color: "#FFFFFF",
  paddingLeft: "4px",
  borderRadius: 0,
  fontSize: "0.875rem",
  fontWeight: "700",
  textAlign: "left",
});
