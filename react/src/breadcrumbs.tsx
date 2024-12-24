import { Breadcrumbs, Link, Typography } from "@mui/material";
import { FC } from "react";

type PropsOne = {
  url: string;
  label: string;
};

// パンくずリスト
const BreadcrumbsEx: FC<{ props: PropsOne[] }> = ({ props }) => {
  return (
    <Breadcrumbs separator="›" aria-label="breadcrumb">
      {props.map((x: PropsOne, idx) => {
        if (x.url === "") {
          return (
            <Typography key={idx} sx={{ color: "text.primary" }}>
              {x.label}
            </Typography>
          );
        }

        return (
          <Link underline="hover" key={idx} color="inherit" href="/">
            {x.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default BreadcrumbsEx;
