const database = [];

class TrainCard {
  constructor(route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray) {
    this.routeInfo = {
      route: route,
      block: block,
      radioRoute: radioRoute,
      signUp: signUp,
      pullOut: pullOut,
      pullIn: pullIn,
      morningEnd: '',
      midStart: '',
      midEnd: '',
      nightStart: '',
      schedule: scheduleArray
    }
  }

  #time(timeString) {
    const timeInMinutes = (Number(timeString.split(':')[0]) * 60) + Number(timeString.split(':')[1]);
    const timeInHours = timeInMinutes / 60;
    const timeObject = {
      hours: 0,
      minutes: 0
    }

    timeObject.hours = Math.floor(timeInHours);
    timeObject.minutes = Math.floor((timeInHours - timeObject.hours) * 60);

    return timeObject;
  }

  #isNewDay(pullInObject) {    
    pullInObject.hours >= 0 && pullInObject.hours < 4
      ? pullInObject.hours = pullInObject.hours + 24
      : pullInObject
    return pullInObject;
  }

  #duration(start, end) {
    return ((new Date().setHours(end.hours, end.minutes) - new Date().setHours(start.hours, start.minutes)) / 3600000).toFixed(2);
  }

  shiftCalculator() {
    const { signUp, pullIn , schedule} = this.routeInfo
    const startTime = this.#time(signUp);
    const endTime = this.#isNewDay(this.#time(pullIn))
    const routeTime = this.#duration(startTime, endTime);
    const morningReliefPointArray = [];
    const nightReliefPointArray = [];
    const morningShiftEnd = `${startTime.hours + 8}:${startTime.minutes.toString().padStart(2, '0')}`;
    const nightShiftStart = `${endTime.hours - 8}:${endTime.minutes.toString().padStart(2, '0')}`;

    Object.assign(this.routeInfo, {
      duration: this.#duration(this.#time(signUp), this.#time(pullIn))
    })

    schedule.trips.forEach((element) => {
      morningReliefPointArray.push(Math.abs(
        this.#duration(this.#time(element.tripArray[schedule.reliefPointsHeaderIndex[Object.keys(schedule.reliefPointsHeaderIndex)[0]]]),
          this.#time(morningShiftEnd)))
      );
      nightReliefPointArray.push(Math.abs(
        this.#duration(this.#time(element.tripArray[schedule.reliefPointsHeaderIndex[Object.keys(schedule.reliefPointsHeaderIndex)[0]]]),
          this.#time(nightShiftStart)))
      );
    });

    const morningReliefTime = () => {
      return schedule.trips[morningReliefPointArray.indexOf(Math.min(...morningReliefPointArray))].tripArray[schedule.reliefPointsHeaderIndex[Object.keys(schedule.reliefPointsHeaderIndex)[0]]];
    }

    const nightReliefTime = () => {
      return schedule.trips[nightReliefPointArray.indexOf(Math.min(...nightReliefPointArray))].tripArray[schedule.reliefPointsHeaderIndex[Object.keys(schedule.reliefPointsHeaderIndex)[0]]];
    }

    if (routeTime >= 10.33) {
      if ((routeTime / 2) >= 9.58) {
        Object.assign(this.routeInfo, {
          morningEnd: morningReliefTime(),
          midStart: morningReliefTime(),
          midEnd: nightReliefTime(),
          nightStart: nightReliefTime(),
          morningDuration: this.#duration(this.#time(signUp), this.#time(morningReliefTime())),
          midDuration: this.#duration(this.#time(morningReliefTime()), this.#time(nightReliefTime())),
          nightDuration: this.#duration(this.#time(nightReliefTime()), this.#time(pullIn))
        })
      } else {
        if (this.#time(signUp).hours < this.#time('7:00').hours) {
          Object.assign(this.routeInfo, {
            morningEnd: morningReliefTime(),
            nightStart: morningReliefTime(),
            morningDuration: this.#duration(this.#time(signUp), this.#time(morningReliefTime())),
            nightDuration: this.#duration(this.#time(morningReliefTime()), this.#time(pullIn))
          })
        } else {
          Object.assign(this.routeInfo, {
            morningEnd: nightReliefTime(),
            nightStart: nightReliefTime(),
            morningDuration: this.#duration(this.#time(signUp), this.#time(nightReliefTime())),
            nightDuration: this.#duration(this.#time(nightReliefTime()), this.#time(pullIn))
          })
        }
      }
    }
  }    
}

//Current Workload
class Schedule {
  constructor(route, block, direction, oppositeDirection) {
    this.routeBlock = [route, block];
    this.header = [`${direction}`, "RTE NUM", "Sign Code"];
    this.headerReverse = [`${oppositeDirection}`, "RTE NUM", "Sign Code"];
    this.reliefPointsHeaderIndex = {};
    this.trips = [];
  }

  #setReliefPoints(headerArray) {
    const reliefArray = [headerArray[0]];

    headerArray.forEach((element, index) => {
      if (element.includes("*")) {
        reliefArray.push(index);
      }
    })
    
    Object.assign(this.reliefPointsHeaderIndex, { [reliefArray.shift()]: reliefArray })
  }

  setHeaders(timePointsHeaderArray, timePointsHeaderArrayReverse) {
    const headerTerminator = ["TO RTE", "NEXT TIME"];

    this.header.push(...timePointsHeaderArray);
    this.header.push(...headerTerminator);
    this.headerReverse.push(...timePointsHeaderArrayReverse);
    this.headerReverse.push(...headerTerminator);
    this.#setReliefPoints(this.header);
    this.#setReliefPoints(this.headerReverse);
  }

  createTrip(route, signCode, timePointsArray) {
    const tripValues = ["", route, signCode];
    const tripKey = `tripArray`;

    tripValues.push(...timePointsArray);
    (this.trips.length % 2) == true
      ? this.trips.push(
        {
          header: this.headerReverse,
          [`${tripKey}`]: tripValues
        }
      )
      : this.trips.push(
        {
          header: this.header,
          [`${tripKey}`]: tripValues
        }
      );
  }
};

const createTrainCard = (route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray) => {
  const trainCard = new TrainCard(route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray);
  
  trainCard.shiftCalculator();
  database.push(trainCard);
}

const timePointsHeaderArray = [
  "TbMs Bdwy (Lv)",
  "Mrhd TbMs",
  "Bdwy Eucl",
  "Dtwn Bldr Gt-J (Ar)*",
  "Dtwn Bldr Gt-J (Lv)",
  "Waln 20th",
  "19th Josl",
  "Frnt Rnge Bdwy(Ar)",
];

const timePointsHeaderArrayReverse = [
  "Frnt Rnge Bdwy(Ar)",
  "19th Iris",
  "Waln 20th",
  "Dtwn Bldr Gt-K (Ar)*",
  "Dtwn Bldr Gt-K (Lv)",
  "Bdwy Eucl",
  "Mrhd TbMs",
  "TbMs Bdwy (Ar)",
  "TbMs Bdwy (Lv)",
];

const trip_1 = [
  "6:22",
  "6:27",
  "6:35",
  "6:44",
  "6:45",
  "6:47",
  "6:53",
  "7:04",
  "",
  "7:16"
];

const trip_2 = [
  "7:16",
  "7:26",
  "7:32",
  "7:36",
  "7:37",
  "7:42",
  "7:50",
  "7:54",
  "7:56",
  "",
  "8:20"
];

const trip_3 = [
  "8:20",
  "8:24",
  "8:35",
  "8:38",
  "8:39",
  "8:41",
  "8:47",
  "8:58",
  "",
  "9:17"
];

const trip_4 = [
  "9:17",
  "9:26",
  "9:32",
  "9:36",
  "9:37",
  "9:43",
  "9:51",
  "9:55",
  "9:57",
  "",
  "10:20"
];

const trip_5 = [
  "10:20",
  "10:24",
  "10:35",
  "10:45",
  "10:46",
  "10:48",
  "10:54",
  "11:04",
  "",
  "11:17"
];

const trip_6 = [
  "11:17",
  "11:26",
  "11:32",
  "11:36",
  "11:37",
  "11:43",
  "11:52",
  "11:56",
  "11:58",
  "",
  "12:20"
];

const trip_7 = [
  "12:20",
  "12:24",
  "12:35",
  "12:45",
  "12:46",
  "12:48",
  "12:54",
  "13:04",
  "",
  "13:17"
];

const trip_8 = [
  "13:17",
  "13:26",
  "13:32",
  "13:36",
  "13:37",
  "13:43",
  "13:52",
  "13:56",
  "13:58",
  "",
  "14:21"
];

const trip_9 = [
  "14:21",
  "14:25",
  "14:35",
  "14:45",
  "14:46",
  "14:48",
  "14:54",
  "15:04",
  "",
  "15:17"
];

const trip_10 = [
  "15:17",
  "15:26",
  "15:32",
  "15:36",
  "15:37",
  "15:43",
  "15:54",
  "15:58",
  "16:00",
  "",
  "16:22"
];

const trip_11 = [
  "16:22",
  "16:26",
  "16:36",
  "16:45",
  "16:46",
  "16:48",
  "16:54",
  "17:05",
  "",
  "17:19"
];

const trip_12 = [
  "17:19",
  "17:27",
  "17:32",
  "17:36",
  "17:37",
  "17:43",
  "17:54",
  "17:58",
  "18:00",
  "",
  "18:09"
];

const trip_13 = [
  "18:09",
  "18:12",
  "18:22",
  "18:30",
  "18:31",
  "18:33",
  "18:39",
  "18:48",
  "",
  "19:20"
];

const trip_14 = [
  "19:20",
  "19:28",
  "19:33",
  "19:36",
  "19:37",
  "19:42",
  "19:51",
  "19:55",
  "19:57",
  "",
  "20:11"
];

const trip_15 = [
  "20:11",
  "20:14",
  "20:23",
  "20:30",
  "20:31",
  "20:33",
  "20:38",
  "20:46",
  "",
  "20:50"
];

const trip_16 = [
  "20:50",
  "20:58",
  "21:03",
  "21:06",
  "21:07",
  "21:12",
  "21:21",
  "21:25",
  "21:27",
  "",
  "--->"
];

const routeSchedule = new Schedule("204", "2", "N-Bound", "S-Bound");
routeSchedule.setHeaders(timePointsHeaderArray, timePointsHeaderArrayReverse);
routeSchedule.createTrip("204", "0C48", trip_1);
routeSchedule.createTrip("204", "0679", trip_2);
routeSchedule.createTrip("204", "0C48", trip_3);
routeSchedule.createTrip("204", "0679", trip_4);
routeSchedule.createTrip("204", "0C48", trip_5);
routeSchedule.createTrip("204", "0679", trip_6);
routeSchedule.createTrip("204", "0C48", trip_7);
routeSchedule.createTrip("204", "0679", trip_8);
routeSchedule.createTrip("204", "0C48", trip_9);
routeSchedule.createTrip("204", "0679", trip_10);
routeSchedule.createTrip("204", "0C48", trip_11);
routeSchedule.createTrip("204", "0679", trip_12);
routeSchedule.createTrip("204", "0C48", trip_13);
routeSchedule.createTrip("204", "0679", trip_14);
routeSchedule.createTrip("204", "0C48", trip_15);
routeSchedule.createTrip("204", "0679", trip_16);

createTrainCard('204', '2', '204', '5:22', '5:37', '22:07', routeSchedule);

console.log(database[0].routeInfo);
