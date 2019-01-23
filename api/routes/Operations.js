class Operations {
    gettingTodayDate() {
        var datetime = Date.now();
        return datetime;
    }

    getThisWeekDate() {
        var days = 7
        var date = new Date();
        var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
        var da = last.toISOString().split("T");
        console.log(da);
        return da[0];
    }

    prepareGettingIdsResposne(response) {
        let msgs = response.body.messages
        return {
            "data": {
                "messages": msgs
            }
        };
    }

    getMsg(){
        
    }
}




module.exports = Operations 