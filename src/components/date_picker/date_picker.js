import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  isValidElement,
  cloneElement,
} from "react";
import ElementPopper from "react-element-popper";
import DateObject from "react-date-object";
import Calendar from "../calendar/calendar";
import getFormat from "../../shared/getFormat";
import stringify from "../../shared/stringify";
import isArray from "../../shared/isArray";
import warn from "../../shared/warn";
import check from "../../shared/check";
import getLocaleName from "../../shared/getLocaleName";
import toLocaleDigits from "../../shared/toLocaleDigits";
import isRTL from "../../shared/isRTL";
import "./date_picker.css";

function DatePicker(
  {
    value,
    calendar,
    locale,
    format,
    onlyMonthPicker,
    onlyYearPicker,
    onChange,
    range = false,
    multiple = false,
    name,
    id,
    title,
    placeholder,
    required,
    style = {},
    className = "",
    inputClass,
    disabled,
    render,
    weekDays,
    months,
    children,
    inputMode,
    scrollSensitive = true,
    hideOnScroll,
    minDate,
    maxDate,
    formattingIgnoreList,
    containerClassName = "",
    calendarPosition = "bottom-left",
    editable = true,
    onOpen,
    onClose,
    arrowClassName = "",
    zIndex = 100,
    arrow = true,
    fixMainPosition,
    onPositionChange,
    onPropsChange,
    digits,
    readOnly,
    shadow = true,
    onFocusedDateChange,
    type,
    weekPicker,
    ...otherProps
  },
  outerRef
) {
  let [date, setDate] = useState(),
    [temporaryDate, setTemporaryDate] = useState(),
    [stringDate, setStringDate] = useState(""),
    [isVisible, setIsVisible] = useState(false),
    [isCalendarReady, setIsCalendarReady] = useState(false),
    datePickerRef = useRef(),
    inputRef = useRef(),
    calendarRef = useRef(),
    ref = useRef({}),
    separator = range || weekPicker ? " ~ " : ", ",
    datePickerProps = arguments[0],
    isMobileMode = isMobile(),
    closeCalendar = useCallback(() => {
      if (onClose?.() === false) return;

      let input = getInput(inputRef);

      if (input) input.blur();

      if (ref.current.mobile) {
        let popper = calendarRef.current.parentNode.parentNode;

        popper.classList.remove("rmdp-calendar-container-mobile");
        popper.style.position = "absolute";
        popper.style.visibility = "hidden";
      }

      setIsVisible(false);
      setIsCalendarReady(false);
    }, [onClose]);

  if (isMobileMode && !ref.current.mobile)
    ref.current = { ...ref.current, mobile: true };
  if (!isMobileMode && ref.current.mobile)
    ref.current = { ...ref.current, mobile: false };

  formattingIgnoreList = stringify(formattingIgnoreList);
  format = getFormat(onlyMonthPicker, onlyYearPicker, format);

  [calendar, locale] = check(calendar, locale);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!isVisible) return;

      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target) &&
        !event.target.classList.contains("b-deselect") &&
        !ref.current.mobile
      ) {
        closeCalendar();
      } else if (
        calendarRef.current &&
        calendarRef.current.contains(event.target) &&
        !ref.current.mobile
      ) {
        datePickerRef.current.removeTransition();
        datePickerRef.current.refreshPosition();
      }
    }

    function handleScroll() {
      if (hideOnScroll && isVisible) closeCalendar();
    }

    document.addEventListener("click", handleClickOutside, false);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, false);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [closeCalendar, outerRef, isVisible, hideOnScroll]);

  useEffect(() => {
    let date = value,
      { date: refDate, initialValue } = ref.current,
      getLastDate = () => date[date.length - 1];

    function checkDate(date) {
      if (!date) return;
      if (!(date instanceof DateObject))
        date = new DateObject({ date, calendar, locale, format });

      if (date.calendar !== calendar) date.setCalendar(calendar);

      date.set({
        weekDays,
        months,
        digits,
        locale,
        format,
        ignoreList: JSON.parse(formattingIgnoreList),
      });

      return date;
    }

    if (!value && !initialValue && refDate) {
      date = refDate;
    } else if (initialValue && !value) {
      initialValue = undefined;
    }

    if (range || multiple || isArray(date)) {
      if (!isArray(date)) date = [date];

      date = date.map(checkDate).filter((value) => value !== undefined);

      if (range && date.length > 2) date = [date[0], getLastDate()];

      setStringDate(getStringDate(date, separator));
    } else {
      if (isArray(date)) date = getLastDate();

      date = checkDate(date);

      if (document.activeElement !== getInput(inputRef)) {
        setStringDate(date ? date.format() : "");
      }
    }

    ref.current = {
      ...ref.current,
      date,
      separator,
      initialValue: initialValue || value,
    };

    setDate(date);
  }, [
    value,
    calendar,
    locale,
    format,
    range,
    multiple,
    separator,
    onlyMonthPicker,
    onlyYearPicker,
    weekDays,
    months,
    digits,
    formattingIgnoreList,
  ]);

  useEffect(() => {
    /**
     * If the locale is non-English, after manually changing the input value,
     * the caret position jumps to the end of the input.
     * To solve this issue, we save the previous position of caret in the ref,
     * and in this effect, we recover it.
     */
    let { selection } = ref.current;

    if (!selection) return;
    /**
     * If the caret position is undefined, there is no reason to get the input.
     * So we only get the input if the caret position is available.
     */
    let input = getInput(inputRef);

    if (!input) return;

    input.setSelectionRange(selection, selection);
    ref.current.selection = undefined;
    /**
     * after manually changing the month by typing in the input,
     * if the calendar position is in top of the input
     * and the number of days in the new month is greater than the number of days in the previous month,
     * the calendar will cover the input due to its larger size.
     * To resolve this issue, we refresh the calendar position here.
     */
    datePickerRef.current.refreshPosition();
  }, [stringDate]);

  if (multiple || range || isArray(date) || !editable) inputMode = "none";

  return (
    <ElementPopper
      ref={setRef}
      element={renderInput()}
      popper={isVisible && renderCalendar()}
      active={!isMobileMode && isCalendarReady}
      position={calendarPosition}
      arrow={!isMobileMode && arrow}
      containerClassName={`rmdp-container ${containerClassName}`}
      arrowClassName={`${className} ${arrowClassName} ep-${
        shadow ? "shadow" : "border"
      }`}
      fixMainPosition={!scrollSensitive || fixMainPosition}
      zIndex={zIndex}
      onChange={!isMobileMode && onPositionChange}
      {...otherProps}
    />
  );

  function setRef(element) {
    if (element) {
      element.openCalendar = () => setTimeout(() => openCalendar(), 10);
      element.closeCalendar = closeCalendar;
      element.isOpen = isVisible && isCalendarReady;
    }

    datePickerRef.current = element;

    if (outerRef instanceof Function) return outerRef(element);
    if (outerRef) outerRef.current = element;
  }

  function renderInput() {
    if (typeof type === "string") {
      warn([
        "the type Prop is deprecated.",
        "https://shahabyazdi.github.io/react-multi-date-picker/types/",
      ]);
    }

    if (render) {
      let strDate =
        isArray(date) || multiple || range
          ? getStringDate(date, separator)
          : stringDate;

      return (
        <div ref={inputRef}>
          {isValidElement(render)
            ? cloneElement(render, {
                [multiple || range ? "stringDates" : "stringDate"]: strDate,
                value: strDate,
                openCalendar,
                handleValueChange,
                locale,
                separator,
              })
            : render instanceof Function
            ? render(
                strDate,
                openCalendar,
                handleValueChange,
                locale,
                separator
              )
            : null}
        </div>
      );
    } else {
      return (
        <input
          ref={inputRef}
          type="text"
          name={name}
          id={id}
          title={title}
          required={required}
          onFocus={openCalendar}
          className={inputClass || "rmdp-input"}
          placeholder={placeholder}
          value={stringDate}
          onChange={handleValueChange}
          style={style}
          autoComplete="off"
          disabled={disabled ? true : false}
          inputMode={inputMode || (isMobileMode ? "none" : undefined)}
          readOnly={readOnly}
        />
      );
    }
  }

  function renderCalendar() {
    return (
      <Calendar
        ref={calendarRef}
        value={temporaryDate || date}
        onChange={handleChange}
        range={range}
        multiple={multiple}
        calendar={calendar}
        locale={locale}
        format={format}
        onlyMonthPicker={onlyMonthPicker}
        onlyYearPicker={onlyYearPicker}
        className={className + (isMobileMode ? " rmdp-mobile" : "")}
        weekDays={weekDays}
        months={months}
        digits={digits}
        minDate={minDate}
        maxDate={maxDate}
        formattingIgnoreList={JSON.parse(formattingIgnoreList)}
        onPropsChange={onPropsChange}
        shadow={shadow}
        onReady={setCalendarReady}
        DatePicker={datePickerRef.current}
        datePickerProps={datePickerProps}
        onFocusedDateChange={handleFocusedDate}
        weekPicker={weekPicker}
        {...otherProps}
      >
        {children}
        {isMobileMode && renderButtons()}
      </Calendar>
    );
  }

  function isMobile() {
    return typeof className === "string" && className.includes("rmdp-mobile");
  }

  function renderButtons() {
    let mustSetTopBorder = [].concat
      .apply([], datePickerProps.plugins || [])
      .some(({ props = {} }) => !props.disabled);

    return (
      <div
        className={`rmdp-action-buttons ${isRTL(locale) ? "rmdp-rtl" : ""} ${
          mustSetTopBorder ? "rmdp-border-top" : ""
        }`}
      >
        <button
          type="button"
          className="rmdp-button rmdp-action-button"
          onClick={() => {
            if (temporaryDate) {
              handleChange(temporaryDate, true);
              setTemporaryDate(undefined);
            }

            closeCalendar();
          }}
        >
          {toLocale("OK")}
        </button>
        <button
          type="button"
          className="rmdp-button rmdp-action-button"
          onClick={() => {
            setTemporaryDate(undefined);
            closeCalendar();
          }}
        >
          {toLocale("CANCEL")}
        </button>
      </div>
    );
  }

  function toLocale(string) {
    if (!locale || typeof locale.name !== "string") return string;

    let actions = {
      en: { OK: "OK", CANCEL: "CANCEL" },
      fa: { OK: "تأیید", CANCEL: "لغو" },
      ar: { OK: "تأكيد", CANCEL: "الغاء" },
      hi: { OK: "पुष्टि", CANCEL: "रद्द करें" },
    };

    return actions[getLocaleName(locale)]?.[string] || string;
  }

  function openCalendar() {
    if (disabled || readOnly || onOpen?.() === false) return;

    if (!value && !ref.current.date && !range && !multiple && !isMobileMode) {
      let date = new DateObject({
        calendar,
        locale,
        format,
        months,
        weekDays,
        digits,
        ignoreList: JSON.parse(formattingIgnoreList),
      });

      if ((!minDate || date > minDate) && (!maxDate || date < maxDate)) {
        handleChange(date);
        onPropsChange?.({ ...datePickerProps, value: date });

        ref.current.date = date;
      }
    }

    let input = getInput(inputRef);

    if (isMobileMode && input) input.blur();

    if (input || !isVisible) {
      setIsVisible(true);
    } else {
      closeCalendar();
    }
  }

  function handleChange(date, force) {
    if (isMobileMode && !force) return setTemporaryDate(date);

    setDate(date);

    ref.current = { ...ref.current, date };

    onChange?.(date);

    if (date) setStringDate(getStringDate(date, separator));
  }

  function handleValueChange(e) {
    if (isArray(date) || !editable) return;

    ref.current.selection = e.target.selectionStart;

    let value = e.target.value,
      object = { year: 1, calendar, locale, format },
      digits =
        date && date.isValid ? date.digits : new DateObject(object).digits;

    if (!value) {
      setStringDate("");

      return handleChange(null);
    }

    if (!digits) return;
    //converting value to english digits
    for (let digit of digits) {
      value = value.replace(new RegExp(digit, "g"), digits.indexOf(digit));
    }

    let newDate = new DateObject(date).parse(value);

    handleChange(newDate.isValid ? newDate : null);
    setStringDate(toLocaleDigits(value, digits));
  }

  function setCalendarReady() {
    setIsCalendarReady(true);

    if (!isMobileMode) return;

    let popper = calendarRef.current.parentNode.parentNode;

    popper.className = "rmdp-calendar-container-mobile";
    popper.style.position = "fixed";
    popper.style.transform = "";

    setTimeout(() => {
      popper.style.visibility = "visible";
    }, 50);
  }

  function handleFocusedDate(focusedDate, clickedDate) {
    if (!isArray(ref.current.date) && clickedDate && !isMobileMode) {
      closeCalendar();
    }

    onFocusedDateChange?.(focusedDate, clickedDate);
  }
}

export default forwardRef(DatePicker);

function getStringDate(date, separator) {
  let dates = [].concat(date).map(toString);

  dates.toString = function () {
    return this.filter(Boolean).join(separator);
  };

  return dates;

  function toString(date) {
    return date?.isValid ? date.format() : "";
  }
}

function getInput(inputRef) {
  if (!inputRef.current) return;

  return inputRef.current.tagName === "INPUT"
    ? inputRef.current
    : inputRef.current.querySelector("input");
}
