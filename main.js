let dataToLoad = ['timedata', 'timedata-shard'];
let dataLoadedCount = 0;
let timeData;
let shardData;
let offset;
let localTime;
let showFullDay = true;
let maxHours = 5;
let pastHours = 1;
let currentHourSlot;
let currentDay;
let localDay;
let currentDayOfTheMonth;
let currentDayOfTheWeek;
let isOffDay = false;
let todaysShard;
let forceDayOffset = 0;

//6e0d3a

const daysOfTheWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function start () {
    loadData('timedata', function (data) {
        timeData = JSON.parse(data);
        checkLoaded();
    });
    
    loadData('timedata-shard', function (data) {
        shardData = JSON.parse(data);
        checkLoaded();
    });
    
    initAbout();
}

function initAbout () {
    const about = document.getElementById('about');
    const modal = document.getElementById('modalAbout');
    
    about.addEventListener('click', (event) => {
        modal.style.opacity = 1;
    });
    
    modal.addEventListener('click', (event) => {
        modal.style.opacity = 0;
    });
}

function checkLoaded () {
    dataLoadedCount++;

    if (dataLoadedCount === 2) {
        onLoad();
    }
}

function loadData (filename, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', filename + '.json', true);

    xhr.onload = () => {
        if (callback) {
            callback(xhr.response);
        }
        //timeData = JSON.parse(xhr.response);
        //onLoad();
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

    //console.log(time.getDate())
    
    return {
        hour: hour,
        hour24: hour24,
        minutes: minutes,
        period: period,
        date: `${time.getMonth()+1}/${time.getDate()}/${time.getFullYear()}`,
        day: time.getDate(),
        month: time.getMonth()+1,
        year: time.getFullYear()
    };
}


function parsePacificTime (date) {
    date = date.split(" ");
    const fullDate = date[0].slice(0, -1);
    const day = fullDate.split('/')[0];
    const month = fullDate.split('/')[1];
    const year = fullDate.split('/')[2];
    let time = date[1].split(":");
    let hour = Number(time[0]);
    let minutes = Number(time[1]);
    let period = date[2];
    let hour24;
    
    hour24 = to24Hours(hour, period);

    return {
        hour: hour,
        hour24: hour24,
        minutes: minutes,
        period: period,
        date: fullDate,
        day: day,
        month: month,
        year: year
    };
}

function getPacificOffest (localTime, pacificTime) {
    let offset = localTime.hour24 - pacificTime.hour24;
    let localIsTomorrow = false;
    
    console.log(localTime.date, pacificTime.date)
    console.log(localTime.day, pacificTime.day)
    
    // if local same month and one day ahead
    if (localTime.day > pacificTime.day && localTime.month == pacificTime.month) {
        localIsTomorrow = true;
    }
    
    // if local gone to the next month
    if (localTime.day == 1 && localTime.month > pacificTime.month) {
        localIsTomorrow = true;
    }
    
    if (localIsTomorrow) {
        offset += 24
        console.log('next day')
    }
    
    // const resetOffset = localTime.hour24 - offset;
    let resetOffset = offset;
    // let resetOffset = 0;
    let hour;

    // console.log(localTime.hour24, pacificTime.hour24, offset)
    // console.log("pac", pacificTime)

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

        //console.log(hour)
        // console.log("previous day");
    } else {
        hour = resetOffset;
    }

    let period = getPeriod(resetOffset);

    console.log('offset', offset)
    
    return {
        offset: offset,
        offsetMinutes: localTime.minutes - pacificTime.minutes,
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
    //console.log("localDate", localDate);

    let pacificTime = parsePacificTime(pacificDate);

    offset = getPacificOffest(localTime, pacificTime);

    // console.log(localTime, diff);
    // console.log("pac", pacificTime);
    // console.log("offset", offset);
    
    currentDay = localDate.getDay()+forceDayOffset;
    currentDayOfTheWeek = daysOfTheWeek[currentDay];
    currentDayOfTheMonth = localDate.getDate()+forceDayOffset;
    
    if (forceDayOffset != 0) {
        console.log(currentDayOfTheWeek, currentDayOfTheMonth)
    }
    
    if (offset.offsetMinutes !== 0) {
        document.getElementById('offsetWarning').style.display = 'block';
    }

    const resetTime = document.getElementById("reset-time");
    resetTime.innerText = `${offset.resetOffset}:00 ${offset.period}`;

    shard();
    generateHourSlots();
}

function shard () {
    let todaysShardType = shardData.pattern[(currentDayOfTheMonth-1) % shardData.pattern.length]
    let offDays = shardData.offDays[currentDayOfTheWeek];
    const shardNote = document.getElementById('shard');
    //console.log(todaysShardType);
    
    if (offDays.indexOf(todaysShardType, offDays) !== -1) {
        isOffDay = true;
        document.getElementById('noShard').style.display = 'block';
    }
    
    //console.log('isOffDay', isOffDay);
    
    if (!isOffDay) {
        todaysShard = shardData.type[todaysShardType];
        
        shardNote.innerHTML = `Shard is in <strong>${shardData.location[currentDayOfTheMonth-1].realm}</strong> at <strong>${shardData.location[currentDayOfTheMonth-1].area}</strong>`;
        shardNote.style.display = 'block';
    }
    
    //console.log(todaysShard);
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
        const hour = localTime.hour24 + i;
        hourSlot.className = "hour-slot";
        hourSlot.id = `hour${hour}`;
        hourSlot.style.zIndex = Math.abs(100 - i);
        
        if (i < 0) {
            hourSlot.classList.add("hour-past");
        }

        const hourLabel = document.createElement("div");
        hourLabel.className = "hour-label";
        
        hourLabel.innerText = getLabelText(i);

        let time = to12Hours(hour);

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
                if (nearestHour + ((timeData[event].frequency / 60) * i2) === hour) {
                    // console.log(i2, nearestHour, (timeData[event].frequency / 60));
                    // console.log('match');

                    const eventBlock = document.createElement("div");
                    let icon = timeData[event].icon ? `<img src="images/${timeData[event].icon}" class="event-icon" alt="">` : '';
                    eventBlock.className = "event";
                    eventBlock.style.backgroundColor = `#${timeData[event].color}`;
                    eventBlock.style.top = `${getVerticalOffset(timeData[event])}%`;
                    //eventBlock.style.left = `${(eventCount / 5) * 100}%`;
                    eventBlock.style.height = `${getEventDuration(timeData[event])}%`;
                    eventBlock.innerHTML = `${icon}${event}`;
                    hourSlot.appendChild(eventBlock);
                    
                }
            }
        }
        // return `${time.hour}:00 ${time.period}`;
        if (!isOffDay) {
            for (var i2 = 0; i2 < todaysShard.startTime.length; i2++) {
                let startTime = todaysShard.startTime[i2];
                
                let nearestHour = (startTime ? Math.floor(startTime / 60) : 0) + offset.resetOffset;
                //console.log(nearestHour)
                
                if (nearestHour === hour) {
                    eventCount++;
                    //console.log(startTime)
                    //console.log(startTime - (hour * 60) + (offset.resetOffset * 60));
                    //console.log(getVerticalOffset({minutesAfterReset: startTime - (hour * 60) + (offset.resetOffset * 60)}));
                    const eventBlock = document.createElement("div");
                    eventBlock.className = "event";
                    eventBlock.style.backgroundColor = `#${todaysShard.color}`;
                    eventBlock.style.top = `${getVerticalOffset({minutesAfterReset: startTime - (hour * 60) + (offset.resetOffset * 60)})}%`;
                    eventBlock.style.left = `${(eventCount / 5) * 100}%`;
                    eventBlock.style.height = `${getEventDuration(shardData)}%`;
                    eventBlock.innerHTML = `Shard<div class="description">${todaysShard.description}</div><div class="realm">${shardData.location[currentDayOfTheMonth-1].realm}</div><div class="area">${shardData.location[currentDayOfTheMonth-1].area}</div>`;
                    hourSlot.appendChild(eventBlock);
                    
                }
            }
        }

        
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

start();