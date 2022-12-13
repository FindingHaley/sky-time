let timeData;
let offset;
let localTime;
let showFullDay = true;
let maxHours = 5;
let pastHours = 1;
let currentHourSlot;

function loadData (filename) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', filename + '.json', true);

    xhr.onload = () => {
        timeData = JSON.parse(xhr.response);
        onLoad();
    };

    xhr.send();
}

function getPeriod (hour) {
    if (hour > 11 && hour < 24) {
        return "PM";
    } else {
        return "AM";
    }
}

function to24Hours (hour, period) {
    let hour24;

    if ((period === "AM" && hour === 12) || (period === "PM" && hour < 12)) {
        hour24 = hour + 12;
    } else if (period === "PM" && hour === 12) {
        hour24 = 0;
    } else {
        hour24 = hour;
    }

    return hour24;
}

function to12Hours (hour24) {
    let hour;
    let period;

    if (hour24 > 24) {
        hour24 = hour24 - 24;
    }

    if (hour24 < 12) {
        period = "AM";
        hour = hour24;
    } else if (hour24 === 12) {
        period = "PM";
        hour = hour24;
    } else if (hour24 > 12 && hour24 < 24) {
        hour = hour24 - 12;
        period = "PM";
    } else if (hour24 === 24) {
        period = "AM";
        hour = 12;
    }

    return {
        hour24: hour24,
        hour: hour,
        period: period
    };
}

function parseTime (time) {
    let hour24 = time.getHours();
    let hour;
    let minutes = time.getMinutes();
    let period = getPeriod(hour24);

    if (hour24 > 12) {
        hour = hour24 - 12;
    } else {
        hour = hour24;
    }

    return {
        hour: hour,
        hour24: hour24,
        minutes: minutes,
        period: period
    };
}


function parsePacificTime (date) {
    date = date.split(" ");
    let time = date[1].split(":");;
    let hour = Number(time[0]);
    let minutes = Number(time[1]);
    let period = date[2];
    let hour24;
    
    hour24 = to24Hours(hour, period);

    return {
        hour: hour,
        hour24: hour24,
        minutes: minutes,
        period: period
    };
}

function getPacificOffest (localTime, pacificTime) {
    const offset = localTime.hour24 - pacificTime.hour24;

    // const resetOffset = localTime.hour24 - offset;
    let resetOffset = offset;
    // let resetOffset = 0;
    let hour;

    // console.log(localTime.hour24, pacificTime.hour24, offset)
    // console.log("resetOffset", resetOffset)

    if (resetOffset === 0) {
        resetOffset = localTime.hour24;
    }
    
    if (resetOffset > 12) {
        hour = resetOffset - 12;
    } else if (resetOffset < 0) {
        hour = resetOffset + 12;
        if (hour === 0) {
            hour = 12;
        }
        resetOffset = resetOffset + 24;

        if (hour < 0) {
            hour = hour * -1;
        }

        // console.log(hour)
        // console.log("previous day");
    } else {
        hour = resetOffset;
    }

    let period = getPeriod(resetOffset);

    return {
        offset: offset,
        resetOffset: hour,
        period: period
    };
}

function onLoad() {
    const localDate = new Date();
    localTime = parseTime(localDate);
    let diff = localDate.getTimezoneOffset();

    var pacificDate = localDate.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles"
    });
    // console.log("pacDate", pacificDate);

    let pacificTime = parsePacificTime(pacificDate);

    offset = getPacificOffest(localTime, pacificTime);

    // console.log(localTime, diff);
    // console.log("pac", pacificTime);
    // console.log("offset", offset);

    const resetTime = document.getElementById("reset-time");
    resetTime.innerText = `${offset.resetOffset}:00 ${offset.period}`;

    generateHourSlots();
}

function getLabelText (i) {
    let time = to12Hours(localTime.hour24 + i);
    return `${(time.hour ? time.hour : '12')}:00 ${time.period}`;
    
}

function updateCurrentTime () {
    let currentDate = new Date();
    let currentTime = document.getElementById('current-time');
    const totalHours = pastHours + maxHours;

    let oneHourPercent = (1 / totalHours) * 100;
    let percentOfHour = currentDate.getMinutes() / 60;
    // let percentOfHour = 1 / 60;
    let hourPos = oneHourPercent + (oneHourPercent * percentOfHour);

    if (showFullDay) {
        hourPos = (oneHourPercent * (localTime.hour24 - offset.resetOffset)) + (oneHourPercent * percentOfHour);
    }
    
    currentTime.style.top = hourPos + "%";

    setTimeout(function () {
        updateCurrentTime();
    }, 1000);
}

function generateHourSlots () {
    const timeline = document.getElementById("timeline");

    const currentTime = document.createElement("div");
    currentTime.id = "current-time";
    
    if (showFullDay) {
        pastHours = localTime.hour24 - offset.resetOffset;
        maxHours = 24 - localTime.hour24 + offset.resetOffset;
    } else {
        timeline.className = "partial-day"
    }

    // let oneHourPercent = (1 / maxHours) * 100;
    // let percentOfHour = localTime.minutes / 60;
    // let hourPos = (oneHourPercent * 1) + (oneHourPercent * percentOfHour);

    // currentTime.style.top = hourPos + "%";

    for (var i = pastHours * -1; i < maxHours; i++) {
        const hourSlot = document.createElement("div");
        hourSlot.className = "hour-slot";
        hourSlot.id = `hour${localTime.hour24 + i}`;
        hourSlot.style.zIndex = Math.abs(100 - i);
        
        if (i < 0) {
            hourSlot.classList.add("hour-past");
        }

        const hourLabel = document.createElement("div");
        hourLabel.className = "hour-label";
        
        hourLabel.innerText = getLabelText(i);

        let time = to12Hours(localTime.hour24 + i);

        // console.log(time.hour, time.period);

        hourSlot.appendChild(hourLabel);

        function getVerticalOffset (event) {
            let topPercent = (event.minutesAfterReset ? (event.minutesAfterReset / 60) : 0) * 100;

            if (topPercent > 100) {
                topPercent -= 100;
            }

            return topPercent;
        }

        function getEventDuration (event) {
            let duration = (event.duration / 60) * 100;

            return duration;
        }

        let eventCount = 0;

        for (var event in timeData) {
            eventCount++;
            // console.log(event);
            let nearestHour = (timeData[event].minutesAfterReset ? Math.floor(timeData[event].minutesAfterReset / 60) : 0) + offset.resetOffset;
            let frequencyHours = timeData[event].frequency / 60;
            // console.log(timeData[event].minutesAfterReset / 60, Math.floor(timeData[event].minutesAfterReset / 60));

            for (var i2 = 0; i2 < 12; i2++) {
                // console.log(nearestHour + ((timeData[event].frequency / 60) * i2), localTime.hour24 + i);
                if (nearestHour + ((timeData[event].frequency / 60) * i2) === localTime.hour24 + i) {
                    // console.log(i2, nearestHour, (timeData[event].frequency / 60));
                    // console.log('match');

                    const eventBlock = document.createElement("div");
                    eventBlock.className = "event";
                    eventBlock.style.backgroundColor = `#${timeData[event].color}`;
                    eventBlock.style.top = `${getVerticalOffset(timeData[event])}%`;
                    eventBlock.style.left = `${(eventCount / 5) * 100}%`;
                    eventBlock.style.height = `${getEventDuration(timeData[event])}%`;
                    eventBlock.innerText = event;
                    hourSlot.appendChild(eventBlock);
                    
                }
            }
        }
        // return `${time.hour}:00 ${time.period}`;
        

        
        timeline.appendChild(hourSlot);
        timeline.appendChild(currentTime);

        // console.log(i);
    }
    
    document.getElementById(`hour${localTime.hour24}`).scrollIntoView({
        block: 'center'
    });

    setTimeout(function () {
        updateCurrentTime();
    }, 1);
    
}

loadData('timedata');