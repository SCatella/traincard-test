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
    const { signUp, pullIn } = this.routeInfo
    const startTime = this.#time(signUp);
    const endTime = this.#isNewDay(this.#time(pullIn))
    const routeTime = this.#duration(startTime, endTime);
    const morningShiftEnd = `${startTime.hours + 8}:${startTime.minutes.toString().padStart(2, '0')}`;
    const nightShiftStart = `${endTime.hours - 8}:${endTime.minutes.toString().padStart(2, '0')}`;

    Object.assign(this.routeInfo, {
      duration: this.#duration(this.#time(signUp), this.#time(pullIn))
    })

    if (routeTime >= 10.33) {
      if ((routeTime / 2) >= 9.58) {
        Object.assign(this.routeInfo, {
          morningEnd: morningShiftEnd,
          midStart: morningShiftEnd,
          midEnd: nightShiftStart,
          nightStart: nightShiftStart,
          morningDuration: this.#duration(this.#time(signUp), this.#time(morningShiftEnd)),
          midDuration: this.#duration(this.#time(morningShiftEnd), this.#time(nightShiftStart)),
          nightDuration: this.#duration(this.#time(nightShiftStart), this.#time(pullIn))
        })
      } else {
        if (this.#time(signUp).hours < this.#time('7:00').hours) {
          Object.assign(this.routeInfo, {
            morningEnd: morningShiftEnd,
            nightStart: morningShiftEnd,
            morningDuration: this.#duration(this.#time(signUp), this.#time(morningShiftEnd)),
            nightDuration: this.#duration(this.#time(morningShiftEnd), this.#time(pullIn))
          })
        } else {
          Object.assign(this.routeInfo, {
            morningEnd: nightShiftStart,
            nightStart: nightShiftStart,
            morningDuration: this.#duration(this.#time(signUp), this.#time(nightShiftStart)),
            nightDuration: this.#duration(this.#time(nightShiftStart), this.#time(pullIn))
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
    const tripKey = `trip_${this.trips.length}`;

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
  "7:16"
];

const createTrainCard = (route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray) => {
  const trainCard = new TrainCard(route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray);
  
  trainCard.shiftCalculator();
  database.push(trainCard);
}

const routeSchedule = new Schedule("204", "2", "N-Bound", "S-Bound");

routeSchedule.setHeaders(timePointsHeaderArray, timePointsHeaderArrayReverse);
routeSchedule.createTrip("204", "0C48", trip_1);
routeSchedule.createTrip("204", "0679", trip_2);

createTrainCard('204', '2', '204', '5:22', '5:37', '22:07', routeSchedule);

console.log(database[0].routeInfo);
