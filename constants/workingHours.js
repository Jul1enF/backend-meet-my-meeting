// constants/workingHours.js
const createWorkingDay = () => ({
  enabled: true,
  start: "09:00",
  end: "18:00",
  break: {
    enabled: true,
    start: "13:00",
    end: "14:00",
  }
});

module.exports = () => ({
  "0": createWorkingDay(),
  "1": createWorkingDay(),
  "2": createWorkingDay(),
  "3": createWorkingDay(),
  "4": createWorkingDay(),
  "5": createWorkingDay(),
  "6": createWorkingDay(),
});
