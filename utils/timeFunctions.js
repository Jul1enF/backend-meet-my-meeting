const { DateTime } = require("luxon")

// Convert to dtDate zone Europe/Paris whatever the entring format is
const toParisDt = (date) => {
    if (date instanceof Date) return DateTime.fromJSDate(date, { zone: "Europe/Paris" })
    else if (typeof date === "string") return DateTime.fromISO(date, { zone: "Europe/Paris" })
    else if (DateTime.isDateTime(date)) {
        if (date.zoneName === "Europe/Paris") return date
        else return date.setZone("Europe/Paris")
    }
    throw new Error(`Unsupported date format: ${date}`)
}

const jsDateFromStringTime = (stringTime, dtReferenceDate) => DateTime.fromFormat(stringTime, "HH:mm")
    .set({ year: dtReferenceDate.year, month: dtReferenceDate.month, day: dtReferenceDate.day })
    .toUTC()
    .toJSDate()


const getJsParisStartOfDay = (date) =>
    toParisDt(date)
        .startOf("day")
        .toUTC()
        .toJSDate()

const getJsParisEndOfDay = (date) =>
    toParisDt(date)
        .endOf("day")
        .toUTC()
        .toJSDate()


module.exports = { toParisDt, jsDateFromStringTime, getJsParisStartOfDay, getJsParisEndOfDay }