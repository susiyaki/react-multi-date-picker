import React from "react";
import DatePicker from "../../../build/index";

export default function Doc({ otherProps, localeImport }) {
  const prime = {
    title: "Prime",
    code: `${localeImport}import "react-multi-date-picker/styles/layouts/prime.css"
.
.
.
<DatePicker
  className="rmdp-prime"
  showOtherDays
/>`,
    jsx: <DatePicker className="rmdp-prime" showOtherDays {...otherProps} />,
  };

  const mobile = {
    title: "Mobile",
    code: `${localeImport}import "react-multi-date-picker/styles/layouts/mobile.css"
.
.
.
<DatePicker
  className="rmdp-mobile"
/>`,
    jsx: <DatePicker className="rmdp-mobile" {...otherProps} />,
  };

  return [prime, mobile];
}
