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

const createTrainCard = (route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray) => {
  const trainCard = new TrainCard(route, block, radioRoute, signUp, pullOut, pullIn, scheduleArray);
  
  trainCard.shiftCalculator();
  database.push(trainCard);
}

createTrainCard('204', '2', '204', '5:22', '5:37', '22:07', [{}]);

console.log(database[0].routeInfo);