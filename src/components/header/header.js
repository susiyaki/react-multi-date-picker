import React from "react"
import Arrow from "../arrow/arrow"
import DateObject from "react-date-object"

export default function Header({
  state,
  setState,
  onChange,
  disableYearPicker,
  disableMonthPicker,
  customMonths,
  numberOfMonths
}) {
  let monthNames = [],
    years = [],
    digits = state.date.digits

  for (let monthIndex = 0; monthIndex < numberOfMonths; monthIndex++) {
    let monthName,
      year = state.date.year,
      index = state.date.month.index + monthIndex

    if (index > 11) {
      index -= 12
      year++
    }

    if (Array.isArray(customMonths) && customMonths.length >= 12) {
      let month = customMonths[index]

      monthName = Array.isArray(month) ? month[0] : month
    } else {
      monthName = state.date.months[index].name
    }

    year = year.toString().replace(/[0-9]/g, w => digits[w])

    monthNames.push(monthName)
    years.push(year)
  }

  return (
    <div className="rmdp-header" style={{ display: state.onlyTimePicker ? "none" : "block" }}>
      <div style={{ position: "relative", display: "flex" }}>
        <Arrow direction="rmdp-left" onClick={() => increaseValue(-1)} />
        {
          monthNames.map((monthName, index) => {
            return (
              <div key={index} className="rmdp-header-values">
                {!state.onlyYearPicker &&
                  <span
                    style={{ cursor: disableMonthPicker || state.onlyMonthPicker ? "default" : "pointer" }}
                    onClick={() => !disableMonthPicker && toggle("mustShowMonthPicker")}
                  >
                    {monthName},
                  </span>
                }
                <span
                  style={{ cursor: disableYearPicker || state.onlyYearPicker ? "default" : "pointer" }}
                  onClick={() => !disableYearPicker && toggle("mustShowYearPicker")}
                >
                  {years[index]}
                </span>
              </div>
            )
          })
        }
        <Arrow direction="rmdp-right" onClick={() => increaseValue(1)} />
      </div>
    </div>
  )

  function increaseValue(value) {
    let { date, selectedDate, mustShowYearPicker, onlyYearPicker, onlyMonthPicker, minDate, maxDate } = state

    if (!mustShowYearPicker && !onlyYearPicker) {
      if (minDate && date.year <= minDate.year && minDate.month.number > date.month.number + value) return
      if (maxDate && date.year >= maxDate.year && maxDate.month.number < date.month.number + value) return

      date.toFirstOfMonth()

      if (onlyMonthPicker) {
        date.year += value
      } else {
        date.month += value
      }

    } else {
      if (minDate && minDate.year > date.year + value) return
      if (maxDate && maxDate.year < date.year + value) return

      let year = date.year + (value * 12)

      if (value < 0 && minDate && year < minDate.year) year = minDate.year
      if (value > 0 && maxDate && year > maxDate.year) year = maxDate.year

      date.year = year
    }

    onChange(
      onlyMonthPicker ? selectedDate : undefined,
      {
        ...state,
        date,
        selectedDate
      }
    )
  }

  function toggle(picker) {
    let object = {
      mustShowMonthPicker: false,
      mustShowYearPicker: false
    }

    object[picker] = !state[picker]

    setState({
      ...state,
      ...object
    })
  }
}