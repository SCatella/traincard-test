/*

Schedule extends Traincard

A Schedule is an array of trip objects

trip objects have the following properties:
{
  RTE NUM,
  Sign Code,
  Time Points
}

*/

class TrainCard {
  constructor(route, block, radioRoute, signUp, pullOut, pullIn) {
    this.route = route;
    this.block = block;
    this.radioRoute = radioRoute;
    this.signUp = signUp;
    this.pullOut = pullOut;
    this.pullIn = pullIn;
    this.morningEnd = '';
    this.midStart = '';
    this.midEnd = '';
    this.nightStart = '';
  }

  #time(valueString) {
    const hours = Number(valueString.split(':')[0]) * 60;
    const minutes = Number(valueString.split(':')[1]);

    return (hours + minutes) * 60;
  }

  #isNewDay(timeString) {
    const timeStringToArray = timeString.split(':');
    const hour = Number(timeStringToArray[0]);
    const minutes = `:${timeStringToArray[1]}`;

    if ((hour >= 0)) {
      hour = (hour + 24).toString();
    }

    return hour + minutes;
  }

  #shiftCalculator() {
    const { signUp, pullIn } = this
    const routeTime = this.#time(this.#isNewDay(pullIn)) - this.#time(signUp);
    const morningShift = `${Math.floor(this.#time(signUp) + 8)}:${Math.floor(((this.#time(signUp) + 8) - Math.floor(this.#time(signUp) + 8)) * 60)}`;
    const nightShift = `${Math.floor(this.#time(signUp) - 8)}:${Math.floor(((this.#time(signUp) - 8) - Math.floor(this.#time(signUp) + 8)) * 60)}`;

    if (routeTime >= 10.33) {
      if ((routeTime / 2) >= 9.58) {
        Object.assign(this, {
          morningEnd: morningShift,
          midStart: morningShift,
          midEnd: nightShift,
          nightStart: nightShift
        })
      } else if ((routeTime / 2) > 5) {
        if (this.#time(signUp) < 9.5) {
          Object.assign(this, {
            morningEnd: morningShift,
            midStart: morningShift,
            midEnd: nightShift,
            nightStart: nightShift
        })
        }
      }
    }
  }
}